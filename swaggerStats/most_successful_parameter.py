import numpy as np
import seaborn as sns
import pandas as pd
from matplotlib import pyplot as plt
from pymongo import MongoClient
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from tqdm import tqdm
from collections import Counter

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
collection = db['statsUrl']
collection_proxy = db["proxyUrls"]
data = collection.find()

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

# Convert data to a pandas dataframe
rows = []
for d in data:
    normalization_factor = processed_count[d["proxyQuery"]] / 100
    query = d["proxyQuery"].replace("https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&", "")  # Cut the base URL
    for overlap in d["overlaps"]:
        overlap_query = overlap["queryName"].replace("https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&", "")  # Cut the base URL
        overlap_count = overlap["numberOfOverlaps"] / normalization_factor
        rows.append({"Query": query, "Overlap Query": overlap_query, "Overlap Count": overlap_count})
df = pd.DataFrame(rows)

# Create a pivot table and plot the heatmap
pivot_table = df.pivot_table(index="Overlap Query", columns="Query", values="Overlap Count", aggfunc=np.sum, fill_value=0)
# Sort the pivot table based on the maximum values in each row
pivot_table = pivot_table.loc[pivot_table.max(axis=1).sort_values(ascending=False).index]
# Sort the pivot table based on the maximum values in each column
pivot_table = pivot_table[pivot_table.max().sort_values(ascending=True).index]

# print the max value of the pivot table
print(pivot_table.max().max())


plt.figure(figsize=(25, 8))
sns.heatmap(pivot_table, cmap="mako_r", annot=False, fmt="d", linecolor="grey", square=False, xticklabels=False, yticklabels=False)
plt.savefig('heatmap.png', dpi=500, bbox_inches='tight')
plt.show()
# save the picture

