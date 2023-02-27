const axios = require('axios');
const fs = require('fs');
const path = require('path');
const download = require('download');
const mkdirp = require('mkdirp');
const tqdm = require("tqdm");
const utils = require('./utils/utilityFunctions.js');
const { ApiObject } = require('./models/ApiObject.js');
const databaseManager = require('./db/databaseManager.js');

// perform a GET request to get the total number of APIs with axios
let getTotalNumberOfAPIs = (sortBy, order, limit, page, owner, spec) => {
    const url = buildUrl(sortBy, order, limit, page, owner, spec)
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: url
        }).then((res) => {
            resolve(res.data.totalCount);
        }).catch((err) => {
            reject(err);
        })
    })
}

// create async function to download all APIs of a page
const downloadAllAPIsOfPage = async (subdir, page) => {
    // get list of APIs of a page
    let apis_raw = await getAPIListUrls(sort_by, order, limit, page);
    // create folder to store APIs
    let dir = `./apis/${subdir}/${page}`;
    mkdirp.sync(dir);
    // download all APIs of a page and give unique names

    let completed_api_list = []

    let i = 0;
    for (let api of apis_raw) {
        // new ApiObject
        let apiObject = new ApiObject();
        try {
            // console.log(api)
            apiObject.name = api.name
            apiObject.description = api.description
            apiObject.API_url = api.properties[0].url
            apiObject.version = api.properties[1].value
            apiObject.created_at = api.properties[2].value
            apiObject.last_modified = api.properties[3].value
            apiObject.OPENAPI_version = api.properties[7].value

            // fetch api and append to apiObject
            apiObject.API_spec =
                await axios.get(api.properties[0].url)
                    .then((res) => {
                        return res.data
                    }
                )

            // const result = await databaseManager.addAPI(apiObject)
            // console.log(`API ${apiObject.name} added to the database with the following id: ${result.insertedId}`)

            await download(api.properties[0].url, dir, {filename: `${page}-${i}.json`});
            // write apiObject to file
            let apiObjectFile = path.join(dir, `${page}-${i}.json`);
            let apiObjectContent = JSON.stringify(apiObject);
            fs.writeFileSync(apiObjectFile, apiObjectContent);
            completed_api_list.push(apiObject)
        } catch (err) {
            console.log(err);
        }
        i++;
        await new Promise((resolve) => setTimeout(resolve, utils.randomDelay(500, 5000)));
    }
}


sort_by = 'CREATED'
order = 'ASC'
limit = 100
page = 0
owner = ''
spec = ''

asyncDownloader = async (n, dirName) => {
    // gen array of numbers from 1 to n
    let arr = Array.from(Array(n).keys());
    for (let i of tqdm(arr)) {
        await downloadAllAPIsOfPage(dirName, i);
    }
}

getTotalNumberOfAPIs(sort_by, order, limit, page).then((res) => {
    // print number of results
    console.log("Number of results: " + res)
    if (res >= 10000) {
        console.log("Number of results is too large. Reducing to 10000...")
        res = 10000
    }

    // calculate number of pages
    let n = Math.ceil(res / limit)
    // get number of pages to download
    console.log("Number of pages to download: " + n)


    // create dir in apis folder with query parameters and today's date as name
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
    let dateTime = date+'-'+time;
    let dirName = `${sort_by}-${order}-${limit}-${owner}-${spec}-${dateTime}`
    asyncDownloader(n, dirName)
})



// perform any cleanup or finalization tasks before stopping the app
function cleanup() {
    console.log('Performing cleanup tasks before stopping the app...');
    // do something, like close database connections, save data, etc.
    process.exit();
}

// listen for the SIGINT signal
process.on('SIGINT', function() {
    console.log('Received SIGINT signal, stopping the app...');
    cleanup();
});