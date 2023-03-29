const ipc = require('node-ipc').default;
const workerPool = require('workerpool')
const databaseManager = require('../db/databaseManager')
const {sendStats} = require("./wsManager");
const {ipcConfigClient, workerPoolConfig} = require("../config/config");

const pool = workerPool.pool(__dirname + '/worker.js', {
    minWorkers: workerPoolConfig.minWorkers,
    maxWorkers: workerPoolConfig.maxWorkers
})

ipc.config.id = ipcConfigClient.id;
ipc.config.retry = ipcConfigClient.retry;
ipc.config.maxRetries = ipcConfigClient.maxRetries;
ipc.config.silent = ipcConfigClient.silent;

let messageHandler = (data) => {
    pool.exec("consumeApiUrls", [data])
        .then(async (result) => {
            await databaseManager.removeElementFromQueue(data)
            await sendStats(pool.stats())
            ipc.of[ipcConfigClient.id].emit('taskExecuted', pool.stats())
        })
        .catch((err) => {
            console.log(err)
        })
}



ipc.connectTo('world', () => {
    ipc.of[ipcConfigClient.id].on('message', messageHandler);
    ipc.of[ipcConfigClient.id].on(
        'disconnect',
        () => {
            ipc.log('disconnected from world');
        }
    );
})