const ipc = require('node-ipc').default;
const databaseManager = require('../db/databaseManager')
const {sendStats} = require("./wsManager");
const {ipcConfigClient, workerPoolConfig} = require("../config/config");
const Piscina = require('piscina');


const pool = new Piscina({
    filename: __dirname + '/worker.js',
    minThreads: workerPoolConfig.minWorkers,
    maxThreads: workerPoolConfig.maxWorkers
});

ipc.config.id = ipcConfigClient.id;
ipc.config.retry = ipcConfigClient.retry;
ipc.config.maxRetries = ipcConfigClient.maxRetries;
ipc.config.silent = ipcConfigClient.silent;

const RETRY_DELAY_MS = 5000;

let messageHandler = (data) => {
    const retryOperation = async () => {
        try {
            await pool.run({ incomingData: data });
            await databaseManager.flagConsumeElement(data);
            // await sendStats(pool.stats());
        } catch (err) {
            console.log(`Error in messageHandler (retrying in ${RETRY_DELAY_MS}ms)`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            await retryOperation();
        }
    };
    retryOperation();
};


// let handleMessageWithRetry = async (data) => {
//     let retries = 1;
//     while (true) {
//         try {
//             await messageHandler(data);
//             console.log('Handling message succeeded.');
//             return;
//         } catch (err) {
//             console.log(`Handling message failed (retrying in ${workerPoolConfig.retryDelay}ms) attempts ${retries}`);
//             retries++;
//             await new Promise(resolve => setTimeout(resolve, workerPoolConfig.retryDelay));
//         }
//     }
// }

ipc.connectTo('world', () => {
    ipc.of[ipcConfigClient.id].on('message', messageHandler);
    ipc.of[ipcConfigClient.id].on(
        'disconnect',
        () => {
            ipc.log('disconnected from world');
        }
    );
})