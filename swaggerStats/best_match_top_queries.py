import pandas as pd
from pymongo import MongoClient
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
collection = db['urls']

# Get all _proxyUrls
pipeline = [
    {
        "$project": {
            "_proxyUrl": 1
        }
    }
]

# Execute the pipeline and store the results in a list
results = list(collection.aggregate(pipeline))

# convert the results to a pandas dataframe
df = pd.DataFrame(results)

# remove None values
df = df[df['_proxyUrl'].notna()]

# remove page parameter
df['_proxyUrl'] = df['_proxyUrl'].str.split("&page=", expand=True)[0]

# keep only the BEST_MATCH queries
df = df[df['_proxyUrl'].str.contains('BEST_MATCH')]

# get the query parameter value
df['_proxyUrl'] = df['_proxyUrl'].str.split("query=", expand=True)[1]

# group the results by _proxyUrl
df = df.groupby("_proxyUrl").size().reset_index(name="count")

# sort the dataframe based on the count
df.sort_values(by=['count'], inplace=True, ascending=False)
df = df.head(20)
# plot_proxyUrls with most URLs
# plot the data as a bar plot
df.plot.bar(x='_proxyUrl', y='count')
plt.xlabel("Words")
plt.ylabel("Number of URLs")
plt.title("Top 20 most successful words for BEST_MATCH queries")
plt.tight_layout()
# save the plot as a svg file
plt.savefig('best_match_top_queries.svg', dpi=500, bbox_inches='tight', format='svg')
plt.show()