const axios = require('axios');
const apiManager = require("./utils/apiManager");
const databaseManager = require('./db/databaseManager');
const {UrlObject} = require("./models/UrlObject");
const {parseOwner} = require("./utils/utilityFunctions");
const {insertApisInDb} = require("./utils/apiManager");
const {connectUsingMongoose, closeConnection} = require("./db/mongoConnector");
const {setOverlapTest} = require("./db/databaseManager");

let dbClient
let alreadyInDbCounter = 0;
let endFlag = false

/**
 * Get the list of urls of APIs from SwaggerHub API Proxy
 * @param url - url of SwaggerHub API Proxy
 * @returns {Promise<unknown>} - list of urls
 */
let getListOfUrls = (url) => {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: url
        }).then((res) => {
            let apiObjects = res.data.apis.map(api => apiManager.createAPIObject(api));
            let urlsList = res.data.apis.map(api => api.properties[0].url);
            insertApisInDb(dbClient, apiObjects).then(_ => resolve(urlsList)).catch(err => reject(err)) // insert new apis in database
        }).catch((err) => reject(err));
    });
};

/**
 * Build a new UrlObject from url and proxyUrl
 * @param url - url
 * @param proxyUrl - proxy url
 * @returns {UrlObject} - new UrlObject
 */
const buildNewUrlObject = (url, proxyUrl) => {
    const urlObject = new UrlObject()
    urlObject.url = url
    urlObject.proxyUrl = proxyUrl
    urlObject.fetch_counter = 0
    urlObject.number_of_failure = 0
    urlObject.number_of_success = 0
    return urlObject;
}

/**
 * Check if owner is in database and insert it if it is not
 * @param ownerName - owner name
 * @returns {Promise<void>} - void
 */
const checkOwnerAndInsert = async (ownerName) => {
    const ownerInDb = await databaseManager.getOwnerIfExists(dbClient, ownerName)
    if (!ownerInDb) {
        await databaseManager.addNewOwner(dbClient, ownerName)
    }
}

/**
 * Insert url in database if it does not exist
 * @param url - url to insert
 * @param proxyUrl - proxy url that was used to retrieve the url
 * @returns {Promise<void>} - void
 */
const insertUrlIfNotExists = async (url, proxyUrl) => {
    // check if url is already in database
    let urlInDB = await databaseManager.getUrlIfExists(dbClient, url)
    if (!urlInDB) {
        const urlObject = buildNewUrlObject(url, proxyUrl);
        // check if owner is already in database
        await checkOwnerAndInsert(parseOwner(urlObject.url));
        await databaseManager.addURL(dbClient, urlObject)
    } else {
        alreadyInDbCounter++
        const urlObject = new UrlObject(urlInDB)
        // get the proxy url without the page number
        const urlObjectProxyUrlWithoutPageNumber = urlObject._proxyUrl.split('&page=')[0]
        const proxyUrlWithoutPageNumber = proxyUrl.split('&page=')[0]
        // check if the proxy url is different from the one in the database
        if (urlObjectProxyUrlWithoutPageNumber !== proxyUrlWithoutPageNumber) {
            // add new overlap to database
            await setOverlapTest(dbClient, urlObjectProxyUrlWithoutPageNumber, proxyUrlWithoutPageNumber)
        }
    }
}

/**
 * Handle disconnect from database
 * @param incomingData - query url
 * @returns {Promise<void>} - void
 */
const handleDisconnect = async (incomingData) => {
    if (endFlag) return; // if the process is finished, do not reconnect
    console.log("Mongo disconnected")
    await closeConnection(dbClient).catch(() => console.log("Error while closing connection"));
    dbClient = await connectUsingMongoose(5000, true);
    // wait for ready state
    while (dbClient.readyState !== 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    dbClient.on('disconnected', () => handleDisconnect(incomingData));

    // retrieve urls from SwaggerHub API Proxy query
    await retrieveURLs(incomingData);
}

/**
 * Retrieve urls from SwaggerHub API Proxy and insert them in database
 * @param incomingUrl - query url
 * @returns {Promise<void>} - void
 */
const retrieveURLs = async (incomingUrl) => {
    let urls = await getListOfUrls(incomingUrl.query);
    // get count of urls
    let countForAnApiProxy = urls.length
    for (const url of urls) {
        await insertUrlIfNotExists(url, incomingUrl.query)
    }
    // get percentage of urls already in db
    let percentage = (alreadyInDbCounter / countForAnApiProxy) * 100
    console.log(`Percentage of already existing URLs: ${percentage}% for ${incomingUrl.query}`)
    await databaseManager.increaseProcessed(dbClient, incomingUrl._id)
    alreadyInDbCounter = 0
    endFlag = true; // the process is finished
    await closeConnection(dbClient).catch(() => console.log("Error while closing connection"));
}

/**
 * Main function
 * @param incomingUrl - query url
 * @returns {Promise<void>} - void
 */
module.exports = async ({incomingUrl}) => {
    incomingUrl = JSON.parse(incomingUrl)
    endFlag = false
    // connect to database
    dbClient = await connectUsingMongoose(5000, true);
    dbClient.on('error', (err) => {
        console.log("Something went wrong with mongo: " + err.message)
    })
    dbClient.on('disconnected', () => handleDisconnect(incomingUrl));

    // retrieve urls from SwaggerHub API Proxy query
    await retrieveURLs(incomingUrl).catch(err => console.log(err));
}