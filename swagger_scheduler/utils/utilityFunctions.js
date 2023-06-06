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