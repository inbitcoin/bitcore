# REST API

## Enabled APIs

### GET

* `/v1/addresses/`
* `/v1/balance/`
* `/v1/notifications/`
* `/v1/sendmaxinfo/`
* `/v1/txhistory/`
* `/v1/txnotes/:txid/`
* `/v1/txnotes/`
* `/v1/utxos/`
* `/v1/version/`
* `/v2/feelevels/`
* `/v2/txproposals/`
* `/v3/wallets/`

### POST

* `/v1/addresses/scan/`
* `/v1/broadcast_raw/`
* `/v1/txproposals/:id/broadcast/`
* `/v1/txproposals/:id/signatures/`
* `/v2/txproposals/:id/publish/`
* `/v2/wallets/:id/copayers/`
* `/v2/wallets/`
* `/v3/txproposals/`
* `/v4/addresses/`

### PUT

* `/v1/copayers/:id/`
* `/v1/txnotes/:txid/`

### DELETE

* `/v1/txproposals/:id/`


Note: all currency amounts are in units of satoshis (1/100,000,000 of a bitcoin).

For a complete list of available APIs see below.

## Authentication

In order to access a wallet, clients are required to send the headers:

```sh
  x-identity
  x-signature
```

Identity is the Peer-ID, this will identify the peer and its wallet. Signature is the current request signature, using `requestSigningKey`, the `m/1/1` derivative of the Extended Private Key.

See [Bitcore Wallet Client](/packages/bitcore-wallet-client) for implementation details.

## GET Endpoints

### `/v1/addresses/`: Get Wallet's main addresses (does not include change addresses)

Optional Arguments:

- ignoreMaxGap: [false] Ignore checking less that 20 unused addresses (BIP44 GAP)

Returns:

- List of [Addresses object](/packages/bitcore-wallet-service/src/lib/model/address.ts). This call is mainly provided so the client check this addresses for incoming transactions (using a service like [Insight](https://insight.bitcore.io)
- Returns cashaddr without prefix for BCH

### `/v1/balance/`: Get Wallet's balance

Returns:

- totalAmount: Wallet's total balance
- lockedAmount: Current balance of outstanding transaction proposals, that cannot be used on new transactions.
- availableAmount: Funds available for new proposals.
- totalConfirmedAmount: Same as totalAmount for confirmed UTXOs only.
- lockedConfirmedAmount: Same as lockedAmount for confirmed UTXOs only.
- availableConfirmedAmount: Same as availableAmount for confirmed UTXOs only.
- byAddress array ['address', 'path', 'amount']: A list of addresses holding funds.
- totalKbToSendMax: An estimation of the number of KiB required to include all available UTXOs in a tx (including unconfirmed).

### `/v1/notifications/`: Get wallet's latest notifications

### `/v1/sendmaxinfo/`: Get wallet's send max information

### `/v1/txhistory/`: Get Wallet's transaction history

**inbitcoin change**: added workaround to pass txis as a string on limit param

Optional Arguments:

- skip: Records to skip from the result (defaults to 0)
- limit: Total number of records to return (return all available records if not specified).

Returns:

- History of incoming and outgoing transactions of the wallet. The list is paginated using the `skip` & `limit` params. Each item has the following fields:
- action ('sent', 'received', 'moved')
- amount
- fees
- time
- addressTo
- confirmations
- proposalId
- creatorName
- message
- actions array ['createdOn', 'type', 'copayerId', 'copayerName', 'comment']

### `/v1/txnotes/:txid/`: Get user notes associated to the specified transaction

Returns:

- The note associated to the `txid` as a string.

### `/v1/txnotes/`: Get all wallet's notes edited after the specified date

### `/v1/utxos/`: Get wallet's UTXOs

### `/v1/version/`: Get service version

### `/v2/feelevels/`: Get current fee levels for the specified network

### `/v2/txproposals/`: Get Wallet's pending transaction proposals and their status

Returns:

- List of pending TX Proposals. (see [fields on the source code](/packages/bitcore-wallet-service/src/lib/model/txproposal.ts))

- Uses cashaddr without prefix for BCH

### `/v3/wallets/`: Get wallet information

Returns:

- Wallet object. (see [fields on the source code](/packages/bitcore-wallet-service/src/lib/model/wallet.ts)).

## disabled GET Endpoints

### `/latest-version/`

### `/v1/fiatrates/:code/`: Get the fiat rate for the specified ISO 4217 code

### `/v2/fiatrates/:code/`

Optional Arguments:

- provider: An identifier representing the source of the rates.
- ts: The timestamp for the fiat rate (defaults to now).

Returns:

- The fiat exchange rate.

### `/v1/preferences/`: Get copayer preferences

### `/v1/wallets/`: deprecated

### `/v2/wallets/`: deprecated

### `/v1/wallets/:identifier/`: Retrieves a wallet from storage

### `/v1/feelevels/`: deprecated

### `/v1/txproposals/`: deprecated

### `/v1/txproposals/:id/`: Retrieves a tx from storage

### `/v1/stats/`: Get stats on new wallets and tx proposals

### `/v1/service/simplex/events`

### `/v1/txcoins/`

### `/v1/blockhash/:height/` (inbitcoin, rainboh-bee only): Get block hash from block height

### `/v1/blockcount/` (inbitcoin, rainboh-bee only): Get last block txs

### `/v1/blocklight/:hash/` (inbitcoin, rainboh-bee only): Get block from hash without txs

### `/v1/connectioncount/` (inbitcoin, rainboh-bee only): Get connection count

### `/v1/peerinfo/` (inbitcoin, rainboh-bee only): Get peer info


## POST Endpoints

### `/v1/addresses/scan`: Start an address scan process looking for activity.

Optional Arguments:

- includeCopayerBranches: Scan all copayer branches following BIP45 recommendation (defaults to false).

### `/v1/broadcast_raw/` (inbitcoin): Broadcasts a raw tx on the specified network

### `/v1/txproposals/:id/broadcast/`: Broadcast a transaction proposal

Returns:

- TX Proposal object. (see [fields on the source code](/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)). `.status` is probably needed in this case.

### `/v1/txproposals/:id/signatures/`: Sign a transaction proposal

Required Arguments:

- signatures: All Transaction's input signatures, in order of appearance.

Returns:

- TX Proposal object. (see [fields on the source code](/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)). `.status` is probably needed in this case.


### `/v2/txproposals/:id/publish/`: Publish the previously created `temporary` tx proposal

Returns:

- TX Proposal object. (see [fields on the source code](/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)).

### `/v2/wallets/:id/copayers/`: Join a Wallet in creation

Required Arguments:

- walletId: Id of the wallet to join
- name: Copayer Name
- xPubKey - Extended Public Key for this copayer.
- requestPubKey - Public Key used to check requests from this copayer.
- copayerSignature - Signature used by other copayers to verify that the copayer joining knows the wallet secret.

Returns:

- copayerId: Assigned ID of the copayer (to be used on x-identity header)
- wallet: Object with wallet's information

### `/v2/wallets/`: Create a new Wallet

Required Arguments:

- name: Name of the wallet
- m: Number of required peers to sign transactions
- n: Number of total peers on the wallet
- pubKey: Wallet Creation Public key to check joining copayer's signatures (the private key is unknown by BWS and must be communicated
  by the creator peer to other peers).

Returns:

- walletId: Id of the new created wallet

### `/v3/txproposals/`: Add a new temporary transaction proposal

Required Arguments:

- toAddress: RCPT Bitcoin address.
- amount: amount (in satoshis) of the mount proposed to be transfered
- proposalsSignature: Signature of the proposal by the creator peer, using proposalSigningKey.
- (opt) message: Encrypted private message to peers.
- (opt) payProUrl: Paypro URL for peers to verify TX
- (opt) feePerKb: Use an alternative fee per KB for this TX.
- (opt) excludeUnconfirmedUtxos: Do not use UTXOs of unconfirmed transactions as inputs for this TX.
- BCH addresses need to be cashaddr without prefix.

Returns:

- TX Proposal object. (see [fields on the source code](/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)). `.id` is probably needed in this case.

### `/v4/addresses/`: Request a new main address from wallet . (creates an address on normal conditions)

Returns:

- Address object: (/packages/bitcore-wallet-service/src/lib/model/address.ts). Note that `path` is returned so client can derive the address independently and check server's response.

## disabled POST Endpoints

### `/v1/login/`: Obtain a valid session token

### `/v1/txproposals/:id/rejections`: Reject a transaction proposal
Returns:
- TX Proposal object. (see [fields on the source code](/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)). `.status` is probably needed in this case.

### `/v1/txconfirmations/`: Subscribe to receive push notifications when the specified transaction gets confirmed
Required Arguments:
- txid: The transaction to subscribe to.

### `/v1/txproposals/:id/publish/`: deprecated

### `/v1/logout/`: Unimplemented

### `/v1/wallets/`: deprecated

### `/v1/wallets/:id/copayers/`: deprecated

### `/v1/txproposals/`: deprecated

### `/v2/txproposals/`: deprecated

### `/v1/addresses/`: deprecated

### `/v2/addresses/`: deprecated

### `/v3/addresses/`: deprecated

### `/v1/service/simplex/quote`

### `/v1/service/simplex/paymentRequest`

### `/v3/estimateGas/`

### `/v2/txproposals/:id/signatures`

## PUT Endpoints

### `/v1/copayers/:id/`: Adds access to a given copayer

### `/v1/txnotes/:txid/`: Modify a note for a tx

## disabled PUT Endpoints

### `/v1/preferences/`: Save copayer preferences for the current wallet/copayer pair

## DELETE Endpoints

### `/v1/txproposals/:id/`: Deletes a transaction proposal. Only the creator can delete a TX Proposal, and only if it has no other signatures or rejections

Returns:

- TX Proposal object. (see [fields on the source code](/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)). `.id` is probably needed in this case.

## disabled DELETE Endpoints

### `/v1/txconfirmations/:txid`: Unsubscribe from transaction `txid` and no longer listen to its confirmation


# Push Notifications (all disabled)

Recomended to complete config.js file:

- [FCM documentation](https://firebase.google.com/docs/cloud-messaging/)
- [Apple's Notification](https://developer.apple.com/documentation/usernotifications)

## disabled POST Endpoints

### `/v1/pushnotifications/subscriptions/`: Adds subscriptions for push notifications service at database

## disabled DELETE Endpoints

### `/v1/pushnotifications/subscriptions/`: Remove subscriptions for push notifications service from database

### `/v2/pushnotifications/subscriptions/:token`: Remove subscriptions for push notifications service from database
