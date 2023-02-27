const db = require('./mongoConnector.js')();

// list all databases
exports.getDatabases = async () => {
    return await db.admin().listDatabases();
}

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