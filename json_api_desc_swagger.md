```json
{
  fetching_id: "unique value to identify the fetch"
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
	version: "version of the api"
	OPENAPI_version: "version of OPENAPI used"
  API_spec: {}, "API spec"
	API_spec_hash: "hash of the API spec"
}
```

