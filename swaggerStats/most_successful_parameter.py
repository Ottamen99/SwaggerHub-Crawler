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
over_dict = {}

for d in data:
    normalization_factor = processed_count[d["proxyQuery"]] / 100
    proxyQuery = d["proxyQuery"].replace("https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&", "")  # Cut the base URL
    overlapping_query = d["overlappingQuery"].replace("https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&", "")  # Cut the base URL
    rows.append({"Query": proxyQuery, "Overlap Query": overlapping_query, "Overlap Count": d["overlaps"] / normalization_factor})
df = pd.DataFrame(rows)

# plot gaussian distribution of the overlap count
# calculate 3 sigma rule
mean = df["Overlap Count"].mean()
std = df["Overlap Count"].std()
print(mean)
print(std)
print(mean - 3 * std)
print(mean + 3 * std)

df["Overlap Count"].plot.kde()
plt.axvline(mean, color='k', linestyle='dashed', linewidth=1)
plt.axvline(mean - 3 * std, color='g', linestyle='dashed', linewidth=1)
plt.axvline(mean + 3 * std, color='g', linestyle='dashed', linewidth=1)
plt.xlabel("Overlap Count")
plt.ylabel("Density")
plt.title("Density Plot of Overlap Count")
plt.xlim((mean - 3 * std) - 100, (mean + 3 * std) + 100)
plt.legend(["Density", "Mean", "3 Sigma"])

# save the plot as a svg file
plt.savefig('gaussian_overlap.svg', dpi=500, bbox_inches='tight', format='svg')
plt.show()

# print percentage of overlap count less than +3 sigma
print(df[df["Overlap Count"] > mean + 3 * std].shape[0] / df.shape[0])

# remove overlap count less than +3 sigma
df = df[df["Overlap Count"] > mean + 3 * std]

# Create a pivot table and plot the heatmap
pivot_table = df.pivot_table(index="Overlap Query", columns="Query", values="Overlap Count", aggfunc=np.sum, fill_value=0)
# # Sort the pivot table based on the maximum values in each row
pivot_table = pivot_table.loc[pivot_table.max(axis=1).sort_values(ascending=False).index]
# # Sort the pivot table based on the maximum values in each column
pivot_table = pivot_table[pivot_table.max().sort_values(ascending=True).index]


# print the max value of the pivot table
print(pivot_table.max().max())


# plt.figure(figsize=(25, 8))
sns.heatmap(pivot_table, cmap="mako_r", annot=False, fmt="d", linecolor="grey", square=False, xticklabels=False, yticklabels=False)
# make the plot fit the window
plt.tight_layout()
plt.title("Heatmap of Overlap Count")
plt.savefig('heatmap.svg', dpi=500, bbox_inches='tight', format='svg')
plt.show()
# save the picture

