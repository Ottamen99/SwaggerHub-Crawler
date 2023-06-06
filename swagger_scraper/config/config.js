/**
 * This file contains the configuration for the application.
 */

// priorities is used to configure the priorities of the urls.
exports.priorities = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
}

// workerPoolConfig is used to configure the worker pool.
exports.workerPoolConfig = {
    minWorkers: 1,
    maxWorkers: 5,
}

// ipcConfig is used to configure the IPC.
exports.ipcConfig = {
    id: 'world',
    retry: 1500,
    maxRetries: 1000000,
    silent: true,
}

// Tor proxy configuration.
exports.TOR_PROXY = process.env.TOR_PROXY || 'socks5://127.0.0.1:9050';