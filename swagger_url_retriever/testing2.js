const {getOwnersNames, getAllAPIProxy, getMaxProcessed, setOverlap} = require("./db/databaseManager");
const {connectUsingMongoose} = require("./db/mongoConnector");
const tqdm = require("tqdm");


(async () => {
    let client = await connectUsingMongoose();
    const db = client.db;
    const coll = db.collection('statsUrl');
    let overlaps = []
    overlaps.push({queryName: "https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&sort=CREATED&order=ASC&specification=openapi-3.0.0&state=PUBLISHED",
    numberOfOverlaps: 1000})
    await setOverlap(client, "https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&sort=CREATED&order=ASC&specification=openapi-3.0.1&state=PUBLISHED", overlaps)
})()