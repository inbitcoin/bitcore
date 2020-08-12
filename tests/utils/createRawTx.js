var bitcoinjs = require('bitcoinjs-lib');
var bitcore = require('bitcore-lib');

var HDPrivateKey = bitcore.HDPrivateKey;
var regtest = bitcoinjs.networks.regtest;


var cmdArgs = process.argv.splice(process.execArgv.length + 2);
if (cmdArgs.length != 4) {
    console.log('ERR you must provide 4 params: bwsUtxo, output, xPrivKey, inputTxHex');
    process.exit(1);
}
var bwsUtxo = JSON.parse(cmdArgs[0]);
var output = JSON.parse(cmdArgs[1]);
var xPrivKey = cmdArgs[2];
var inputTxHex = cmdArgs[3];

var input = {
    hash: bwsUtxo.txid,
    index: bwsUtxo.vout,
    nonWitnessUtxo: Buffer.from(inputTxHex, 'hex')
};
var psbt = new bitcoinjs.Psbt({ network: regtest });
psbt.addInput(input);
psbt.addOutput(output);

var hdPrivateKey = new HDPrivateKey(xPrivKey, 'testnet');
var derived = hdPrivateKey.deriveChild(bwsUtxo.fullPath);
// currently there's no way to create a testnet/regtest PrivateKey with
// bitcore-lib, hence removed network param from 'fromWIF' call
var key = bitcoinjs.ECPair.fromWIF(derived.privateKey.toWIF());
psbt.signInput(0, key);
psbt.validateSignaturesOfInput(0);
psbt.finalizeAllInputs();

var signedRawTx = psbt.extractTransaction().toHex();
console.log(signedRawTx);
