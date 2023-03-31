const db = require('./mongoConnector.js')();

// list all databases
exports.getDatabases = async () => {
    return await db.admin().listDatabases();
}


// ====================== API COLLECTION ======================

// add new api to the database
exports.addAPI = async (newApi) => {
    return await db.collection('apis').insertOne(newApi);
}

// get an api from the database by its API_url_hash
exports.getAPI = async (API_url_hash) => {
    return await db.collection('apis').findOne({_API_url_hash: API_url_hash});
}

// ====================== URL COLLECTION ======================

exports.addURL = async (newUrl) => {
    return await db.collection('urls').insertOne(newUrl);
}

exports.addURLs = async (newUrls) => {
    return await db.collection('urls').insertMany(newUrls);
}

exports.getURLs = async () => {
    return await db.collection('urls').find().toArray();
}

exports.getURL = async (url) => {
    return await db.collection('urls').findOne({_url: url})
}

exports.truncateURLs = async () => {
    return await db.collection('urls').deleteMany({});
}

exports.updateURL = async (filter, newUrl) => {
    const options = { upsert: false};
    return await db.collection('urls').updateOne(filter, { $set: newUrl }, options);
}

exports.getUrlIfExists = async (url) => {
    return await db.collection('urls').findOne({_url: url})
}

// ====================== APIPROXY COLLECTION ======================

exports.addAPIProxy = async (newAPIProxy) => {
    return await db.collection('proxyUrls').insertOne(newAPIProxy);
}

exports.addAPIProxies = async (newAPIProxies) => {
    return await db.collection('proxyUrls').insertMany(newAPIProxies);
}

// check if exists
exports.getAPIProxy = async (query) => {
    return await db.collection('proxyUrls').findOne({query: query})
}

exports.getAPIProxyCursor = () => {
    return db.collection('proxyUrls').find();
}

exports.addNewOwner = async (newOwner) => {
    return await db.collection('owners').insertOne(newOwner);
}

exports.addNewOwners = async (newOwners) => {
    return await db.collection('owners').insertMany(newOwners);
}

exports.getOwnerIfExists = async (name) => {
    return await db.collection('owners').findOne({name: name})}

exports.insertNewQueueElement = async (newQueueElement) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await db.collection('queue').insertOne(newQueueElement);
}