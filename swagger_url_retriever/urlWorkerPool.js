const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const {ipcConfig, workerPoolConfig} = require("./config/config");
const ipc = require('node-ipc').default;
const Piscina = require('piscina');
const {getMinProcessed, getUnprocessed} = require("./db/databaseManager");

// configuration for the worker pool that will handle the new urls
const poolNewUrls = new Piscina({
    filename: __dirname + '/worker.js',
    minThreads: workerPoolConfig.newUrls.minWorkers,
    maxThreads: workerPoolConfig.newUrls.maxWorkers
});

// configuration for the worker pool that will handle the known urls
// const poolKnownUrls = new Piscina({
//     filename: __dirname + '/worker.js',
//     minThreads: workerPoolConfig.knownUrls.minWorkers,
//     maxThreads: workerPoolConfig.knownUrls.maxWorkers
// });

// configuration of the IPC server
ipc.config.id = ipcConfig.id;
ipc.config.retry = ipcConfig.retry;
ipc.config.maxRetries = ipcConfig.maxRetries;
ipc.config.silent = ipcConfig.silent;


let dbClient // mongoDB client
let changeStream // stream for proxyUrls collection


/**
 * Configure streams and send urls to the worker pool if needed
 * @returns {Promise<void>} - nothing
 */
let onServerStart = async () => {
    // connect to stream
    try {
        changeStream = dbClient.db.collection('proxyUrls').watch();
        changeStream.on('change', messageDispatcher)
        changeStream.on('error', (err) => {
            console.log("Unable to get change stream: " + err.message)
        })
    } catch (err) {
        console.log("Error change stream")
    }


    let minProcessValue = await getMinProcessed(dbClient)
    if (minProcessValue !== typeof undefined) {
        let toBeProcessed = []
        if (minProcessValue === 0) {
            // send new urls already in the database to the worker pool
            toBeProcessed = await getUnprocessed(dbClient)
            toBeProcessed.forEach((url) => {
                if (url) {
                    poolNewUrls.run({incomingUrl: JSON.stringify(url)});
                }
            })
        } else {
            // // send known urls already in the database to the worker pool
            // toBeProcessed = await getProcessed(dbClient)
            // toBeProcessed.forEach((url) => {
            //     if (url) {
            //         poolKnownUrls.run({incomingUrl: JSON.stringify(url)});
            //     }
            // })
        }
    }
}

/**
 * Function that dispatches the message to the correct worker pool
 * @param change - the change that has been detected
 * @returns {Promise<void>} - nothing
 */
let messageDispatcher = async (change) => {
    if (change.operationType === 'insert') { // new url to be processed
        await poolNewUrls.run({incomingUrl: JSON.stringify(change.fullDocument)});
    }
    // else if (change.operationType === 'update') { // known url to be processed
        // let tmp = await getAPIProxyById(dbClient, new ObjectId(change.documentKey._id))
        // await poolKnownUrls.run({ incomingUrl: JSON.stringify(tmp) });
    // }
}

// Start the IPC server
ipc.serve(() => {
    // Handle server start
    ipc.server.on('start', () => {
        console.log("STARTING URL WORKER POOL")
        onServerStart().catch((err) => {
            console.log("Error on server start: " + err.message)
        })
    })

    // Handle new client connection
    ipc.server.on('connect', (socket) => {
        console.log('client connected');
        ipc.server.emit(socket, 'readyMessage', 'server is ready');
    })
})

/**
 * Main function
 * @returns {Promise<void>} - nothing
 */
let main = async () => {
    // connect to mongo and configure event handlers
    dbClient = await connectUsingMongoose()
    dbClient.on('error', (err) => {
        console.log("Something went wrong with mongo: " + err.message)
    })
    dbClient.on('disconnected', async () => {
        dbClient = await connectUsingMongoose()
    })
    dbClient.on('reconnected', async () => {
        console.log("Reconnected to mongo, reloading change stream...")
        changeStream = dbClient.db.collection('proxyUrl').watch();
        changeStream.on('change', messageDispatcher)
        changeStream.on('error', (err) => {
            console.log("Unable to get change stream: " + err.message)
        })
    })

    // start the IPC server
    ipc.server.start();
}

// Start the main function
main().catch(err => async () => {
    console.log("ERROR: " + err.message)
    await closeConnection(dbClient).catch(err => {
        console.log("CLOSING CONNECTION ERROR: " + err.message)
    })
})