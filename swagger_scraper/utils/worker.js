const axios = require("axios");
const {ApiObject} = require("../models/ApiObject");
const utils = require("./utilityFunctions");
const config = require('../config/config.js');
const dbManager = require('../db/databaseManager.js');
const {hashString, parseOwner} = require("./utilityFunctions");
const {UrlObject} = require("../models/UrlObject");
const {FetchingObject} = require("../models/FetchingObject");
const {LOW_PRIORITY_TIMEOUT, TOR_PROXY} = require("../config/constants");
const { SocksProxyAgent } = require('socks-proxy-agent');
const {closeConnection, hasBeenClosed, connectToMongo, connectUsingMongoose} = require("../db/mongoConnector");
const {getElementToCheck, flagConsumeElement} = require("../db/databaseManager");
const databaseManager = require("../db/databaseManager");

const agent = new SocksProxyAgent(TOR_PROXY);
let dbClient

let endFlag = false

async function consumeApiUrls(incomingData) {
        switch (incomingData.priority) {
            case config.priorities.HIGH:
                try {
                    const resultUrlObjectHigh = new UrlObject(JSON.parse(incomingData.urlObject));
                    console.log('\n\nPartition high priority');
                    await fetchNewAPI(resultUrlObjectHigh, incomingData.API_url_hash)
                } catch (e) {
                    // Wait for the connection to be established
                    while (dbClient.readyState !== 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    console.log("Connection established")
                    // convert data to Url object
                    const urlObj = new UrlObject(JSON.parse(incomingData.urlObject))
                    const dbCheckObj = await getElementToCheck(dbClient, urlObj)
                    if (urlObj._fetch_counter < dbCheckObj._fetch_counter) {
                        console.log('Message already consumed, flagging as consumed...')
                        await databaseManager.flagConsumeElement(dbClient, incomingData);
                    }
                }
                break;
            case config.priorities.MEDIUM:
                const resultUrlObjectMedium = new UrlObject(JSON.parse(incomingData.urlObject));
                console.log('\n\nPartition medium priority');
                await updateAPI(resultUrlObjectMedium, incomingData.API_url_hash, 0)
                break;
        }
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
    const inserted = await dbManager.addFetch(dbClient, fetchObject);
    return inserted.insertedId
}

const fetchNewAPI = async (apiUrlObject, apiUrlHash, retries) => {
    let {apiObject, queryResult} = await getApiFromSwagger(apiUrlHash, retries);
    apiObject.fetching_reference = await createFetchObjAndInsertDb(apiObject, apiUrlObject, queryResult);
    await updateInfoUrl(apiUrlObject.url, queryResult.status);
    if (queryResult.error) {
        return false; // API not found
    }

    appendQueryResults(apiObject, queryResult);

    console.log('No changes in API spec');

    // Update API object in db
    const filter = { _API_url_hash: apiObject.API_url_hash };
    const update = await dbManager.updateAPI(dbClient, filter, apiObject);
    console.log(`${update.matchedCount} document(s) matched the filter criteria.`);
    console.log(`${update.modifiedCount} document(s) were updated.`);

    // await updateInfoUrl(apiUrlObject.url, queryResult.status);
    await new Promise((resolve) => setTimeout(resolve, 250));

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
    const url = await dbManager.getURL(dbClient, apiUrl);
    const urlObject = new UrlObject(url);

    urlObject.fetch_counter += 1;
    if (queryResultStatus !== 200) {
        urlObject.number_of_failure += 1;
    } else {
        urlObject.number_of_success += 1;
    }

    // Update URL object in db
    const filter_url = {_url: urlObject.url};
    const update_url = await dbManager.updateURL(dbClient, filter_url, urlObject).catch((err) => {
        console.log(err);
    });
    console.log(`[URL] => ${update_url.matchedCount} document(s) matched the filter criteria.`);
    console.log(`[URL] => ${update_url.modifiedCount} document(s) were updated.`);
}

async function getApiFromSwagger(apiUrlHash, retries) {
    // Get API object from db and convert it to ApiObject
    const api = await dbManager.getAPI(dbClient, apiUrlHash);
    let apiObject = new ApiObject(api);
    try {
        const queryResult = await axios({
            method: 'get',
            url: apiObject.API_url,
            httpsAgent: agent,
        }).then((res) => {
            return {
                data: res.data,
                headers: res.headers,
                status: res.status
            }
        })
        return {apiObject, queryResult};
    } catch (err) {
        const urlObject = new UrlObject(await dbManager.getURL(dbClient, apiObject.API_url));
        const isUpdate = !!apiObject.fetching_reference;
        switch (err.response.status) {
            case 404:
                console.log(`[ERROR] 404 - ${err.response.data.message}`);
                // await kafkaManager.produceInLowPriority(urlObject, LOW_PRIORITY_TIMEOUT * (retries + 1), retries + 1, isUpdate)
                return {apiObject, queryResult: {status: 404, error: err.code}};
            case 400:
                console.log(`[ERROR] 400 - ${err.response.data.message}`);
                // await kafkaManager.produceInLowPriority(urlObject, LOW_PRIORITY_TIMEOUT * (retries + 1), retries + 1, isUpdate)
                return {apiObject: apiObject, queryResult: {status: 400, error: err.code}};
            case 403:
                console.log(`[ERROR] 403 - ${err.response.data.message}`);
                // await handleForbiddenError();
                return {apiObject: apiObject, queryResult: {status: 403, error: err.code}};
            case 500:
                console.log(`[ERROR] 500 - ${err.response.data.message}`);
                // await kafkaManager.produceInLowPriority(urlObject, LOW_PRIORITY_TIMEOUT * (retries + 1), retries + 1, isUpdate)
                return {apiObject: apiObject, queryResult: {status: 500, error: err.code}};
        }
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

    const apiFromDb = await dbManager.getLastUpdatedApi(dbClient, apiSwaggerObject.API_url_hash);
    const apiFromDbObject = new ApiObject(apiFromDb[apiFromDb.length - 1]);
    appendQueryResults(apiSwaggerObject, queryResult);


    // Check if API spec has changed
    if (apiSwaggerObject.API_spec_hash !== apiFromDbObject.API_spec_hash) {
        console.log('Changes in API spec');

        // Insert API object in db
        apiSwaggerObject.id = null;
        const insert = await dbManager.addAPI(dbClient, apiSwaggerObject);
        console.log(`${insert.insertedId} document(s) was/were inserted.`);
    } else {
        console.log('No changes in API spec');
        apiFromDbObject.fetching_reference = apiSwaggerObject.fetching_reference;
        // Update API object in db
        const filter = { _id: apiFromDbObject.id };
        const update = await dbManager.updateAPI(dbClient, filter, apiFromDbObject);
        console.log(`${update.matchedCount} document(s) matched the filter criteria.`);
        console.log(`${update.modifiedCount} document(s) were updated.`);
    }

    // wait 250 ms
    await new Promise(resolve => setTimeout(resolve, 250));

    return true; // return true if the api has been updated
}

// const handleLowPriority = async (consumedMessage) => {
//     const apiUrlObject = new UrlObject(JSON.parse(consumedMessage.urlObject));
//     if (consumedMessage.retryNumber <= 3) {
//         // await timout
//         console.log(`[URL] => ${apiUrlObject.url} is dead, retrying in ${consumedMessage.timeoutRetry} ms`)
//         await new Promise(resolve => setTimeout(resolve, consumedMessage.timeoutRetry));
//         // this url can be retried again
//         switch (consumedMessage.isUpdate) {
//             case true:
//                 await updateAPI(apiUrlObject, consumedMessage.API_url_hash, consumedMessage.retryNumber);
//                 break;
//             case false:
//                 await fetchNewAPI(apiUrlObject, consumedMessage.API_url_hash, consumedMessage.retryNumber);
//                 break;
//         }
//     } else {
//         // this url can't be retried anymore
//         // it will be flagged as dead
//         console.log(`[URL] => ${apiUrlObject.url} is dead`);
//     }
// }

const handleForbiddenError = async () => {
    // pause consumers
    await Promise.all([mainConsumer.pause(), lowPriorityConsumer.pause()]);
    // wait for 60 seconds
    await new Promise(resolve => setTimeout(resolve, 60000));
    // resume consumers
    await Promise.all([mainConsumer.resume(), lowPriorityConsumer.resume()]);
}

// const retryConsumeApiUrls = async () => {
//     await lowPriorityConsumer.run({
//         eachMessage: async ({ _, partition, message }) => {
//             // get corresponding api from db
//             const result = JSON.parse(message.value.toString())
//             switch (partition) {
//                 case config.priorities.LOW:
//                     console.log('\n\nPartition low priority');
//                     await handleLowPriority(result);
//                     break;
//             }
//         }
//     });
// }

const handleDisconnect = async (incomingData) => {
    if (endFlag) return;
    console.log("Mongo disconnected")
    await closeConnection(dbClient).catch(() => console.log("Error while closing connection"));
    dbClient = await connectUsingMongoose()
    // wait for ready state
    while (dbClient.readyState !== 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    dbClient.on('disconnected', () => handleDisconnect(incomingData));
    await processIncomingData(incomingData);
}

const processIncomingData = async (incomingData) => {
    let tmpTime = Date.now();
    await consumeApiUrls(incomingData);
    await flagConsumeElement(dbClient, incomingData).catch(() => console.log("Error while flagging element"));
    endFlag = true;
    await closeConnection(dbClient).catch(() => console.log("Error while closing connection"));
    console.log(`[TIME] => ${Date.now() - tmpTime} ms`);
}


module.exports = async ({incomingData}) => {
    endFlag = false;
    dbClient = await connectUsingMongoose();
    dbClient.on('error', (err) => {
        console.log("Something went wrong with mongo: " + err.message)
    })
    dbClient.on('disconnected', () => handleDisconnect(incomingData));
    await processIncomingData(incomingData);
}