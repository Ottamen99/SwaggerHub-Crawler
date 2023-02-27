// function that creates a new API object from raw metadata
const { ApiObject } = require("../models/ApiObject");
const databaseManager = require("../db/databaseManager");
const utilityFunction = require("./utilityFunctions");

const createAPIObject = (api) => {
    let apiObject = new ApiObject();
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
const addAPI = async (apiObject) => {
    const result = await databaseManager.addAPI(apiObject);
    console.log(`API ${apiObject.name} added to the database with the following id: ${result.insertedId}`);
}

module.exports = {
    createAPIObject,
    addAPI
}