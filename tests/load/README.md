# bws load tests

## Setup

Before running a test:
- follow [tests instructions](/tests/README.md)
- create as many wallets as you need by running: `./create_wlts.sh <num_wlts>`


## Run

Run a test with:
```bash
./tests/<test_name>.sh [opts]
```

Wallets report and services logs will be saved in `./reports`.


## Available tests

- `balance.sh <num_wlts> <num_calls>`
- `bb_xpub.sh <num_wlts> <num_calls>`
- `broadcast_raw.sh <num_wlts> <num_calls>`
- `btc_txs.sh <num_wlts>`
- `btc_txs_many_moves.sh <num_wlts> <num_calls>`
- `feelevels.sh <num_wlts> <num_calls>`
- `get_addresses.sh <num_wlts> <num_calls>`
- `notifications.sh <num_wlts> <num_calls>`
- `post_addresses.sh <num_wlts> <num_calls>`
- `scan.sh <num_wlts> <num_calls>`
- `txhistory.sh <num_wlts> <num_calls>`
- `txnotes.sh <num_wlts> <num_calls>`
- `utxos.sh <num_wlts> <num_calls>`
- `wallets.sh <num_wlts> <num_calls>`
