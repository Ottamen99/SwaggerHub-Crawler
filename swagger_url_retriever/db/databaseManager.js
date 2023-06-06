const {ObjectId} = require("mongodb");

// ====================== API COLLECTION ======================

/**
 * Add an API to the database
 * @param client - the mongo client
 * @param newApi - the API object to add
 * @returns {Promise<*>} - the result of the insertion
 */
exports.addAPI = async (client, newApi) => await client.db.collection('apis').insertOne(newApi);

/**
 * Add multiple APIs to the database
 * @param client - the mongo client
 * @param apiObjects - the API objects to add
 * @returns {*} - the result of the insertion
 */
exports.addAPIs = async (client, apiObjects) => await client.db.collection('apis').insertMany(apiObjects);

/**
 * Get an API from the database
 * @param client - the mongo client
 * @param API_url_hash - the hash of the API url
 * @returns {Promise<*>} - the API object
 */
exports.getAPI = async (client, API_url_hash) => await client.db.collection('apis').findOne({_API_url_hash: API_url_hash});

// ====================== URL COLLECTION ======================

/**
 * Add a URL to the database
 * @param client - the mongo client
 * @param newUrl - the URL object to add
 * @returns {Promise<*>} - the result of the insertion
 */
exports.addURL = async (client, newUrl) => await client.db.collection('urls').insertOne(newUrl);

/**
 * Get a URL from the database
 * @param client - the mongo client
 * @param url - the URL to get
 * @returns {Promise<*>} - the URL object
 */
exports.getUrlIfExists = async (client, url) => await client.db.collection('urls').findOne({_url: url});

// ====================== PROXYURLS COLLECTION ======================

/**
 * Add a proxy url to the database
 * @param client - the mongo client
 * @param newAPIProxy - the proxy url object to add
 * @returns {Promise<*>} - the result of the insertion
 */
exports.addAPIProxy = async (client, newAPIProxy) => await client.db.collection('proxyUrls').insertOne(newAPIProxy);

/**
 * Get a proxy url from the database by query
 * @param client - the mongo client
 * @param query - the query to get the proxy url
 * @returns {Promise<*>} - the proxy url object
 */
exports.getAPIProxy = async (client, query) => await client.db.collection('proxyUrls').findOne({query: query})

/**
 * Get a proxy url from the database by id
 * @param client - the mongo client
 * @param id - the id of the proxy url
 * @returns {Promise<*>} - the proxy url object
 */
exports.getAPIProxyById = async (client, id) => await client.db.collection('proxyUrls').findOne({_id: id})

/**
 * Get all proxy urls from the database
 * @param client - the mongo client
 * @returns {Promise<*>} - the proxy url objects
 */
exports.getAllAPIProxy = async (client) => await client.db.collection('proxyUrls').find().toArray();

/**
 * Update a proxy url in the database
 * @param client - the mongo client
 * @param id - the id of the proxy url
 * @returns {Promise<awaited Promise<ResultType | void> | Promise<ResultType | void> | Promise<any>>} - the result of the update
 */
exports.increaseProcessed = async (client, id) => {
    const options = { upsert: false };
    return await client.db.collection('proxyUrls')
        .updateOne({_id: new ObjectId(id)}, { $inc: { processed: 1 } }, options)
        .catch(err => console.log(err));
}

/**
 * Get the max processed value
 * @param client - the mongo client
 * @returns {Promise<*>} - the max processed value
 */
exports.getMaxProcessed = async (client) => {
    const result = await client.db.collection('proxyUrls').aggregate([
        { $group: { _id: null, maxValue: { $max: "$processed" } } }
    ]).toArray();
    return result[0].maxValue;
}

/**
 * Get the min processed value
 * @param client - the mongo client
 * @returns {Promise<undefined|*>} - the min processed value
 */
exports.getMinProcessed = async (client) => {
    const result = await client.db.collection('proxyUrls').aggregate([
        { $group: { _id: null, minValue: { $min: "$processed" } } }
    ]).toArray();
    if (result.length === 0) return undefined;
    return result[0].minValue;
}

/**
 * Get the number of unprocessed proxy urls
 * @param client - the mongo client
 * @returns {Promise<*>} - unprocessed proxy urls
 */
exports.getUnprocessed = async (client) => await client.db.collection('proxyUrls').find({processed: 0}).toArray();

// ====================== OWNERS COLLECTION ======================

/**
 * Add a new owner to the database
 * @param client - the mongo client
 * @param newOwner - the owner object to add
 * @returns {Promise<*>} - the result of the insertion
 */
exports.addNewOwner = async (client, newOwner) => await client.db.collection('owners').insertOne(newOwner);

/**
 * Get an owner from the database
 * @param client - the mongo client
 * @param name - the name of the owner
 * @returns {Promise<*>} - the owner object
 */
exports.getOwnerIfExists = async (client, name) => await client.db.collection('owners').findOne({name: name});

/**
 * Get all owners name from the database
 * @param client - the mongo client
 * @returns {Promise<*>} - the owner objects
 */
exports.getOwnersNames = async (client) => await client.db.collection('owners').find({}, {name: 1, _id: 0}).toArray();

// ====================== STATSURL COLLECTION ======================

/**
 * Add new overlapping query to the database
 * @param client - the mongo client
 * @param proxyUrlNoPage - the proxy url without page
 * @param overlaps - the number of overlapping query
 * @returns {Promise<*>}
 */
exports.setOverlap = async (client, proxyUrlNoPage, overlaps) => {
    const options = { upsert: true };
    return await client.db.collection('statsUrl')
        .updateOne({proxyQuery: proxyUrlNoPage}, { $set: {overlaps: overlaps} }, options);
}

/**
 * Add new overlapping query to the database
 * @param client - the mongo client
 * @param proxyUrlNoPage - the proxy url without page
 * @param overlappingQuery - the overlapping query
 * @returns {Promise<*>} - the result of the insertion
 */
exports.setOverlapTest = async (client, proxyUrlNoPage, overlappingQuery) => {
    const options = { upsert: true };
    return await client.db.collection('statsUrl').updateOne({ $and: [
            { proxyQuery: proxyUrlNoPage },
            { overlappingQuery: overlappingQuery }
        ]}, { $inc: {overlaps: 1} }, options);
}