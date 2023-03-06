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
const {FetchingObject} = require("./models/fetchingObject");

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
        partitions: [config.kafkaConfig.priorities.HIGH],
        partitionsAssigners: [
            async ({ partitions }) => {
                return partitions.sort((a, b) => a.partition - b.partition)
            },
        ],
        partitionsConsumedConcurrently: 1,
    })

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            // get corresponding api from db
            const result = JSON.parse(message.value.toString())
            const resultUrlObject = new UrlObject(JSON.parse(result.urlObject));

            switch (partition) {
                case config.kafkaConfig.priorities.HIGH:
                    console.log('\n\nPartition high priority');
                    await fetchNewAPI(resultUrlObject, result.API_url_hash)
                    break;
                case config.kafkaConfig.priorities.MEDIUM:
                    console.log('\n\nPartition medium priority');
                    await updateAPI(resultUrlObject, result.API_url_hash)
                    break;
                case config.kafkaConfig.priorities.LOW:
                    console.log('\n\nPartition low priority');
                    break;
            }
        }
    });
}

async function createFetchObjAndInsertDb(apiObject, apiUrlObject, queryResult) {
    const fetchObject = new FetchingObject()
    fetchObject.API_reference = apiObject.API_reference
    fetchObject.url_id = apiUrlObject.id; // ID of the URL
    fetchObject.timestamp = new Date().toISOString();
    fetchObject.headers = queryResult.headers;
    fetchObject.response_code = queryResult.status;
    fetchObject.still_alive = queryResult.status === 200;

    // Add to database
    const inserted = await dbManager.addFetch(fetchObject);
    return inserted.insertedId
}

const fetchNewAPI = async (apiUrlObject, apiUrlHash) => {
    let {apiObject, queryResult} = await getApiFromSwagger(apiUrlHash);
    await updateInformationsUrl(apiUrlObject.url, queryResult.status);

    appendQueryResults(apiObject, queryResult);

    console.log('No changes in API spec');
    apiObject.fetching_reference = await createFetchObjAndInsertDb(apiObject, apiUrlObject, queryResult);

    // Update API object in db
    const filter = { _API_url_hash: apiObject.API_url_hash };
    const update = await dbManager.updateAPI(filter, apiObject);
    console.log(`${update.matchedCount} document(s) matched the filter criteria.`);
    console.log(`${update.modifiedCount} document(s) were updated.`);

    await new Promise((resolve) => setTimeout(resolve, utils.randomDelay(500, 5000)));
}

function appendQueryResults(apiObject, queryResult) {

    apiObject.API_reference = utils.getBaseURL(apiObject.API_url)

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

async function updateInformationsUrl(apiUrl, queryResultStatus) {
    const url = await dbManager.getURL(apiUrl);
    const urlObject = new UrlObject(url);

    urlObject.fetch_counter += 1;
    if (queryResultStatus !== 200) {
        urlObject.number_of_failure += 1;
    } else {
        urlObject.number_of_success += 1;
    }

    // Update URL object in db
    const filter_url = {_url: urlObject.url};
    const update_url = await dbManager.updateURL(filter_url, urlObject);
    console.log(`[URL] => ${update_url.matchedCount} document(s) matched the filter criteria.`);
    console.log(`[URL] => ${update_url.modifiedCount} document(s) were updated.`);
}

async function getApiFromSwagger(apiUrlHash){
    // Get API object from db and convert it to ApiObject
    const api = await dbManager.getAPI(apiUrlHash);
    let apiObject = new ApiObject(api);
    const queryResult = await axios.get(apiObject.API_url).then((res) => {
        return {
            data: res.data,
            headers: res.headers,
            status: res.status
        }
    })

    return {apiObject, queryResult};
}

const updateAPI = async (apiUrlObject, apiUrlHash) => {
    let {apiObject, queryResult} = await getApiFromSwagger(apiUrlHash);
    const apiSwaggerObject = apiObject;
    await updateInformationsUrl(apiUrlObject.url, queryResult.status);

    const apiFromDb = await dbManager.getLastUpdatedApi(apiSwaggerObject.API_url_hash);
    const apiFromDbObject = new ApiObject(apiFromDb[apiFromDb.length - 1]);
    appendQueryResults(apiSwaggerObject, queryResult);

    apiSwaggerObject.fetching_reference = await createFetchObjAndInsertDb(apiSwaggerObject, apiUrlObject, queryResult);

    // Check if API spec has changed
    if (apiSwaggerObject.API_spec_hash !== apiFromDbObject.API_spec_hash) {
        console.log('Changes in API spec');

        // Insert API object in db
        apiSwaggerObject.id = null;
        const insert = await dbManager.addAPI(apiSwaggerObject);
        console.log(`${insert.insertedId} document(s) was/were inserted.`);
    } else {
        console.log('No changes in API spec');

        // Update API object in db
        const filter = { _id: apiFromDbObject.id };
        const update = await dbManager.updateAPI(filter, apiFromDbObject);
        console.log(`${update.matchedCount} document(s) matched the filter criteria.`);
        console.log(`${update.modifiedCount} document(s) were updated.`);
    }
}

consumeApiUrls().catch((err) => {
    console.log(err);
})