import * as requestStream from 'request';
import * as request from 'request-promise-native';
import * as secp256k1 from 'secp256k1';
import { URL } from 'url';
import logger from '../../logger';
logger.level = process.env.LOG_LEVEL || 'info';

const bitcoreLib = require('bitcore-lib');

export class Client {
  authKey: { bn: { toBuffer: (arg) => Buffer } };
  baseUrl: string;

  constructor(params) {
    Object.assign(this, params);
  }

  getMessage(params: { method: string; url: string; payload?: any }) {
    const { method, url, payload = {} } = params;
    const parsedUrl = new URL(url);
    return [method, parsedUrl.pathname + parsedUrl.search, JSON.stringify(payload)].join('|');
  }

  sign(params: { method: string; url: string; payload?: any }) {
    const message = this.getMessage(params);
    const privateKey = this.authKey.bn.toBuffer({ size: 32 });
    const messageHash = bitcoreLib.crypto.Hash.sha256sha256(Buffer.from(message));

    return secp256k1.sign(messageHash, privateKey).signature.toString('hex');
  }

  async register(params) {
    const { payload } = params;
    // allow you to overload the client's baseUrl
    const { baseUrl = this.baseUrl } = payload;
    const url = `${baseUrl}/wallet`;
    const signature = this.sign({ method: 'POST', url, payload });
    logger.debug(`register ${url}`);
    return request.post(url, {
      headers: { 'x-signature': signature },
      body: payload,
      json: true
    });
  }

  async getBalance(params) {
    const { payload, pubKey, tokenAddress, multisigContractAddress } = params;
    let query = '';
    let apiUrl = `${this.baseUrl}/wallet/${pubKey}/balance`;

    if (tokenAddress) {
      query = `?tokenAddress=${tokenAddress}`;
    }

    if (multisigContractAddress) {
      apiUrl = `${this.baseUrl}/address/${multisigContractAddress}/balance`;
    }

    const url = apiUrl + query;
    logger.debug(`getBalance ${url}`);
    const signature = this.sign({ method: 'GET', url, payload });
    return request.get(url, {
      headers: { 'x-signature': signature },
      body: payload,
      json: true
    });
  }

  async getCheckData(params) {
    const { payload, pubKey } = params;
    const url = `${this.baseUrl}/wallet/${pubKey}/check`;
    logger.debug(`getCheckData ${url}`);
    const signature = this.sign({ method: 'GET', url, payload });
    return request.get(url, {
      headers: { 'x-signature': signature },
      body: payload,
      json: true
    });
  }

  async getAddressTxos(params) {
    const { confirmed, address } = params;
    const args = confirmed ? `?confirmed=${confirmed}` : '';
    const url = `${this.baseUrl}/v2/utxo/${address}${args}`;
    logger.debug(`getAddressTxos ${url}`);
    return request.get(url, {
      json: true
    });
  }

  async getTx(params) {
    const { txid } = params;
    const url = `${this.baseUrl}/v2/tx/${txid}`;
    logger.debug(`getTx ${url}`);
    return request.get(url, {
      json: true
    });
  }

  async getCoins(params) {
    const { xPubKey } = params;

    const url = `${this.baseUrl}/v2/utxo/${xPubKey}`;
    logger.debug(`getCoins ${url}`);
    return request.get(url, {
      json: true
    });
  }

  async getCoinsForTx(params) {
    const { txId } = params;
    const url = `${this.baseUrl}/tx/${txId}/coins`;
    logger.debug(`getCoinsForTx ${url}`);
    return request.get(url, {
      json: true
    });
  }

  async listTransactions(params) {
    const {
      xPubKey,
      startBlock,
      endBlock,
      maxGap,
      tokenAddress,
      multisigContractAddress
    } = params;
    let url = `${this.baseUrl}/v2/xpub/${xPubKey}?details=txs`;
    // FIXME: temporary disabled, see issue #64
    /*
    if (startBlock) {
      url += `&from=${startBlock}`;
    }
    if (endBlock) {
      url += `&to=${endBlock}`;
    }
    */
    if (maxGap) {
      url += `&gap=${maxGap}`;
    }
    const signature = this.sign({ method: 'GET', url });
    logger.debug(`List transactions ${url}`);
    return request.get(url, {
      headers: { 'x-signature': signature },
      json: true
    });
  }

  async importAddresses(params) {
    const { payload, pubKey } = params;
    const url = `${this.baseUrl}/wallet/${pubKey}`;

    logger.debug(`addAddresses: ${url} ${payload}`);
    const signature = this.sign({ method: 'POST', url, payload });
    const h = { 'x-signature': signature };
    return request.post(url, {
      headers: h,
      body: payload,
      json: true
    });
  }

  async broadcast(params) {
    const { payload } = params;
    const url = `${this.baseUrl}/v2/sendtx/${payload.rawTx}`;
    logger.debug(`broadcast ${url}`);
    return request.get(url, { json: true });
  }

  async getBlockHash(params) {
    const { blockId } = params;
    const url = `${this.baseUrl}/v2/block-index/${blockId}`;
    logger.debug(`getBlockHash  ${url}`);
    return request.get(url, {
      json: true
    });
  }

  async getBlockLight(params) {
    const { blockId } = params;
    const url = `${this.baseUrl}/block/${blockId}`;
    logger.debug(`getBlockLight  ${url}`);
    return request.get(url, {
      json: true
    });
  }

  async getConnectionCount() {
    const url = `${this.baseUrl}/info/getconnectioncount`;
    logger.debug(`getConnectionCount ${url}`);
    return request.get(url, {
      json: true
    });
  }

  async getPeerInfo() {
    const url = `${this.baseUrl}/info/getpeerinfo`;
    logger.debug(`getPeerInfo ${url}`);
    return request.get(url, {
      json: true
    });
  }
}
