const {getOwnersNames, getAllAPIProxy, getMaxProcessed, setOverlap} = require("./db/databaseManager");
const {connectUsingMongoose} = require("./db/mongoConnector");
const tqdm = require("tqdm");
const {ObjectId} = require("mongodb");

let count = 0;

(async () => {
    let client = await connectUsingMongoose();
    const db = client.db;
    const collection1 = db.collection('urls');
    const collection2 = db.collection('queue');

    let urlsObj = await collection1.find({_fetch_counter: 1}).toArray()
    let queueObj = await collection2.find({consumed: true}).toArray()


    // get only the elements that are in queueObj but not in urlsObj
    let urlsObjStr = urlsObj.map((obj) => {
        return obj._id.toString()
    })
    let queueObjStr = queueObj.map((obj) => {
        return JSON.parse(obj.urlObject)
    })
    let ids = []
    for (let queueDoc of tqdm(queueObjStr)) {
        if (!urlsObjStr.includes(queueDoc._id.toString())) {
            // console.log(queueDoc);
            // console.log();
            ids.push(new ObjectId(queueDoc._id))
        }
    }
    console.log(ids.length);

    // update the urls collection via the ids
    await collection1.updateMany({_id: {$in: ids}}, {$set: {_fetch_counter: 1, _number_of_failure: 0, _number_of_success: 1}}).then((result) => {
        console.log(result);
    }
    ).catch((err) => {
        console.log(err);
    })
    console.log("done")

})()
