const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const {ipcConfigServer, workerPoolNewUrlsConfig, workerPoolKnownUrlsConfig} = require("./config/config");
const ipc = require('node-ipc').default;
const Piscina = require('piscina');
const {getAPIProxyById, getMaxProcessed, getMinProcessed, getUnprocessed, getProcessed} = require("./db/databaseManager");
const {ObjectId} = require("mongodb");


const poolNewUrls = new Piscina({
    filename: __dirname + '/worker.js',
    minThreads: workerPoolNewUrlsConfig.minWorkers,
    maxThreads: workerPoolNewUrlsConfig.maxWorkers
});

const poolKnownUrls = new Piscina({
    filename: __dirname + '/worker.js',
    minThreads: workerPoolKnownUrlsConfig.minWorkers,
    maxThreads: workerPoolKnownUrlsConfig.maxWorkers
});

ipc.config.id = ipcConfigServer.id;
ipc.config.retry = ipcConfigServer.retry;
ipc.config.maxRetries = ipcConfigServer.maxRetries;
ipc.config.silent = true

let dbClient
let changeStream

let onServerStart = async () => {
    try {
        changeStream = dbClient.db.collection('proxyUrls').watch();
        changeStream.on('change', messageDispatcher)
        changeStream.on('error', (err) => {
            console.log("Unable to get change stream: " + err.message)
        })
    } catch (err) {
        console.log("Error change stream")
    }

    // let maxProcessValue = await getMaxProcessed(dbClient)
    let minProcessValue = await getMinProcessed(dbClient)
    if (minProcessValue !== typeof undefined) {
        let toBeProcessed = []
        if (minProcessValue === 0) {
            toBeProcessed = await getUnprocessed(dbClient)
            toBeProcessed.forEach((url) => {
                if (url) {
                    poolNewUrls.run({incomingUrl: JSON.stringify(url)});
                }
            })
        } else {
            // toBeProcessed = await getProcessed(dbClient)
            // toBeProcessed.forEach((url) => {
            //     if (url) {
            //         poolKnownUrls.run({incomingUrl: JSON.stringify(url)});
            //     }
            // })
        }
    }
}

let messageDispatcher = async (change) => {
    if (change.operationType === 'insert') {
        await poolNewUrls.run({incomingUrl: JSON.stringify(change.fullDocument)});
    } else if (change.operationType === 'update') {
        // let tmp = await getAPIProxyById(dbClient, new ObjectId(change.documentKey._id))
        // await poolKnownUrls.run({ incomingUrl: JSON.stringify(tmp) });
    }
}

ipc.serve(() => {
    ipc.server.on('start', () => {
        console.log("STARTING URL WORKER POOL")
        onServerStart().catch((err) => {
            console.log("Error on server start: " + err.message)
        })
    })
    ipc.server.on('connect', (socket) => {
        console.log('client connected');
        ipc.server.emit(socket, 'readyMessage', 'server is ready');
    })
})

let main = async () => {
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
    ipc.server.start();
}

main().catch(err => async () => {
    console.log("ERROR: " + err.message)
    await closeConnection(dbClient).catch(err => {
        console.log("CLOSING CONNECTION ERROR: " + err.message)
    })
    // process.exit(1);
})