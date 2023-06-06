// function that creates a new API object from raw metadata
const { ApiObject } = require("../models/ApiObject");
const databaseManager = require("../db/databaseManager");
const utilityFunction = require("./utilityFunctions");

const createAPIObject = (api) => {
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

// create new entry on the database
const addAPI = async (client, apiObject) => {
    const apiExists = await databaseManager.getAPI(client, apiObject.API_url_hash);
    if (apiExists) {
        // console.log(`API ${apiObject.name} already exists in the database`);
    } else {
        const result = await databaseManager.addAPI(client, apiObject);
        // console.log(`API ${apiObject.name} added to the database with the following id: ${result.insertedId}`);
    }
}

const updateApis = async (client, apiObjects) => {
    // keep only apis that are not in the database
    const apiObjectsToInsert = [];
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

module.exports = {
    createAPIObject,
    addAPI,
    updateApis
}