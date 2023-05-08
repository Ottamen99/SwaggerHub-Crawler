const {getOwnersNames, getAllAPIProxy, getMaxProcessed, setOverlap} = require("./db/databaseManager");
const {connectUsingMongoose} = require("./db/mongoConnector");
const tqdm = require("tqdm");


(async () => {
    let client = await connectUsingMongoose();
    const db = client.db;
    const collection1 = db.collection('urls');
    const collection2 = db.collection('queue');

    collection1.find({_fetch_counter: 1}).toArray().then((documents) => {
        collection2.find().toArray().then((queueDocuments) => {
            for (let doc of tqdm(documents)) {
                let isInQueue = false;
                for (let queueDoc of queueDocuments) {
                    if (queueDoc.urlObject === JSON.stringify(doc)) {
                        isInQueue = true;
                        break;
                    }
                }
                if (!isInQueue) {
                    console.log(doc);
                }
            }
        })
    })
})()
