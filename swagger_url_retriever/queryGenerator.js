const ipc = require('node-ipc').default;
const {ipcConfigClient, workerPoolConfig} = require("./config/config");
const {generateQuery, pushQueryInDatabase} = require("./utils/queryManager");
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const {sort_by, order, specification, state} = require("./config/queries");
const tqdm = require("tqdm");

ipc.config.id = ipcConfigClient.id;
ipc.config.retry = ipcConfigClient.retry;
ipc.config.maxRetries = ipcConfigClient.maxRetries;
ipc.config.silent = ipcConfigClient.silent;

let dbClient
let queries = []

let genQueriesAndPush = async () => {
    if (queries.length > 0) {
        console.log("Skipping generation...")
    } else {
        queries = await generateQuery(dbClient, {
            sort: sort_by,
            order: order,
            specification: specification,
            state: state,
        })
    }
    console.log("Pushing queries...")
    for (let query of tqdm(queries)) {
        await pushQueryInDatabase(dbClient, query)
        await new Promise(resolve => setTimeout(resolve, 100));
    }
};

let main = async () => {
    console.log("STARTING QUERY GENERATOR")
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
    ipc.connectTo('generation', () => {
        ipc.of[ipcConfigClient.id].on('readyMessage', () => {
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

main()