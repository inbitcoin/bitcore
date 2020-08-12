'use strict';

var _ = require('lodash');
var chai = require('chai');
var sinon = require('sinon');
var should = chai.should();
var { V8 } = require('../ts_build/lib/blockchainexplorers/v8');
var B = require('bitcore-lib-cash');
const { Readable } = require('stream');
var Common = require('../ts_build/lib/common');
var Defaults = Common.Defaults;

const errorQueryingBlockchain = 'Error querying the blockchain';

const V8UTXOS_old = [
{"_id":"5c1d4bc47adced963b3cddb9","chain":"BCH","network":"testnet","coinbase":false,"mintIndex":0,"spentTxid":"","mintTxid":"6e34d9b83631cd55ee09d907061332ba3c17246e3c1255543fb7a35e58c52e42","mintHeight":12,"spentHeight":-2,"address":"qrua7vsdmks4522wwv8rtamfph7g8s8vpq6a0g3veh","script":"76a914f9df320ddda15a294e730e35f7690dfc83c0ec0888ac","value":1000000,"confirmations":-1},
{"_id":"5c1e33e17adced963b776bcf","chain":"BCH","network":"testnet","coinbase":false,"mintIndex":0,"spentTxid":"","mintTxid":"fb1340bae2431f71c5f14d0c5893cbfb09042dcb9602b858ccec43e0e1e2f1a1","mintHeight":15,"spentHeight":-2,"address":"qrua7vsdmks4522wwv8rtamfph7g8s8vpq6a0g3veh","script":"76a914f9df320ddda15a294e730e35f7690dfc83c0ec0888ac","value":2000000,"confirmations":-1},
{"_id":"5c21088f7adced963b33eea2","chain":"BCH","network":"testnet","coinbase":false,"mintIndex":0,"spentTxid":"","mintTxid":"42eeb1d139521fa5206685ffec5df3b302cf85561201178680a0efe6bd23d449","mintHeight":-1,"spentHeight":-2,"address":"qrua7vsdmks4522wwv8rtamfph7g8s8vpq6a0g3veh","script":"76a914f9df320ddda15a294e730e35f7690dfc83c0ec0888ac","value":2000000,"confirmations":-1}];

const V8UTXOS = [
{"vout":0,"txid":"6e34d9b83631cd55ee09d907061332ba3c17246e3c1255543fb7a35e58c52e42","height":12,"value":"1000000","confirmations":-1},
{"vout":0,"txid":"fb1340bae2431f71c5f14d0c5893cbfb09042dcb9602b858ccec43e0e1e2f1a1","height":15,"value":"2000000","confirmations":-1},
{"vout":0,"txid":"42eeb1d139521fa5206685ffec5df3b302cf85561201178680a0efe6bd23d449","height":-1,"value":"2000000","confirmations":-1}];


const V8UTXOS2 = [
  { vout: 0, txid: '623f72b089da60a179d7b85b50ed655e8580747ee06f2f77369cacfb99de11a0', height: 571792, value: 109810934, confirmations: 126 },
  { vout: 0, txid: '06ab9db9100409132a4c1367b87f16983938007dbae7b96a0746a64a7755e3e6', height: 571797, value: 350000000, confirmations: 121 }];

const BB_UTXOS = [
  {"vout":0,"txid":"6e34d9b83631cd55ee09d907061332ba3c17246e3c1255543fb7a35e58c52e42","height":12,"value":"1000000","confirmations":-1,"address":"1L3z9LPd861FWQhf3vDn89Fnc9dkdBo2CG"},
  {"vout":0,"txid":"fb1340bae2431f71c5f14d0c5893cbfb09042dcb9602b858ccec43e0e1e2f1a1","height":15,"value":"2000000","confirmations":-1,"address":"1L3z9LPd861FWQhf3vDn89Fnc9dkdBo2CG"},
  {"vout":0,"txid":"42eeb1d139521fa5206685ffec5df3b302cf85561201178680a0efe6bd23d449","height":-1,"value":"2000000","confirmations":-1,"address":"1L3z9LPd861FWQhf3vDn89Fnc9dkdBo2CG"}];

// Blockbook status page
const bbStatusPage = {
  "blockbook":{
    "coin":"Bitcoin",
    "host":"b5eb9a9c186f",
    "version":"0.3.3",
    "gitCommit":"2f99563",
    "buildTime":"2020-06-22T08:36:03+00:00",
    "syncMode":true,
    "initialSync":false,
    "inSync":true,
    "bestHeight":638150,
    "lastBlockTime":"2020-07-07T14:18:01.770129685Z",
    "inSyncMempool":true,
    "lastMempoolTime":"2020-07-07T14:23:27.109081706Z",
    "mempoolSize":19745,
    "decimals":8,
    "dbSize":255847401686,
    "about":"Blockbook - blockchain indexer for Trezor wallet https://trezor.io/. Do not use for any other purpose."
  },
  "backend":{
    "chain":"main",
    "blocks":638150,
    "headers":638150,
    "bestBlockHash":"0000000000000000000336e4251efd3166d2c1076964c07dc01695b86d805901",
    "difficulty":"15784217546288.15",
    "sizeOnDisk":325318588124,
    "version":"180100",
    "subversion":"/Satoshi:0.18.1/",
    "protocolVersion":"70015"
  }
};

const BB_TX = {
  "txid": "59622c71796da76f53834aac53047e4cdbc8d1585b0f396a73bcb792273e1d3c",
  "version": 1,
  "vin": [
    {
      "txid": "7479f5b4d2e85318fe3719d02287332aa77bf2effbb1ef760e8fa29a54637e96",
      "vout": 3,
      "sequence": 4294967295,
      "n": 0,
      "addresses": [
        "mzXUZnnhH7tjeK3Jx92o7ugr6L2xVp2mrr"
      ],
      "isAddress": true,
      "value": "651",
      "hex": "483045022100bf8b68c76a9390d75e8e9df6cc59fe835f07038c45f9d4432498f4779a0aa6e20220625355f15268d7128cbf203bc70c5831efff3e59b6802c095dc5f6b701765970012103fded9361f97298f9ef3caa1990340ed6566dd638594b5fcc493b8fd380eab83c"
    },
    {
      "txid": "7479f5b4d2e85318fe3719d02287332aa77bf2effbb1ef760e8fa29a54637e96",
      "vout": 2,
      "sequence": 4294967295,
      "n": 1,
      "addresses": [
        "mkYE7pJoYrkw9uCbEVP39XnNVx9dTsRqty"
      ],
      "isAddress": true,
      "value": "21188",
      "hex": "473044022051ee912806a4fb003b99084e1735ed361cdfb1429f85922f8041e0490c97864f02207536a9dc22ba83dc399fcff30bf0b648144af89d9e7d726047afc2c941bcd8d4012102396bb782a2de2f21f7691e23d590f57b11afacf0c504bccec4ef1b2a90fc2d46"
    }
  ],
  "vout": [
    {
      "value": "651",
      "n": 0,
      "hex": "76a914a94c7f96dc58404c5e2b903faeaf078d33b4893188ac",
      "addresses": [
        "mvx88g7DJ9b5vYs97bvTSfzz4hUUx2EjqT"
      ],
      "isAddress": true
    },
    {
      "value": "0",
      "n": 1,
      "hex": "6a0843430215004036b4",
      "addresses": [
        "OP_RETURN 43430215004036b4"
      ],
      "isAddress": false
    },
    {
      "value": "20110",
      "n": 2,
      "spent": true,
      "hex": "76a9147b2eb43242a3261343da2f65eb0176993dac7d8588ac",
      "addresses": [
        "mrkHMh7hKZxRyEywAY2KwHVktrEbv9x4NP"
      ],
      "isAddress": true
    },
    {
      "value": "651",
      "n": 3,
      "spent": true,
      "hex": "76a9147bb092a3d406f4dac28e2f81d314105b41295c2c88ac",
      "addresses": [
        "mrnxw9G8FLeMFX2JALatw8jdLqqDPsFVMt"
      ],
      "isAddress": true
    }
  ],
  "blockHash": "0000000000000069bfdd46bf9e7055f583b46dd3c4cb4cfc8081c2ad6724d2cb",
  "blockHeight": 1773356,
  "confirmations": 7391,
  "blockTime": 1592985722,
  "value": "21412",
  "valueIn": "21839",
  "fees": "427",
  "hex": "0100000002967e63549aa28f0e76efb1fbeff27ba72a338722d01937fe1853e8d2b4f57974030000006b483045022100bf8b68c76a9390d75e8e9df6cc59fe835f07038c45f9d4432498f4779a0aa6e20220625355f15268d7128cbf203bc70c5831efff3e59b6802c095dc5f6b701765970012103fded9361f97298f9ef3caa1990340ed6566dd638594b5fcc493b8fd380eab83cffffffff967e63549aa28f0e76efb1fbeff27ba72a338722d01937fe1853e8d2b4f57974020000006a473044022051ee912806a4fb003b99084e1735ed361cdfb1429f85922f8041e0490c97864f02207536a9dc22ba83dc399fcff30bf0b648144af89d9e7d726047afc2c941bcd8d4012102396bb782a2de2f21f7691e23d590f57b11afacf0c504bccec4ef1b2a90fc2d46ffffffff048b020000000000001976a914a94c7f96dc58404c5e2b903faeaf078d33b4893188ac00000000000000000a6a0843430215004036b48e4e0000000000001976a9147b2eb43242a3261343da2f65eb0176993dac7d8588ac8b020000000000001976a9147bb092a3d406f4dac28e2f81d314105b41295c2c88ac00000000"
};

const BB_TX_IN_BLOCK = {
  "txid": "eb5712033701da8efd28737fa609bb74398e37d606ad81d429f2869fe01755ed",
  "vin": [
    {
      "n": 0,
      "addresses": [
        "mg7wqaegJoxAykoELkG5JgE1QvQbRrSS1a"
      ],
      "isAddress": true,
      "value": "67000"
    }
  ],
  "vout": [
    {
      "value": "56000",
      "n": 0,
      "spent": true,
      "addresses": [
        "mg7wqaegJoxAykoELkG5JgE1QvQbRrSS1a"
      ],
      "isAddress": true
    },
    {
      "value": "1000",
      "n": 1,
      "addresses": [
        "msC4VTgbqgDoAhQoXYqxdAvFsDVXZhtr8B"
      ],
      "isAddress": true
    },
    {
      "value": "0",
      "n": 2,
      "addresses": [
        "OP_RETURN (LIGHT!)"
      ],
      "isAddress": false
    }
  ],
  "blockHash": "000000000000624f06c69d3a9fe8d25e0a9030569128d63ad1b704bbb3059a16",
  "blockHeight": 600000,
  "confirmations": 1180765,
  "blockTime": 1447184636,
  "value": "57000",
  "valueIn": "67000",
  "fees": "10000"
};

const BB_BLOCK = {
  "page": 1,
  "totalPages": 1,
  "itemsOnPage": 1000,
  "hash": "000000000000624f06c69d3a9fe8d25e0a9030569128d63ad1b704bbb3059a16",
  "previousBlockHash": "000000000000bb1644b4d9a643b165a52b3ffba077f2a12b8bd1f0a6b6cc0fbc",
  "nextBlockHash": "0000000000022d279bb4239c0a703d12fc6f37f6b9e8e8c196fe2a0692859811",
  "height": 600000,
  "confirmations": 1180765,
  "size": 505,
  "time": 1447184636,
  "version": 4,
  "merkleRoot": "59eedd359bd90f1489d732644f08792d743c7ab6cecb6deb396030bc91f853cb",
  "nonce": "1212006978",
  "bits": "1b024a88",
  "difficulty": "28603.69332409825",
  "txCount": 0,
  "txs": []
  };

const BB_EMPTY_XPUB = {
  "page": 1,
  "totalPages": 1,
  "itemsOnPage": 1000,
  "address": "xpub",
  "balance": "0",
  "totalReceived": "0",
  "totalSent": "0",
  "unconfirmedBalance": "0",
  "unconfirmedTxs": 0,
  "txs": 0
};

var t = (new Date).toISOString();
var external = '11234';
var txs = [{
  id: 1,
  txid: 'txid1',
  blockTime: t,
  size: 226,
  category: 'send',
  toAddress: external,
  satoshis: 0.5e8,
},
{
  id: 2,
  txid: 'txid2',
  category: 'send',
  blockTime: t,
  satoshis: 0.3e8,
  toAddress: external,
},
{
  id: 3,
  txid: 'txid3',
  blockTime: t,
  satoshis: 5460,
  category: 'fee',
},
];


describe('V8', () => {
  var wallet={};

  wallet.beAuthPrivateKey2= new B.PrivateKey();

  describe('#listTransactions', () => {
    it('should return empty result on empty xpub', (done) => {
      class Client {
        listTransactions(opts) {
          return new Promise(function (resolve) {
            resolve(BB_EMPTY_XPUB);
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        addressFormat: null,
        client: Client,
      });

      be.getTransactions(wallet, 'xpub', 0, (err, txs) => {
        should.not.exist(err);
        should.not.exist(txs);
        done();
      });
    });

    it('should return valid txs list', (done) => {
      let bbtxs = BB_EMPTY_XPUB;
      bbtxs.txs = 3;
      bbtxs.transactions = [];
      bbtxs.transactions.push(_.clone(BB_TX));
      bbtxs.transactions.push(_.clone(BB_TX));
      bbtxs.transactions.push(_.clone(BB_TX));
      bbtxs.transactions[0].blockTime = 1593006560;
      bbtxs.transactions[0].txid = 'txid0';
      bbtxs.transactions[1].blockTime = 1593006555;
      bbtxs.transactions[1].txid = 'txid1';
      bbtxs.transactions[2].blockTime = 1593006570;
      bbtxs.transactions[2].txid = 'txid2';
      class Client {
        listTransactions(opts) {
          return new Promise(function (resolve) {
            resolve(bbtxs);
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        addressFormat: null,
        client: Client,
      });

      be.getTransactions(wallet, 'xpub', 0, (err, txs) => {
        should.not.exist(err);
        should.exist(txs.transactions);
        // check ordered by blockTime desc
        txs.transactions[0].txid.should.equal('txid2');
        txs.transactions[1].txid.should.equal('txid0');
        txs.transactions[2].txid.should.equal('txid1');
        done();
      });
    });

    // useless on blockbook, is not a stream
    it.skip('should handle partial json results', (done) => {
      class PartialJson {
        listTransactions(opts) {
          class MyReadable extends Readable {
            constructor(options) {
              super(options);
              var txStr = JSON.stringify(txs);
              this.push(txStr.substr(0,10));
              this.push(txStr.substr(10));
              this.push(null);
              }
          };

          return new Promise(function (resolve) {
            const txslist = {transactions: txs}
            resolve(txslist);
          })

          return new MyReadable;
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        addressFormat: null,
        client: PartialJson,
      });

      be.getTransactions(wallet, 'xpub', 0, (err, txs) => {
        should.not.exist(err);
        should.exist(txs.transactions);
        txs.transactions.length.should.equal(3);
        return done();
      });
    });

    // useless on blockbook, is not a stream
    it.skip('should handle partial jsonline results', (done) => {
      class PartialJsonL {
        listTransactions(opts) {
          class MyReadable extends Readable {
            constructor(options) {
              super(options);
              var txStr = '{ "id": 1, "txid": "txid1", "confirmations": 1, "blockTime": "'+
                t + '", "size": 226, "category": "send", "toAddress": "'+
                external +'", "satoshis": 0.5e8 } \n { "id": 2, "txid": "txid2", "confirmations": 1, "category": "send", "blockTime": "'+
                t + '", "satoshis": 0.3e8, "toAddress": "'+external + '"}';
              this.push(txStr.substr(0,10));
              this.push(txStr.substr(10));
              this.push(null);
              }
          };

          return new MyReadable;
        };
      };
      var be2 = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        addressFormat: null,
        client: PartialJsonL,
      });
      be2.getTransactions(wallet, 0, 'xpub', (err, txs) => {
        should.not.exist(err);
        should.exist(txs);
        txs.length.should.equal(2);
        return done();
      });
    });

  });

  describe('#getAddressActivity', () => {
    it('should return false on empty txids', (done) => {
      let addressActivity = _.clone(BB_EMPTY_XPUB);
      addressActivity.address = 'address';
      const fakeRequest = {
        get: sinon.stub().resolves(JSON.stringify(addressActivity)),
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        addressFormat: null,
        request: fakeRequest
      });

      be.getAddressActivity('address', (err, result) => {
        should.not.exist(err);
        result.should.equal(false);
        done();
      });
    });

    it('should fail on invalid JSON', (done) => {
      const fakeRequest = {
        get: sinon.stub().resolves('invalid json'),
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        addressFormat: null,
        request: fakeRequest
      });

      be.getAddressActivity('address', (err, result) => {
        should.exist(err);
        err.code.should.equal(500);
        err.message.should.equal(errorQueryingBlockchain);
        done();
      });
    });

    it('should return true on txids length = 2', (done) => {
      let addressActivity = _.clone(BB_EMPTY_XPUB);
      addressActivity.address = 'address';
      addressActivity.txs = 2;
      addressActivity.txids = [];
      addressActivity.txids.push('txid0')
      addressActivity.txids.push('txid1')
      const fakeRequest = {
        get: sinon.stub().resolves(JSON.stringify(addressActivity)),
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        addressFormat: null,
        request: fakeRequest
      });

      be.getAddressActivity('address', (err, result) => {
        should.not.exist(err);
        result.should.equal(true);
        done();
      });
    });
  });

  describe.skip('#deregistedwallet', () => {
  });

  describe('#getUtxos', () => {
    it('should get uxtos', (done) => {

      class Client {
        getCoins(opts) {
          return new Promise(function (resolve) {
            resolve(BB_UTXOS);
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: Client,
      });

      be.getUtxos(wallet, 15, 'xpub', (err, utxos) => {
        should.not.exist(err);
        utxos[0].confirmations.should.equal(4)
        should.exist(utxos);
        let x = utxos[2];
        x.confirmations.should.equal(0);
        x.address.should.equal('1L3z9LPd861FWQhf3vDn89Fnc9dkdBo2CG');
        x.satoshis.should.equal(2000000);
        x.amount.should.equal(x.satoshis/1e8);
        x.scriptPubKey.should.equal('76a914d0faec47bebd22b7168a6298c3b4d3d7dc84fe2088ac');
        x.txid.should.equal('42eeb1d139521fa5206685ffec5df3b302cf85561201178680a0efe6bd23d449');
        x.vout.should.equal(0);

        utxos[1].confirmations.should.equal(1);
        utxos[0].confirmations.should.equal(4);
        return done();
      });
    });

    it('should return empty utxos array on empty blockbook response array', (done) => {
      class Client {
        getCoins(opts) {
          return new Promise(function (resolve) {
            resolve([]);
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: Client,
      });

      be.getUtxos(wallet, 15, 'xpub', (err, utxos) => {
        should.not.exist(err);
        console.log(JSON.stringify(utxos))
        utxos.length.should.equal(0)
        done();
      });
    });

    it('should return error on invalid xpub', (done) => {
      const errorMessage = "Invalid address 'invalidxpub', decoded address is of unknown format";
      class Client {
        getCoins(opts) {
          return new Promise(function (resolve, reject) {
            reject({statusCode: 400, error: {error: errorMessage}});
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: Client,
      });

      be.getUtxos(wallet, 15, 'invalidxpub', (err, utxos) => {
        should.exist(err);
        err.code.should.equal(400);
        err.message.should.equal(errorMessage);
        done();
      });
    });
  });

  describe('#getAddressUtxos', () => {
    it('should get uxtos', (done) => {


      class PartialJson {
        getAddressTxos(opts) {
          return new Promise(function (resolve) {
            resolve(V8UTXOS);
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: PartialJson,
      });

      be.getAddressUtxos('1EU9VhWRN7aW38pGk7qj3c2EDcUGDZKESt', 15, (err, utxos) => {
        should.not.exist(err);
        should.exist(utxos);
        let x = utxos[2];
        x.confirmations.should.equal(0);
        x.address.should.equal('1EU9VhWRN7aW38pGk7qj3c2EDcUGDZKESt');
        x.satoshis.should.equal(2000000);
        x.amount.should.equal(x.satoshis/1e8);
        x.scriptPubKey.should.equal('76a91493bbf50ef3204a60d68143e76a1c37ac8cedc63e88ac');
        x.txid.should.equal('42eeb1d139521fa5206685ffec5df3b302cf85561201178680a0efe6bd23d449');
        x.vout.should.equal(0);

        utxos[1].confirmations.should.equal(1);
        utxos[0].confirmations.should.equal(4);

        return done();
      });
    });

    it('should get uxtos 2', (done) => {


      class PartialJson {
        getAddressTxos(opts) {
          return new Promise(function (resolve) {
            resolve(V8UTXOS2);
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: PartialJson,
      });

      be.getAddressUtxos('36pUaXzGouNdCqUDRWRXX9NJYungJEWJC2', 571920, (err, utxos) => {
        should.not.exist(err);
        should.exist(utxos);
        let x = utxos[1];
        x.confirmations.should.equal(124);
        x.satoshis.should.equal(350000000);
        x.amount.should.equal(3.5);
        return done();
      });
    });

  });

  describe('#getTransaction', () => {
    it('should return empty result on tx not found', (done) => {
      class Client {
        getTx(opts) {
          return new Promise(function (resolve,reject) {
            reject({statusCode: 400, error: {error: "Transaction 'txid' not found (encoding/hex: invalid byte: U+0074 't')"}});
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: Client,
      });

      be.getTransaction('txid', (err, tx) => {
        should.not.exist(err);
        should.not.exist(tx);
        done();
      });
    });

    it('should return missing txid on empty txid parameter', (done) => {
      class Client {
        getTx(opts) {
          return new Promise(function (resolve,reject) {
            reject({statusCode: 400, error: {error: 'Missing txid'}});
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: Client,
      });

      be.getTransaction('', (err, tx) => {
        should.exist(err);
        err.code.should.equal(400)
        err.message.should.equal('Missing txid')
        done();
      });
    });

    it('should return valid tx', (done) => {
      class Client {
        getTx(opts) {
          return new Promise(function (resolve) {
            resolve(BB_TX);
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: Client,
      });

      be.getTransaction(BB_TX.txid, (err, tx) => {
        should.not.exist(err);
        tx.txid.should.equal(BB_TX.txid);
        tx.network.should.equal('mainnet')
        tx.chain.should.equal('BTC');
        tx.blockHeight.should.equal(BB_TX.blockHeight);
        tx.blockHash.should.equal(BB_TX.blockHash);
        const date = new Date(BB_TX.blockTime * 1000);
        tx.blockTime.toString().should.equal(date.toString());
        tx.inputCount.should.equal(BB_TX.vin.length);
        tx.outputCount.should.equal(BB_TX.vout.length);
        tx.fee.should.equal(parseInt(BB_TX.fees));
        tx.value.should.equal(parseInt(BB_TX.value));
        tx.confirmations.should.equal(BB_TX.confirmations);
        done();
      });
    });
  });

  describe('#getTransactionBlockbookOutput', () => {
    it('should return empty result on tx not found', (done) => {
      class Client {
        getTx(opts) {
          return new Promise(function (resolve,reject) {
            reject({statusCode: 400, error: {error: "Transaction 'txid' not found (encoding/hex: invalid byte: U+0074 't')"}});
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: Client,
      });

      be.getTransactionBlockbookOutput('txid', (err, tx) => {
        should.not.exist(err);
        should.not.exist(tx);
        done();
      });
    });

    it('should return missing txid on empty txid parameter', (done) => {
      class Client {
        getTx(opts) {
          return new Promise(function (resolve,reject) {
            reject({statusCode: 400, error: {error: 'Missing txid'}});
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: Client,
      });

      be.getTransactionBlockbookOutput('', (err, tx) => {
        should.exist(err);
        err.code.should.equal(400)
        err.message.should.equal('Missing txid')
        done();
      });
    });

    it('should return valid tx', (done) => {
      class Client {
        getTx(opts) {
          return new Promise(function (resolve) {
            resolve(BB_TX);
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: Client,
      });

      be.getTransactionBlockbookOutput(BB_TX.txid, (err, tx) => {
        should.not.exist(err);
        tx.toString().should.equal(BB_TX.toString());
        done();
      });
    });
  });

  describe('#estimateFee', () => {
    it('should estimate fee', (done) => {

      let fakeRequest = {
        get: sinon.stub().resolves('{"result":"0.00017349"}'),
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        request: fakeRequest,
      });

      be.estimateFee([5], (err, levels) => {
        should.not.exist(err);
        should.exist(levels);
        // should ignore non-matching results
        levels.should.deep.equal({ '5': 0.00017349 });
        return done();
      });
    });

    it('should ignore non-matching results from estimate fee', (done) => {

      const fakeRequest = {get: sinon.stub().callsFake((arg1) => {
        if (arg1[arg1.length-1] === '4')
          return Promise.resolve('{"result":"0.00017349"}')
        else
          return Promise.resolve('{}')
      })};

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        request: fakeRequest,
      });

      be.estimateFee([1,2,3,4,5], (err, levels) => {
        should.not.exist(err);
        should.exist(levels);
        // should ignore non-matching results
        levels.should.deep.equal({ '4': 0.00017349 });
        return done();
      });
    });

    it('should use results from estimate fee is blocks is not present', (done) => {

      let fakeRequest = {
        get: sinon.stub().resolves('{"result":"0.00017349"}'),
      };

      var be = new V8({
        coin: 'bch',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        request: fakeRequest,
      });

      be.estimateFee([1,2,3,4,5], (err, levels) => {
        should.not.exist(err);
        should.exist(levels);
        levels.should.deep.equal({ '1': 0.00017349,
          '2': 0.00017349,
          '3': 0.00017349,
          '4': 0.00017349,
          '5': 0.00017349 });
        return done();
      });
    });

  });


  describe('#broadcast', () => {
    it('should broadcast a TX', (done) => {
      class BroadcastOk {
        broadcast(payload) {
          return new Promise(function (resolve) {
            resolve({'result':'txid'});
          })
        };
      };

      var be = new V8({
        coin: 'bch',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: BroadcastOk,
      });

      be.broadcast('xxx', (err, txid) => {
        should.not.exist(err);
        txid.should.equal('txid');
        done();
      });
    });

    it('should fail to broadcast an invalid TX', (done) => {
      class BroadcastInvalid {
        broadcast(payload) {
          return new Promise(function (resolve) {
            resolve('invalid');
          })
        };
      };

      var be = new V8({
        coin: 'bch',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: BroadcastInvalid,
      });

      be.broadcast('xxx', (err, txid) => {
        should.not.exist(txid);
        err.toString().should.contain('Error');
        done();
      });
    });


    it('should retry to broadcast is socket hang up', (done) => {
      var oldd = Defaults.BROADCAST_RETRY_TIME;
      Defaults.BROADCAST_RETRY_TIME = 5;
      var x=0;
      class BroadcastInvalid {
        broadcast(payload) {
          return new Promise(function (resolve,reject) {
            if (x++<2) {
              reject('socket err or');
            } else {
              resolve({'result':'txid'});
            }
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        client: BroadcastInvalid,
      });

      be.broadcast('xxx', (err, txid) => {
        should.not.exist(err);
        txid.should.equal('txid');
        Defaults.BROADCAST_RETRY_TIME = oldd;
        done();
      });
    });

  });

  describe('#blockheight', () => {
    let statusPage = {
      get: sinon.stub().resolves(JSON.stringify(bbStatusPage)),
    };
    it('should return block height and hash', (done) => {
      class BlockHash {
        getBlockHash(payload) {
          return new Promise(function (resolve) {
            resolve({blockHash: 'hash'});
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        request: statusPage,
        client: BlockHash,
      });

      be.getBlockchainHeight((err, height, hash) => {
        should.not.exist(err);
        height.should.equal(638150);
        hash.should.equal('hash');
        done();
      });
    });

    it('should return error on invalid json on get status page', (done) => {
      let invalidJson = {
        get: sinon.stub().resolves(''),
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        request: invalidJson,
      });

      be.getBlockchainHeight((err, height, hash) => {
        should.exist(err);
        err.toString().should.equal('Error: Could not get height from block explorer');
        done();
      });
    });

    it('should return error on bad response from getBlockHash', (done) => {
      class BlockHash {
        getBlockHash(payload) {
          return new Promise(function (resolve,reject) {
            reject({"error":{"error": "error from blockbook"}});
          })
        };
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        request: statusPage,
        client: BlockHash,
      });

      be.getBlockchainHeight((err, height, hash) => {
        should.exist(err);
        err.message.should.equal('error from blockbook');
        done();
      });
    });
  });

  describe('#getTxidsInBlock', () => {
    it('should return empty array on no txs', (done) => {
      let fakeRequest = {
        get: sinon.stub().resolves(JSON.stringify(BB_BLOCK)),
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        request: fakeRequest,
      });

      be.getTxidsInBlock('hash', (err, result) => {
        should.not.exist(err);
        result.length.should.equal(0);
        done();
      });
    });

    it('should fail on invalid JSON', (done) => {
      const fakeRequest = {
        get: sinon.stub().resolves('invalid json'),
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        addressFormat: null,
        request: fakeRequest
      });

      be.getTxidsInBlock('hash', (err, result) => {
        should.exist(err);
        err.toString().should.equal('Error: Could not get height from block explorer');
        done();
      });
    });

    it('should return 3 txs by txid', (done) => {
      let block = _.clone(BB_BLOCK);
      block.txs.push(_.clone(BB_TX_IN_BLOCK));
      block.txs.push(_.clone(BB_TX_IN_BLOCK));
      block.txs.push(_.clone(BB_TX_IN_BLOCK));
      block.txs[0].txid = 'txid0';
      block.txs[1].txid = 'txid1';
      block.txs[2].txid = 'txid2';
      let fakeRequest = {
        get: sinon.stub().resolves(JSON.stringify(block)),
      };

      var be = new V8({
        coin: 'btc',
        network: 'livenet',
        url: 'http://dummy/',
        apiPrefix: 'dummyPath',
        userAgent: 'testAgent',
        request: fakeRequest,
      });

      be.getTxidsInBlock('hash', (err, result) => {
        should.not.exist(err);
        result.length.should.equal(3);
        result[0].should.equal('txid0');
        result[1].should.equal('txid1');
        result[2].should.equal('txid2');
        done();
      });
    });
  });

  describe('blockbook unavailable (status page on generic API call)', () => {
    class SyncReply {
      _syncPromise() {
        return new Promise(function (resolve) {
          resolve(bbStatusPage);
        })
      }
      // list of client calls
      getCoins() {return this._syncPromise();};
      getBalance() {return this._syncPromise();};
      getCoinsForTx() {return this._syncPromise();};
      broadcast() {return this._syncPromise();};
      getTx() {return this._syncPromise();};
      getAddressTxos() {return this._syncPromise();};
      listTransactions() {return this._syncPromise();};
      getBlockHash() {return this._syncPromise();};
      getBlockLight() {return this._syncPromise();};
      getConnectionCount() {return this._syncPromise();};
      getPeerInfo() {return this._syncPromise();};
    };
    const errorMessage = 'Error: Blockbook is unavailable, it may be syncing';
    let fakeRequest = {
      get: sinon.stub().resolves(JSON.stringify(bbStatusPage)),
    };
    let emptyJson = {
      get: sinon.stub().resolves('{}'),
    };
    const be = new V8({
      coin: 'btc',
      network: 'livenet',
      url: 'http://dummy/',
      apiPrefix: 'dummyPath',
      userAgent: 'testAgent',
      client: SyncReply,
      request: fakeRequest
    });
    const be2 = new V8({
      coin: 'btc',
      network: 'livenet',
      url: 'http://dummy/',
      apiPrefix: 'dummyPath',
      userAgent: 'testAgent',
      request: emptyJson
    });
    it('should fail on getBalance when unavailable', (done) => {
      be.getBalance(wallet, (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getUtxos when unavailable', (done) => {
      be.getUtxos(wallet, 'height', 'pubkey', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getCoinsForTx when unavailable', (done) => {
      be.getCoinsForTx('tx', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on broadcast when unavailable', (done) => {
      be.broadcast('rawtx', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getTransaction when unavailable', (done) => {
      be.getTransaction('tx', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getTransactionBlockbookOutput when unavailable', (done) => {
      be.getTransactionBlockbookOutput('tx', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getAddressUtxos when unavailable', (done) => {
      be.getAddressUtxos('addr', 'h', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getTransactions when unavailable', (done) => {
      be.getTransactions(wallet, 'pubkey', 'startblock', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getAddressActivity when unavailable', (done) => {
      be.getAddressActivity('addr', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getTransactionCount when unavailable', (done) => {
      be.getTransactionCount('addr', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on estimateFee when unavailable', (done) => {
      be.estimateFee([5], (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getBlockchainHeight when unavailable', (done) => {
      be2.getBlockchainHeight((err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getTxidsInBlock when unavailable', (done) => {
      be.getTxidsInBlock('block', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getBlockHash when unavailable', (done) => {
      be.getBlockHash('block', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getBlockLight when unavailable', (done) => {
      be.getBlockLight('block', (err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getConnectionCount when unavailable', (done) => {
      be.getConnectionCount((err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
    it('should fail on getPeerInfo when unavailable', (done) => {
      be.getPeerInfo((err, reply) => {
        should.exist(err);
        err.toString().should.equals(errorMessage);
        done();
      });
    });
  });
});
