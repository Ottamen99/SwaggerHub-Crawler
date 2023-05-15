const urlRetriever = require("./urlRetriever");
const {generateQuery, pushQueryInDatabase} = require("./utils/queryManager");
const {sort_by, order, specification, state} = require("./config/queries");
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const {getOwnersNames} = require("./db/databaseManager");
const tqdm = require("tqdm");

let dbClient
let generationFinished = false;

let handleDisconnect = async () => {
    console.log('Disconnected from MongoDB');
    await closeConnection(dbClient).catch(() => console.log("Error while closing connection"));
    dbClient = await connectUsingMongoose()
    // wait for ready state
    while (dbClient.readyState !== 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    dbClient.on('disconnected', handleDisconnect);
    if (generationFinished) {
        await urlRetriever.retrieveURLs(dbClient)
    }else{

        let docs = await getOwnersNames(dbClient);
        const namesArray = docs.map(doc => doc.name);

        await generateQuery(dbClient,
            {
                sort: sort_by,
                order: order,
                // specification: specification,
                // state: state,
                // owner: namesArray
        })
    }
}

let main = async () => {
    dbClient = await connectUsingMongoose()
    dbClient.on('error', (err) => {
        console.log()
    })
    dbClient.on('disconnected', () => {
        handleDisconnect()
    })

    let docs = await getOwnersNames(dbClient);
    const namesArray = docs.map(doc => doc.name);

    let queries = await generateQuery(dbClient,
        {
            sort: sort_by,
            order: order,
            // specification: specification,
            // state: state,
            // owner: namesArray
        })
    console.log("Pushing queries...")
    for (let query of tqdm(queries)) {
        await pushQueryInDatabase(dbClient, query)
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    let iteration = 0;
    while (iteration < 1) {
        await urlRetriever.retrieveURLs(dbClient).catch(err => () => {l            // if is a cursor error, retry
            if (err.message.includes('cursor')) {
                console.log('Retrying...')
                urlRetriever.retrieveURLs(dbClient)
            }
        })
        iteration++;
        console.log('Iteration: ', iteration)
    }
}

main().then(() => {
    console.log('Finished');
    process.exit(0);
})
//     .then(() => {
//     console.log('Finished');
//     process.exit(0);
// }).catch(async (err) => {
//     let retries = 1;
//     while (true) {
//         try {
//             await main()
//             console.log('Main finished');
//             return;
//         } catch (err) {
//             console.log(err)
//             console.log(`MAIN failed (retrying in ${RETRY_DELAY_MS}ms) attempts ${retries}`);
//             retries++;
//             await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
//         }
//     }
// })
