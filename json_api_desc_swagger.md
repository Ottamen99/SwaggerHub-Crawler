```json
{
  _id: "unique value to identify the fetch"
  meta: {
    fetched_at: [{
  		timestamp: "timestamp where the API spec was fetched"
			still_alive: "boolean to verify if the API is still alive"
  		fetching_ref: "reference to the previous fetch if the the url was fetched multiple times"
  
		}],
		server: {
      url: "api server url (if exists)"
      schemes: [] "protocol of the api server" //http, https or others? 
			security: [{}] "require security and what type of security (ex: oauth token)"
    },
		is_valid_JSON_spec: "boolean to check if the API spec is valid JSON"
  },
	name: "name of the api"
	description: "description of the api"
  created_at: "timestamp where the api was created"
  last_modified: "timestamp where the api was modified"
	created_by: "name of the owner"
	API_url: "url to swaggerhub repo"
	API_url_hash: "hash of the url"
	version: "version of the api"
	OPENAPI_version: "version of OPENAPI used"
  API_spec: {}, "API spec"
	API_spec_hash: "hash of the API spec"
}

```

## Version 2

### APIs

```json
{
  _id: "unique value to identify the fetch"
  _API_ref: "base url of the API"
  _fetching_ref:
  meta: {
		server: {
      url: "api server url (if exists)"
      schemes: [] "protocol of the api server" //http, https or others? 
			security: [{}] "require security and what type of security (ex: oauth token)"
    },
		is_valid_JSON_spec: "boolean to check if the API spec is valid JSON"
  },
	name: "name of the api"
	description: "description of the api"
  created_at: "timestamp where the api was created"
  last_modified: "timestamp where the api was modified"
	created_by: "name of the owner"
	API_url: "url to swaggerhub repo"
	API_url_hash: "hash of the url"
	version: "version of the api"
	OPENAPI_version: "version of OPENAPI used"
  API_spec: {}, "API spec"
	API_spec_hash: "hash of the API spec"
}
```

### Urls

```json
{
	_id:
	_url:
	_fetch_counter:
	_number_of_success:
	_number_of_failure:
}
```

### Fetching

```json
{
	_id:
	_fetching_ref:
	_API_ref:
  _url:
	_timestamp:
	_headers:
	_response_code:
	_still_alive:
}
```

