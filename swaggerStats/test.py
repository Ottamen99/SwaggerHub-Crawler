import pymongo
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

# Connect to MongoDB and retrieve data
client = pymongo.MongoClient("mongodb://localhost:27017/?directConnection=true")
db = client["swagger"]
collection_proxy = db["proxyUrls"]
data_proxy = collection_proxy.find()

# Aggregate the count of processed queries without "page" parameter
processed_count = {}
for d in data_proxy:
    query = d["query"]
    parsed_query = urlparse(query)
    query_params = parse_qs(parsed_query.query)
    if "page" in query_params:
        del query_params["page"]
    modified_query = urlunparse(
        (parsed_query.scheme, parsed_query.netloc, parsed_query.path, parsed_query.params, urlencode(query_params, doseq=True), parsed_query.fragment)
    )
    if modified_query in processed_count:
        processed_count[modified_query] += d["processed"]
    else:
        processed_count[modified_query] = d["processed"]

# Print the count of processed queries without "page" parameter
for query, count in processed_count.items():
    print(f"{query}: {count}")
