import pymongo

# connect to MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/?directConnection=true")
db = client["swagger"]
url_collection = db["urls"]
queue_collection = db["queue"]
evolution_collection = db["evolution"]

# define the change stream pipeline
pipeline = [
    {"$match": {"operationType": "insert"}}
]

# create the change stream
change_stream = url_collection.watch(pipeline)

# loop over the change stream
for change in change_stream:
    # get the timestamp of the change
    timestamp = change["clusterTime"].as_datetime()

    # get the number of URLs at the timestamp
    num_urls = url_collection.count_documents({})

    # check if the number of URLs is equal to the number of consumed elements in the queue collection
    num_consumed = queue_collection.count_documents({"consumed": True})
    # insert a new document in the evolution collection
    evolution_collection.insert_one({"timestamp": timestamp, "num_urls": num_urls})
