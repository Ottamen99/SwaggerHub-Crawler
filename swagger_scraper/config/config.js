const priorities = {
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
    maxRetries: 100000,
    silent: true,
}

const ipcConfigServer = {
    id: 'world',
    retry: 1500,
    maxRetries: 100000,
}

module.exports = {
    priorities,
    ipcConfigClient,
    ipcConfigServer,
    workerPoolConfig,
}