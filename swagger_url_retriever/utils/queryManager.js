const dbManager = require("../db/databaseManager.js");
const queryConfig = require('../config/queries')
const {BASE_SWAGGER_PROXY_URL} = require("../config/config");
const {pages} = require("../config/queries");

/**
 * Generate queries from parameters and return them
 * @param client - the mongo client
 * @param restParams - the parameters to generate the queries
 * @returns {Promise<string[]>} - the generated queries
 */
exports.generateQuery = async (client, { ...restParams } = {}) =>{
    const baseUrl = BASE_SWAGGER_PROXY_URL;
    const paramArrays = { ...restParams };
    const cartesianProduct = getCartesianProduct(paramArrays); // Generate all possible combinations of parameters
    const queries = cartesianProduct.flatMap(params => {
        return Array.from({ length: pages }, (_, i) => { // Generate all possible pages for each combination
            const queryParams = new URLSearchParams({ ...params, page: i }).toString();
            return `${baseUrl}${queryParams}`;
        });
    });
    console.log(`Number of queries generated: ${queries.length}`);
    return queries;
}

/**
 * Push a query in the database if it doesn't exist
 * @param client - the mongo client
 * @param query - the query to push
 * @returns {Promise<boolean>} - true if the query has been pushed, false otherwise
 */
exports.pushQueryInDatabase = async (client, query) => {
    // TODO: check if projection can be used to only get the query field
    let exists = await dbManager.getAPIProxy(client, query)
    if (!exists) {
        await dbManager.addAPIProxy(client, {query: query, processed: 0})
        return true;
    }
    return false;
}

/**
 * Get the cartesian product of the parameters
 * @param paramArrays - the parameters
 * @returns {*} - the cartesian product
 */
function getCartesianProduct(paramArrays) {
    const keys = Object.keys(paramArrays);
    const values = keys.map(key => paramArrays[key]);
    const result = values.reduce((acc, arr) => {
        return acc.flatMap(x => arr.map(y => [...x, y]));
    }, [[]]);
    return result.map(arr => {
        return arr.reduce((acc, val, i) => {
            acc[keys[i]] = val;
            return acc;
        }, {});
    });
}