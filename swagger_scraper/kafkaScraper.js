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
const kafkaManager = require("./utils/kafkaManager");
const {UrlObject, UrlFetchObject} = require("./models/UrlObject");

sort_by = 'CREATED'
order = 'ASC'
limit = 1
page = 0
owner = ''
spec = ''

// kafkaManager.setupKafka(true).then(() => {
//     console.log('Kafka setup complete');
//     kafkaManager.logTopics();
// })

const topic = config.kafkaConfig.topic.topic;


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


async function consumeApiUrls() {
    const consumer = await kafkaManager.getConsumer(config.kafkaConsumerConfig)
    await consumer.connect();

    await consumer.subscribe({
        topic: topic,
        fromBeginning: true,
    })

    await consumer.run({
        partitionsConsumedConcurrently: 1,
        // autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {

            // console.log({
            //     partition,
            //     offset: message.offset,
            //     value: message.value.toString(),
            // })

            // get corresponding api from db
            const result = JSON.parse(message.value.toString())

            switch (partition) {
                case config.kafkaConfig.priorities.HIGH:
                    console.log('Partition high priority');
                    await fetchNewAPI(result.url, result.API_url_hash)
                    break;
                case config.kafkaConfig.priorities.MEDIUM:
                    console.log('Partition medium priority');
                    await updateAPI(result.url, result.API_url_hash)
                    break;
                case config.kafkaConfig.priorities.LOW:
                    console.log('Partition low priority');
                    break;
            }
        }
    });
}

const fetchNewAPI = async (apiUrl, apiUrlHash) => {
    let {apiObject, queryResult} = await updateInformationsUrl(apiUrl, apiUrlHash);

    const apiFromDb = await dbManager.getAPI(apiObject.API_url_hash);
    const apiFromDbObject = new ApiObject(apiFromDb);
    appendQueryResults(apiObject, queryResult);

    console.log('No changes in API spec');
    // Append fetched_at data to meta
    apiObject.meta.fetched_at.push({
        timestamp: new Date().toISOString(),
        still_alive: queryResult.status === 200,
        fetching_ref: apiFromDbObject.id,
    })
    // Update API object in db
    const filter = { _API_url_hash: apiObject.API_url_hash };
    const update = await dbManager.updateAPI(filter, apiObject);
    console.log(`${update.matchedCount} document(s) matched the filter criteria.`);
    console.log(`${update.modifiedCount} document(s) were updated.`);


    await new Promise((resolve) => setTimeout(resolve, utils.randomDelay(500, 5000)));
}

function appendQueryResults(apiObject, queryResult) {
    apiObject.API_spec = queryResult.data
    apiObject.API_spec_hash = hashString(JSON.stringify(apiObject.API_spec));

    // Append creator name to API object
    if (apiObject.created_by === "") {
        apiObject.created_by = parseOwner(apiObject.API_url);
    }

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
}

async function updateInformationsUrl(apiUrl, apiUrlHash) {
    const url = await dbManager.getURL(apiUrl);
    const urlObject = new UrlObject(url);

    // Get API object from db and convert it to ApiObject
    const api = await dbManager.getAPI(apiUrlHash);
    let apiObject = new ApiObject(api);
    const queryResult = await axios.get(apiUrl).then((res) => {
        return {
            data: res.data,
            headers: res.headers,
            status: res.status
        }
    })

    let urlFetch = new UrlFetchObject()
    urlFetch.timestamp = new Date().toISOString();
    urlFetch.response_code = queryResult.status;
    urlObject.fetch.push(urlFetch);

    if (queryResult.status !== 200) {
        urlObject.number_of_failure += 1;
    } else {
        urlObject.number_of_success += 1;
    }

    // Update URL object in db
    const filter_url = {_url: urlObject.url};
    const update_url = await dbManager.updateURL(filter_url, urlObject);
    console.log(`[URL] => ${update_url.matchedCount} document(s) matched the filter criteria.`);
    console.log(`[URL] => ${update_url.modifiedCount} document(s) were updated.`);
    return {apiObject, queryResult};
}

const updateAPI = async (apiUrl, apiUrlHash) => {
    let {apiObject, queryResult} = await updateInformationsUrl(apiUrl, apiUrlHash);

    const apiFromDb = await dbManager.a(apiObject.API_url_hash);
    const apiFromDbObject = new ApiObject(apiFromDb[apiFromDb.length - 1]);
    appendQueryResults(apiObject, queryResult);

    // Check if API spec has changed
    if (apiObject.API_spec_hash !== apiFromDbObject.API_spec_hash) {
        console.log('Changes in API spec');

        apiObject.meta.fetched_at = apiFromDbObject.meta.fetched_at;
        // Append fetched_at data to meta
        apiObject.meta.fetched_at.push({
            timestamp: new Date().toISOString(),
            still_alive: queryResult.status === 200,
            fetching_ref: "",
        })
        apiObject.id = null;
        // Insert API object in db
        const insert = await dbManager.addAPI(apiObject);
        console.log(`${insert.insertedId} document(s) was/were inserted.`);

        const newMeta = apiObject.meta;
        // get last element of fetched_at array

        newMeta.fetched_at[newMeta.fetched_at.length - 1].fetching_ref = insert.insertedId;
        // Update API object in db
        const filter = { _id: insert.insertedId };
        const update = await dbManager.updateFetchingRefAPI(filter, newMeta);
        console.log(`${update.matchedCount} document(s) matched the filter criteria.`);
    } else {
        console.log('No changes in API spec');
        // Append fetched_at data to meta
        apiFromDbObject.meta.fetched_at.push({
            timestamp: new Date().toISOString(),
            still_alive: queryResult.status === 200,
            fetching_ref: apiFromDbObject.id,
        })
        // Update API object in db
        const filter = { _id: apiFromDbObject.id };
        const update = await dbManager.updateAPI(filter, apiFromDbObject);
        console.log(`${update.matchedCount} document(s) matched the filter criteria.`);
        console.log(`${update.modifiedCount} document(s) were updated.`);
    }
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

consumeApiUrls().catch((err) => {
    console.log(err);
})