const ipc = require('node-ipc').default;
const {ipcConfigClient, workerPoolConfig} = require("./config/config");
const {generateQuery, pushQueryInDatabase} = require("./utils/queryManager");
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const {sort_by, order, specification, state, query} = require("./config/queries");
const tqdm = require("tqdm");
const {getOwnersNames} = require("./db/databaseManager");

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

        let docs = await getOwnersNames(dbClient);
        const namesArray = docs.map(doc => doc.name);

        queries = await generateQuery(dbClient, {
            sort: sort_by,
            order: order,
            query: query,
            // specification: specification,
            // state: state,
            // owner: namesArray
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