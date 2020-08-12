import * as async from 'async';
import _ from 'lodash';
import * as request from 'request-promise-native';
import io = require('socket.io-client');
import { ChainService } from '../chain/index';
import logger from '../logger';
import { Client } from './v8/client';

const $ = require('preconditions').singleton();
logger.level = process.env.LOG_LEVEL || 'info';
const Common = require('../common');
const Bitcore = require('bitcore-lib');
const Bitcore_ = {
  btc: Bitcore,
  bch: require('bitcore-lib-cash'),
  eth: Bitcore,
  xrp: Bitcore
};
const config = require('../../config');
const Constants = Common.Constants,
  Defaults = Common.Defaults,
  Utils = Common.Utils;

function v8network(bwsNetwork) {
  if (bwsNetwork == 'livenet') return 'mainnet';
  if (
    bwsNetwork == 'testnet' &&
    (_.get(config, 'blockchainExplorerOpts.btc.testnet.regtestEnabled') === true)
  ) {
    return 'regtest';
  }
  return bwsNetwork;
}

export class V8 {
  chain: string;
  coin: string;
  network: string;
  v8network: string;
  // v8 is always cashaddr
  addressFormat: string;
  apiPrefix: string;
  host: string;
  userAgent: string;
  baseUrl: string;
  request: request;
  Client: typeof Client;

  constructor(opts) {
    $.checkArgument(opts);
    $.checkArgument(Utils.checkValueInCollection(opts.network, Constants.NETWORKS));
    $.checkArgument(Utils.checkValueInCollection(opts.coin, Constants.COINS));
    $.checkArgument(opts.url);

    this.apiPrefix = _.isUndefined(opts.apiPrefix) ? 'api' : opts.apiPrefix;
    this.chain = ChainService.getChain(opts.coin || Defaults.COIN);
    this.coin = opts.coin || Defaults.COIN;

    this.network = opts.network || 'livenet';
    this.v8network = v8network(this.network);

    // v8 is always cashaddr
    this.addressFormat = this.coin == 'bch' ? 'cashaddr' : null;

    this.host = opts.url;
    this.userAgent = opts.userAgent || 'bws';

    this.baseUrl = this.host + '/' + this.apiPrefix;

    // for testing
    //
    this.request = opts.request || request;
    this.Client = opts.client || Client || require('./v8/client');
  }

  _getClient() {
    return new this.Client({
      baseUrl: this.baseUrl
    });
  }

  _getAuthClient(wallet) {
    $.checkState(wallet.beAuthPrivateKey2);
    return new this.Client({
      baseUrl: this.baseUrl,
      authKey: Bitcore_[this.coin].PrivateKey(wallet.beAuthPrivateKey2)
    });
  }

  // DEPRECATED on blockbook
  addAddresses(wallet, addresses, cb) {
    const client = this._getAuthClient(wallet);

    const payload = _.map(addresses, a => {
      return {
        address: a
      };
    });

    const k = 'addAddresses' + addresses.length;
    console.time(k);
    console.time('AddAddresses');
    client
      .importAddresses({
        payload,
        pubKey: wallet.beAuthPublicKey2
      })
      .then(ret => {
        console.timeEnd('AddAddresses');
        console.timeEnd(k);
        return cb(null, ret);
      })
      .catch(err => {
        return cb(_parseErr(err));
      });
  }

  // DEPRECATED on blockbook
  register(wallet, cb) {
    if (wallet.coin != this.coin || wallet.network != this.network) {
      return cb(new Error('Network coin or network mismatch'));
    }

    const client = this._getAuthClient(wallet);
    const payload = {
      name: wallet.id,
      pubKey: wallet.beAuthPublicKey2
    };
    console.time('RegisterWallet');
    client
      .register({
        authKey: wallet.beAuthPrivateKey2,
        payload
      })
      .then(ret => {
        console.timeEnd('RegisterWallet');
        return cb(null, ret);
      })
      .catch(cb);
  }

  // DEPRECATED on blockbook
  async getBalance(wallet, cb) {
    const client = this._getAuthClient(wallet);
    const { tokenAddress, multisigContractAddress } = wallet;
    console.time('GetBalanceWallet');
    client
      .getBalance({ pubKey: wallet.beAuthPublicKey2, payload: {}, tokenAddress, multisigContractAddress })
      .then(ret => {
        console.timeEnd('GetBalanceWallet');
        if (ret && ret.blockbook) return cb(_unavailableError);
        return cb(null, ret);
      })
      .catch(cb);
  }

  getConnectionInfo() {
    return 'Blockbook (' + this.coin + '/' + this.v8network + ') @ ' + this.host;
  }

  _transformUtxos(unspent, bcheight, address) {
    $.checkState(bcheight > 0, 'No BC height passed to _transformUtxos');
    const ret = _.map(
      unspent,
      x => {
        const u = {
          address: address ? address : x.address,
          satoshis: parseInt(x.value),
          amount: parseInt(x.value) / 1e8,
          fullPath: x.path,
          scriptPubKey: Bitcore_[this.coin].Script.buildPublicKeyHashOut(address ? address : x.address).toBuffer().toString('hex'),
          txid: x.txid,
          vout: x.vout,
          locked: false,
          confirmations: x.height > 0 && bcheight >= x.height ? bcheight - x.height + 1 : 0
        };

        // v8 field name differences
        return u;
      }
    );
    return ret;
  }

  /**
   * Retrieve a list of unspent outputs associated with an address or set of addresses
   *
   *
   * This is for internal usage, address should be on internal representaion
   */
  getUtxos(wallet, height, xPubKey, cb) {
    $.checkArgument(cb);
    const client = this._getAuthClient(wallet);
    console.time('getUtxos');
    client
      .getCoins({ pubKey: wallet.beAuthPublicKey2, payload: {}, xPubKey })
      .then(unspent => {
        console.timeEnd('getUtxos');
        if (unspent && unspent.blockbook) return cb(_unavailableError);
        return cb(null, this._transformUtxos(unspent, height, null));
      })
      .catch(err => {
        return cb(_parseErr(err));
      });
  }

  // DEPRECATED on blockbook
  getCoinsForTx(txId, cb) {
    $.checkArgument(cb);
    const client = this._getClient();
    console.time('getCoinsForTx');
    client
      .getCoinsForTx({ txId, payload: {} })
      .then(coins => {
        console.timeEnd('getCoinsForTx');
        if (coins && coins.blockbook) return cb(_unavailableError);
        return cb(null, coins);
      })
      .catch(cb);
  }

  // DEPRECATED on blockbook
  /**
   * Check wallet addresses
   */
  getCheckData(wallet, cb) {
    const client = this._getAuthClient(wallet);
    console.time('WalletCheck');
    client
      .getCheckData({ pubKey: wallet.beAuthPublicKey2, payload: {} })
      .then(checkInfo => {
        console.timeEnd('WalletCheck');
        return cb(null, checkInfo);
      })
      .catch(cb);
  }

  /**
   * Broadcast a transaction to the bitcoin network
   */
  broadcast(rawTx, cb, count: number = 0) {
    const payload = {
      rawTx,
      network: this.v8network,
      chain: this.chain
    };

    const client = this._getClient();
    console.time('BroadcastRawTx');
    client
      .broadcast({ payload })
      .then(ret => {
        console.timeEnd('BroadcastRawTx');
        if (ret && ret.blockbook) return cb(_unavailableError);
        if (!ret.result) {
          return cb(new Error('Error broadcasting'));
        }
        return cb(null, ret.result);
      })
      .catch(err => {
        if (count > 3) {
          logger.error('FINAL Broadcast error:', err);
          return cb(_parseErr(err));
        } else {
          count++;
          // retry
          setTimeout(() => {
            logger.info(`Retrying broadcast after ${count * Defaults.BROADCAST_RETRY_TIME}`);
            return this.broadcast(rawTx, cb, count);
          }, count * Defaults.BROADCAST_RETRY_TIME);
        }
      });
  }

  // This is for internal usage, addresses should be returned on internal representation
  getTransaction(txid, cb) {
    logger.info(`GET TX ${txid}`);
    const client = this._getClient();
    console.time('GetTx');
    client
      .getTx({ txid })
      .then(tx => {
        console.timeEnd('GetTx');
        if (tx && tx.blockbook) return cb(_unavailableError);
        if (!tx || _.isEmpty(tx)) {
          return cb();
        }
        const txv8 = {
          txid: tx.txid,
          network: this.v8network,
          chain: this.coin.toUpperCase(),
          blockHeight: tx.blockHeight,
          blockHash: tx.blockHash,
          blockTime: new Date(tx.blockTime * 1000),
          inputCount: tx.vin.length,
          outputCount: tx.vout.length,
          fee: parseInt(tx.fees),
          value: parseInt(tx.value),
          confirmations: tx.confirmations
        };
        return cb(null, txv8);
      })
      .catch(err => {
        // The TX was not found
        if (err.statusCode == 400 &&
          err.error && err.error.error && _.includes(err.error.error, 'not found')) {
          return cb();
        } else {
          return cb(_parseErr(err));
        }
      });
  }

  // This is for internal usage, addresses should be returned on internal representation
  getTransactionBlockbookOutput(txid, cb) {
    logger.info(`GET TX Blockbook Output ${txid}`);
    const client = this._getClient();
    console.time('GetTxBlockbookOutput');
    client
      .getTx({ txid })
      .then(tx => {
        console.timeEnd('GetTxBlockbookOutput');
        if (tx && tx.blockbook) return cb(_unavailableError);
        if (!tx || _.isEmpty(tx)) {
          return cb();
        }
        return cb(null, tx);
      })
      .catch(err => {
        // The TX was not found
        if (err.statusCode == 400 &&
          err.error && err.error.error && _.includes(err.error.error, 'not found')) {
          return cb();
        } else {
          return cb(_parseErr(err));
        }
      });
  }

  getAddressUtxos(address, height, cb) {
    logger.info(`GET ADDR UTXO ${address} ${height}`);
    const client = this._getClient();

    console.time('GetAddressUtxos');
    client
      .getAddressTxos({ address })
      .then(utxos => {
        console.timeEnd('GetAddressUtxos');
        if (utxos && utxos.blockbook) return cb(_unavailableError);
        return cb(null, this._transformUtxos(utxos, height, address));
      })
      .catch(cb);
  }

  getTransactions(wallet, xPubKey_param, startBlock, cb) {
    console.time('getTxs');
    if (startBlock) {
      logger.debug(`getTxs: startBlock ${startBlock}`);
    } else {
      logger.debug('getTxs: from 0');
    }

    const client = this._getAuthClient(wallet);

    const opts = {
      xPubKey: xPubKey_param,
      startBlock: undefined,
      maxGap: Defaults.MAX_MAIN_ADDRESS_GAP,
      tokenAddress: wallet.tokenAddress,
      multisigContractAddress: wallet.multisigContractAddress
    };

    if (_.isNumber(startBlock)) opts.startBlock = startBlock;

    client
      .listTransactions(opts)
      .then(data => {
        console.timeEnd('getTxs');
        if (data && data.blockbook) return cb(_unavailableError);
        if (!data || _.isEmpty(data) || (!_.isEmpty(data) && !data.transactions)) {
          return cb();
        }
        const txs = data.transactions;
        delete data.transaction;
        const orderedTxs = _.orderBy(txs, 'blockTime', 'desc');
        data.transactions = orderedTxs;
        return cb(null, data);
      })
      .catch(err => {
        return cb(_parseErr(err));
      });
  }

  getAddressActivity(address, cb) {
    const url = this.baseUrl + '/v2/address/' + address;
    logger.info(`CHECKING ADDRESS ACTIVITY ${url}`);
    console.time('GetAddressActivity');
    this.request
      .get(url, {})
      .then(ret => {
        console.timeEnd('GetAddressActivity');
        if (!ret || _.isEmpty(ret)) return cb('error to get address');
        try {
          ret = JSON.parse(ret);
          if (ret && ret.blockbook) return cb(_unavailableError);
          return cb(null, (!_.isUndefined(ret.txids) && ret.txids.length > 0));
        } catch (err) {
          logger.warn('fail to fetch address activity:', err);
          return cb(_parseErr(err));
        }
      })
      .catch(err => {
        return cb(_parseErr(err));
      });
  }

  // not supported: not used on BTC, only on ETH and XRP
  getTransactionCount(address, cb) {
    const url = this.baseUrl + '/address/' + address + '/txs/count';
    logger.info(`CHECKING ADDRESS NONCE ${url}`);
    console.time('GetTxCount');
    this.request
      .get(url, {})
      .then(ret => {
        console.timeEnd('GetTxCount');
        ret = JSON.parse(ret);
        if (ret && ret.blockbook) return cb(_unavailableError);
        return cb(null, ret.nonce);
      })
      .catch(err => {
        return cb(_parseErr(err));
      });
  }

  // DEPRECATED on blockbook
  estimateGas(opts, cb) {
    const url = this.baseUrl + '/gas';
    logger.info(`CHECKING GAS LIMIT ${url}`);
    console.time('EstimateGas');
    this.request
      .post(url, { body: opts, json: true })
      .then(gasLimit => {
        console.timeEnd('EstimateGas');
        gasLimit = JSON.parse(gasLimit);
        return cb(null, gasLimit);
      })
      .catch(err => {
        return cb(_parseErr(err));
      });
  }

  getMultisigContractInstantiationInfo(opts, cb) {
    const url = this.baseUrl + '/ethmultisig/' + opts.sender;
    console.log('[v8.js.378:url:] CHECKING CONTRACT INSTANTIATION INFO', url);
    this.request
      .get(url, {})
      .then(contractInstantiationInfo => {
        contractInstantiationInfo = JSON.parse(contractInstantiationInfo);
        return cb(null, contractInstantiationInfo);
      })
      .catch(err => {
        return cb(err);
      });
  }

  getMultisigContractInfo(opts, cb) {
    const url = this.baseUrl + '/ethmultisig/info/' + opts.multisigContractAddress;
    console.log('[v8.js.378:url:] CHECKING CONTRACT INFO', url);
    this.request
      .get(url, {})
      .then(contractInfo => {
        contractInfo = JSON.parse(contractInfo);
        return cb(null, contractInfo);
      })
      .catch(err => {
        return cb(err);
      });
  }

  getMultisigTxpsInfo(opts, cb) {
    const url = this.baseUrl + '/ethmultisig/txps/' + opts.multisigContractAddress;
    console.log('[v8.js.378:url:] CHECKING CONTRACT TXPS INFO', url);
    this.request
      .get(url, {})
      .then(multisigTxpsInfo => {
        multisigTxpsInfo = JSON.parse(multisigTxpsInfo);
        return cb(null, multisigTxpsInfo);
      })
      .catch(err => {
        return cb(err);
      });
  }

  estimateFee(nbBlocks, cb) {
    nbBlocks = nbBlocks || [1, 2, 6, 24];
    const result = {};

    async.each(
      nbBlocks,
      (x: string, icb) => {
        const url = this.baseUrl + '/v2/estimatefee/' + x;
        console.time(`EstimateFee_${x}`);
        this.request
          .get(url, {})
          .then(ret => {
            console.timeEnd(`EstimateFee_${x}`);
            try {
              ret = JSON.parse(ret);
              if (ret && ret.blockbook) return cb(_unavailableError);

              // only process right responses.
              if (_.isUndefined(ret.result)) {
                logger.info(`Ignoring response for ${x}:` + JSON.stringify(ret));
                return icb();
              }

              result[x] = parseFloat(ret.result);
            } catch (e) {
              logger.warn('fee error:', e);
            }

            return icb();
          })
          .catch(err => {
            return icb(err);
          });
      },
      err => {
        if (err) {
          return cb(_parseErr(err));
        }
        // TODO: normalize result
        return cb(null, result);
      }
    );
  }

  getBlockchainHeight(cb) {
    const url = this.baseUrl + '/v2/';

    console.time('GetBlockchainHeight');
    this.request
      .get(url, {})
      .then(ret => {
        console.timeEnd('GetBlockchainHeight');
        try {
          ret = JSON.parse(ret);
          if (!ret.blockbook) return cb(_unavailableError);
          this.getBlockHash(ret.blockbook.bestHeight, (err, hash) => {
            // err is already parsed by _parseErr in getBlockHash(),
            // we pass it to the callback as is
            if (err) return cb(err);
            return cb(null, ret.blockbook.bestHeight, hash);
          });
        } catch (err) {
          return cb(new Error('Could not get height from block explorer'));
        }
      })
      .catch(cb);
  }

  getTxidsInBlock(blockHash, cb) {
    const url = this.baseUrl + '/v2/block/' + blockHash;
    console.time('GetTxidsInBlock');
    this.request
      .get(url, {})
      .then(ret => {
        console.timeEnd('GetTxidsInBlock');
        try {
          ret = JSON.parse(ret);
          if (ret && ret.blockbook) return cb(_unavailableError);
          const res = _.map(ret.txs, 'txid');
          return cb(null, res);
        } catch (err) {
          return cb(new Error('Could not get height from block explorer'));
        }
      })
      .catch(cb);
  }

  initSocket(callbacks) {
    logger.info('connecting socket at:' + this.host);
    // sockets always use the first server on the pull
    const walletsSocket = io.connect(this.host, { path: '/socket.io', transports: ['websocket'] });

    const blockSocket = io.connect(this.host, { path: '/socket.io', transports: ['websocket'] });

    const getAuthPayload = host => {
      const authKey = config.blockchainExplorerOpts.socketApiKey;

      if (!authKey) throw new Error('provide authKey');

      const authKeyObj = new Bitcore.PrivateKey(authKey);
      const pubKey = authKeyObj.toPublicKey().toString();
      const authClient = new Client({ baseUrl: host, authKey: authKeyObj });
      const payload = { method: 'socket', url: host };
      const authPayload = { pubKey, message: authClient.getMessage(payload), signature: authClient.sign(payload) };
      return authPayload;
    };

    blockSocket.on('connect', () => {
      logger.info(`Connected to block ${this.getConnectionInfo()}`);
      blockSocket.emit(
        'subscribe',
        'bitcoind/hashblock'
      );
    });

    blockSocket.on('connect_error', () => {
      logger.error(`Error connecting to ${this.getConnectionInfo()}`);
    });

    blockSocket.on('bitcoind/hashblock', (hash) => {
      return callbacks.onBlock(hash);
    });

    blockSocket.on('block', data => {
      return callbacks.onBlock(data.hash);
    });

    walletsSocket.on('connect', () => {
      logger.info(`Connected to wallets ${this.getConnectionInfo()}`);
      walletsSocket.emit(
        'subscribe',
        'bitcoind/coin'
      );
    });

    walletsSocket.on('connect_error', () => {
      logger.error(`Error connecting to ${this.getConnectionInfo()}  ${this.chain}/${this.v8network}`);
    });

    walletsSocket.on('failure', err => {
      logger.error(`Error joining room ${err.message} ${this.chain}/${this.v8network}`);
    });

    walletsSocket.on('coin', data => {
      if (!data || !data.coin) return;

      const notification = ChainService.onCoin(this.coin, data.coin);
      if (!notification) return;

      return callbacks.onIncomingPayments(notification);
    });

    walletsSocket.on('tx', data => {
      if (!data || !data.tx) return;

      const notification = ChainService.onTx(this.coin, data.tx);
      if (!notification) return;

      return callbacks.onIncomingPayments(notification);
    });

    walletsSocket.on('bitcoind/coin', data => {
      if (!data || !data.address) return;
      let coin;
      try {
        coin = {
          address: data.address,
          value: data.value / 1e8,
          mintTxid: data.txid
        };
      } catch (e) {
        // non parsable address
        return;
      }

      const notification = ChainService.onCoin(this.coin, coin);
      if (!notification) return;

      return callbacks.onIncomingPayments(notification);
    });

    walletsSocket.on('bitcoind/txid', data => {
      if (!data) return;

      const notification = ChainService.onTx(this.coin, data);
      if (!notification) return;

      return callbacks.onIncomingPayments(notification);
    });
  }

  getBlockHash(blockHeight, cb) {
  logger.info(`getBlockHash: ${blockHeight}`);
  const client = this._getClient();
  console.time('GetBlockHash');
  client.getBlockHash({blockId: blockHeight })
      .then(block => {
        console.timeEnd('GetBlockHash');
        if (block && block.blockbook) return cb(_unavailableError);
        if (!block || _.isEmpty(block)) {
          return cb();
        }
        return cb(null, block.blockHash);
      })
      .catch((err) => {
        // The block index was not found
        return cb(_parseErr(err));
      });
  }

  // DEPRECATED on blockbook
  getBlockLight(blockHash, cb) {
  logger.info(`getBlockLight: ${blockHash}`);
  const client = this._getClient();
  console.time('GetBlockLight');
  client.getBlockLight({blockId: blockHash })
      .then( (block) => {
        console.timeEnd('GetBlockLight');
        if (block && block.blockbook) return cb(_unavailableError);
        if (!block || _.isEmpty(block)) {
          return cb();
        }
        delete block.txs;
        return cb(null, block);
      })
      .catch((err) => {
        return cb(_parseErr(err));
      });
  }

  // DEPRECATED on blockbook
  getConnectionCount(cb) {
  logger.info('getConnectionCount');
  const client = this._getClient();
  console.time('GetConnectionCount');
  client.getConnectionCount()
      .then( (result) => {
        console.timeEnd('GetConnectionCount');
        if (result && result.blockbook) return cb(_unavailableError);
        if (!result || !_.isNumber(result)) {
          return cb();
        }
        return cb(null, result);
      })
      .catch((err) => {
        // Error to fetch connection count
        return cb(_parseErr(err));
      });
  }

  // DEPRECATED on blockbook
  getPeerInfo(cb) {
  logger.info('getPeerInfo');
  const client = this._getClient();
  console.time('GetPeerInfo');
  client.getPeerInfo()
      .then( (result) => {
        console.timeEnd('GetPeerInfo');
        if (result && result.blockbook) return cb(_unavailableError);
        if (!result || _.isEmpty(result)) {
          return cb();
        }
        return cb(null, result);
      })
      .catch((err) => {
        // Error to fetch connection count
        return cb(_parseErr(err));
      });
  }
}

const _parseErr = (err) => {
  const genericError = 'Error querying the blockchain';
  const genericCode = 500;
  if (err) {
    let message;
    try {
      message = err.error.error || err.body || err.toString() || genericError;
    } catch(e) {
      message = genericError;
    }
    const code = (err.statusCode && _.isNumber(err.statusCode)) ? err.statusCode : genericCode;
    logger.warn('blockbook error: ', message);
    return {code, message};
  }
  logger.warn('blockbook error: ', genericError);
  return {code: genericCode, message: genericError};
};

const _unavailableError = new Error('Blockbook is unavailable, it may be syncing');
