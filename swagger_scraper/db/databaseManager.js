const config = require('./dbConfig')
const {ObjectId} = require("mongodb");

// list all databases
exports.getDatabases = async (client) => {
    return await client.db.admin().listDatabases();
}


// ====================== API COLLECTION ======================

// add new api to the database
exports.addAPI = async (client, newApi) => {
    return await client.db.collection('apis').insertOne(newApi);
}

// add multiple apis to the database
exports.addAPIs = async (client, newApis) => {
    return await client.db.collection('apis').insertMany(newApis);
}

// get all apis from the database
exports.getAPIs = async (client) => {
    return await client.db.collection('apis').find().toArray();
}

// get an api from the database by its API_url_hash
exports.getAPI = async (client, API_url_hash) => {
    return await client.db.collection('apis').findOne({_API_url_hash: API_url_hash});
}

// truncate the database
exports.truncate = async (client) => {
    return await client.db.collection('apis').deleteMany({});
}

// update an api in the database, it finds the api by its API_url_hash
exports.updateAPI = async (client, filter, newApi) => {
    const options = { upsert: false};
    return await client.db.collection('apis').updateOne(filter, { $set: newApi }, options).catch(err => console.log(err));
}

exports.updateFetchingRefAPI = async (client, filter, newMeta) => {
    const options = { upsert: false};
    return await client.db.collection('apis').updateOne(filter, { $set: {_meta: newMeta} }, options);
}

exports.getLastUpdatedApi = async (client, API_url_hash) => {
    return await client.db.collection('apis').find({ _API_url_hash: API_url_hash })
        .sort({ updatedAt: -1 })
        .toArray(function(err, docs) {
            if (err) throw err;
            return docs;
    });
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


// ====================== FETCH COLLECTION ======================

exports.addFetch = async (client, newFetch) => {
    return await client.db.collection('fetches').insertOne(newFetch);
}

exports.addFetches = async (client, newFetches) => {
    return await client.db.collection('fetches').insertMany(newFetches);
}

exports.getFetches = async (client) => {
    return await client.db.collection('fetches').find().toArray();
}

exports.removeElementFromQueue = async (client, elem) => {
    return await client.db.collection('queue').deleteOne({_id: new ObjectId(elem._id)});
}

exports.countElementsInQueueNotConsumed = async (client) => {
    return await client.db.collection('queue').countDocuments({consumed:null});
    // return QueueModel.countDocuments({consumed: null});
}

exports.getQueueCursor = async (client) => {
    // await new Promise(resolve => setTimeout(resolve, 2000))
    return client.db.collection('queue').find({consumed:null})
}


exports.flagConsumeElement = async (client, elem) =>{
    await client.db.collection('queue').updateOne({_id: new ObjectId(elem._id)},{$set: {consumed:true}} )
}

exports.getQueueElementsNotConsumed = async (client) => {
    return await client.db.collection('queue').find({consumed:null}).toArray();
}

exports.getElementToCheck = async (client, elem) => {
    return await client.db.collection('urls').find({_id: new ObjectId(elem._id)})
}
