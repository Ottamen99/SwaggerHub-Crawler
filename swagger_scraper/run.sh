#!/bin/bash

pm2 start utils/queueWatcher.js
pm2-runtime start utils/consumerPool.js