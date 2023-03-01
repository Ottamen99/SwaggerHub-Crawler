class ApiObject {
    get api() {
        return this._api;
    }

    set api(value) {
        this._api = value;
    }
    get API_url_hash() {
        return this._API_url_hash;
    }

    set API_url_hash(value) {
        this._API_url_hash = value;
    }

    constructor(api) {
        Object.assign(this, api);
    }
    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get meta() {
        return this._meta;
    }

    set meta(value) {
        this._meta = value;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get description() {
        return this._description;
    }

    set description(value) {
        this._description = value;
    }

    get created_at() {
        return this._created_at;
    }

    set created_at(value) {
        this._created_at = value;
    }

    get last_modified() {
        return this._last_modified;
    }

    set last_modified(value) {
        this._last_modified = value;
    }

    get created_by() {
        return this._created_by;
    }

    set created_by(value) {
        this._created_by = value;
    }

    get API_url() {
        return this._API_url;
    }

    set API_url(value) {
        this._API_url = value;
    }

    get version() {
        return this._version;
    }

    set version(value) {
        this._version = value;
    }

    get OPENAPI_version() {
        return this._OPENAPI_version;
    }

    set OPENAPI_version(value) {
        this._OPENAPI_version = value;
    }

    get API_spec() {
        return this._API_spec;
    }

    set API_spec(value) {
        this._API_spec = value;
    }

    get API_spec_hash() {
        return this._API_spec_hash;
    }

    set API_spec_hash(value) {
        this._API_spec_hash = value;
    }
    _id = null;
    _meta = {
        fetched_at: [],
        server: {},
        is_valid_JSON_spec: null,
    }
    _name = null;
    _description = null;
    _created_at = null;
    _last_modified = null;
    _created_by = null;
    _API_url = null;
    _version = null;
    _OPENAPI_version = null;
    _API_spec = {}
    _API_spec_hash = null;

    _API_url_hash = null;
}

module.exports = {ApiObject}