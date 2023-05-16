from datetime import datetime

import matplotlib.pyplot as plt
import pymongo

client = pymongo.MongoClient("mongodb://localhost:27017/?directConnection=true")
db = client["swagger"]
url_collection = db["urls"]
evo_urls_collection = db["urlsEvolution"]
evo_apis_collection = db["apisEvolution"]

# get the data from the evolution collection
pipeline = [{"$sort": {"timestamp": 1}}]
data = list(evo_apis_collection.aggregate(pipeline))
timestamps = [d["timestamp"] for d in data]
# convert the timestamps from string to datetime objects
timestamps = [datetime.strptime(t, "%Y-%m-%dT%H:%M:%S.%fZ") for t in timestamps]
num_urls = [d["consumedUrlsCount"] for d in data]


data2 = list(evo_urls_collection.aggregate(pipeline))
timestamps2 = [d["timestamp"] for d in data2]
# convert the timestamps from string to datetime objects
timestamps2 = [datetime.strptime(t, "%Y-%m-%dT%H:%M:%S.%fZ") for t in timestamps2]
num_urls2 = [d["urlCount"] for d in data2]

# plot the data on separate graphs but same figure
# figure wider
plt.figure(figsize=(20, 8))
fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True)
ax1.plot(timestamps, num_urls)
ax1.set_ylabel("Number of APIs processed")
ax2.plot(timestamps2, num_urls2)
ax2.set_ylabel("Number of URLs of APIs")
ax2.set_xlabel("Timestamp of the data")
plt.xticks(rotation=90)
plt.tight_layout()
# plt.title("Number of APIs and URLs processed over time")
plt.savefig("apis_over_time.png")
plt.show()