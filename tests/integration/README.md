# bws integration tests

## Setup

Before running the tests:
- follow [tests instructions](/tests/README.md)


## Run

Start integration tests by running:
```bash
./start_tests.sh
```

Wallet report and services logs will be saved in `./reports`.


## Tested APIs

### DELETE

- `/v1/txproposals/:id/`

### GET

- `/v1/addresses/`
- `/v1/balance/`
- `/v1/notifications/`
- `/v1/sendmaxinfo/`
- `/v1/txhistory/`
- `/v1/txnotes/:txid/`
- `/v1/txnotes/`
- `/v1/utxos/`
- `/v1/version/`
- `/v2/feelevels/`
- `/v2/txproposals/`
- `/v3/wallets/`

### POST

- `/v1/addresses/scan/`
- `/v1/broadcast_raw/`
- `/v1/txproposals/:id/broadcast/`
- `/v1/txproposals/:id/signatures/`
- `/v2/txproposals/:id/publish/`
- `/v2/wallets/:id/copayers/`
- `/v2/wallets/`
- `/v3/txproposals/`
- `/v4/addresses/`

### PUT

- `/v1/copayers/:id/`
- `/v1/txnotes/:txid/`
