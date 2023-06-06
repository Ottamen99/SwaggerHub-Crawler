import seaborn as sns
import pandas as pd
from matplotlib import pyplot as plt
from pymongo import MongoClient
from tqdm import tqdm

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
collection = db['apis']

# get _created_at
pipeline = [
    {
        "$project": {
            "_created_at": 1
        }
    }
]

# Execute the pipeline and store the results in a list
results = list(collection.aggregate(pipeline))

# remove None
results = [result["_created_at"] for result in results if result["_created_at"] is not None]
# keep only year
results = [result[:4] for result in results]
# convert to datetime
results = pd.to_datetime(results)

# group by year in dataframe and count
df = pd.DataFrame(results, columns=["year"])
df["count"] = 1
df = df.groupby("year").count()

# plot distribution of _created_at
sns.lineplot(data=df, x=df.index, y="count")
plt.title(f"Evolution of the number of APIs created over the years\n (Total APIs: {len(results):,})")
plt.xlabel("Year")
plt.ylabel("Number of APIs")
plt.tight_layout()
# save as svg
plt.savefig("evolution_over_years.svg")
plt.show()