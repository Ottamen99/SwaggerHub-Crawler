const config = require('./dbConfig')
const { MongoClient } = require('mongodb');


// create a new MongoClient
const client = new MongoClient(config.URI);

// connect to the server
client.connect((err) => {
    if (err) {
        console.log('Error connecting to MongoDB', err);
    } else {
        console.log('Connected to MongoDB');
    }
});

module.exports = () => {
    return client.db(config.DATABASE_NAME);
};
