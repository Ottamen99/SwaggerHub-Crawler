const ipc = require('node-ipc').default;
const {ipcConfig} = require("./config/config");
const {generateQuery, pushQueryInDatabase} = require("./utils/queryManager");
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const {sort_by, order, specification, state, query} = require("./config/queries");
const tqdm = require("tqdm");
const {getOwnersNames} = require("./db/databaseManager");

// configuration of the IPC client
ipc.config.id = ipcConfig.id;
ipc.config.retry = ipcConfig.retry;
ipc.config.maxRetries = ipcConfig.maxRetries;
ipc.config.silent = ipcConfig.silent;

let dbClient
let queries = []

/**
 * Generate queries and push them in the database
 * @returns {Promise<void>} - nothing
 */
const genQueriesAndPush = async () => {
    if (queries.length > 0) {
        console.log("Skipping generation...")
    } else {
        // get all the owners names if parameter is not empty
        let docs = await getOwnersNames(dbClient);
        const namesArray = docs.map(doc => doc.name);
        // generate queries
        // TODO: implement read from file
        queries = await generateQuery(dbClient, {
            sort: sort_by,
            order: order,
            query: query,
            // specification: specification,
            // state: state,
            // owner: namesArray
        })
    }
    // push queries
    console.log("Pushing queries...")
    for (let query of tqdm(queries)) {
        await pushQueryInDatabase(dbClient, query)
        await new Promise(resolve => setTimeout(resolve, 100));
    }
};

/**
 * Main function
 * @returns {Promise<void>} - nothing
 */
const main = async () => {
    console.log("STARTING QUERY GENERATOR")
    // connect to mongo and handle errors
    dbClient = await connectUsingMongoose()
    dbClient.on('error', (err) => {
        console.log("Something went wrong with mongo: " + err.message)
    })
    dbClient.on('disconnected', async () => {
        dbClient = await connectUsingMongoose()
    })
    dbClient.on('reconnected', async () => {
        console.log("Reconnected to mongo, reloading change stream...")
        await genQueriesAndPush().then(async () => {
            console.log("Queries generated and pushed")
            await closeConnection(dbClient).catch((err) => {
                console.log("Error closing connection: " + err.message)
            })
            process.exit(0)
        })
    })

    // connect to the IPC server
    ipc.connectTo('generation', () => {
        ipc.of[ipcConfig.id].on('readyMessage', () => {
            genQueriesAndPush().then(async () => {
                console.log("Queries generated and pushed")
                await closeConnection(dbClient).catch((err) => {
                    console.log("Error closing connection: " + err.message)
                })
                process.exit(0)
            })
        });
    })
}

// start the program
main()