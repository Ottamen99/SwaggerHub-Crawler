const databaseManager = require('./db/databaseManager');
const {getAllNewURLs, checkNumberOfFetchedAPIs, countElementsInQueue, countAllInQueue} = require("./db/databaseManager");
const {hashString} = require("./utils/utilityFunctions");
const {UrlObject} = require("./models/UrlObject");
const {refreshTimer, priorities, fetchLimitSize} = require("./config/config");
let tr = require('tor-request');
let request = require('request');


tr.setTorAddress('127.0.0.1', 9050);
tr.TorControlPort.host = '127.0.0.1';
tr.TorControlPort.port = 9051;
tr.TorControlPort.password = 'password';

let fetchCounter = 0;

const MAX_NUMBER_OF_FETCHES = fetchLimitSize;

let addElementsToQueue = (elements, priority) => {
    elements.forEach( async (element) => {
        const urlObject = new UrlObject(element)
        let exists = await databaseManager.getQueueElement(hashString(urlObject.url))
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
    const allNewUrls = await getAllNewURLs(MAX_NUMBER_OF_FETCHES - fetchCounter, fetchCounter)
    addElementsToQueue(allNewUrls, priorities.HIGH)

    // FOR URL UPDATE
    // const allKnownUrls = await databaseManager.getAllKnownURLs()
    // addElementsToQueue(allKnownUrls, priorities.MEDIUM)
}


let main = async () => {
    console.log('Started scheduler')
    console.log(`Refresh timer set at: ${refreshTimer / 1000}s`)
    fetchCounter = await countElementsInQueue()
    let allQueue = await countAllInQueue()
    const runScheduler = async () => {
        let sum = await checkNumberOfFetchedAPIs()
        if (fetchCounter >= MAX_NUMBER_OF_FETCHES) {
            console.log('Queue is full, waiting...')
            if (sum[0].total % allQueue === 0) {
                console.log('Waiting...')
                await new Promise(resolve => setTimeout(resolve, 91000))
                console.log('Refreshing queue...')
                fetchCounter = 0
            } else {
                allQueue = await countAllInQueue()
            }
        } else {
            console.log('Checking queue...')
            await checkUrlsQueue();
        }
        setTimeout(runScheduler, refreshTimer);
    };
    setTimeout(runScheduler, refreshTimer);
}
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

main()