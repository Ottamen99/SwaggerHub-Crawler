const crypto = require('crypto');

// create delay function with random delay
exports.randomDelay = (min, max) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    console.log(`Delaying for ${delay} ms...`)
    return delay;
}

// create function that hash a string with sha256
exports.hashString = (str) => {
    const hash = crypto.createHash('sha256');
    hash.update(str);
    return hash.digest('hex');
}

// parse swaggerhub url to get the owner name
exports.parseOwner = (url) => {
    return url.split('/')[4];
}