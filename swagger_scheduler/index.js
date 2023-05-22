const databaseManager = require('./db/databaseManager');
const {getAllNewURLs, checkNumberOfFetchedAPIs, countElementsInQueue, countAllInQueue, countURLs} = require("./db/databaseManager");
const {hashString} = require("./utils/utilityFunctions");
const {UrlObject} = require("./models/UrlObject");
const {refreshTimer, priorities, fetchLimitSize, waitingTime} = require("./config/config");
let tr = require('tor-request');
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const tqdm = require('tqdm');
const {ObjectId} = require("mongodb");


tr.setTorAddress('127.0.0.1', 9050);
tr.TorControlPort.host = '127.0.0.1';
tr.TorControlPort.port = 9051;
tr.TorControlPort.password = 'password';

let fetchCounter = 0;
let allQueue = 0
let dbClient;
let sum;

let reSyncDone = false;

const MAX_NUMBER_OF_FETCHES = fetchLimitSize;

let reSync = async (client, numberOutOfSync) => {
    let foundValues = 0
    const db = client.db;
    const collection1 = db.collection('urls');
    const collection2 = db.collection('queue');
    let needResyncIds = [];

    collection1.find({_fetch_counter: 0}).toArray().then((documents) => {
        collection2.find().toArray().then((queueDocuments) => {
            for (let doc of tqdm(documents)) {
                for (let queueDoc of queueDocuments) {
                    if (queueDoc.urlObject === JSON.stringify(doc)) {
                        foundValues++;
                        needResyncIds.push(queueDoc._id.toString());
                        break;
                    }
                }
                if (foundValues === numberOutOfSync) {
                    break;
                }
            }
            let a = needResyncIds.map((id) => { return new ObjectId(id) })
            // delete from queue the elements with needResyncIds
            collection2.deleteMany({_id: {$in: a}}).then((res) => {
                console.log(res)
                reSyncDone = true;
            })
        })
    })
}

let updateEvolutions = async () => {
    try {
        // get timestamp as year-month-day and hour minute second
        const timestamp = new Date().toISOString()

        let numUrls = await countURLs(dbClient)
        await databaseManager.insertUrlEvolution(dbClient, timestamp, numUrls)
        console.log("Inserted evolution")

        let numConsumedUrls = await databaseManager.countConsumedURLs(dbClient)
        await databaseManager.insertConsumedUrlEvolution(dbClient, timestamp, numConsumedUrls)
        console.log("Inserted consumed evolution")
    } catch (err) {
        console.log("Error while updating evolutions")
    }
}

let addElementsToQueue = async (elements, priority) => {
    let newElems = []
    let cnt = 0
    for (const element of tqdm(elements)) {
        const urlObject = new UrlObject(element)
        let exists = await databaseManager.getQueueElement(dbClient, hashString(urlObject.url)).catch(err => console.log(err))
        if (!exists) {
            newElems.push({
                timestamp: Date.now(),
                urlObject: JSON.stringify(urlObject),
                API_url_hash: hashString(urlObject.url),
                priority: priority
            })
            cnt++
            // await new Promise(resolve => setTimeout(resolve, 100))
        }
    }
    await databaseManager.insertNewQueueElements(dbClient, newElems).catch(err => console.log(err))
    fetchCounter += cnt
}
let checkUrlsQueue = async () => {
    const allNewUrls = await getAllNewURLs(dbClient, MAX_NUMBER_OF_FETCHES - fetchCounter, allQueue).catch(err => console.log(err))
    console.log("Fetch counter: ", fetchCounter)
    console.log("All queue: ", allQueue)
    console.log("All new urls: ", allNewUrls.length)
    await addElementsToQueue(allNewUrls, priorities.HIGH)

    // FOR URL UPDATE
    const allKnownUrls = await databaseManager.getAllKnownURLs(dbClient, MAX_NUMBER_OF_FETCHES - fetchCounter, allQueue).catch(err => console.log(err))
    await addElementsToQueue(allKnownUrls, priorities.MEDIUM)
}

let runSchedule = async () => {
    allQueue = await countAllInQueue(dbClient)
    console.log("All queue: ", allQueue)
    console.log("Fetch counter: ", fetchCounter)
    sum = await checkNumberOfFetchedAPIs(dbClient)
    let tmpSum = sum[0].total
    console.log("Sum: ", sum[0].total)

    if (sum[0].total % allQueue !== 0 && sum[0].total !== 0 && sum[0].total < allQueue) {
        for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000))
            sum = await checkNumberOfFetchedAPIs(dbClient)
            console.log("Sum: ", sum[0].total)
            if (tmpSum !== sum[0].total) {
                reSyncDone = true
                break
            } else {
                console.log("Scheduler is stuck...(iteration: ", i + 1, " over 5)");
            }
        }
        let outOfSyncValue = allQueue - sum[0].total
        console.log("Out of sync value: ", outOfSyncValue)
        await reSync(dbClient, outOfSyncValue)
    } else {
        reSyncDone = true
    }

    while (!reSyncDone) {
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const runScheduler = async () => {
        try {
            await updateEvolutions()
            sum = await checkNumberOfFetchedAPIs(dbClient)
            if (fetchCounter >= MAX_NUMBER_OF_FETCHES) {
                console.log('Queue is full, waiting...')
                console.log(sum[0].total, allQueue, fetchCounter)
                if (sum[0].total % allQueue === 0 && sum[0].total !== 0) {
                    console.log('Waiting...')
                    await new Promise(resolve => setTimeout(resolve, waitingTime))
                    console.log('Refreshing queue...')
                    fetchCounter = 0
                } else {
                    allQueue = await countAllInQueue(dbClient)
                }
            } else {
                console.log('Checking queue...')
                allQueue = await countAllInQueue(dbClient)
                await checkUrlsQueue(dbClient);
            }
            setTimeout(runScheduler, refreshTimer);
        } catch (err) {
            // console.log(err)
            console.log("Something went wrong with the scheduler")
        }
    };
    setTimeout(runScheduler, 0);
}

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

let main = async () => {
    console.log(`Refresh timer set at: ${refreshTimer / 1000}s`)
    dbClient = await connectUsingMongoose()
    dbClient.on('error', (err) => {
        console.log("Something went wrong with mongo: " + err.message)
    })
    dbClient.on('disconnected', handleDisconnect)
    fetchCounter = await countElementsInQueue(dbClient)
    await runSchedule();
}

main()
