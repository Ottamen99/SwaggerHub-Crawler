const {countElementsInQueue, getQueueCursor} = require("../db/databaseManager");
const {ipcConfigServer} = require("../config/config");
const db = require('../db/mongoConnector.js')();
const ipc = require('node-ipc').default;

ipc.config.id = ipcConfigServer.id;
ipc.config.retry = ipcConfigServer.retry;
ipc.config.maxRetries = ipcConfigServer.maxRetries;

const collection = db.collection('queue');
let changeStream;

ipc.serve(() => {
    ipc.server.on('start', () => {
        ipc.log('## started ##', ipc.config.delay);
        changeStream = collection.watch();
        changeStream.on('change', (change) => {
            if (change.operationType === 'insert') {
                console.log(change.fullDocument);
                ipc.server.broadcast('message', change.fullDocument);
            }
        })


        changeStream.on('error', (err) => {
            console.log(err);
        })
    })
    ipc.server.on('connect', async (socket) => {
        ipc.log('## connected to world ##', ipc.config.delay);
        let elementsInQueue = await countElementsInQueue();
        if (elementsInQueue > 0) {
            const cursor = getQueueCursor()
            while (await cursor.hasNext()) {
                const doc = await cursor.next()
                ipc.server.emit(socket, 'message', doc);
            }
        }
    })
    ipc.server.on('message', (data, socket) => {
        ipc.log('got a message : ', data);
        ipc.server.emit(socket, 'message', data + ' world!');
    });
    ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
        ipc.log('client ' + destroyedSocketID + ' has disconnected!');
    })
})

ipc.server.start();
