const {ObjectId} = require("mongodb");
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

exports.updateURL = async (filter, newUrl) => {
    const options = { upsert: false};
    return await db.collection('urls').updateOne(filter, { $set: newUrl }, options);
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

exports.removeElementFromQueue = async (elem) => {
    return await db.collection('queue').deleteOne({_id: new ObjectId(elem._id)});
}

exports.countElementsInQueueNotConsumed = async () => {
    return await db.collection('queue').countDocuments({consumed:null});
}

exports.getQueueCursor = async () => {
    // await new Promise(resolve => setTimeout(resolve, 2000))
    return db.collection('queue').find({consumed:null})
}


exports.flagConsumeElement=  async (elem) =>{
    await db.collection('queue').updateOne({_id: new ObjectId(elem._id)},{$set: {consumed:true}} )
}

exports.getQueueElementsNotConsumed = async () => {
    return await db.collection('queue').find({consumed:null}).toArray();
}