const { getQueueCursor, getQueueElementsNotConsumed, countElementsInQueueNotConsumed, getWaitingElements} = require("../db/databaseManager");
const {ipcConfigServer} = require("../config/config");
const db = require('../db/mongoConnector.js')();
const ipc = require('node-ipc').default;

ipc.config.id = ipcConfigServer.id;
ipc.config.retry = ipcConfigServer.retry;
ipc.config.maxRetries = ipcConfigServer.maxRetries;
ipc.config.silent = true

const collection = db.collection('queue');
let changeStream;

let queueIsEmpty = true;
let elementsInQueue = 0;

let requestSentCounter = 0;

let messageBroadcast = async (change) => {
    if (change.operationType === 'insert') {
        ipc.server.broadcast('message', change.fullDocument);
    }
}

sendWaitingQueue = async (socket) => {
    const waitingData = await getWaitingElements()
    for (let i = 0; i < waitingData.length; i++) {
        await send(socket, 'message', waitingData[i])
    }
}

let send = (socket, channel, data) => {
    return ipc.server.emit(socket, channel, data);
}

let sendAtStart = async (socket) => {
    const allData = await getQueueElementsNotConsumed()
    allData.forEach((data) => {
        send(socket, 'message', data)
    })
    queueIsEmpty = true;
}


const options = {
    batchSize: 1000,
};


ipc.serve(() => {
    ipc.server.on('start', async () => {
        ipc.log('## started ##');
        changeStream = collection.watch(options);
        changeStream.on('change', messageBroadcast)
        changeStream.on('error', (err) => {
            console.log(err);
        })
    })
    ipc.server.on('connect', async (socket) => {
        ipc.log('## connected to world ##');
        elementsInQueue = await countElementsInQueueNotConsumed();
        console.log("ELEMENTS IN QUEUE AT START: " + elementsInQueue)
        if (elementsInQueue > 0) {
            queueIsEmpty = false;
        }
        if (!queueIsEmpty) {
            console.log("[CONNECT] sending new batch")
            await sendAtStart(socket)
        }
    })
    ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
        ipc.log('client ' + destroyedSocketID + ' has disconnected!');
    })
})

ipc.server.start();

// perform any cleanup or finalization tasks before stopping the app
async function cleanup() {
    console.log('Performing cleanup tasks before stopping the app...');
    ipc.server.stop();
    process.exit();
}

// listen for the SIGINT signal
process.on('SIGINT', function() {
    console.log('Received SIGINT signal, stopping the app...');
    cleanup().catch(err => {
        console.log('Error during cleanup: ', err);
    });
});
