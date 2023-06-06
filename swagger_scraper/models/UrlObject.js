/**
 * Class representing a UrlObject of document in "urls" collection in MongoDB.
 * @class UrlObject
 * @property {object} _id - The reference to the Url object.
 * @property {string} _url - The reference to the Url object.
 * @property {number} _fetch_counter - The reference to the Url object.
 * @property {number} _number_of_success - The reference to the Url object.
 * @property {number} _number_of_failure - The reference to the Url object.
 */
class UrlObject {
    _id = null;
    _url = "";
    _fetch_counter = 0;
    _number_of_success = 0;
    _number_of_failure = 0;

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