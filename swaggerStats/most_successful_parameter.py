import numpy as np
import seaborn as sns
import pandas as pd
from matplotlib import pyplot as plt
from pymongo import MongoClient
from tqdm import tqdm
from collections import Counter

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
collection = db['statsUrl']
data = collection.find()

# Convert data to a pandas dataframe
rows = []
for d in data:
    query = d["proxyQuery"].replace("https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&", "")  # Cut the base URL
    for overlap in d["overlaps"]:
        overlap_query = overlap["queryName"].replace("https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&", "")  # Cut the base URL
        overlap_count = overlap["numberOfOverlaps"]
        rows.append({"Query": query, "Overlap Query": overlap_query, "Overlap Count": overlap_count})
df = pd.DataFrame(rows)

# myDict = defaultdict(int)
#
# # Convert data to a pandas dataframe
# for d in data:
#     query = d["proxyQuery"].replace("https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&", "")  # Cut the base URL
#     for overlap in d["overlaps"]:
#         overlap_query = overlap["queryName"].replace("https://app.swaggerhub.com/apiproxy/specs?specType=API&limit=100&", "")  # Cut the base URL
#         myDict[overlap_query] += 1
# df = pd.DataFrame.from_dict(myDict, orient='index', columns=['Overlap Count'])

# Create a pivot table and plot the heatmap
pivot_table = df.pivot_table(index="Overlap Query", columns="Query", values="Overlap Count", aggfunc=np.sum, fill_value=0)
plt.figure(figsize=(25, 8))
sns.heatmap(pivot_table, cmap="YlGnBu", annot=False, fmt="d", linewidths=0.5, linecolor="grey", square=False)
plt.savefig('heatmap.png', dpi=500, bbox_inches='tight')
plt.show()
# save the picture

