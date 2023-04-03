const config = require('./dbConfig')
const { MongoClient } = require('mongodb');


// create a new MongoClient
const client = new MongoClient(config.URI, { directConnection: true });

// connect to the server
client.connect().then(r => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.log('Error connecting to MongoDB', err);
});

module.exports = () => {
    return client.db(config.DATABASE_NAME);
};
