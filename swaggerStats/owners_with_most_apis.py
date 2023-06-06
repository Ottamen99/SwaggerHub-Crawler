import pandas as pd
from pymongo import MongoClient
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']
urls = db['urls']
owners = db['owners']

# Get all owner names
owner_names = [owner['name'] for owner in owners.find()]

# Initialize a dictionary to store the API counts per owner
api_counts = {owner_name: 0 for owner_name in owner_names}

# Iterate over the URLs collection and count the APIs per owner
for url in urls.find():
    owner_name = url['_url'].split('/')[4]  # Extract the owner name from the URL
    if owner_name in api_counts:
        api_counts[owner_name] += 1

df = pd.DataFrame(api_counts.items(), columns=['Owner', 'API Count'])

# Set the owner name as the index
df.set_index('Owner', inplace=True)

# Sort the dataframe based on the API count
df.sort_values(by=['API Count'], inplace=True)

# plot only owners with more than 100 APIs
df = df[df['API Count'] > 40]

# plot the data as a bar plot
df.plot.bar()
plt.xlabel("Owner")
plt.ylabel("Number of APIs")
plt.title("Number of APIs per Owner with more than 40 APIs each")
plt.tight_layout()
# save the plot as a svg file
plt.savefig('owners_with_most_apis.svg', dpi=500, bbox_inches='tight', format='svg')
plt.show()
