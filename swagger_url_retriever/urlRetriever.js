const axios = require('axios');
const apiManager = require("./utils/apiManager");
const databaseManager = require('./db/databaseManager');
const {UrlObject} = require("./models/UrlObject");
const {parseOwner, hashString} = require("./utils/utilityFunctions");
const {connectToMongo} = require("./db/mongoConnector");

let alreadyInDbCounter = 0;


// get list of APIs urls
let getAPIListUrls = (url) => {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: url
        }).then((res) => {
            const apiPromises = res.data.apis.map(api => {
                return apiManager.addAPI(apiManager.createAPIObject(api))
                    .then(_ => api.properties[0].url);
            });
            Promise.all(apiPromises).then(apiUrls => {
                resolve(apiUrls);
            }).catch(err => {
                reject(err);
            });
        }).catch((err) => {
            reject(err);
        });
    });
};

const insertUrlIfNotExists = async (url) => {
    // check if url is already in database
    let urlInDB = await databaseManager.getUrlIfExists(url)
    if (!urlInDB) {
        // add it to database
        const urlObject = new UrlObject()
        urlObject.url = url
        urlObject.fetch_counter = 0
        urlObject.number_of_failure = 0
        urlObject.number_of_success = 0

        const ownerInDb = await databaseManager.getOwnerIfExists(parseOwner(urlObject.url))
        if (!ownerInDb) {
            await databaseManager.addNewOwner({name: parseOwner(urlObject.url)})
        }
        await databaseManager.addURL(urlObject)
    } else {
        alreadyInDbCounter++
    }
}

retrieveURLs = async () => {
    let requestCounter = 0
    const cursor = databaseManager.getAPIProxyCursor()
    while (await cursor.hasNext()) {
        const doc = await cursor.next()
        let urls = await getAPIListUrls(doc.query);
        // get count of urls
        let countForAnApiProxy = urls.length
        for (const url of urls) {
            await insertUrlIfNotExists(url)
            requestCounter++
            // if (requestCounter >= 1172) {
            //     await new Promise(resolve => setTimeout(resolve, 91000));
            //     requestCounter = 0
            // }
        }
        // get percentage of urls already in db
        let percentage = (alreadyInDbCounter / countForAnApiProxy) * 100
        console.log(`Percentage of already existing URLs: ${percentage}% for ${doc.query}`)
        alreadyInDbCounter = 0
        await databaseManager.updateAPIProxy(doc._id)
    }
}

const RETRY_DELAY_MS = 5000; // 5 seconds

exports.retrieveURLsWithRetry = async () => {
    let retries = 1;
    while (true) {
        try {
            await retrieveURLs();
            console.log('Retrieve URLs succeeded.');
            return;
        } catch (err) {
            console.log(`Retrieve URLs failed (retrying in ${RETRY_DELAY_MS}ms) attempts ${retries}`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
}
