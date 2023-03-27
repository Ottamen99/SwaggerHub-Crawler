const urlRetriever = require("./utils/urlRetriever");

urlRetriever.retrieveURLs()
    .then(() => {
        console.log('Finished');
        process.exit(0);
    })
    .catch((err) => {
        console.log(err);
        process.exit(1);
    })


// const axios = require('axios');
// const {randomDelay} = require("./utils/utilityFunctions");
//
// axios.get('https://app.swaggerhub.com/apiproxy/specs?sort=CREATED&order=ASC&limit=100&page=0')
//     .then((response) => {
//         console.log(response.data.apis.length);
//     })
//     .catch((error) => {
//         console.error(error.response.status);
//     }).finally(() => {
//         process.exit(0);
// });
