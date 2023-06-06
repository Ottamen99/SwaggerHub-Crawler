import seaborn as sns
import pandas as pd
from matplotlib import pyplot as plt
from pymongo import MongoClient
from tqdm import tqdm

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
collection = db['apis']

# get _created_at and _last_modified

pipeline = [
    {
        "$project": {
            "_created_at": 1,
            "_last_modified": 1
        }
    },
]

# Execute the pipeline and store the results in a list
results = list(collection.aggregate(pipeline))

# remove None
results = [result for result in results if result["_created_at"] is not None and result["_last_modified"] is not None]
# keep only year and month
results = [{"_created_at": result["_created_at"][:7], "_last_modified": result["_last_modified"][:7]} for result in results]

# convert to dataframe
df = pd.DataFrame(results)

# get smallest and largest _created_at
print(f"Smallest _created_at: {min(df['_created_at'])}")
print(f"Largest _created_at: {max(df['_created_at'])}")


# plot distribution of _created_at and _last_modified on separate subplots lineplot
# x-axis every month from smallest to largest _created_at
# y-axis number of APIs created or modified in that month
# x-axis label only every 3 months
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 10))
sns.lineplot(data=df['_created_at'].value_counts().sort_index(), ax=ax1)
sns.lineplot(data=df['_last_modified'].value_counts().sort_index(), ax=ax2)
ax1.set_title("Distribution of APIs created per month")
ax2.set_title("Distribution of APIs modified per month")
ax1.set_xlabel("Date")
ax2.set_xlabel("Date")
ax1.set_ylabel("Number of APIs")
ax2.set_ylabel("Number of APIs")
ax1.set_xticks(ax1.get_xticks()[::3])
ax2.set_xticks(ax2.get_xticks()[::3])
# rotate x-axis labels
for ax in [ax1, ax2]:
    for tick in ax.get_xticklabels():
        tick.set_rotation(90)
plt.tight_layout()
# save as svg
plt.savefig("api_date_analysis.svg")
plt.show()

