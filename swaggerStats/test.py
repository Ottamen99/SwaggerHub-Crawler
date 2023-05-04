import pymongo
from tqdm import tqdm

# Connect to the MongoDB database
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["swagger"]
collection = db["urls"]
collection2 = db["queue"]

# Retrieve all documents in the collection
documents = collection.find()
queueDocuments = collection2.find()

# Print the documents
for doc in documents:
    # match doc stringified to queueDocuments urlObject
    for queueDoc in queueDocuments:
        print(str(doc))
        if queueDoc["urlObject"] == str(doc):
            print(doc)
            print(queueDoc)
            print()
            break

