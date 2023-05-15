import pymongo
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

# Connect to MongoDB and retrieve data
client = pymongo.MongoClient("mongodb://localhost:27017/?directConnection=true")
db = client["swagger"]
collection_proxy = db["urls"]

# use stream to get data every time there is a change
data_proxy = collection_proxy.watch()

# # save on file timestamp and number of urls to plot them later
# with open("data_old.txt", "w") as f:
#     for d in data_proxy:
#         timestamp = d["clusterTime"].as_datetime()
#         num_urls = collection_proxy.count_documents({})
#         f.write(f"{timestamp},{num_urls}\n")
#         # when reaching 10000 urls, stop
#         if num_urls == 10000:
#             break

# plot the data of the old and new version on the same plot with max 50 seconds
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import datetime as dt

# read the data from the file
with open("data_old.txt", "r") as f:
    data_old = f.readlines()
with open("data_new.txt", "r") as f:
    data_new = f.readlines()

# parse the data
data_old = [d.strip().split(",") for d in data_old]
data_new = [d.strip().split(",") for d in data_new]

# convert the data to datetime and than from 0 to n seconds
data_old = [(dt.datetime.strptime(d[0], "%Y-%m-%d %H:%M:%S%z"), int(d[1])) for d in data_old]
data_new = [(dt.datetime.strptime(d[0], "%Y-%m-%d %H:%M:%S%z"), int(d[1])) for d in data_new]
data_old = [(d[0] - data_old[0][0], d[1]) for d in data_old]
data_new = [(d[0] - data_new[0][0], d[1]) for d in data_new]

# plot the data only first 50 seconds of old and new
data_old = [d for d in data_old if d[0].seconds <= 50]
data_new = [d for d in data_new if d[0].seconds <= 50]

# calculate speedup in percentage old has 1 processor and new has 5
speedup = [(d[0], d[1], d[1] / data_new[i][1] * 100) for i, d in enumerate(data_old)]
# average speedup
avg_speedup = sum([d[2] for d in speedup]) / len(speedup)
print(f"Average speedup: {avg_speedup:.2f}%")

# plot the data
fig, ax = plt.subplots()
ax.plot([d[0].seconds for d in data_old], [d[1] for d in data_old], label="Old URL retriever")
ax.plot([d[0].seconds for d in data_new], [d[1] for d in data_new], label="New URL retriever")
ax.set_xlabel("Seconds")
ax.set_ylabel("Number of URLs")
ax.legend()
plt.grid()
plt.title(f"Number of URLs retrieved over time (10k APIs)")
plt.savefig("url_ret_new_vs_old.png")
plt.tight_layout()
plt.show()

