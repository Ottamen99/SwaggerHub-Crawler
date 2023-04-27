const dbManager = require("../db/databaseManager.js");
const queryConfig = require('../config/queries')
const {BASE_SWAGGER_PROXY_URL} = require("../config/constants");

exports.generateQuery = async (client, { ...restParams } = {}) =>{
    const baseUrl = BASE_SWAGGER_PROXY_URL;
    const paramArrays = { ...restParams };
    const cartesianProduct = getCartesianProduct(paramArrays);
    const queries = cartesianProduct.flatMap(params => {
        return Array.from({ length: 10 }, (_, i) => {
            const queryParams = new URLSearchParams({ ...params, page: i }).toString();
            return `${baseUrl}${queryParams}`;
        });
    });
    console.log(`Number of queries generated: ${queries.length}`);
    return queries;
}

exports.pushQueryInDatabase = async (client, query) => {
    let exists = await dbManager.getAPIProxy(client, query)
    if (!exists) {
        await dbManager.addAPIProxy(client, {query: query, processed: 0})
        return true;
    }
    return false;
}
    // let pushedQueries = 0;
    // for (let i = 0; i < queries.length; i++){
    //     const query = queries[i];
    //     let exists = await dbManager.getAPIProxy(client, query)
    //     if (!exists) {
    //         await dbManager.addAPIProxy(client, {query: query, processed: 0})
    //         pushedQueries++;
    //     }
    // }
    // console.log(`Number of queries pushed in database: ${pushedQueries}`);

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