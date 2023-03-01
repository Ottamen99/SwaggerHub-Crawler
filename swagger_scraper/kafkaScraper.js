const axios = require("axios");
const urlRetriever = require("./utils/urlRetriever.js");
const mkdirp = require("mkdirp");
const {ApiObject} = require("./models/ApiObject");
const utils = require("./utils/utilityFunctions");
const tqdm = require("tqdm");
const { Kafka } = require('kafkajs')
const config = require('./config/config.js');
const dbManager = require('./db/databaseManager.js');
const {hashString, parseOwner} = require("./utils/utilityFunctions");
const {kafkaConfig} = require("./config/config");

sort_by = 'CREATED'
order = 'ASC'
limit = 5
page = 0
owner = ''
spec = ''

kafkaConfig.setupKafka(false).catch(e => console.error(`[kafkaConfig.setupKafka] ${e.message}`, e));

const topic = config.kafkaConfig.topic;

// perform any cleanup or finalization tasks before stopping the app
function cleanup() {
    console.log('Performing cleanup tasks before stopping the app...');
    // do something, like close database connections, save data, etc.
    process.exit();
}

// listen for the SIGINT signal
process.on('SIGINT', function() {
    console.log('Received SIGINT signal, stopping the app...');
    cleanup();
});

// get element from kafka topic
const consumerConfig = {
    groupId: config.kafkaConfig.groupId,
    maxInFlightRequests: 1,
    maxMessagesPerBatch: 1, // Consume 1 messages per batch
    autoCommitInterval: 3000, // Automatically commit messages every 3 seconds
};
async function consumeApiUrls() {
    const consumer = kafka.consumer(consumerConfig);
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    await consumer.run({
        // autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            // get corresponding api from db
            const result = JSON.parse(message.value.toString())
            await downloadAPI(result.url, result.API_url_hash)
        }
    });
}

// urlRetriever.retrieveURLs(sort_by, order, limit, page, owner, spec)
//     .then(() => {
//         console.log('Finished');
//         process.exit(0);
//     })
//     .catch((err) => {
//         console.log(err);
//         process.exit(1);
// });

const downloadAPI = async (apiUrl, apiUrlHash) => {
    // Get API object from db and convert it to ApiObject
    const api = await dbManager.getAPI(apiUrlHash);
    const apiObject = new ApiObject(api);
    const queryResult = await axios.get(apiUrl).then((res) => {
        return  {
            data: res.data,
            headers: res.headers,
            status: res.status
        }
    })
    apiObject.API_spec = queryResult.data
    apiObject.API_spec_hash = hashString(JSON.stringify(apiObject.API_spec));

    // Append creator name to API object
    if (apiObject.created_by === "") {
        apiObject.created_by = parseOwner(apiObject.API_url);
    }

    // Append fetched_at data to meta
    apiObject.meta.fetched_at.push({
        timestamp: new Date().toISOString(),
        still_alive: queryResult.status === 200,
        fetching_ref: "",
    })

    // Append server data to meta
    apiObject.meta.server.url = queryResult.data.host
    apiObject.meta.server.schemes = queryResult.data.schemes
    apiObject.meta.server.security = queryResult.data.security

    // Check if API spec is valid JSON
    try {
        apiObject.API_spec =
            typeof apiObject.API_spec === "string"
                ? JSON.parse(apiObject.API_spec)
                : apiObject.API_spec;
        apiObject.meta.is_valid_JSON_spec = true;
    } catch (err) {
        apiObject.meta.is_valid_JSON_spec = false;
    }

    // Update API object in db
    const filter = { _API_url_hash: apiObject.API_url_hash };
    const update = await dbManager.updateAPI(filter, apiObject);
    console.log(`${update.matchedCount} document(s) matched the filter criteria.`);
    console.log(`${update.modifiedCount} document(s) were updated.`);

    await new Promise((resolve) => setTimeout(resolve, utils.randomDelay(500, 5000)));
}

consumeApiUrls().catch((err) => {
    console.log(err);
})