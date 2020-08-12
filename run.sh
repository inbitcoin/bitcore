#!/bin/bash

cd /srv/app/packages/bitcore-node
./node_modules/.bin/tsc
pm2 start --no-daemon build/src/server.js ${NODE_ARGS}