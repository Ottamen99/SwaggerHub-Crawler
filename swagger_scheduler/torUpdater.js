const databaseManager = require('./db/databaseManager');
const {getAllNewURLs} = require("./db/databaseManager");
const {hashString} = require("./utils/utilityFunctions");
const {UrlObject} = require("./models/UrlObject");
const {refreshTimer, priorities} = require("./config/config");
let tr = require('tor-request');
let request = require('request');


tr.setTorAddress('127.0.0.1', 9050);
tr.TorControlPort.host = '127.0.0.1';
tr.TorControlPort.port = 9051;
tr.TorControlPort.password = 'password';

let main = async () => {
    // Refresh the Tor session every 30 seconds
    console.log(tr.TorControlPort)
    setInterval(() => {
        tr.renewTorSession(function (err, done) {
            console.log('New Tor session for request ' + done)
            if (err) throw err;
        });
        tr.request({
            url: 'https://api.ipify.org/',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        },(error, response, body) => {
            if (!error && response.statusCode === 200) {
                console.log('Your public IP address is:', body);
            } else {
                console.error('Error getting IP address:', error);
            }
        });
    }, 31000);
}

main()
