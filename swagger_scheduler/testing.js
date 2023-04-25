const {connectUsingMongoose} = require("./db/mongoConnector");
const {getDatabases} = require("./db/databaseManager");

(async () => {
    client = await connectUsingMongoose()
    console.log(await getDatabases(client))
})()