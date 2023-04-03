const databaseManager = require('./db/databaseManager');
const {getAllNewURLs} = require("./db/databaseManager");
const {hashString} = require("./utils/utilityFunctions");
const {UrlObject} = require("./models/UrlObject");
const {refreshTimer, priorities} = require("./config/config");
let tr = require('tor-request');
let request = require('request');


tr.TorControlPort.port = 9051;

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
            })
        }
    })
    console.log(`Added ${elements.length} elements to queue with priority ${priority}`)
}
let checkUrlsQueue = async () => {
    const allNewUrls = await getAllNewURLs()
    addElementsToQueue(allNewUrls, priorities.HIGH)

    // FOR URL UPDATE
    // const allKnownUrls = await databaseManager.getAllKnownURLs()
    // addElementsToQueue(allKnownUrls, priorities.MEDIUM)
}


let main = async () => {
    // console.log('Started scheduler')
    // console.log(`Refresh timer set at: ${refreshTimer / 1000}s`)
    // setInterval(function() {
    //     checkUrlsQueue();
    // }, refreshTimer);
    // Refresh the Tor session every 30 seconds
    // console.log(tr.TorControlPort)
    // setInterval(() => {
    //     tr.newTorSession((error, done) => {
    //         if (error) {
    //             console.error('Error requesting new Tor session:', error);
    //         } else {
    //             console.log('New Tor session created');
    //         }
    //     })
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
    tr.setTorAddress('127.0.0.1', 9050);
    tr.TorControlPort.send('SIGNAL NEWNYM', (error, done) => {
        if (error) {
            console.error('Error requesting new Tor session:', error);
        } else {
            console.log('New Tor session created');
        }
    })
}

// main()

tr.TorControlPort.send('SIGNAL NEWNYM', (error, done) => {
    if (error) {
        console.error('Error requesting new Tor session:', error);
    } else {
        console.log('New Tor session created');
    }
})