class UrlObject {

    constructor(urlObject) {
        Object.assign(this, urlObject);
    }

    get url() {
        return this._url;
    }

    set url(value) {
        this._url = value;
    }

    get fetch() {
        return this._fetch;
    }

    set fetch(value) {
        this._fetch = value;
    }
    _url = null;
    _fetch = [];

    _number_of_success = null;
    _number_of_failure = null;

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

class UrlFetchObject {
    _timestamp = null;
    _response_code = null;

    constructor(urlFetch) {
        Object.assign(this, urlFetch);
    }

    get timestamp() {
        return this._timestamp;
    }

    set timestamp(value) {
        this._timestamp = value;
    }

    get response_code() {
        return this._response_code;
    }

    set response_code(value) {
        this._response_code = value;
    }
}

module.exports = {UrlObject, UrlFetchObject};