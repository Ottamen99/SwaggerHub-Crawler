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

// add multiple apis to the database
exports.addAPIs = async (newApis) => {
    return await db.collection('apis').insertMany(newApis);
}

// get all apis from the database
exports.getAPIs = async () => {
    return await db.collection('apis').find().toArray();
}

// get an api from the database by its API_url_hash
exports.getAPI = async (API_url_hash) => {
    return await db.collection('apis').findOne({_API_url_hash: API_url_hash});
}

// truncate the database
exports.truncate = async () => {
    return await db.collection('apis').deleteMany({});
}

// update an api in the database, it finds the api by its API_url_hash
exports.updateAPI = async (filter, newApi) => {
    const options = { upsert: false};
    return await db.collection('apis').updateOne(filter, { $set: newApi }, options);
}

exports.updateFetchingRefAPI = async (filter, newMeta) => {
    const options = { upsert: false};
    return await db.collection('apis').updateOne(filter, { $set: {_meta: newMeta} }, options);
}

exports.getLastUpdatedApi = async (API_url_hash) => {
    return await db.collection('apis').find({ _API_url_hash: API_url_hash })
        .sort({ updatedAt: -1 })
        .toArray(function(err, docs) {
            if (err) throw err;
            return docs;
        });
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

exports.updateSuccessCounter = async (url) => {

}

exports.updateFailureCounter = async (url) => {

}

exports.updateURL = async (filter, newUrl) => {
    const options = { upsert: false};
    return await db.collection('urls').updateOne(filter, { $set: newUrl }, options);
}

exports.addNewFetch = async (url) => {

}

exports.checkIfURLExists = async (url) => {

}

exports.getUrlIfExists = async (url) => {
    return await db.collection('urls').findOne({_url: url})
}


// ====================== FETCH COLLECTION ======================

exports.addFetch = async (newFetch) => {
    return await db.collection('fetches').insertOne(newFetch);
}

exports.addFetches = async (newFetches) => {
    return await db.collection('fetches').insertMany(newFetches);
}

exports.getFetches = async () => {
    return await db.collection('fetches').find().toArray();
}

exports.getFetch = async (fetchRef) => {

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
    return await db.collection('queue').insertOne(newQueueElement);
}