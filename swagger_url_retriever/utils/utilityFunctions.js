const crypto = require('crypto');

/**
 * Hashes a string using sha256
 * @param str - string to hash
 * @returns {string} - hashed string
 */
exports.hashString = (str) => {
    const hash = crypto.createHash('sha256');
    hash.update(str);
    return hash.digest('hex');
}

/**
 * Parses the owner from a SwaggerHub url
 * @param url - SwaggerHub url
 * @returns {*} - owner
 */
exports.parseOwner = (url) => {
    return url.split('/')[4];
}

/**
 * Get API url without the version
 * @param url - SwaggerHub url
 * @returns {string} - API url without the version
 */
exports.getBaseURL = (url) => {
    return url.split('/').slice(0, -1).join('/');
}
