import seaborn as sns
import pandas as pd
from matplotlib import pyplot as plt
from pymongo import MongoClient
from tqdm import tqdm

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
collection = db['apis']

# implement this pipeline db.apis.find({}).projection({_API_reference: 1}) limit 1000
pipeline = [
    {
        "$project": {
            "_API_reference": 1
        }
    }
]

# Execute the pipeline and store the results in a list
results = list(collection.aggregate(pipeline))

# convert the results to a pandas dataframe
df = pd.DataFrame(results)

# group the results by API reference
df = df.groupby("_API_reference").size().reset_index(name="count")

# plot the distribution of API versions
sns.histplot(df["count"], bins=50)
plt.title(f"Distribution of API versions (Total APIs: {len(df):,})")
plt.xlabel("Number of API versions")
plt.ylabel("Frequency")

# Add the maximum value for each bin as text
bin_counts, bin_edges, _ = plt.hist(df["count"], bins=50)
for i in range(len(bin_counts)):
    if bin_counts[i] != 0:
        plt.text(bin_edges[i], bin_counts[i], int(bin_counts[i]), ha='center', va='bottom')

plt.savefig('API_versions.svg', dpi=500, bbox_inches='tight', format='svg')

plt.show()