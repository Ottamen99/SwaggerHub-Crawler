const axios = require('axios');
const config = require('../config/config.js');
const apiManager = require("./apiManager");
const utilityFunctions = require("./utilityFunctions");
const databaseManager = require('../db/databaseManager.js');
const kafkaManager = require('./kafkaManager.js');
const {UrlObject} = require("../models/UrlObject");
const utils = require("./utilityFunctions");

const topic = config.kafkaConfig.topic.topic;

async function produceMessages(lstUrls) {
    const producer = await kafkaManager.getProducer();
    await producer.connect();
    for (const urlElem of lstUrls) {
        const urlObject = new UrlObject(urlElem.urlObject);
        const message = {
            realTimestamp: Date.now(),
            urlObject: JSON.stringify(urlObject),
            API_url_hash: utilityFunctions.hashString(urlObject.url),
            // API_url_hash: utilityFunctions.hashString("https://api.swaggerhub.com/apis/fehguy/tesla/2.666.1"),
        };
        let time = Date.now();
        switch (urlElem.kafkaPartition) {
            case config.kafkaConfig.priorities.HIGH:
                time = 1;
                break;
            case config.kafkaConfig.priorities.MEDIUM:
                // date now minus 100 years
                time = 315360000000;
                break;
            case config.kafkaConfig.priorities.LOW:
                time = Date.now();
        }
        await producer.send({
            topic,
            messages: [{
                timestamp: time,
                value: JSON.stringify(message),
                partition: urlElem.kafkaPartition
            }]
        });
    }
    await producer.disconnect();
}

// get list of APIs urls
let getAPIListUrls = (sortBy, order, limit, page, owner, spec) => {
    let urlToGetAPIList = utils.buildUrl(sortBy, order, limit, page, owner, spec);
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: urlToGetAPIList
        }).then((res) => {
            const apiPromises = res.data.apis.map(api => {
                return apiManager.addAPI(apiManager.createAPIObject(api))
                    .then(r => api.properties[0].url);
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

const selectKafkaPartition = async (url) => {

    // url = "https://api.swaggerhub.com/apis/fehguy/tesla/2.666.1"

    // check if url is already in database
    let urlInDB = await databaseManager.getUrlIfExists(url)
    if (urlInDB) {
        // if yes, check if it has failed before
        let numberFailures = urlInDB.number_of_failure
        if (numberFailures > 0) {
            // if yes, add to kafka low priority partition for retry
            // if retry fails, more than 3 times with same error, drop it
            return {urlObject: new UrlObject(urlInDB), kafkaPartition: config.kafkaConfig.priorities.LOW}
        } else {
            // if no, add to kafka medium priority partition for update
            return {urlObject: new UrlObject(urlInDB), kafkaPartition: config.kafkaConfig.priorities.MEDIUM}
        }
    } else {
        // add it to database
        const urlObject = new UrlObject()
        urlObject.url = url
        // urlObject.url = "https://api.swaggerhub.com/apis/fehguy/tesla/2.666.1"
        urlObject.fetch_counter = 0
        urlObject.number_of_failure = 0
        urlObject.number_of_success = 0

        await databaseManager.addURL(urlObject)
        // if not, add to kafka high priority partition
        return {urlObject, kafkaPartition: config.kafkaConfig.priorities.HIGH}
    }
}


const retrieveURLs = async (sort_by, order, limit, page, owner, spec) => {
    let urls = await getAPIListUrls(sort_by, order, limit, page, owner, spec);
    let lstUrls = []
    for (const url of urls) {
        const {urlObject, kafkaPartition} = await selectKafkaPartition(url)
        lstUrls.push({urlObject, kafkaPartition})
    }
    await produceMessages(lstUrls).catch(err => console.error(err));
}

module.exports = {
    retrieveURLs
}