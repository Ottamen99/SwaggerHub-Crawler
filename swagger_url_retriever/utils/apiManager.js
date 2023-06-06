// function that creates a new API object from raw metadata
const { ApiObject } = require("../models/ApiObject");
const databaseManager = require("../db/databaseManager");
const utilityFunction = require("./utilityFunctions");

/**
 * Create a new ApiObject from raw metadata
 * @param api - raw metadata
 * @returns {ApiObject} - new ApiObject
 */
exports.createAPIObject = (api) => {
    let apiObject = new ApiObject();
    apiObject.API_reference = utilityFunction.getBaseURL(api.properties[0].url);
    apiObject.name = api.name;
    apiObject.description = api.description;
    apiObject.API_url = api.properties[0].url;
    apiObject.API_url_hash = utilityFunction.hashString(api.properties[0].url);
    apiObject.version = api.properties[1].value;
    apiObject.created_at = api.properties[2].value;
    apiObject.last_modified = api.properties[3].value;
    apiObject.OPENAPI_version = api.properties[7].value;
    apiObject.created_by = api.properties[11].value;
    return apiObject;
}

/**
 * Insert new apis in the database if they are not already there
 * @param client - database client
 * @param apiObjects - list of apis
 * @returns {Promise<void>} - void
 */
exports.insertApisInDb = async (client, apiObjects) => {
    // keep only apis that are not in the database
    const apiObjectsToInsert = [];
    // TODO: use projection to get only the API_url_hash field
    for (let i = 0; i < apiObjects.length; i++) {
        const apiExists = await databaseManager.getAPI(client, apiObjects[i].API_url_hash);
        if (!apiExists) {
            apiObjectsToInsert.push(apiObjects[i]);
        }
    }
    // insert new apis
    if (apiObjectsToInsert.length > 0) {
        await databaseManager.addAPIs(client, apiObjectsToInsert);
    }
}