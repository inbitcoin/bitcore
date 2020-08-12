#!/bin/bash

cd /srv/app/packages/bitcore-wallet-service/
rm -rf pids/*
[ ! -f ts_build/custom_config.js ] && \
  echo "Missing file '/srv/app/packages/bitcore-wallet-service/ts_build/custom_config.js', please mount it" && exit 1
grep -q 'process.env.DB_HOST' ts_build/custom_config.js
[ $? -ne 0 ] && \
  echo -e "W: missing 'process.env.DB_HOST' setting, if you need to use DB_HOST env variable set it like follow:\nconst host = process.env.DB_HOST || 'mongodb';"
grep -q 'process.env.DB_PORT' ts_build/custom_config.js
[ $? -ne 0 ] && \
  echo -e "W: missing 'process.env.DB_PORT' setting, if you need to use DB_PORT env variable set it like follow:\nconst port = process.env.DB_PORT || '27017';"
grep -q 'uri:.*`mongodb://${host}:${port}/.*`' ts_build/custom_config.js
[ $? -ne 0 ] && \
  echo "W: missing 'uri: \`mongodb://\${host}:\${port}/\`' setting, set it if you need to use host/port variables"
[ ! -n "${DB_HOST}" ] && \
  echo "W: missing 'DB_HOST' environment variable, will be used in config host"
[ ! -n "${DB_PORT}" ] && \
  echo "W: missing 'DB_PORT' environment variable, will be used in config port"
cp ts_build/custom_config.js ts_build/config.js
pm2-runtime process.yml --format
