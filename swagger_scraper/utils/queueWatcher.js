const {countElementsInQueue, getQueueCursor} = require("../db/databaseManager");
const {ipcConfigServer} = require("../config/config");
const db = require('../db/mongoConnector.js')();
const ipc = require('node-ipc').default;

ipc.config.id = ipcConfigServer.id;
ipc.config.retry = ipcConfigServer.retry;
ipc.config.maxRetries = ipcConfigServer.maxRetries;
ipc.config.silent = true

const collection = db.collection('queue');
let changeStream;

let totalNumberOfTasks = 0;
let numberOfTasks = 0;

let pendingTasks;

let queueIsEmpty = true;
let consumerQueueIsEmpty = true;


let elementsInQueue = 0;

let messageBroadcast = async (change) => {
    // if (change.operationType === 'insert') {
    //     // console.log(change.fullDocument);
    //     ipc.server.broadcast('message', change.fullDocument);
    // }
    // if (change.operationType === 'insert') {
    //     elementsInQueue = await countElementsInQueue();
    // }
}

let send = async (socket) => {
    const cursor = await getQueueCursor();
    while (await cursor.hasNext()) {
        if (numberOfTasks >= 1172) {
            await new Promise(resolve => {
                // Wait for the consumer queue to become empty
                const checkQueue = setInterval(() => {
                    if (pendingTasks === 0) {
                        clearInterval(checkQueue);
                        console.log("[SENDING MORE] NUMBER OF ELEMENTS SENT: " + numberOfTasks);
                        // Set number of tasks to 0
                        totalNumberOfTasks += numberOfTasks;
                        numberOfTasks = 0;
                        resolve();
                    }
                }, 100);
            });
            await new Promise(resolve => setTimeout(resolve, 10000));
        } else {
            const doc = await cursor.next();
            ipc.server.emit(socket, 'message', doc);
            consumerQueueIsEmpty = false;
            numberOfTasks++;
            pendingTasks = undefined;
        }
    }
    totalNumberOfTasks += numberOfTasks;
}

let sendNewBatch = async (socket) => {
    if (elementsInQueue === 0) {
        queueIsEmpty = true;
    } else {
        await send(socket)
        queueIsEmpty = false;
    }
    console.log("NUMBER OF ELEMENTS SENT: " + totalNumberOfTasks);
};


ipc.serve(() => {
    ipc.server.on('start', async () => {
        ipc.log('## started ##');
        elementsInQueue = await countElementsInQueue();
        console.log(elementsInQueue)
        if (elementsInQueue > 0) {
            queueIsEmpty = false;
        }
        changeStream = collection.watch();
        changeStream.on('change', messageBroadcast)
        changeStream.on('error', (err) => {
            console.log(err);
        })
    })
    ipc.server.on('connect', async (socket) => {
        ipc.log('## connected to world ##');
        if (!queueIsEmpty) {
            console.log("[CONNECT] sending new batch")
            await sendNewBatch(socket);
        }
    })
    ipc.server.on('message', (data, socket) => {
        ipc.log('got a message : ', data);

    });
    ipc.server.on('taskExecuted', async (data) => {
        pendingTasks = data.pendingTasks;
        if (pendingTasks === 0) {
            consumerQueueIsEmpty = true;
        }
        elementsInQueue = await countElementsInQueue();
        if (elementsInQueue === 0) {
            queueIsEmpty = true;
            console.log("[TASK EXECUTED] QUEUE IS EMPTY")
        }
    });
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
