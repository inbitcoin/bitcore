var bitcore = require('bitcore-lib')
var Client = require('bitcore-wallet-client/index').default

var Key = Client.Key
var PrivateKey = bitcore.PrivateKey
var Utils = Client.Utils


var cmdArgs = process.argv.splice(process.execArgv.length + 2);

if (cmdArgs.length == 0) {
  console.log('ERR you must at least provide the type of action to perform')
  process.exit(1)
}
const action = cmdArgs.shift()

const walletName = cmdArgs[0]
const copayerName = 'copayer_' + walletName
const coin = 'btc'
const network = 'testnet'
const account = 0
const m = 1
const n = 1
const useNativeSegwit = false


var client = new Client({
  baseUrl: process.env['BWS_HOST'],
  verbose: false,
  network
});

if (action == "create") {
  if (cmdArgs.length != 1) {
    console.log('ERR you must provide 1 param: walletName')
    process.exit(1)
  }

  const opts = {coin, network, account, n}

  let key = Key.create();
  let cred = key.createCredentials(null, opts);
  client.fromString(cred)  // sets credentials

  var walletPrivKey = new PrivateKey(network);

  var c = client.credentials;
  c.addWalletPrivateKey(walletPrivKey.toString());
  var encWalletName = Utils.encryptMessage(walletName, c.sharedEncryptingKey);

  var args = {
    name: encWalletName,
    m,
    n,
    pubKey: new PrivateKey(walletPrivKey).toPublicKey().toString(),
    coin,
    network,
    singleAddress: false,
    usePurpose48: n > 1,
    useNativeSegwit
  }

  var createWalletData = {
    args,
    walletData: {key: key.toObj(), cred: cred.toObj()},
    walletPrivKey
  }
  console.log(JSON.stringify(createWalletData))
}

if (action == "join") {
  if (cmdArgs.length != 3) {
    console.log('ERR you must provide 3 params: walletName, walletId, walletData')
    process.exit(1)
  }

  const walletId = cmdArgs[1]
  var createWalletData = JSON.parse(cmdArgs[2])

  const walletPrivKey = PrivateKey.fromObject(createWalletData.walletPrivKey)

  var cred = createWalletData.walletData.cred
  client.fromObj(cred)  // sets credentials

  var c = client.credentials;
  c.addWalletPrivateKey(walletPrivKey.toString());
  var encCopayerName = Utils.encryptMessage(copayerName, c.sharedEncryptingKey);
  c.addWalletInfo(walletId, walletName, m, n, copayerName, { useNativeSegwit });

  var xPubKey = c.xPubKey
  var requestPubKey = c.requestPubKey
  var args = {
    walletId,
    coin,
    name: encCopayerName,
    xPubKey,
    requestPubKey,
  };
  var hash = Utils.getCopayerHash(args.name, args.xPubKey, args.requestPubKey);
  args.copayerSignature = Utils.signMessage(hash, walletPrivKey);
  console.log(JSON.stringify(args))
}
