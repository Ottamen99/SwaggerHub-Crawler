const {fetchLimitSize} = require("../config/config");

// list all databases
exports.getDatabases = async (client) => {
    return await client.db.admin().listDatabases();
}


// ====================== API COLLECTION ======================

// add new api to the database
exports.addAPI = async (client, newApi) => {
    return await client.db.collection('apis').insertOne(newApi);
}

// get an api from the database by its API_url_hash
exports.getAPI = async (client, API_url_hash) => {
    return await client.db.collection('apis').findOne({_API_url_hash: API_url_hash});
}

// ====================== URL COLLECTION ======================

exports.addURL = async (client, newUrl) => {
    return await client.db.collection('urls').insertOne(newUrl);
}

exports.addURLs = async (client, newUrls) => {
    return await client.db.collection('urls').insertMany(newUrls);
}

exports.getURLs = async (client) => {
    return await client.db.collection('urls').find().toArray();
}

exports.getURL = async (client, url) => {
    return await client.db.collection('urls').findOne({_url: url})
}

exports.truncateURLs = async (client) => {
    return await client.db.collection('urls').deleteMany({});
}

exports.updateURL = async (client, filter, newUrl) => {
    const options = { upsert: false};
    return await client.db.collection('urls').updateOne(filter, { $set: newUrl }, options);
}

exports.getUrlIfExists = async (client, url) => {
    return await client.db.collection('urls').findOne({_url: url})
}

// ====================== APIPROXY COLLECTION ======================

exports.addAPIProxy = async (client, newAPIProxy) => {
    return await client.db.collection('proxyUrls').insertOne(newAPIProxy);
}

exports.addAPIProxies = async (client, newAPIProxies) => {
    return await client.db.collection('proxyUrls').insertMany(newAPIProxies);
}

// check if exists
exports.getAPIProxy = async (client, query) => {
    return await client.db.collection('proxyUrls').findOne({query: query})
}

exports.getAPIProxyCursor = (client) => {
    return client.db.collection('proxyUrls').find();
}

exports.addNewOwner = async (client, newOwner) => {
    return await client.db.collection('owners').insertOne(newOwner);
}

exports.addNewOwners = async (client, newOwners) => {
    return await client.db.collection('owners').insertMany(newOwners);
}

exports.getOwnerIfExists = async (client, name) => {
    return await client.db.collection('owners').findOne({name: name})}

exports.insertNewQueueElement = async (client, newQueueElement) => {
    return await client.db.collection('queue').insertOne(newQueueElement);
}

exports.insertNewQueueElements = async (client, newQueueElements) => {
    if (newQueueElements.length === 0) return;
    return await client.db.collection('queue').insertMany(newQueueElements);
}

exports.getURLsCursor = (client) => {
    return client.db.collection('urls').find();
}

// get all urls from the database
exports.getURLs = async (client) => {
    return await client.db.collection('urls').find().toArray();
}

exports.getAllNewURLs = async (client, fetchLimit, offset) => {
    return await client.db.collection('urls').aggregate([
        { $sort: { _id: 1 } },
        { $skip: offset },
        { $match: { "_fetch_counter": 0 } },
        { $limit: fetchLimit }
    ]).toArray()
    // return await client.db.collection('urls').find({_fetch_counter: 0}).sort({_id: 1}).skip(offset).limit(fetchLimit).toArray();
}

exports.getAllKnownURLs = async (client) => {
    return await client.db.collection('urls').find({_fetch_counter: {$gt: 0}}).toArray();
}

// check if element is in the queue by urlObject
exports.getQueueElement = async (client, urlHash) => {
    return await client.db.collection('queue').findOne({ API_url_hash: urlHash })
}

exports.checkNumberOfFetchedAPIs = async (client) => {
    return await client.db.collection('urls').aggregate([{$group: {_id: null, total: {$sum: "$_fetch_counter"}}}]).toArray();
}

exports.countElementsInQueue = async (client) => {
    return await client.db.collection('queue').countDocuments({consumed: null});
}

exports.countAllInQueue = async (client) => {
    return await client.db.collection('queue').countDocuments();
}

exports.flushQueue = async (client) => {
    return await client.db.collection('queue').deleteMany({consumed: null});
}