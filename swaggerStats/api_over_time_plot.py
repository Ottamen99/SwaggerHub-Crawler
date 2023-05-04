import matplotlib.pyplot as plt
import pymongo

client = pymongo.MongoClient("mongodb://localhost:27017/?directConnection=true")
db = client["swagger"]
url_collection = db["urls"]
queue_collection = db["queue"]
evolution_collection = db["evolution"]

# get the data from the evolution collection
pipeline = [{"$sort": {"timestamp": 1}}]
data = list(evolution_collection.aggregate(pipeline))
timestamps = [d["timestamp"] for d in data]
num_urls = [d["num_urls"] for d in data]

# plot the data (timestamp without seconds)
plt.figure(figsize=(10, 5))
plt.plot(timestamps, num_urls)
plt.xlabel("Timestamp")
plt.ylabel("Number of URLs")
plt.title("Number of URLs over Time")
plt.savefig('number_urls_over_time.png', dpi=500, bbox_inches='tight')
plt.show()