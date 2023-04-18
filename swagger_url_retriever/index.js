const urlRetriever = require("./urlRetriever");
const {generateQuery} = require("./utils/queryManager");
const {sort_by, order, spec} = require("./config/queries");

let main = async () => {
    // await generateQuery(
    //     {
    //         sort_by: sort_by,
    //         order: order,
    //         spec: spec,
    //         // owner: ["fehguy"]
    //     }
    // )
    await generateQuery(
        {
            sort_by: sort_by,
            // order: order,
            // spec: spec,
            // owner: ["fehguy"]
        }
    )

    await urlRetriever.retrieveURLsWithRetry()
}

main().then(() => {
    console.log('Finished');
    process.exit(0);
})
    // .catch((err) => {
    //     console.log(err);
    //     process.exit(1);
    // })
