const urlRetriever = require("./urlRetriever");
const {generateQueries} = require("./utils/queryManager");

let main = async () => {
    await generateQueries()
    await urlRetriever.retrieveURLs()
}

main().then(() => {
    console.log('Finished');
    process.exit(0);
})
    .catch((err) => {
        console.log(err);
        process.exit(1);
    })
