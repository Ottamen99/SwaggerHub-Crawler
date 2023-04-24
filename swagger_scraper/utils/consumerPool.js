const ipc = require('node-ipc').default;
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

let messageHandler = async (data) => {
    await pool.run({ incomingData: data });
};

let main = async () => {
    console.log("STARTING CONSUMER POOL")
    ipc.connectTo('world', () => {
        ipc.of[ipcConfigClient.id].on('message', messageHandler);
        ipc.of[ipcConfigClient.id].on(
            'disconnect',
            () => {
                ipc.log('disconnected from world');
            }
        );
    })
}

main()