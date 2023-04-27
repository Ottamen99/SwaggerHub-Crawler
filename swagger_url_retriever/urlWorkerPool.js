const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const {ipcConfigServer, workerPoolConfig} = require("./config/config");
const ipc = require('node-ipc').default;
const Piscina = require('piscina');


const poolNewUrls = new Piscina({
    filename: __dirname + '/worker.js',
    minThreads: workerPoolConfig.minWorkers,
    maxThreads: workerPoolConfig.maxWorkers
});

const poolKnownUrls = new Piscina({
    filename: __dirname + '/worker.js',
    minThreads: workerPoolConfig.minWorkers,
    maxThreads: workerPoolConfig.maxWorkers
});

ipc.config.id = ipcConfigServer.id;
ipc.config.retry = ipcConfigServer.retry;
ipc.config.maxRetries = ipcConfigServer.maxRetries;
ipc.config.silent = true

let dbClient
let changeStream

let onServerStart = () => {
    try {
        changeStream = dbClient.db.collection('queue').watch();
        changeStream.on('change', messageDispatcher)
        changeStream.on('error', (err) => {
            console.log("Unable to get change stream: " + err.message)
        })
    } catch (err) {
        console.log("Error change stream")
    }
}

let messageDispatcher = async (change) => {
    if (change.operationType === 'insert') {
        await poolNewUrls.run({incomingUrl: change});
    }
    // } else if (change.operationType === 'update') {
    //     await poolKnownUrls.run({ incomingUrl: change });
    // }
}

ipc.serve(() => {
    ipc.server.on('start', () => {
        console.log("STARTING URL WORKER POOL")
        onServerStart()
    })
    ipc.server.on('connect', (socket) => {
        console.log('client connected');
        // send message to client
        ipc.server.emit(socket, 'readyMessage', 'server is ready');
    })
    // ipc.server.on('newUrl', async (data, socket) => {
    //     console.log("MESSAGE RECEIVED: " + data)
    //     await handleNewUrl(data)
    // })
    ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
        console.log('client ' + destroyedSocketID + ' has disconnected!');
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
        // changeStream = dbClient.db.collection('queue').watch();
        // changeStream.on('change', messageBroadcast)
        // changeStream.on('error', (err) => {
        //     console.log("Unable to get change stream: " + err.message)
        // })
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