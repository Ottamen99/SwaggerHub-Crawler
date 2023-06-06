import seaborn as sns
import pandas as pd
from matplotlib import pyplot as plt
from pymongo import MongoClient
from tqdm import tqdm

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
collection = db['apis']

# get app _OPENAPI_version and _created_at
pipeline = [
    {
        "$project": {
            "_OPENAPI_version": 1,
            "_created_at": 1
        }
    }
]

# Execute the pipeline and store the results in a list
results = list(collection.aggregate(pipeline))

# remove None
results = [result for result in results if result["_OPENAPI_version"] is not None and result["_created_at"] is not None]

# keep only year and _OPENAPI_version
results = [{"year": result["_created_at"][:4], "_OPENAPI_version": result["_OPENAPI_version"]} for result in results]
# convert to dataframe year and _OPENAPI_version
df = pd.DataFrame(results, columns=["year", "_OPENAPI_version"])

# plot the trend of _OPENAPI_version over years counting the number of APIs
# sort by year
df = df.sort_values(by="year")
# make the plot wider
plt.figure(figsize=(10, 5))
sns.countplot(data=df, x="year", hue="_OPENAPI_version")
plt.title(f"Evolution of OpenAPI version used over years\n (Total APIs: {df.shape[0]:,})")
plt.xlabel("Year")
plt.ylabel("Number of APIs")
plt.tight_layout()
# save figure as svg
plt.savefig("evolution_openapi_over_years.svg")
plt.show()
