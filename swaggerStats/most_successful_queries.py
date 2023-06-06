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
    {"$limit": 100}
]
result = list(collection.aggregate(pipeline))

# Convert the result to a pandas DataFrame
df = pd.DataFrame(result)

# Plot a histogram
sns.histplot(data=df, x="total", bins=50, kde=True)
plt.title("Number of URLs Downloaded per Query")
plt.xlabel("Number of URLs")
plt.ylabel("Frequency")
plt.show()