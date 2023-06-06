/**
 * The configuration for the SwaggerHub URL Retriever
 */

/**
 * Priority of the URLs
 * @type {{HIGH: number, MEDIUM: number, LOW: number}}
 */
exports.PRIORITIES = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
}

/**
 * The configuration for the worker pools
 * @type {{knownUrls: {maxWorkers: number, minWorkers: number}, newUrls: {maxWorkers: number, minWorkers: number}}}
 */
exports.workerPoolConfig = {
    newUrls: {
        minWorkers: 1,
        maxWorkers: 5,
    },
    knownUrls: {
        minWorkers: 1,
        maxWorkers: 5,
    }
}

/**
 * The configuration for the IPC
 * @type {{maxRetries: number, silent: boolean, id: string, retry: number}}
 */
exports.ipcConfig = {
    id: 'generation',
    retry: 1500,
    maxRetries: 1000000,
    silent: true,
}

/**
 * Base URL for the SwaggerHub API
 * @type {string}
 */
exports.BASE_SWAGGER_PROXY_URL = "https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&";