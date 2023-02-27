const axios = require('axios');
const { Kafka, Partitioners} = require('kafkajs');
const config = require('../config/config.js');
const apiManager = require("./apiManager");
const utilityFunctions = require("./utilityFunctions");

const kafka = new Kafka({
    clientId: config.kafkaConfig.clientId,
    brokers: config.kafkaConfig.brokers
});

const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });

const topic = config.kafkaConfig.topic;

async function produceMessages(urls) {
    await producer.connect();
    for (const url of urls) {
        const message = {
            url: url,
            API_url_hash: utilityFunctions.hashString(url)
        };
        await producer.send({
            topic,
            messages: [{
                    value: JSON.stringify(message)
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


const retrieveURLs = async (sort_by, order, limit, page, owner, spec) => {
    let urls = await getAPIListUrls(sort_by, order, limit, page, owner, spec);
    await produceMessages(urls).catch(err => console.error(err));
}

module.exports = {
    buildUrl,
    retrieveURLs
}