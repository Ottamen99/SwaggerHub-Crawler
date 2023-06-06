const {ObjectId} = require("mongodb");

// ====================== API COLLECTION ======================

/**
 * Add an API to the database
 * @param client - the database client
 * @param newApi - the API to add
 * @returns {Promise<*>} - the result of the insertion
 */
exports.addAPI = async (client, newApi) => {
    return await client.db.collection('apis').insertOne(newApi);
}

/**
 * Get an API from the database by its API_url_hash
 * @param client - the database client
 * @param API_url_hash - the API_url_hash of the API to get
 * @returns {Promise<*>} - the API
 */
exports.getAPI = async (client, API_url_hash) => {
    return await client.db.collection('apis').findOne({_API_url_hash: API_url_hash});
}

/**
 * Update an API in the database
 * @param client - the database client
 * @param filter - the filter to apply
 * @param newApi - the new API
 * @returns {Promise<*>} - the result of the update
 */
exports.updateAPI = async (client, filter, newApi) => {
    const options = { upsert: false};
    return await client.db.collection('apis').updateOne(filter, { $set: newApi }, options).catch(err => console.log(err));
}

/**
 * Get the last updated API from the database
 * @param client - the database client
 * @param API_url_hash - the API_url_hash of the API to get
 * @returns {Promise<*>} - the API
 */
exports.getLastUpdatedApi = async (client, API_url_hash) => {
    return await client.db.collection('apis').find({ _API_url_hash: API_url_hash })
        .sort({ updatedAt: -1 })
        .toArray(function(err, docs) {
            if (err) throw err;
            return docs;
    });
}


// ====================== URL COLLECTION ======================

/**
 * Add an URL to the database
 * @param client - the database client
 * @param url - the URL to add
 * @returns {Promise<*>} - the result of the insertion
 */
exports.getURL = async (client, url) => {
    return await client.db.collection('urls').findOne({_url: url})
}

/**
 * Update an URL in the database
 * @param client - the database client
 * @param filter - the filter to apply
 * @param newUrl - the new URL
 * @returns {Promise<*>} - the result of the update
 */
exports.updateURL = async (client, filter, newUrl) => {
    const options = { upsert: false};
    return await client.db.collection('urls').updateOne(filter, { $set: newUrl }, options);
}

// ====================== FETCH COLLECTION ======================

/**
 * Add a fetch to the database
 * @param client - the database client
 * @param newFetch - the fetch to add
 * @returns {Promise<*>} - the result of the insertion
 */
exports.addFetch = async (client, newFetch) => {
    return await client.db.collection('fetches').insertOne(newFetch);
}

/**
 * Count number of fetches in the database that are not consumed
 * @param client - the database client
 * @returns {Promise<*>} - the number of fetches
 */
exports.countElementsInQueueNotConsumed = async (client) => {
    return await client.db.collection('queue').countDocuments({consumed:null});
}

/**
 * Flag a queue element as consumed
 * @param client - the database client
 * @param elem - the element to flag
 * @returns {Promise<void>} - nothing
 */
exports.flagConsumeElement = async (client, elem) =>{
    await client.db.collection('queue').updateOne({_id: new ObjectId(elem._id)},{$set: {consumed:true}} )
}

/**
 * Get all the queue elements that are not consumed
 * @param client - the database client
 * @returns {Promise<*>} - the queue elements
 */
exports.getQueueElementsNotConsumed = async (client) => {
    return await client.db.collection('queue').find({consumed:null}).toArray();
}

/**
 * Get element that needs to be checked after reconnecting to the database
 * @param client - the database client
 * @param elem - the element to get
 * @returns {Promise<*>} - the element
 */
exports.getElementToCheck = async (client, elem) => {
    return await client.db.collection('urls').findOne({_id: new ObjectId(elem._id)})
}
