const config = require('./dbConfig')
const { MongoClient } = require('mongodb');


// create a new MongoClient
const client = new MongoClient(config.URI, { directConnection: true });

let connectToMongo = async (retryInterval = 5000) => {
    let attempt = 1;
    while (true) {
        try {
            await client.connect();
            console.log('Connected to MongoDB');
            return;
        } catch (err) {
            console.log(`Error connecting to MongoDB (attempt ${attempt}):`);
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
        attempt++;
    }
}

(async () => {
    await connectToMongo();
})();

module.exports = () => {
    return client.db(config.DATABASE_NAME);
};

module.exports.connectToMongo = connectToMongo;
