// create apis folder if it does not exist
const fs = require("fs");
exports.createFolder = (folderName) => {
    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
    }
}
// create logs and apis folders
exports.createFolder("logs");
exports.createFolder("apis");

// connect to the database
const databaseManager = require("./db/databaseManager.js");
databaseManager.getDatabases().then((res) => {
    console.log("Connected to mongoDB database");
}).catch((err) => {
    console.log("Error connecting to mongoDB database", err);
    process.exit(1);
});