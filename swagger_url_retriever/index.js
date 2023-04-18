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
            // sort_by: sort_by,
            // order: order,
            // spec: spec,
            owner: ["fehguy"]
        }
    )

    await urlRetriever.retrieveURLsWithRetry()
}

const RETRY_DELAY_MS = 5000;

main().then(() => {
    console.log('Finished');
    process.exit(0);
}).catch(async (err) => {
    let retries = 1;
    while (true) {
        try {
            await main()
            console.log('Main finished');
            return;
        } catch (err) {
            console.log(`MAIN failed (retrying in ${RETRY_DELAY_MS}ms) attempts ${retries}`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
})
