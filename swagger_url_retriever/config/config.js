// Kafka config
const PRIORITIES = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
}

const workerPoolConfig = {
    minWorkers: 1,
    maxWorkers: 1,
}

const ipcConfigClient = {
    id: 'world',
    retry: 1500,
    maxRetries: 1000000,
    silent: true,
}

const ipcConfigServer = {
    id: 'world',
    retry: 1500,
    maxRetries: 1000000,
}

module.exports = {
    workerPoolConfig,
    ipcConfigClient,
    ipcConfigServer,
}