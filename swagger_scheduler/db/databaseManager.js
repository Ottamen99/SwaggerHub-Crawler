// ====================== URL COLLECTION ======================

/**
 * Gets all new URLs from the database (i.e. URLs that have not been fetched yet)
 * @param client - the connection object
 * @param fetchLimit - the maximum number of URLs to fetch
 * @param offset - the offset to start fetching from
 * @returns {Promise<*>} - a promise that resolves to an array of URLs
 */
exports.getAllNewURLs = async (client, fetchLimit, offset) => {
    return await client.db.collection('urls').aggregate([
        { $sort: { _id: 1 } },
        { $skip: offset },
        { $match: { "_fetch_counter": 0 } },
        { $limit: fetchLimit }
    ]).toArray()
}

/**
 * Gets all Known URLs from the database (i.e. URLs that have been fetched at least once)
 * @param client - the connection object
 * @param fetchLimit - the maximum number of URLs to fetch
 * @param offset - the offset to start fetching from
 * @returns {Promise<*>} - a promise that resolves to an array of URLs
 */
exports.getAllKnownURLs = async (client, fetchLimit, offset) => {
    return await client.db.collection('urls').aggregate([
        { $sort: { _fetch_counter: 1 } },
        { $skip: offset },
        { $match: { "_fetch_counter": {$gt: 0} } },
        { $limit: fetchLimit }
    ]).toArray()
}

/**
 * Gets the sum of all fetch counters
 * @param client - the connection object
 * @returns {Promise<*>} - a promise that resolves to the sum of all fetch counters
 */
exports.checkNumberOfFetchedAPIs = async (client) => {
    return await client.db.collection('urls').aggregate([{$group: {_id: null, total: {$sum: "$_fetch_counter"}}}]).toArray();
}

/**
 * Counts the number of URLs in the database
 * @param client - the connection object
 * @returns {Promise<*>} - a promise that resolves to the number of URLs in the database
 */
exports.countURLs = async (client) => {
    return await client.db.collection('urls').countDocuments();
}

// ====================== QUEUE COLLECTION ======================

/**
 * Inserts new elements in the queue
 * @param client - the connection object
 * @param newQueueElements - the new elements to insert
 * @returns {Promise<*>} - a promise that resolves to the result of the insertion
 */
exports.insertNewQueueElements = async (client, newQueueElements) => {
    if (newQueueElements.length === 0) return;
    return await client.db.collection('queue').insertMany(newQueueElements);
}

/**
 * Get element from the queue
 * @param client - the connection object
 * @param urlHash - the hash of the URL to get
 * @returns {Promise<*>} - a promise that resolves to the element from the queue
 */
exports.getQueueElement = async (client, urlHash) => {
    return await client.db.collection('queue').findOne({ API_url_hash: urlHash })
}

/**
 * Counts not consumed elements in the queue
 * @param client - the connection object
 * @returns {Promise<*>} - a promise that resolves to the number of not consumed elements in the queue
 */
exports.countElementsInQueue = async (client) => {
    return await client.db.collection('queue').countDocuments({consumed: null});
}

/**
 * Counts all elements in the queue
 * @param client - the connection object
 * @returns {Promise<*>} - a promise that resolves to the number of all elements in the queue
 */
exports.countAllInQueue = async (client) => {
    return await client.db.collection('queue').countDocuments();
}

/**
 * Counts consumed elements in the queue
 * @param client - the connection object
 * @returns {Promise<*>} - a promise that resolves to the number of consumed elements in the queue
 */
exports.countConsumedURLs = async (client) => {
    return await client.db.collection('queue').countDocuments({consumed: true});
}

// ====================== EVOLUTION COLLECTIONS ======================

/**
 * Inserts a new element in the urlsEvolution collection
 * @param client - the connection object
 * @param timestamp - the timestamp of the element
 * @param urlCount - the number of URLs at the timestamp
 * @returns {Promise<*>} - a promise that resolves to the result of the insertion
 */
exports.insertUrlEvolution = async (client, timestamp, urlCount) => {
    return await client.db.collection('urlsEvolution').insertOne({timestamp: timestamp, urlCount: urlCount});
}

/**
 * Inserts a new element in the apisEvolution collection
 * @param client - the connection object
 * @param timestamp - the timestamp of the element
 * @param consumedUrlsCount - the number of consumed URLs at the timestamp
 * @returns {Promise<*>} - a promise that resolves to the result of the insertion
 */
exports.insertConsumedUrlEvolution = async (client, timestamp, consumedUrlsCount) => {
    return await client.db.collection('apisEvolution').insertOne({timestamp: timestamp, consumedUrlsCount: consumedUrlsCount});
}