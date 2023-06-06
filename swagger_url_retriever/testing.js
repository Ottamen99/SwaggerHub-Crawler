const {getOwnersNames, getAllAPIProxy, getMaxProcessed} = require("./db/databaseManager");
const {connectUsingMongoose} = require("./db/mongoConnector");
const tqdm = require("tqdm");
const {ObjectId} = require("mongodb");


(async () => {
    let client = await connectUsingMongoose();
    const db = client.db;
    const collection1 = db.collection('urls');
    const collection2 = db.collection('queue');

    // let urlsObj = await collection1.find({_fetch_counter: 1}).toArray()
    // urlsObj = urlsObj.map((obj) => {
    //     let tmpDoc = obj;
    //     tmpDoc._fetch_counter = 0;
    //     tmpDoc._number_of_failure = 0;
    //     tmpDoc._number_of_success = 0;
    //     return JSON.stringify(tmpDoc)
    // })
    // let queueObj = await collection2.find().toArray()
    // // take only the urlObject field of the queue
    // queueObj = queueObj.map((obj) => {
    //     return obj.urlObject
    // })
    //
    // for (let urlDoc of tqdm(urlsObj)) {
    //     if (!queueObj.includes(urlDoc)) {
    //         console.log(urlDoc);
    //         console.log();
    //     }
    // }

    let queueObj = await collection2.find({consumed: true}).toArray()
    queueObj = queueObj.map((obj) => {
        return obj.urlObject
    })
    let urlsObj = await collection1.find({_fetch_counter: 0}).toArray()
    urlsObj = urlsObj.map((obj) => {
        return JSON.stringify(obj)
    })

    let updateObjs = []
    for (let queueObjDoc of tqdm(queueObj)) {
        if (urlsObj.includes(queueObjDoc)) {
            console.log(queueObjDoc);
            console.log();
            let tmpDoc = JSON.parse(queueObjDoc);
            tmpDoc._fetch_counter = 1;
            tmpDoc._number_of_failure = 0;
            tmpDoc._number_of_success = 1;
            updateObjs.push(tmpDoc);
        }
    }
    // update the collection via the ids
    let ids = updateObjs.map((obj) => {
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