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

let messageHandler = (data) => {
    pool.run({incomingData: data})
        .then(async (result) => {
            await databaseManager.flagConsumeElement(data)
            // await sendStats(pool.stats())
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