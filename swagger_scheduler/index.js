const databaseManager = require('./db/databaseManager');
const {getAllNewURLs, checkNumberOfFetchedAPIs, countElementsInQueue, countAllInQueue} = require("./db/databaseManager");
const {hashString} = require("./utils/utilityFunctions");
const {UrlObject} = require("./models/UrlObject");
const {refreshTimer, priorities, fetchLimitSize, waitingTime} = require("./config/config");
let tr = require('tor-request');
let request = require('request');
const {connectToMongo} = require("./db/mongoConnector");


tr.setTorAddress('127.0.0.1', 9050);
tr.TorControlPort.host = '127.0.0.1';
tr.TorControlPort.port = 9051;
tr.TorControlPort.password = 'password';

let fetchCounter = 0;

const MAX_NUMBER_OF_FETCHES = fetchLimitSize;

let addElementsToQueue = (elements, priority) => {
    elements.forEach( async (element) => {
        const urlObject = new UrlObject(element)
        let exists = await databaseManager.getQueueElement(hashString(urlObject.url)).catch(err => console.log(err))
        if (!exists) {
            await databaseManager.insertNewQueueElement({
                timestamp: Date.now(),
                urlObject: JSON.stringify(urlObject),
                API_url_hash: hashString(urlObject.url),
                priority: priority
            }).then(() => {
                fetchCounter++
            })
        }
    })
}
let checkUrlsQueue = async () => {
    console.log("Fetch Counter: ", fetchCounter)
    const allNewUrls = await getAllNewURLs(MAX_NUMBER_OF_FETCHES - fetchCounter, fetchCounter).catch(err => console.log(err))
    addElementsToQueue(allNewUrls, priorities.HIGH)

    // FOR URL UPDATE
    // const allKnownUrls = await databaseManager.getAllKnownURLs()
    // addElementsToQueue(allKnownUrls, priorities.MEDIUM)
}

let runSchedule = async () => {
    console.log(`Refresh timer set at: ${refreshTimer / 1000}s`)
    fetchCounter = await countElementsInQueue()
    let allQueue = await countAllInQueue()
    console.log("All queue: ", allQueue)
    console.log("Fetch counter: ", fetchCounter)
    const runScheduler = async () => {
        let sum = await checkNumberOfFetchedAPIs()
        if (fetchCounter >= MAX_NUMBER_OF_FETCHES) {
            console.log('Queue is full, waiting...')
            console.log(sum[0].total, allQueue, fetchCounter)
            if (sum[0].total % allQueue === 0) {
                console.log('Waiting...')
                await new Promise(resolve => setTimeout(resolve, waitingTime))
                console.log('Refreshing queue...')
                fetchCounter = 0
            } else {
                allQueue = await countAllInQueue()
            }
        } else {
            console.log('Checking queue...')
            await checkUrlsQueue();
        }
        setTimeout(() => {
            runScheduler().catch(async (err) => {
                let retries = 1;
                while (true) {
                    try {
                        await runScheduler();
                        console.log('Scheduler started successfully from call back 1')
                        return;
                    } catch (err) {
                        console.log(`Error starting scheduler, retrying in ${RETRY_DELAY_MS / 1000}s...`);
                        retries++;
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    }
                }
            });
        }, refreshTimer);
    };
    setTimeout(() => {
        runScheduler().catch(async (err) => {
            let retries = 1;
            while (true) {
                try {
                    await runScheduler();
                    console.log('Scheduler started successfully from call back 2')
                    return;
                } catch (err) {
                    console.log(`Error starting scheduler, retrying in ${RETRY_DELAY_MS / 1000}s...`);
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                }
            }
        });
    }, refreshTimer);
}

const RETRY_DELAY_MS = 5000; // 5 seconds

let main = async () => {
    let retries = 1;
    while (true) {
        try {
            await runSchedule();
            console.log('Scheduler started successfully')
            return;
        } catch (err) {
            console.log(`Error starting scheduler, retrying in ${RETRY_DELAY_MS / 1000}s...`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
}

console.log("THIS IS A LOG FOR DOCKER")
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

