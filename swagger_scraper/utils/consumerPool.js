const ipc = require('node-ipc').default;
const {ipcConfig, workerPoolConfig} = require("../config/config");
const Piscina = require('piscina');

// Create a new pool with the specified options
const pool = new Piscina({
    filename: __dirname + '/worker.js',
    minThreads: workerPoolConfig.minWorkers,
    maxThreads: workerPoolConfig.maxWorkers
});

// Configure IPC client
ipc.config.id = ipcConfig.id;
ipc.config.retry = ipcConfig.retry;
ipc.config.maxRetries = ipcConfig.maxRetries;
ipc.config.silent = ipcConfig.silent;

/**
 * Handle incoming messages and send them to the worker
 * @param data - element to be processed
 * @returns {Promise<void>} - void
 */
let messageHandler = async (data) => {
    await pool.run({ incomingData: data });
};

/**
 * Main function
 * @returns {Promise<void>} - void
 */
let main = async () => {
    console.log("STARTING CONSUMER POOL")
    ipc.connectTo('world', () => {
        ipc.of[ipcConfig.id].on('message', messageHandler);
        ipc.of[ipcConfig.id].on(
            'disconnect',
            () => {
                ipc.log('disconnected from world');
            }
        );
    })
}

// Run main function
main()