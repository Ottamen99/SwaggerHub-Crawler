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
    {"$group": {"_id": "$_proxyUrl", "count": {"$sum": 1}}},
    {"$sort": {"count": -1}},
    # {"$limit": 100}
]



# Execute the pipeline and store the results in a list
results = list(collection.aggregate(pipeline))
# Create a histogram of the total counts
# Extract query and total fields from results
counts = [result["count"] for result in results]

# Create histogram of API results per query
plt.hist(counts, bins=50)
plt.xlabel("Number of API Results")
plt.ylabel("Number of Queries")
plt.title("Distribution of API Results per Query")

plt.savefig('number_api_per_query_pages.png', dpi=500, bbox_inches='tight')
plt.show()