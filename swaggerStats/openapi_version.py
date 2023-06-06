import seaborn as sns
import pandas as pd
from matplotlib import pyplot as plt
from pymongo import MongoClient
from tqdm import tqdm

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
collection = db['apis']

# get app _OPENAPI_version
pipeline = [
    {
        "$project": {
            "_OPENAPI_version": 1
        }
    },
]

# Execute the pipeline and store the results in a list
results = list(collection.aggregate(pipeline))

# remove None
results = [result["_OPENAPI_version"] for result in results if result["_OPENAPI_version"] is not None]

# convert to dataframe
df = pd.DataFrame(results, columns=["_OPENAPI_version"])

# plot distribution of _OPENAPI_version usin pandas histplot
sns.histplot(data=df, x="_OPENAPI_version", bins=50)
plt.title(f"Distribution of OpenAPI version\n (Total APIs: {len(df):,})")
plt.xlabel("OpenAPI version")
# vertical labels xticks
plt.xticks(rotation=90)
plt.ylabel("Number of APIs")
plt.tight_layout()

# # Add the maximum value for each bin as text
# bin_counts, bin_edges, _ = plt.hist(df["_OPENAPI_version"])
# for i in range(len(bin_counts)):
#     if bin_counts[i] != 0:
#         plt.text(bin_edges[i], bin_counts[i], int(bin_counts[i]), ha='center', va='bottom')

# save figure svg
plt.savefig("OPENAPI_version_distribution.svg")
plt.show()
