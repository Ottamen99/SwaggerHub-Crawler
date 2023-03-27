const URI = process.env.MONGO_HOST || 'mongodb://localhost:27017';
const DATABASE_NAME = 'swagger';

module.exports = {
    URI,
    DATABASE_NAME
}