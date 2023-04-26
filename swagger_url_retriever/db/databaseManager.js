exports.addAPIs = (client, apiObjects) => {
    return client.db.collection('apis').insertMany(apiObjects);
}


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

exports.getAllAPIProxy = async (client) => {
    return await client.db.collection('proxyUrls').find({processed: null}).toArray();
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await client.db.collection('queue').insertOne(newQueueElement);
}

exports.updateAPIProxy = async (client, id) => {
    const options = { upsert: false};
    return await client.db.collection('proxyUrls').updateOne({_id: id}, { $set: {processed: true} }, options);
}

exports.getOwnersNames = async (client) => {
    return await client.db.collection('owners').find({}, {name: 1, _id: 0}).toArray()
}