const urlRetriever = require("./utils/urlRetriever");

sort_by = 'CREATED'
order = 'ASC'
limit = 1
page = 0
owner = ''
spec = ''

urlRetriever.retrieveURLs(sort_by, order, limit, page, owner, spec)
    .then(() => {
        console.log('Finished');
        process.exit(0);
    })
    .catch((err) => {
        console.log(err);
        process.exit(1);
    });