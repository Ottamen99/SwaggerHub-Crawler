#!/bin/bash

docker-compose up -d

sleep 5

docker exec mongodb /scripts/rs-init.sh