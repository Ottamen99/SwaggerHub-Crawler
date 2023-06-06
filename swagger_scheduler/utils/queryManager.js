const {buildUrl} = require("./utilityFunctions.js");
const dbManager = require("../db/databaseManager.js");
const tqdm = require('tqdm');
const queryConfig = require('../config/queries')

exports.generateQueries = async () => {
    // build url for each query with all parameters with pages 0 to 100
    console.log('Generating queries...')
    for (let s of queryConfig.sort_by) {
        for (let o of queryConfig.order) {
            for (let spec of queryConfig.spec) {
                for (let p of tqdm(queryConfig.page)) {
                    let tmpLimit = queryConfig.limit
                    if (p === 100) {
                        tmpLimit = 99
                    }
                    let tmpQuery = buildUrl(s, o, tmpLimit, p, queryConfig.owner, spec)
                    let exists = await dbManager.getAPIProxy(tmpQuery)
                    if (!exists) {
                        await dbManager.addAPIProxy({query: tmpQuery})
                    }
                }
            }
        }
    }
}