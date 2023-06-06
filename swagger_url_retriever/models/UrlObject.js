/**
 * Class representing a UrlObject from the "urls" collection in the database.
 * @class UrlObject
 * @param {string} id - id of the url
 * @param {string} url - url
 * @param {number} fetch_counter - number of times the url has been fetched
 * @param {number} number_of_success - number of times the url has been fetched successfully
 * @param {number} number_of_failure - number of times the url has failed to be fetched
 * @param {string} proxyUrl - proxy url
 */

class UrlObject {

    _id = null;
    _url = "";
    _fetch_counter = 0;
    _number_of_success = 0;
    _number_of_failure = 0;
    _proxyUrl = "";

    get proxyUrl() {
        return this._proxyUrl;
    }

    set proxyUrl(value) {
        this._proxyUrl = value;
    }

    constructor(newUrl) {
        Object.assign(this, newUrl);
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get url() {
        return this._url;
    }

    set url(value) {
        this._url = value;
    }

    get fetch_counter() {
        return this._fetch_counter;
    }

    set fetch_counter(value) {
        this._fetch_counter = value;
    }

    get number_of_success() {
        return this._number_of_success;
    }

    set number_of_success(value) {
        this._number_of_success = value;
    }

    get number_of_failure() {
        return this._number_of_failure;
    }

    set number_of_failure(value) {
        this._number_of_failure = value;
    }
}

module.exports = {UrlObject};