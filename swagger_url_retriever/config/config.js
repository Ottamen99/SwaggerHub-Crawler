// Kafka config
const PRIORITIES = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
}

const workerPoolNewUrlsConfig = {
    minWorkers: 1,
    maxWorkers: 1,
}

const workerPoolKnownUrlsConfig = {
    minWorkers: 1,
    maxWorkers: 5,
}

const ipcConfigClient = {
    id: 'generation',
    retry: 1500,
    maxRetries: 1000000,
    silent: true,
}

const ipcConfigServer = {
    id: 'generation',
    retry: 1500,
    maxRetries: 1000000,
}

module.exports = {
    ipcConfigClient,
    ipcConfigServer,
    workerPoolNewUrlsConfig,
    workerPoolKnownUrlsConfig,
}