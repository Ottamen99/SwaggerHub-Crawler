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

let queryCounter = 0;

let messageHandler = (data) => {
    queryCounter++
    if (queryCounter > 1171) {
        ipc.of[ipcConfigClient.id].off('message', messageHandler);
        new Promise(resolve => setTimeout(resolve, 91000)).then(() => {
            ipc.of[ipcConfigClient.id].on('message', messageHandler);
            queryCounter = 0
            pool.exec("consumeApiUrls", [data])
                .then(async (result) => {
                    await databaseManager.removeElementFromQueue(data)
                    await sendStats(pool.stats())
                })
                .catch((err) => {
                    console.log(err)
                })
        })
    } else {
        pool.exec("consumeApiUrls", [data])
            .then(async (result) => {
                await databaseManager.removeElementFromQueue(data)
                await sendStats(pool.stats())
            })
            .catch((err) => {
            console.log(err)
        })
    }
}

ipc.connectTo('world', () => {
    ipc.of[ipcConfigClient.id].on('message', messageHandler);
    ipc.of[ipcConfigClient.id].on(
        'disconnect',
        function(){
            ipc.log('disconnected from world');
        }
    );
})