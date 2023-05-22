const {getOwnersNames, getAllAPIProxy, getMaxProcessed, setOverlap} = require("./db/databaseManager");
const {connectUsingMongoose} = require("./db/mongoConnector");
const tqdm = require("tqdm");
const {ObjectId} = require("mongodb");

let count = 0;

(async () => {
    let client = await connectUsingMongoose();
    const db = client.db;
    const collection1 = db.collection('urls');

    let urlsObj = await collection1.find({_fetch_counter: {$gt: 1}}).toArray()

    let ids = urlsObj.map((obj) => {
        return new ObjectId(obj._id)
    })

    await collection1.updateMany({_id: {$in: ids}}, {$set: {_fetch_counter: 1, _number_of_failure: 0, _number_of_success: 1}}).then((result) => {
        console.log(result)
    })


    // collection1.find({_fetch_counter: 0}).toArray().then((documents) => {
    //     collection2.find().toArray().then((queueDocuments) => {
    //         for (let doc of tqdm(documents)) {
    //             for (let queueDoc of queueDocuments) {
    //                 if (queueDoc.urlObject === JSON.stringify(doc)) {
    //                     console.log(doc);
    //                     // console.log(queueDoc);
    //                     console.log();
    //                     break;
    //                 }
    //             }
    //         }
    //     })
    // })
})()
