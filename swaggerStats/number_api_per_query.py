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
            "query": {
                "$arrayElemAt": [
                    { "$split": ["$_proxyUrl", "page="] },
                    0
                ]
            }
        }
    },
    {
        "$group": {
            "_id": "$query",
            "total": { "$sum": 1 }
        }
    },
    {
        "$sort": { "total": -1 }
    },
    # {
    #     "$limit": 100
    # }
]

# Execute the pipeline and store the results in a list
results = list(collection.aggregate(pipeline))

# Extract the total counts from the results
totals = [result["total"] for result in results]

# Get the total number of APIs
total_apis = sum(totals)

# Create a histogram of the total counts
sns.histplot(totals, bins=50)
plt.title(f"Distribution of API results across queries (Total APIs: {total_apis:,})\n (Grouping all the pages of a query together)")
plt.xlabel("Number of API results")
plt.ylabel("Frequency")

# Add the maximum value for each bin as text
bin_counts, bin_edges, _ = plt.hist(totals, bins=50)
for i in range(len(bin_counts)):
    if bin_counts[i] != 0:
        plt.text(bin_edges[i], bin_counts[i], int(bin_counts[i]), ha='center', va='bottom')
plt.savefig('number_api_per_query.png', dpi=500, bbox_inches='tight')
plt.show()