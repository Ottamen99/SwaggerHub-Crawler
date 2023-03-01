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

exports.a = async (API_url_hash) => {
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