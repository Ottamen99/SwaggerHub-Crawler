import pandas as pd
from pymongo import MongoClient
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
collection = db['urls']

# Pipeline to group by query and count successful URLs
# Aggregate the data
pipeline = [
    {"$group": {"_id": "$_proxyUrl", "total": {"$sum": 1}}},
    {"$sort": {"total": -1}},
    # {"$limit": 100}
]
result = list(collection.aggregate(pipeline))

# Convert the result to a pandas DataFrame
df = pd.DataFrame(result)

# group ids without the page number
df['query'] = df['_id'].str.split('page=').str[0]

# remove base url https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&
df['query'] = df['query'].map(lambda x: x.lstrip('https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&'))

# group by query and sum the total
df = df.groupby('query').sum()

# sort by total
df = df.sort_values(by='total', ascending=False)

# reset index
df = df.reset_index()

# plot the top 10
df = df.head(10)

# print most successful queries name
for index, row in df.iterrows():
    print(f"{index + 1}. {row['query']}")

# plot the data
sns.barplot(x='query', y='total', data=df, color='lightblue')
plt.xticks(np.arange(10), ('(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)', '(10)'))
# Add title and axis labels
plt.title("Top 10 Most Successful Queries")
plt.xlabel("Query")
plt.ylabel("Number of new URLs found")
plt.tight_layout()
plt.savefig('most_successful_queries.svg', dpi=500, bbox_inches='tight', format='svg')
plt.show()