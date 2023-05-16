import numpy as np
import pandas as pd
from matplotlib import pyplot as plt
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/?directConnection=true')
db = client['swagger']

apis = db['apis']

all_apis = apis.find({}, {'_name': 1}).limit(100000)

# Create an empty array
name_array = []

# Iterate over the result
for document in all_apis:
    name = document['_name']
    name_array.append(name)


print("Number of APIs: " + str(len(name_array)))

# split the name into words and store them in a list
name_array = [name.split() for name in name_array]

# flatten the list
name_array = [word for name in name_array for word in name]

# convert all words to lowercase
name_array = [word.lower() for word in name_array]

# remove all words with less than 3 characters
name_array = [word for word in name_array if len(word) > 2]

# remove stopwords
from nltk.corpus import stopwords

stop_words = stopwords.words('english')

name_array = [word for word in name_array if word not in stop_words]

# remove punctuation
import string
name_array = [word for word in name_array if word not in string.punctuation]

# remove "api" word "simple" word
name_array = [word for word in name_array if word not in ['api', 'simple', "petstore", "sample", "defaulttitle", "your-api", "apis", "test", "swagger", "example", "demo"]]

# find the most common words
from collections import Counter

# Create a Counter object
counter = Counter(name_array)

# Get the 10 most common words
most_common = counter.most_common(50)

# Print the 10 most common words
print(most_common)

# plot distribution of most common words
# Create a dataframe from the most common words
df = pd.DataFrame(most_common, columns=['Word', 'Frequency'])

# Set the word as the index
df.set_index('Word', inplace=True)

# Plot the dataframe
df.plot.bar()

# save most_common words to file without frequency
most_common = [word[0] for word in most_common]
with open('most_common_words.txt', 'w') as f:
    for item in most_common:
        f.write("%s\n" % item)

# dump most_common words to json file without frequency
import json
with open('most_common_words.json', 'w') as f:
    json.dump(most_common, f)


plt.show()
