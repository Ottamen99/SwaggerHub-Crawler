const { getQueueCursor, getQueueElementsNotConsumed, countElementsInQueueNotConsumed, getWaitingElements, QueueSchema,
    QueueModel
} = require("../db/databaseManager");
const {ipcConfigServer} = require("../config/config");
const {connectToMongo, connectUsingMongoose} = require("../db/mongoConnector");
const {DATABASE_NAME} = require("../db/dbConfig");
const mongoose = require("mongoose");
// const db = require('../db/mongoConnector.js')();
const ipc = require('node-ipc').default;

ipc.config.id = ipcConfigServer.id;
ipc.config.retry = ipcConfigServer.retry;
ipc.config.maxRetries = ipcConfigServer.maxRetries;
ipc.config.silent = true

let dbClient

let changeStream;
let startAfter

let queueIsEmpty = true;
let elementsInQueue = 0;

let requestSentCounter = 0;

let messageBroadcast = async (change) => {
    if (change.operationType === 'insert') {
        ipc.server.broadcast('message', change.fullDocument);
        startAfter = change._id;
    }
}

// let messageBroadcastWithRetry = async (change) => {
//     let retries = 1;
//     while (true) {
//         try {
//             await messageBroadcast(change);
//             // console.log('Broadcasting message succeeded.');
//             return;
//         } catch (err) {
//             console.log(`Broadcasting message failed (retrying in ${ipcConfigServer.retryDelay}ms) attempts ${retries}`);
//             retries++;
//             await new Promise(resolve => setTimeout(resolve, ipcConfigServer.retryDelay));
//         }
//     }
// }

let send = (socket, channel, data) => {
    return ipc.server.emit(socket, channel, data);
}

let sendAtStart = async (socket) => {
    const allData = await getQueueElementsNotConsumed(dbClient)
    allData.forEach((data) => {
        send(socket, 'message', data)
    })
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


ipc.serve(() => {
    ipc.server.on('start', onServerStartWithRetry)
    ipc.server.on('connect', handleNewConnectionWithRetry)
    ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
        ipc.log('client ' + destroyedSocketID + ' has disconnected!');
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

// perform any cleanup or finalization tasks before stopping the app
async function cleanup() {
    console.log('Performing cleanup tasks before stopping the app...');
    // ipc.server.stop();
    process.exit();
}

// listen for the SIGINT signal
process.on('SIGINT', function() {
    console.log('Received SIGINT signal, stopping the app...');
    cleanup().catch(err => {
        console.log('Error during cleanup: ', err);
    });
});
