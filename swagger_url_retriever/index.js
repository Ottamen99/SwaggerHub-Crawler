const urlRetriever = require("./urlRetriever");
const {generateQuery} = require("./utils/queryManager");
const {sort_by, order, spec} = require("./config/queries");
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");

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
        await generateQuery(dbClient,
            {
                // sort_by: sort_by,
                order: order,
                // spec: spec,
                // owner: ["fehguy"]
            }
        )
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
    await generateQuery(dbClient,
        {
            // sort_by: sort_by,
            order: order,
            // spec: spec,
            // owner: ["fehguy"]
        })
    await urlRetriever.retrieveURLs(dbClient)
    // generationFinished = true;

    // await generateQuery(
    //     {
    //         sort_by: sort_by,
    //         order: order,
    //         spec: spec,
    //         // owner: ["fehguy"]
    //     }
    // )
    // await generateQuery(
    //     {
    //         // sort_by: sort_by,
    //         order: order,
    //         // spec: spec,
    //         // owner: ["fehguy"]
    //     }
    // )
    //
    // await urlRetriever.retrieveURLsWithRetry()
}

const RETRY_DELAY_MS = 5000;

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
