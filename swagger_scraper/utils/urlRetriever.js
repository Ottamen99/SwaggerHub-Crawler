const axios = require('axios');
const { Kafka, Partitioners} = require('kafkajs');
const config = require('../config/config.js');
const apiManager = require("./apiManager");
const utilityFunctions = require("./utilityFunctions");
const databaseManager = require('../db/databaseManager.js');
const kafkaManager = require('./kafkaManager.js');
kafkaManager.setupKafka(true).catch(e => console.error(`[kafkaManager.setupKafka] ${e.message}`, e));

const producer = kafkaManager.getProducer();

const topic = config.kafkaConfig.topic.topic;

async function produceMessages(lstUrls) {
    await producer.connect();
    for (const urlElem of lstUrls) {
        const message = {
            url: urlElem.url,
            API_url_hash: utilityFunctions.hashString(urlElem.url)
        };
        await producer.send({
            topic,
            messages: [{
                    value: JSON.stringify(message),
                    partition: urlElem.kafkaPartition
                }]
        });
    }
    await producer.disconnect();
}

let buildUrl = (sortBy= undefined,
                order= undefined,
                limit= undefined,
                page= undefined,
                owner= undefined,
                spec= undefined) => {
    let url = 'https://app.swaggerhub.com/apiproxy/specs?'
    if (sortBy) {
        url += `sort=${sortBy}&`
    }
    if (order) {
        url += `order=${order}&`
    }
    if (limit) {
        url += `limit=${limit}&`
    }
    if (page) {
        url += `page=${page}&`
    }
    if (owner) {
        url += `owner=${owner}&`
    }
    if (spec) {
        url += `spec=${spec}&`
    }
    return url
}

// get list of APIs urls
let getAPIListUrls = (sortBy, order, limit, page, owner, spec) => {
    let urlToGetAPIList = buildUrl(sortBy, order, limit, page, owner, spec);
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
    // check if url is already in database
    let urlInDB = await databaseManager.getUrlIfExists(url)
    if (urlInDB) {
        // if yes, check if it has failed before
        let numberFailures = urlInDB.number_of_failure
        if (numberFailures > 0) {
            // if yes, add to kafka low priority partition for retry
            // if retry fails, more than 3 times with same error, drop it
            return config.kafkaConfig.priorities.LOW
        } else {
            // if no, add to kafka medium priority partition for update
            return config.kafkaConfig.priorities.MEDIUM
        }
    } else {
        // if not, add to kafka high priority partition
        return config.kafkaConfig.priorities.HIGH
    }
}


const retrieveURLs = async (sort_by, order, limit, page, owner, spec) => {
    let urls = await getAPIListUrls(sort_by, order, limit, page, owner, spec);
    let lstUrls = []
    for (const url of urls) {
        lstUrls.push({url: url, kafkaPartition: await selectKafkaPartition(url)})
    }
    await produceMessages(lstUrls).catch(err => console.error(err));
}

module.exports = {
    buildUrl,
    retrieveURLs
}