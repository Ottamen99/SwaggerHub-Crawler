const axios = require('axios');
const apiManager = require("./utils/apiManager");
const databaseManager = require('./db/databaseManager');
const {UrlObject} = require("./models/UrlObject");
const {parseOwner, hashString} = require("./utils/utilityFunctions");
const {insertApisInDb} = require("./utils/apiManager");
const {setOverlapTest} = require("./db/databaseManager");
const {closeConnection} = require("./db/mongoConnector");

let alreadyInDbCounter = 0;

/**
 * Get the list of urls of APIs from SwaggerHub API Proxy
 * @param client - database client
 * @param url - url of SwaggerHub API Proxy
 * @returns {Promise<unknown>} - list of urls
 */
let getAPIListUrls = (client, url) => {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: url
        }).then((res) => {
            insertApisInDb(client, res.data.apis.map(api => apiManager.createAPIObject(api))).then(_ => {
                resolve(res.data.apis.map(api => api.properties[0].url));
            }).catch(err => {
                reject(err);
            })
        }).catch((err) => {
            reject(err);
        });
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
 * @param client - database client
 * @param url - url
 * @param proxyUrl - proxy url
 * @returns {Promise<void>} - void
 */
const insertUrlIfNotExists = async (client, url, proxyUrl) => {
    // check if url is already in database
    let urlInDB = await databaseManager.getUrlIfExists(client, url)
    if (!urlInDB) {
        // add it to database
        const urlObject = buildNewUrlObject(url, proxyUrl);

        const ownerInDb = await databaseManager.getOwnerIfExists(client, parseOwner(urlObject.url))
        if (!ownerInDb) {
            await databaseManager.addNewOwner(client, {name: parseOwner(urlObject.url)})
        }
        await databaseManager.addURL(client, urlObject)
    } else {
        alreadyInDbCounter++
        const urlObject = new UrlObject(urlInDB)
        // get the proxy url without the page number
        const urlObjectProxyUrlWithoutPageNumber = urlObject._proxyUrl.split('&page=')[0]
        const proxyUrlWithoutPageNumber = proxyUrl.split('&page=')[0]
        // check if the proxy url is different from the one in the database
        if (urlObjectProxyUrlWithoutPageNumber !== proxyUrlWithoutPageNumber) {
            // add new overlap to database
            await setOverlapTest(client, urlObjectProxyUrlWithoutPageNumber, proxyUrlWithoutPageNumber)
        }
    }
}

/**
 * Retrieve all urls from the APIs
 * @param client - database client
 * @returns {Promise<void>} - void
 */
exports.retrieveURLs = async (client) => {
    let requestCounter = 0
    const lstApiProxy = await databaseManager.getAllAPIProxy(client)
    for (const apiProxy of lstApiProxy) {
        let urls = await getAPIListUrls(client, apiProxy.query);
        // get count of urls
        let countForAnApiProxy = urls.length
        for (const url of urls) {
            await insertUrlIfNotExists(client, url, apiProxy.query)
            requestCounter++
        }
        // get percentage of urls already in db
        let percentage = (alreadyInDbCounter / countForAnApiProxy) * 100
        console.log(`Percentage of already existing URLs: ${percentage}% for ${apiProxy.query}`)
        alreadyInDbCounter = 0
        await closeConnection(client).catch(() => console.log("Error while closing connection"));
    }
}
