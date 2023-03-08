const crypto = require('crypto');
const {BASE_SWAGGER_PROXY_URL} = require("../config/constants");

// create delay function with random delay
exports.randomDelay = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
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

// parse swaggerhub url to get the base url that is everything except the version
exports.getBaseURL = (url) => {
    return url.split('/').slice(0, -1).join('/');
}

exports.buildUrl = (sortBy= undefined,
                order= undefined,
                limit= undefined,
                page= undefined,
                owner= undefined,
                spec= undefined) => {
    let url = BASE_SWAGGER_PROXY_URL
    if (sortBy) {
        url += `sort=${sortBy}&`
    }
    if (order) {
        url += `order=${order}&`
    }
    if (limit) {
        url += `limit=${limit}&`
    }
    if (page) {
        url += `page=${page}&`
    }
    if (owner) {
        url += `owner=${owner}&`
    }
    if (spec) {
        url += `spec=${spec}&`
    }
    return url
}