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

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "API Fetch Metadata",
  "description": "Metadata about a fetched API specification",
  "type": "object",
  "required": [
    "_id",
    "meta",
    "name",
    "description",
    "created_at",
    "last_modified",
    "created_by",
    "API_url",
    "API_url_hash",
    "version",
    "OPENAPI_version",
    "API_spec",
    "API_spec_hash"
  ],
  "properties": {
    "_id": {
      "type": "string",
      "description": "Unique identifier for the fetch"
    },
    "meta": {
      "type": "object",
      "description": "Metadata about the fetch",
      "required": ["fetched_at", "is_valid_JSON_spec"],
      "properties": {
        "fetched_at": {
          "type": "array",
          "description": "Array of timestamps and fetch references",
          "items": {
            "type": "object",
            "required": ["timestamp", "still_alive"],
            "properties": {
              "timestamp": {
                "type": "string",
                "description": "Timestamp when the API spec was fetched"
              },
              "still_alive": {
                "type": "boolean",
                "description": "Boolean indicating if the API is still alive"
              },
              "fetching_ref": {
                "type": "string",
                "description": "Reference to the previous fetch if the URL was fetched multiple times"
              }
            }
          }
        },
        "server": {
          "type": "object",
          "description": "Information about the API server",
          "required": ["url", "schemes"],
          "properties": {
            "url": {
              "type": "string",
              "description": "URL of the API server"
            },
            "schemes": {
              "type": "array",
              "description": "Protocol(s) used by the API server",
              "items": {
                "type": "string"
              }
            },
            "security": {
              "type": "array",
              "description": "Security requirements for the API",
              "items": {}
            }
          }
        },
        "is_valid_JSON_spec": {
          "type": "boolean",
          "description": "Boolean indicating if the API spec is valid JSON"
        }
      }
    },
    "name": {
      "type": "string",
      "description": "Name of the API"
    },
    "description": {
      "type": "string",
      "description": "Description of the API"
    },
    "created_at": {
      "type": "string",
      "description": "Timestamp when the API was created"
    },
    "last_modified": {
      "type": "string",
      "description": "Timestamp when the API was last modified"
    },
    "created_by": {
      "type": "string",
      "description": "Name of the API owner"
    },
    "API_url": {
      "type": "string",
      "description": "URL to the SwaggerHub repository for the API"
    },
    "API_url_hash": {
      "type": "string",
      "description": "Hash of the URL to the SwaggerHub repository for the API"
    },
    "version": {
      "type": "string",
      "description": "Version of the API"
    },
    "OPENAPI_version": {
      "type": "string",
      "description": "Version of of OPENAPI used"
    },
    "API_spec": {
    	"type": "object"
    	"description": "API specification"
    }, 
	  "API_spec_hash": {
	  	"type": "string"
	  	"description": "Hash of the API specification"
	  }
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

