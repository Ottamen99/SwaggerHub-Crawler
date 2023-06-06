const { getQueueElementsNotConsumed, countElementsInQueueNotConsumed } = require("../db/databaseManager");
const {ipcConfig} = require("../config/config");
const {connectUsingMongoose} = require("../db/mongoConnector");
const ipc = require('node-ipc').default;

// configures the IPC server
ipc.config.id = ipcConfig.id;
ipc.config.retry = ipcConfig.retry;
ipc.config.maxRetries = ipcConfig.maxRetries;
ipc.config.silent = ipcConfig.silent;

let dbClient

let changeStream;

let queueIsEmpty = true;
let elementsInQueue = 0;

/**
 * Broadcasts a message to all connected clients
 * @param change - the change in the queue collection
 * @returns {void} - nothing
 */
let messageBroadcast = (change) => {
    if (change.operationType === 'insert') {
        ipc.server.broadcast('message', change.fullDocument);
    }
}

/**
 * Sends a message to a specific client
 * @param socket - the socket of the client
 * @param channel - the channel to send the message to
 * @param data - the data to send
 * @returns {*} - the result of the send operation
 */
let send = (socket, channel, data) => {
    return ipc.server.emit(socket, channel, data);
}

/**
 * Sends all the elements in the queue to the client
 * @param socket - the socket of the client
 * @returns {Promise<void>} - nothing
 */
let sendAtStart = async (socket) => {
    const allData = await getQueueElementsNotConsumed(dbClient)
    allData.forEach((data) => send(socket, 'message', data))
    queueIsEmpty = true;
}

const RETRY_DELAY_MS = 5000;

let sendAtStartWithRetry = async (socket) => {
    let retries = 1;
    while (true) {
        try {
            await sendAtStart(socket);
            console.log('Sending queue succeeded.');
            return;
        } catch (err) {
            console.log(`Sending queue failed (retrying in ${RETRY_DELAY_MS}ms) attempts ${retries}`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
}

/**
 * Configure the change stream and start listening for changes on IPC server start
 */
let onServerStart = () => {
    try {
        changeStream = dbClient.db.collection('queue').watch();
        changeStream.on('change', messageBroadcast)
        changeStream.on('error', (err) => {
            console.log("Unable to get change stream: " + err.message)
        })
    } catch (err) {
        console.log("Error change stream")
    }
}

/**
 * Configure the change stream and start listening for changes on IPC server start
 *  with retry mechanism
 * @returns {Promise<void>} - nothing
 */
let onServerStartWithRetry = async () => {
    let retries = 1;
    while (true) {
        try {
            await onServerStart();
            console.log('Starting server succeeded.');
            return;
        } catch (err) {
            console.log(`Starting server failed (retrying in ${RETRY_DELAY_MS}ms) attempts ${retries}`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
}

/**
 * Handles a new connection to the IPC server
 * @param socket - the socket of the client
 * @returns {Promise<void>} - nothing
 */
let handleNewConnection = async (socket) => {
    elementsInQueue = await countElementsInQueueNotConsumed(dbClient);
    console.log("ELEMENTS IN QUEUE AT START: " + elementsInQueue)
    if (elementsInQueue > 0) {
        queueIsEmpty = false;
    } else {
        console.log("[CONNECT] new connection, but queue is empty")
    }
    if (!queueIsEmpty) {
        console.log("[CONNECT] sending new batch")
        await sendAtStartWithRetry(socket)
    }
}

/**
 * Handles a new connection to the IPC server with retry mechanism
 * @param socket - the socket of the client
 * @returns {Promise<void>} - nothing
 */
let handleNewConnectionWithRetry = async (socket) => {
    let retries = 1;
    while (true) {
        try {
            await handleNewConnection(socket);
            console.log('Handling new connection succeeded.');
            return;
        } catch (err) {
            console.log(`Handling new connection failed (retrying in ${RETRY_DELAY_MS}ms) attempts ${retries}`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
}

// start the IPC server
ipc.serve(() => {
    ipc.server.on('start', onServerStartWithRetry)
    ipc.server.on('connect', handleNewConnectionWithRetry)
    ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
        console.log('client ' + destroyedSocketID + ' has disconnected!');
    })
})

/**
 * Main function
 * @returns {Promise<void>} - nothing
 */
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
        changeStream = dbClient.db.collection('queue').watch();
        changeStream.on('change', messageBroadcast)
        changeStream.on('error', (err) => {
            console.log("Unable to get change stream: " + err.message)
        })
    })

    ipc.server.start();
}

main().catch(err => {
    console.log("ERROR: " + err.message)
    // process.exit(1);
})

/**
 * Performs cleanup tasks before stopping the app
 * @returns {Promise<void>}
 */
const cleanup = async () => {
    console.log('Performing cleanup tasks before stopping the app...');
    ipc.server.stop();
    process.exit();
}

/**
 * Handles SIGINT signal
 */
process.on('SIGINT', function() {
    console.log('Received SIGINT signal, stopping the app...');
    cleanup().catch(err => {
        console.log('Error during cleanup: ', err);
    });
});
