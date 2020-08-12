var _ = require('lodash')
var bitcore = require('bitcore-lib');
var Client = require('bitcore-wallet-client/index').default

var HDPrivateKey = bitcore.HDPrivateKey;
var Key = Client.Key
var Utils = Client.Utils

const ROOT_PATH = "m/44'/1'/0'"


class MyUtils {

  static signRequest(method, url, args, privKey) {
    var message = [method.toLowerCase(), url, JSON.stringify(args)].join('|');
    return Utils.signMessage(message, privKey);
  }

}

var cmdArgs = process.argv.splice(process.execArgv.length + 2);

if (cmdArgs.length == 0) {
  console.log('ERR you must at least provide the type of the object to sign')
  process.exit(1)
}
const objToSign = cmdArgs.shift()

if (objToSign == "req") {
  if (cmdArgs.length != 4) {
    console.log('ERR you must provide 4 params: method, url, requestArgs, requestPrivKey')
    process.exit(1)
  }
  const method = cmdArgs[0]
  const url = cmdArgs[1]
  const requestArgs = JSON.parse(cmdArgs[2])
  const requestPrivKey = cmdArgs[3]
  signature = MyUtils.signRequest(method, url, requestArgs, requestPrivKey)
  console.log(signature)
}

if (objToSign == "txp") {
  if (cmdArgs.length != 2) {
    console.log('ERR you must provide 2 params: txp, requestPrivKey')
    process.exit(1)
  }
  const txp = JSON.parse(cmdArgs[0])
  const message = Client.getRawTx(txp)
  const requestPrivKey = cmdArgs[1]
  signature = Utils.signMessage(message, requestPrivKey)
  console.log(signature)
}

if (objToSign == "reqPubKey") {
  if (cmdArgs.length != 2) {
    console.log('ERR you must provide 2 params: xPrivKey, requestPubKey')
    process.exit(1)
  }
  const xPrivKey = cmdArgs[0]
  const requestPubKey = cmdArgs[1]
  var xPriv = new HDPrivateKey(xPrivKey).deriveChild(ROOT_PATH);
  var sig = Utils.signRequestPubKey(requestPubKey, xPriv);
  console.log(sig)
}

if (objToSign == "publishedTxp") {
  if (cmdArgs.length != 2) {
    console.log('ERR you must provide 2 params: txp, walletData')
    process.exit(1)
  }
  const txp = JSON.parse(cmdArgs[0])
  const walletData = JSON.parse(cmdArgs[1])

  let key = new Key();
  _.each(Key.FIELDS, i => {
  if (!_.isUndefined(walletData[i])) {
    key[i] = walletData[i];
  }});
  key.use44forMultisig = walletData.n > 1 ? true : false;
  key.use0forBCH = walletData.use145forBCH ? false : walletData.coin == 'bch' ? true : false;
  key.BIP45 = walletData.derivationStrategy == 'BIP45';

  let signatures = key.sign(ROOT_PATH, txp);
  console.log(signatures)
}
