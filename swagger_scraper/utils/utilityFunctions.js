const crypto = require('crypto');

/**
 * Hashes a string using sha256
 * @param str - the string to hash
 * @returns {string} - the hashed string
 */
exports.hashString = (str) => {
    const hash = crypto.createHash('sha256');
    hash.update(str);
    return hash.digest('hex');
}

/**
 * Parses the owner from a SwaggerHub url
 * @param url - the SwaggerHub url
 * @returns {*} - the owner
 */
exports.parseOwner = (url) => {
    return url.split('/')[4];
}

/**
 * Parses the API name from a SwaggerHub url to get url without version
 * @param url - the SwaggerHub url
 * @returns {*} - the API name
 */
exports.getBaseURL = (url) => {
    return url.split('/').slice(0, -1).join('/');
}
