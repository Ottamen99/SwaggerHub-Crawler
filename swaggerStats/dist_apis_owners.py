import numpy as np
import pandas as pd
from matplotlib import pyplot as plt
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']

owners = db['owners']
urls = db['urls']

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

# print mean and median values
print("Mean: " + str(df['API Count'].mean()))
print("Median: " + str(df['API Count'].median()))
# print std
print("Standard deviation: " + str(df['API Count'].std()))

# calculate 3 sigma rule
three_sig_minus = df['API Count'].mean() - 3 * df['API Count'].std()
three_sig_plus = df['API Count'].mean() + 3 * df['API Count'].std()

# calculate 2 sigma rule
two_sig_minus = df['API Count'].mean() - 2 * df['API Count'].std()
two_sig_plus = df['API Count'].mean() + 2 * df['API Count'].std()


# print 3 sigma rule
print("3 sigma rule min: " + str(three_sig_minus))
print("3 sigma rule max: " + str(three_sig_plus))
# print 2 sigma rule
print("2 sigma rule min: " + str(two_sig_minus))
print("2 sigma rule max: " + str(two_sig_plus))


# plot gaussian distribution between -10 and 10 std
df['API Count'].plot.kde()
# add vertical lines for 3 sigma rule
plt.axvline(three_sig_minus, color='r', linestyle='dashed', linewidth=1, label='3 sigma')
plt.axvline(three_sig_plus, color='r', linestyle='dashed', linewidth=1)
plt.axvline(two_sig_minus, color='g', linestyle='dashed', linewidth=1, label='2 sigma')
plt.axvline(two_sig_plus, color='g', linestyle='dashed', linewidth=1)
plt.title('Gaussian distribution of API Count per Owner')

# show labels
plt.legend()

plt.xlim(-10, 10)

# save the plot as a png file
plt.savefig('gaussian_api_count_owners.png', dpi=500, bbox_inches='tight')

plt.show()

# Create a histogram of the API counts per owner with matplotlib
plt.figure(figsize=(25, 8))
df.plot(kind='line', legend=None)
plt.xticks(rotation=90)
plt.xlabel('Owner')
plt.ylabel('API Count')
plt.title('API Count per Owner')

# make the plot fit the window
plt.tight_layout()

# save the plot as a png file
plt.savefig('api_count_per_owner.png', dpi=500, bbox_inches='tight')
plt.show()