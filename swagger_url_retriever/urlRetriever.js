const axios = require('axios');
const apiManager = require("./utils/apiManager");
const databaseManager = require('./db/databaseManager');
const {UrlObject} = require("./models/UrlObject");
const {parseOwner, hashString} = require("./utils/utilityFunctions");

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
        await databaseManager.insertNewQueueElement({
            timestamp: Date.now(),
            urlObject: JSON.stringify(urlObject),
            API_url_hash: hashString(urlObject.url),
            priority: 0
        })
    } else {
        const urlObject = new UrlObject(urlInDB)
        await databaseManager.insertNewQueueElement({
            timestamp: Date.now(),
            urlObject: JSON.stringify(urlObject),
            API_url_hash: hashString(urlObject.url),
            priority: 1
        })

    }
}

exports.retrieveURLs = async () => {
    const cursor = databaseManager.getAPIProxyCursor()
    while (await cursor.hasNext()) {
        const doc = await cursor.next()
        let urls = await getAPIListUrls(doc.query);
        for (const url of urls) {
            await insertUrlIfNotExists(url)
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}