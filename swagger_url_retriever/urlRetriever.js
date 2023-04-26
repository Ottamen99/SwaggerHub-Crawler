const axios = require('axios');
const apiManager = require("./utils/apiManager");
const databaseManager = require('./db/databaseManager');
const {UrlObject} = require("./models/UrlObject");
const {parseOwner, hashString} = require("./utils/utilityFunctions");
const {updateApis} = require("./utils/apiManager");

let alreadyInDbCounter = 0;

// get list of APIs urls
let getAPIListUrls = (client, url) => {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: url
        }).then((res) => {
            updateApis(client, res.data.apis.map(api => apiManager.createAPIObject(api))).then(_ => {
                resolve(res.data.apis.map(api => api.properties[0].url));
            }).catch(err => {
                reject(err);
            })
        }).catch((err) => {
            reject(err);
        });
    });
};

const insertUrlIfNotExists = async (client, url, proxyUrl) => {
    // check if url is already in database
    let urlInDB = await databaseManager.getUrlIfExists(client, url)
    if (!urlInDB) {
        // add it to database
        const urlObject = new UrlObject()
        urlObject.url = url
        urlObject.proxyUrl = proxyUrl
        urlObject.fetch_counter = 0
        urlObject.number_of_failure = 0
        urlObject.number_of_success = 0

        const ownerInDb = await databaseManager.getOwnerIfExists(client, parseOwner(urlObject.url))
        if (!ownerInDb) {
            await databaseManager.addNewOwner(client, {name: parseOwner(urlObject.url)})
        }
        await databaseManager.addURL(client, urlObject)
    } else {
        alreadyInDbCounter++
    }
}

exports.retrieveURLs = async (client, iteration) => {
    let requestCounter = 0
    const lstApiProxy = await databaseManager.getAllAPIProxy(client, iteration)
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
        await databaseManager.updateAPIProxy(client, apiProxy._id, iteration )
    }
}
