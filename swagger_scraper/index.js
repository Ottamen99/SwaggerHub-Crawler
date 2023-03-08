// make http request with axios to specific url
// and return the response

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const download = require('download');
const mkdirp = require('mkdirp');
const tqdm = require("tqdm");
const dir = './apis';
const request = require('request');
const Stopwatch = require('statman-stopwatch');

const sw = new Stopwatch();


let getTotalNumberOfAPIs = () => {
    const url = 'https://app.swaggerhub.com/apiproxy/specs?limit=1&page=1';
    const options = {
        url: url,
        headers: {
            'User-Agent': 'request'
        }
    }
    return new Promise((resolve, reject) => {
        request(options, (err, res, body) => {
            if (err) {
                reject(err);
            }
            resolve(JSON.parse(body).totalCount);
        });
    })
}

// get total number of APIs
let totalNumberOfAPIs
getTotalNumberOfAPIs().then((res) => {
    totalNumberOfAPIs = res
    console.log(totalNumberOfAPIs)
})

sort_by = "CREATED"
order = "ASC"
limit = 25
page = 1



// get list of APIs
let getAPIListUrls = (sortBy, order, limit, page) => {
    let urlToGetAPIList = `https://app.swaggerhub.com/apiproxy/specs?sort=${sortBy}&order=${order}&limit=${limit}&page=${page}`
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: urlToGetAPIList
        }).then((res) => {
            urls = []
            res.data.apis.forEach((api) => {urls.push(api.properties[0].url)})
            resolve(urls)
        }).catch((err) => {
            reject(err)
        })
    })
}

// download all APIs to a folder named "apis"
const delay = async (ms = 75) =>
    new Promise(resolve => setTimeout(resolve, ms))

function task(url) {
    request(url, {json: true}, (err, res, body) => {
        // if http code is 403 count number of 403s
        if (res.statusCode === 403) {
            sw.stop()
            console.log("Forbidden 403")
            // time elapsed in seconds and minutes single log
            console.log(`Time elapsed: ${sw.read() / 1000} seconds`)
            console.log(`Number of APIs downloaded: ${count}`)

            sw.reset()
            process.exit(1)
            // return err
        }
        if (err) { return console.log(err); }
        let apiName
        try {
            apiName = body.info.title
            // remove special characters from apiName and apiVersion
            apiName = apiName.replace(/[^a-zA-Z0-9]/g, '_')

        } catch (error) {
            console.log(body)
            console.log(error)
        }
        let apiVersion
        try {
            apiVersion = body.info.version
            // check if apiVersion is empty
            if (apiVersion === "") {
                apiVersion = "1.0.0"
            }
            apiVersion = apiVersion.replace(/[^a-zA-Z0-9]/g, '_')
            count += 1
        } catch (error) {
            console.log(apiVersion)
            console.log(error)
        }
        let apiFileName = `${apiName}_${apiVersion}_${Math.floor(Math.random() * 1000000)}.json`
        let apiFilePath = path.join(dir, apiFileName)
        fs.writeFile(apiFilePath, JSON.stringify(body), (err) => {
            if (err) throw err;
            console.log(`${apiFileName} downloaded!`);
        });
    })
}

// download all APIs to a folder named "apis"
let downloadAllAPIs = async (apiListUrls) => {
    for (let i = 0; i < apiListUrls.length; i++) {
        task(apiListUrls[i])
        await delay()
    }
}
let count = 0
async function downloadNpages(n) {
    sw.start();
    for (let i = 1; i < n; i++) {
        await getAPIListUrls(sort_by, order, limit, i).then(async (res) => {
            let apiListUrls = res
            await downloadAllAPIs(apiListUrls)
        })
    }
    sw.stop()
    console.log(`Time elapsed: ${sw.read() / 1000} seconds`)
    console.log(`Number of APIs downloaded: ${count}`)
}

downloadNpages(100)
