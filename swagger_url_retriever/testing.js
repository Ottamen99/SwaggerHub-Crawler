const {getOwnersNames, getAllAPIProxy} = require("./db/databaseManager");
const {connectUsingMongoose} = require("./db/mongoConnector");


(async () => {
    let client = await connectUsingMongoose();
    // check if connection is ready
    while (client.readyState !== 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    docs = await getAllAPIProxy(client);
    const namesArray = docs.map(doc => doc.query);
    console.log(namesArray);
})()