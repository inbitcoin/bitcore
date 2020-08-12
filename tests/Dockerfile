FROM node:10-buster-slim

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl g++ git gosu jq make openssh-client python3-dev python3-pip \
        python3-setuptools \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ARG BITCOIND_VER="0.18.1"
COPY --from=registry.inbitcoin.it/inbitcoin/bitcoind:0.18.1 \
    /opt/bitcoin-${BITCOIND_VER}/bin/bitcoin-cli /usr/local/bin/

ENV APP_DIR="/srv/app" USER="node" USER_HOME="/home/node"
RUN usermod --home ${USER_HOME} ${USER}

WORKDIR ${APP_DIR}

RUN npm i bitcoinjs-lib@5.1.8 bitcore-wallet-client@8.20.1

ARG BISK_DEPLOY_KEY
ARG BISK_REF="1.1.0"
RUN mkdir -p /root/.ssh \
    && chmod 0700 /root/.ssh \
    && echo "${BISK_DEPLOY_KEY}" > /root/.ssh/id_rsa \
    && chmod 600 /root/.ssh/id_rsa \
    && echo "Host gitlab.inbitcoin.it\n\tStrictHostKeyChecking no\n" \
        >> /root/.ssh/config \
    && python3 -m pip install -U setuptools wheel \
    && python3 -m pip install \
        "git+ssh://git@gitlab.inbitcoin.it:2222/docker/bisk.git@${BISK_REF}#egg=biskli" \
    && rm -rf /root/.ssh

ENV UTILS_DIR="${APP_DIR}/utils" WLTS_DIR="${USER_HOME}/wallets"
ENV REPORTS_DIR="${USER_HOME}/reports" SYNC_DIR="${USER_HOME}/sync"

COPY tests-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/tests-entrypoint.sh

WORKDIR ${USER_HOME}
ENTRYPOINT ["/usr/local/bin/tests-entrypoint.sh"]
