#!/bin/bash

# Define the MongoDB container name and query to send
CONTAINER_NAME="mongodb"
QUERY="db.stats()"

# Get the container ID of the MongoDB container
CONTAINER_ID=$(docker ps -qf "name=${CONTAINER_NAME}")

# Send the query to the MongoDB database
mongo --eval "${QUERY}" localhost:27017 > /dev/null 2>&1

# If the query fails (i.e. the database is unreachable), restart the Docker container
if [ $? -ne 0 ]; then
  echo "MongoDB is unreachable. Restarting Docker container..."
  docker restart "${CONTAINER_ID}"
fi
