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
    urlsObj = urlsObj.map((obj) => {
        let tmpDoc = obj;
        tmpDoc._fetch_counter = 0;
        tmpDoc._number_of_failure = 0;
        tmpDoc._number_of_success = 0;
        return JSON.stringify(tmpDoc);
    })
    let queueObj = await collection2.find().toArray()
    // take only the urlObject field of the queue
    queueObj = queueObj.map((obj) => {
        return obj.urlObject
    })

    // match the urlObject field of the queue with the urlObject field of the urls
    // if there is a match, then the url is in the queue
    // if there is no match, then the url is not in the queue update a counter
    // let ids = []
    // for (let urlObj of tqdm(urlsObj)) {
    //     if (!queueObj.includes(JSON.stringify(urlObj))) {
    //         count++;
    //         ids.push(urlObj._id.toString())
    //     }
    // }
    // console.log(count)
    // console.log(ids)
    // ids = ids.map((id) => {
    //     return new ObjectId(id)
    // })
    // // change value of _fetch_counter to 0 and _number_of_failure and _number_of_success to 0
    // // for each of those ids
    // await collection1.updateMany({_id: {$in: ids}}, {$set: {_fetch_counter: 0, _number_of_failure: 0, _number_of_success: 0}}).then((result) => {
    //     console.log(result)
    // })
    // console.log("done")

    let ids = []
    for (let queue of tqdm(queueObj)) {
        if (!urlsObj.includes(queue)) {
            count++;
            ids.push(JSON.parse(queue)._id.toString())
        }
    }
    console.log(count)
    console.log(ids)

    // // remove all the ids from the queue in database
    ids = ids.map((id) => {
        return new ObjectId(id)
    })

    await collection2.deleteMany({urlObject: {$in: ids}}).then((result) => {
        console.log(result)
    })

    // collection1.find({_fetch_counter: 1}).toArray().then(async (documents) => {
    //     for (let doc of tqdm(documents)) {
    //         let tmpDoc = doc;
    //         tmpDoc._fetch_counter = 0;
    //         tmpDoc._number_of_failure = 0;
    //         tmpDoc._number_of_success = 0;
    //         let a = await collection2.find({urlObject: JSON.stringify(tmpDoc)}).toArray()
    //         if (a.length === 0) {
    //             count++;
    //             console.log(doc);
    //             console.log();
    //         }
    //     }
    // })
})()
