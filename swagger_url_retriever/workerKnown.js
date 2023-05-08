const axios = require('axios');
const apiManager = require("./utils/apiManager");
const databaseManager = require('./db/databaseManager');
const {UrlObject} = require("./models/UrlObject");
const {parseOwner, hashString} = require("./utils/utilityFunctions");
const {updateApis} = require("./utils/apiManager");
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const {setOverlapTest} = require("./db/databaseManager");

let dbClient
let alreadyInDbCounter = 0;
let endFlag = false

let overlaps = []

// get list of APIs urls
let getAPIListUrls = (url) => {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: url
        }).then((res) => {
            updateApis(dbClient, res.data.apis.map(api => apiManager.createAPIObject(api))).then(_ => {
                resolve(res.data.apis.map(api => api.properties[0].url));
            }).catch(err => {
                reject(err);
            })
        }).catch((err) => {
            reject(err);
        });
    });
};

const insertUrlIfNotExists = async (url, proxyUrl) => {
    // check if url is already in database
    let urlInDB = await databaseManager.getUrlIfExists(dbClient, url)
    if (!urlInDB) {
        // add it to database
        const urlObject = new UrlObject()
        urlObject.url = url
        urlObject.proxyUrl = proxyUrl
        urlObject.fetch_counter = 0
        urlObject.number_of_failure = 0
        urlObject.number_of_success = 0

        const ownerInDb = await databaseManager.getOwnerIfExists(dbClient, parseOwner(urlObject.url))
        if (!ownerInDb) {
            await databaseManager.addNewOwner(dbClient, {name: parseOwner(urlObject.url)})
        }
        await databaseManager.addURL(dbClient, urlObject)
    } else {
        alreadyInDbCounter++
        const urlObject = new UrlObject(urlInDB)
        // get the proxy url without the page number
        const urlObjectProxyUrlWithoutPageNumber = urlObject._proxyUrl.split('&page=')[0]
        const proxyUrlWithoutPageNumber = proxyUrl.split('&page=')[0]
        // check if proxy  url is aleady in the list of object of overlapping proxy urls
        if (urlObjectProxyUrlWithoutPageNumber !== proxyUrlWithoutPageNumber) {
            await setOverlapTest(dbClient, urlObjectProxyUrlWithoutPageNumber, proxyUrlWithoutPageNumber)
        }
    }
}

const handleDisconnect = async (incomingData) => {
    if (endFlag) return;
    console.log("Mongo disconnected")
    await closeConnection(dbClient).catch(() => console.log("Error while closing connection"));
    dbClient = await connectUsingMongoose(5000, true);
    // wait for ready state
    while (dbClient.readyState !== 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    dbClient.on('disconnected', () => handleDisconnect(incomingData));
    await retrieveURLs(incomingData);
}

const retrieveURLs = async (incomingUrl) => {
    let requestCounter = 0
    let urls = await getAPIListUrls(incomingUrl.query);
    // get count of urls
    let countForAnApiProxy = urls.length
    for (const url of urls) {
        await insertUrlIfNotExists(url, incomingUrl.query)
        requestCounter++
    }
    // get percentage of urls already in db
    let percentage = (alreadyInDbCounter / countForAnApiProxy) * 100
    console.log(`Percentage of already existing URLs: ${percentage}% for ${incomingUrl.query}`)
    alreadyInDbCounter = 0
    await databaseManager.updateAPIProxy(dbClient, incomingUrl._id)
    endFlag = true;
    await closeConnection(dbClient).catch(() => console.log("Error while closing connection"));
}

module.exports = async ({incomingUrl}) => {
    await new Promise(resolve => setTimeout(resolve, 10000));
    incomingUrl = JSON.parse(incomingUrl)
    endFlag = false
    dbClient = await connectUsingMongoose(5000, true);
    dbClient.on('error', (err) => {
        console.log("Something went wrong with mongo: " + err.message)
    })
    dbClient.on('disconnected', () => handleDisconnect(incomingUrl));
    await retrieveURLs(incomingUrl);
}