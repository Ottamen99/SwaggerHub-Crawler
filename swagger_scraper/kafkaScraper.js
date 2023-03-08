const axios = require("axios");
const {ApiObject} = require("./models/ApiObject");
const utils = require("./utils/utilityFunctions");
const config = require('./config/config.js');
const dbManager = require('./db/databaseManager.js');
const {hashString, parseOwner} = require("./utils/utilityFunctions");
const kafkaManager = require("./utils/kafkaManager");
const {UrlObject} = require("./models/UrlObject");
const {FetchingObject} = require("./models/fetchingObject");
const {LOW_PRIORITY_TIMEOUT} = require("./config/constants");

// kafkaManager.setupKafka(true).then(() => {
//     console.log('Kafka setup complete');
//     kafkaManager.logTopics();
// })

const topic = config.kafkaConfig.topic.topic;


// perform any cleanup or finalization tasks before stopping the app
async function cleanup() {
    console.log('Performing cleanup tasks before stopping the app...');
    // do something, like close database connections, save data, etc.
    await Promise.all([mainConsumer.disconnect(), lowPriorityConsumer.disconnect()]);
    process.exit();
}

// listen for the SIGINT signal
process.on('SIGINT', function() {
    console.log('Received SIGINT signal, stopping the app...');
    cleanup().catch(err => {
        console.log('Error during cleanup: ', err);
    });
});

let mainConsumer;
let lowPriorityConsumer;

const startConsumers = async () => {
    mainConsumer = await kafkaManager.getConsumer(config.kafkaMainConsumerConfig);
    lowPriorityConsumer = await kafkaManager.getConsumer(config.kafkaRetryConsumerConfig);

    await Promise.all([mainConsumer.connect(), lowPriorityConsumer.connect()]);
    console.log('[Consumers connected]');

    await Promise.all([mainConsumer.subscribe({
        topic: topic,
        fromBeginning: true,
        partitions: [config.kafkaConfig.priorities.HIGH]
    }), lowPriorityConsumer.subscribe({
        topic: topic,
        fromBeginning: true,
        partitions: [config.kafkaConfig.priorities.LOW],
    })]);
    console.log('[Consumers subscribed]');

    await Promise.all([consumeApiUrls(), retryConsumeApiUrls()]);
}


async function consumeApiUrls() {
    await mainConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            // get corresponding api from db
            const result = JSON.parse(message.value.toString())

            switch (partition) {
                case config.kafkaConfig.priorities.HIGH:
                    const resultUrlObjectHigh = new UrlObject(JSON.parse(result.urlObject));
                    console.log('\n\nPartition high priority');
                    await fetchNewAPI(resultUrlObjectHigh, result.API_url_hash)
                    break;
                case config.kafkaConfig.priorities.MEDIUM:
                    const resultUrlObjectMedium = new UrlObject(JSON.parse(result.urlObject));
                    console.log('\n\nPartition medium priority');
                    await updateAPI(resultUrlObjectMedium, result.API_url_hash, 0)
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
    if (queryResult.headers) {
        fetchObject.headers = queryResult.headers;
        fetchObject.response_code = queryResult.status;
        fetchObject.still_alive = queryResult.status === 200;
    } else {
        fetchObject.error = queryResult.error;
        fetchObject.response_code = queryResult.status;
        fetchObject.still_alive = false;
    }

    // Add to database
    const inserted = await dbManager.addFetch(fetchObject);
    return inserted.insertedId
}

const fetchNewAPI = async (apiUrlObject, apiUrlHash, retries) => {
    let {apiObject, queryResult} = await getApiFromSwagger(apiUrlHash, retries);
    apiObject.fetching_reference = await createFetchObjAndInsertDb(apiObject, apiUrlObject, queryResult);
    if (queryResult.error) {
        return false; // API not found
    }
    await updateInfoUrl(apiUrlObject.url, queryResult.status);

    appendQueryResults(apiObject, queryResult);

    console.log('No changes in API spec');

    // Update API object in db
    const filter = { _API_url_hash: apiObject.API_url_hash };
    const update = await dbManager.updateAPI(filter, apiObject);
    console.log(`${update.matchedCount} document(s) matched the filter criteria.`);
    console.log(`${update.modifiedCount} document(s) were updated.`);

    await new Promise((resolve) => setTimeout(resolve, utils.randomDelay(500, 5000)));

    return true; // API added successfully
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

async function updateInfoUrl(apiUrl, queryResultStatus) {
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

async function getApiFromSwagger(apiUrlHash, retries) {
    // Get API object from db and convert it to ApiObject
    const api = await dbManager.getAPI(apiUrlHash);
    let apiObject = new ApiObject(api);
    try {
        const queryResult = await axios.get(apiObject.API_url).then((res) => {
            return {
                data: res.data,
                headers: res.headers,
                status: res.status
            }
        })
        return {apiObject, queryResult};
    } catch (err) {
        console.log("[ERROR] 404");
        if (err.code === "ERR_INVALID_URL") {
            const urlObject = new UrlObject(await dbManager.getURL(apiObject.API_url));
            const isUpdate = !!apiObject.fetching_reference;
            await kafkaManager.produceInLowPriority(urlObject, LOW_PRIORITY_TIMEOUT * (retries + 1), retries + 1, isUpdate)
            return {apiObject, queryResult: {status: 404, error: err}};
        } else if (err.code === "ERR_BAD_REQUEST") {
            const urlObject = new UrlObject(await dbManager.getURL(apiObject.API_url));
            const isUpdate = !!apiObject.fetching_reference;
            await kafkaManager.produceInLowPriority(urlObject, LOW_PRIORITY_TIMEOUT * (retries + 1), retries + 1, isUpdate)
            return {apiObject: apiObject, queryResult: {status: 400, error: err.code}};
        }
        return {apiObject: apiObject, queryResult: {status: 500, error: err.code}};
    }
}

const updateAPI = async (apiUrlObject, apiUrlHash, retries) => {
    let {apiObject, queryResult} = await getApiFromSwagger(apiUrlHash, retries);
    apiObject.fetching_reference = await createFetchObjAndInsertDb(apiObject, apiUrlObject, queryResult);
    if (queryResult.error) {
        return false; // return false if the api has not been found
    }
    const apiSwaggerObject = apiObject;
    await updateInfoUrl(apiUrlObject.url, queryResult.status);

    const apiFromDb = await dbManager.getLastUpdatedApi(apiSwaggerObject.API_url_hash);
    const apiFromDbObject = new ApiObject(apiFromDb[apiFromDb.length - 1]);
    appendQueryResults(apiSwaggerObject, queryResult);


    // Check if API spec has changed
    if (apiSwaggerObject.API_spec_hash !== apiFromDbObject.API_spec_hash) {
        console.log('Changes in API spec');

        // Insert API object in db
        apiSwaggerObject.id = null;
        const insert = await dbManager.addAPI(apiSwaggerObject);
        console.log(`${insert.insertedId} document(s) was/were inserted.`);
    } else {
        console.log('No changes in API spec');
        apiFromDbObject.fetching_reference = apiSwaggerObject.fetching_reference;
        // Update API object in db
        const filter = { _id: apiFromDbObject.id };
        const update = await dbManager.updateAPI(filter, apiFromDbObject);
        console.log(`${update.matchedCount} document(s) matched the filter criteria.`);
        console.log(`${update.modifiedCount} document(s) were updated.`);
    }

    return true; // return true if the api has been updated
}

const handleLowPriority = async (consumedMessage) => {
    const apiUrlObject = new UrlObject(JSON.parse(consumedMessage.urlObject));
        if (consumedMessage.retryNumber <= 3) {
            // await timout
            console.log(`[URL] => ${apiUrlObject.url} is dead, retrying in ${consumedMessage.timeoutRetry} ms`)
            await new Promise(resolve => setTimeout(resolve, consumedMessage.timeoutRetry));
            // this url can be retried again
            switch (consumedMessage.isUpdate) {
                case true:
                    await updateAPI(apiUrlObject, consumedMessage.API_url_hash, consumedMessage.retryNumber);
                    break;
                case false:
                    await fetchNewAPI(apiUrlObject, consumedMessage.API_url_hash, consumedMessage.retryNumber);
                    break;
            }
    } else {
        // this url can't be retried anymore
        // it will be flagged as dead
            console.log(`[URL] => ${apiUrlObject.url} is dead`);
    }
}

const retryConsumeApiUrls = async () => {
    await lowPriorityConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            // get corresponding api from db
            const result = JSON.parse(message.value.toString())
            switch (partition) {
                case config.kafkaConfig.priorities.LOW:
                    console.log('\n\nPartition low priority');
                    await handleLowPriority(result);
                    break;
            }
        }
    });
}

startConsumers().catch((err) => {
    console.log(err);
})