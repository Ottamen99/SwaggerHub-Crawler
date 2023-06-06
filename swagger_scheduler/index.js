const databaseManager = require('./db/databaseManager');
const {getAllNewURLs, checkNumberOfFetchedAPIs, countElementsInQueue, countAllInQueue, countURLs} = require("./db/databaseManager");
const {hashString} = require("./utils/utilityFunctions");
const {UrlObject} = require("./models/UrlObject");
const {refreshTimer, priorities, fetchLimitSize, waitingTime} = require("./config/config");
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const tqdm = require('tqdm');

let fetchCounter = 0;
let allQueue = 0
let dbClient;
let sum;

const MAX_NUMBER_OF_FETCHES = fetchLimitSize;

/**
 * Insert new update into the database to track the evolutions
 * @returns {Promise<void>} - a promise that resolves when the update is done
 */
let updateEvolutions = async () => {
    try {
        const timestamp = new Date().toISOString()

        // Insert the number of urls in the database
        let numUrls = await countURLs(dbClient)
        await databaseManager.insertUrlEvolution(dbClient, timestamp, numUrls)
        console.log("Inserted evolution")

        // Insert the number of processed apis
        let numConsumedUrls = await databaseManager.countConsumedURLs(dbClient)
        await databaseManager.insertConsumedUrlEvolution(dbClient, timestamp, numConsumedUrls)
        console.log("Inserted consumed evolution")
    } catch (err) {
        console.log("Error while updating evolutions")
    }
}

/**
 * Add new elements to the queue
 * @param elements - the elements to add
 * @param priority - the priority of the elements
 * @returns {Promise<void>} - a promise that resolves when the elements are added
 */
let addElementsToQueue = async (elements, priority) => {
    let newElems = []
    let cnt = 0
    for (const element of tqdm(elements)) {
        const urlObject = new UrlObject(element)
        // TODO: using projection to get only the hash
        let exists = await databaseManager.getQueueElement(dbClient, hashString(urlObject.url)).catch(err => console.log(err))
        if (!exists) {
            newElems.push({
                timestamp: Date.now(),
                urlObject: JSON.stringify(urlObject),
                API_url_hash: hashString(urlObject.url),
                priority: priority
            })
            cnt++
        }
    }
    // add new elements to queue
    await databaseManager.insertNewQueueElements(dbClient, newElems).catch(err => console.log(err))
    fetchCounter += cnt
}

/**
 * Check queue and add new elements if needed
 * @returns {Promise<void>} - a promise that resolves when the check is done
 */
let checkUrlsQueue = async () => {
    const allNewUrls = await getAllNewURLs(dbClient, MAX_NUMBER_OF_FETCHES - fetchCounter, allQueue).catch(err => console.log(err))
    console.log("Fetch counter: ", fetchCounter)
    console.log("All queue: ", allQueue)
    console.log("All new urls: ", allNewUrls.length)
    await addElementsToQueue(allNewUrls, priorities.HIGH)

    // FOR URL UPDATE
    // NOT WORKING
    // if (allNewUrls.length === 0) {
    //     const allKnownUrls = await databaseManager.getAllKnownURLs(dbClient, MAX_NUMBER_OF_FETCHES - fetchCounter, allQueue).catch(err => console.log(err))
    //     console.log("----- UPDATE URLS -----")
    //     console.log("Fetch counter: ", fetchCounter)
    //     console.log("All queue: ", allQueue)
    //     console.log("All new urls: ", allNewUrls.length)
    //     await addElementsToQueue(allKnownUrls, priorities.MEDIUM)
    // }
}

/**
 * Run the scheduler
 * @returns {Promise<void>} - a promise that resolves when the scheduler is done
 */
let runSchedule = async () => {
    allQueue = await countAllInQueue(dbClient)
    sum = await checkNumberOfFetchedAPIs(dbClient)
    console.log("All queue: ", allQueue)
    console.log("Fetch counter: ", fetchCounter)

    const runScheduler = async () => {
        try {
            await updateEvolutions()
            sum = await checkNumberOfFetchedAPIs(dbClient)
            if (fetchCounter >= MAX_NUMBER_OF_FETCHES) { // if queue is full
                console.log('Queue is full, waiting...')
                console.log(sum[0].total, allQueue, fetchCounter)
                if (sum[0].total % allQueue === 0 && sum[0].total !== 0) { // if all apis are waiting in queue are fetched
                    console.log('Waiting...')
                    await new Promise(resolve => setTimeout(resolve, waitingTime))
                    console.log('Refreshing queue...')
                    fetchCounter = 0
                } else {
                    allQueue = await countAllInQueue(dbClient)
                }
            } else { // if queue has space
                console.log('Checking queue...')
                allQueue = await countAllInQueue(dbClient)
                await checkUrlsQueue();
            }
            setTimeout(runScheduler, refreshTimer); // run again after refreshTimer
        } catch (err) {
            console.log("Something went wrong with the scheduler")
        }
    };
    setTimeout(runScheduler, 0); // run immediately at startup
}

/**
 * Handle the disconnection of the database
 * @returns {Promise<void>} - a promise that resolves when the disconnection is done
 */
let handleDisconnect = async () => {
    console.log("Mongo disconnected")
    await closeConnection(dbClient).catch(() => console.log("Error while closing connection"));
    dbClient = await connectUsingMongoose()
    // wait for ready state
    while (dbClient.readyState !== 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    dbClient.on('disconnected', handleDisconnect)
    await runSchedule()
}

/**
 * Main function
 * @returns {Promise<void>} - a promise that resolves when the main is done
 */
let main = async () => {
    console.log(`Refresh timer set at: ${refreshTimer / 1000}s`)
    // connect to mongo
    dbClient = await connectUsingMongoose()
    dbClient.on('error', (err) => {
        console.log("Something went wrong with mongo: " + err.message)
    })
    dbClient.on('disconnected', handleDisconnect)

    // start scheduler
    fetchCounter = await countElementsInQueue(dbClient)
    await runSchedule();
}

// Run main
main()
