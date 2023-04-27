const ipc = require('node-ipc').default;
const {ipcConfigClient, workerPoolConfig} = require("./config/config");
const Piscina = require('piscina');
const {generateQuery, pushQueryInDatabase} = require("./utils/queryManager");
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");


const poolNewUrl = new Piscina({
    filename: __dirname + '/worker.js',
    minThreads: workerPoolConfig.minWorkers,
    maxThreads: workerPoolConfig.maxWorkers
});

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
            owner: ["fehguy"],
        })
    }
    for (let query of queries) {
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
    ipc.connectTo('world', () => {
        ipc.of[ipcConfigClient.id].on('readyMessage', () => {
            genQueriesAndPush().then(async () => {
                console.log("Queries generated and pushed")
                await closeConnection(dbClient).catch((err) => {
                    console.log("Error closing connection: " + err.message)
                })
                process.exit(0)
            })
        });
        ipc.of[ipcConfigClient.id].on(
            'disconnect',
            () => {
                ipc.log('disconnected from world');
            }
        );
    })
}

main()