const databaseManager = require('./db/databaseManager');
const {getAllNewURLs, checkNumberOfFetchedAPIs, countElementsInQueue, countAllInQueue} = require("./db/databaseManager");
const {hashString} = require("./utils/utilityFunctions");
const {UrlObject} = require("./models/UrlObject");
const {refreshTimer, priorities, fetchLimitSize, waitingTime} = require("./config/config");
let tr = require('tor-request');
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");


tr.setTorAddress('127.0.0.1', 9050);
tr.TorControlPort.host = '127.0.0.1';
tr.TorControlPort.port = 9051;
tr.TorControlPort.password = 'password';

let fetchCounter = 0;
let allQueue = 0
let dbClient;

const MAX_NUMBER_OF_FETCHES = fetchLimitSize;

let addElementsToQueue = async (elements, priority) => {
    let newElems = []
    let cnt = 0
    for (const element of elements) {
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
    // const allKnownUrls = await databaseManager.getAllKnownURLs()
    // addElementsToQueue(allKnownUrls, priorities.MEDIUM)
}

let runSchedule = async () => {
    allQueue = await countAllInQueue(dbClient)
    console.log("All queue: ", allQueue)
    console.log("Fetch counter: ", fetchCounter)
    const runScheduler = async () => {
        try {
            let sum = await checkNumberOfFetchedAPIs(dbClient)
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
    // Refresh the Tor session every 30 seconds
    // console.log(tr.TorControlPort)
    // setInterval(() => {
    //     tr.newTorSession(function (err, done) {
    //         if (err) throw err;
    //     });
    // }, 30000);

    // setInterval(() => {
    //     tr.request({
    //         url: 'https://api.ipify.org/',
    //         // torControlPort: torControlPort,
    //         // torControlPassword: torControlPassword,
    //         method: 'GET',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         // body: JSON.stringify({
    //         //     'signal': 'NEWNYM',
    //         // }),
    //     },(error, response, body) => {
    //         if (!error && response.statusCode === 200) {
    //             console.log('Your public IP address is:', body);
    //         } else {
    //             console.error('Error getting IP address:', error);
    //         }
    //     });
    // }, 5000);

