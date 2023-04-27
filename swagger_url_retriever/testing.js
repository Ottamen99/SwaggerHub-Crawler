const {getOwnersNames, getAllAPIProxy, getMaxProcessed} = require("./db/databaseManager");
const {connectUsingMongoose} = require("./db/mongoConnector");


(async () => {
    let client = await connectUsingMongoose();
    // check if connection is ready
    while (client.readyState !== 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    docs = getMaxProcessed(client);
    console.log(docs);
})()