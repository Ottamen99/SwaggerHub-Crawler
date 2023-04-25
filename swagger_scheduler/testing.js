const {connectUsingMongoose} = require("./db/mongoConnector");
const {getDatabases, getAllNewURLs} = require("./db/databaseManager");

(async () => {
    client = await connectUsingMongoose()
    console.log(await getDatabases(client))
    // console.log(await getAllNewURLs(client, 1172 - 0, 0).catch(err => console.log(err)))
})()