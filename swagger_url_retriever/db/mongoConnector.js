const config = require('./dbConfig')
const mongoose = require('mongoose');

/**
 * Connects to MongoDB using mongoose
 * @param retryInterval - the interval between connection attempts
 * @param silent - if true, no messages will be printed to the console
 * @returns {Promise<*>} - the connection object
 */
exports.connectUsingMongoose = async (retryInterval = 5000, silent = false) => {
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
            if (!silent)
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

/**
 * Closes the connection to MongoDB
 * @param client - the connection object
 * @returns {Promise<void>} - a promise that resolves when the connection is closed
 */
exports.closeConnection = async (client) => await client.close({ force: true });
