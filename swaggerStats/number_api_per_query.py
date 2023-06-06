import seaborn as sns
import pandas as pd
from matplotlib import pyplot as plt
from pymongo import MongoClient
from tqdm import tqdm

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
collection = db['urls']

# Define the pipeline to group by query string
pipeline = [
    {
        "$project": {
            "_proxyUrl": 1,
        }
    },
]

# Execute the pipeline and store the results in a list
results = list(collection.aggregate(pipeline))

# convert the results to a pandas dataframe
df = pd.DataFrame(results)

# remove page parameter
df['_proxyUrl'] = df['_proxyUrl'].str.split("&page=", expand=True)[0]

# group the results by _proxyUrl
df = df.groupby("_proxyUrl").size().reset_index(name="total")

# count how many _proxyUrl
# df = df.groupby("total").size().reset_index(name="count")

# plot the distribution of API versions
# wide figure with subplot
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 5))
sns.histplot(df["total"], bins=100, ax=ax1)
df = df[df['total'] > 100]
sns.histplot(df['total'], bins=100, ax=ax2)
ax1.set_title(f"Distribution of URLs found per query")
ax1.set_xlabel("Number of URLs")
ax1.set_ylabel("Number of queries")
ax2.set_title(f"Distribution of URLs found per query\n(Only more than 100 URLs)")
ax2.set_xlabel("Number of URLs")
ax2.set_ylabel("Number of queries")

# plt.show()


# # Add the maximum value for each bin as text
# bin_counts, bin_edges, _ = plt.hist(df["total"], bins=100)
# for i in range(len(bin_counts)):
#     if bin_counts[i] != 0:
#         plt.text(bin_edges[i], bin_counts[i], int(bin_counts[i]), ha='center', va='bottom')
plt.savefig('number_api_per_query.svg', dpi=500, bbox_inches='tight', format='svg')
plt.tight_layout()
plt.show()