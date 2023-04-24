const config = require('./dbConfig')
const mongoose = require('mongoose');

let connectUsingMongoose = async (retryInterval = 5000) => {
    let attempt = 1;
    while (true) {
        try {
            let conn = await mongoose.createConnection(config.URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxIdleTimeMS: 86400000, // 24 hours
                serverSelectionTimeoutMS: 250,
                directConnection: true,
            }).asPromise()
            console.log('Connected to MongoDB');
            return conn;
        } catch (err) {
            // catching initial connection error
            console.log(`Error connecting to MongoDB (attempt ${attempt}):`);
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
        attempt++;
    }
}
let closeConnection = async (client) => {
    await client.close({ force: true })
}

module.exports.closeConnection = closeConnection;
module.exports.connectUsingMongoose = connectUsingMongoose;
