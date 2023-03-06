class FetchingObject {
    get error() {
        return this._error;
    }

    set error(value) {
        this._error = value;
    }
    _id = null;
    _fetching_reference = "";
    _API_reference = "";
    _url_id = "";
    _timestamp = "";
    _headers = null;
    _response_code = "";
    _still_alive = null;
    _error = null;

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get fetching_reference() {
        return this._fetching_reference;
    }

    set fetching_reference(value) {
        this._fetching_reference = value;
    }

    get API_reference() {
        return this._API_reference;
    }

    set API_reference(value) {
        this._API_reference = value;
    }

    get url_id() {
        return this._url_id;
    }

    set url_id(value) {
        this._url_id = value;
    }

    get timestamp() {
        return this._timestamp;
    }

    set timestamp(value) {
        this._timestamp = value;
    }

    get headers() {
        return this._headers;
    }

    set headers(value) {
        this._headers = value;
    }

    get response_code() {
        return this._response_code;
    }

    set response_code(value) {
        this._response_code = value;
    }

    get still_alive() {
        return this._still_alive;
    }

    set still_alive(value) {
        this._still_alive = value;
    }
}

module.exports = {FetchingObject};