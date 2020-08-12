FROM node:12-buster-slim as builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates g++ git make python3

ENV APP="/srv/app"

WORKDIR ${APP}

COPY package.json ./
COPY package-lock.json ./
COPY lerna.json ./

COPY packages/bitcore-build/package.json ./packages/bitcore-build/package.json
COPY packages/bitcore-mnemonic/package.json ./packages/bitcore-mnemonic/package.json
COPY packages/bitcore-lib/package.json ./packages/bitcore-lib/package.json
COPY packages/bitcore-lib-cash/package.json ./packages/bitcore-lib-cash/package.json
COPY packages/bitcore-p2p/package.json ./packages/bitcore-p2p/package.json
COPY packages/bitcore-p2p-cash/package.json ./packages/bitcore-p2p-cash/package.json
COPY packages/bitcore-wallet-client/package.json ./packages/bitcore-wallet-client/package.json
COPY packages/bitcore-client/package.json ./packages/bitcore-client/package.json
COPY packages/bitcore-wallet/package.json ./packages/bitcore-wallet/package.json
COPY packages/bitcore-wallet-client/package.json ./packages/bitcore-wallet-client/package.json
COPY packages/bitcore-wallet-service/package.json ./packages/bitcore-wallet-service/package.json
COPY packages/crypto-wallet-core/package.json ./packages/crypto-wallet-core/package.json

COPY packages/bitcore-build/package-lock.json ./packages/bitcore-build/package-lock.json
COPY packages/bitcore-mnemonic/package-lock.json ./packages/bitcore-mnemonic/package-lock.json
COPY packages/bitcore-lib/package-lock.json ./packages/bitcore-lib/package-lock.json
COPY packages/bitcore-lib-cash/package-lock.json ./packages/bitcore-lib-cash/package-lock.json
COPY packages/bitcore-p2p/package-lock.json ./packages/bitcore-p2p/package-lock.json
COPY packages/bitcore-p2p-cash/package-lock.json ./packages/bitcore-p2p-cash/package-lock.json
COPY packages/bitcore-wallet-client/package-lock.json ./packages/bitcore-wallet-client/package-lock.json
COPY packages/bitcore-client/package-lock.json ./packages/bitcore-client/package-lock.json
COPY packages/bitcore-wallet/package-lock.json ./packages/bitcore-wallet/package-lock.json
COPY packages/bitcore-wallet-client/package-lock.json ./packages/bitcore-wallet-client/package-lock.json
COPY packages/bitcore-wallet-service/package-lock.json ./packages/bitcore-wallet-service/package-lock.json
COPY packages/crypto-wallet-core/package-lock.json ./packages/crypto-wallet-core/package-lock.json

RUN npm install --production
RUN node_modules/.bin/lerna bootstrap
COPY packages packages
RUN npm run compile

FROM node:12-buster-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends gnupg && \
    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 4B7C549A058F8B6B && \
    echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.2 main" > /etc/apt/sources.list.d/mongodb.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        curl mongodb-org-shell && \
    rm /etc/apt/sources.list.d/mongodb.list && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm install --global pm2@3.5.1

COPY mongodb-check.sh /usr/local/bin/

ENV APP="/srv/app" USER="node"

COPY --from=builder --chown=${USER}:${USER} ${APP} ${APP}

EXPOSE 3232
USER ${USER}
WORKDIR ${APP}

HEALTHCHECK --interval=15s --timeout=4s --start-period=5s --retries=3 \
    CMD curl -f 127.0.0.1:3232/v1/version || exit 1

ENTRYPOINT  [ "/usr/local/bin/mongodb-check.sh" ]
