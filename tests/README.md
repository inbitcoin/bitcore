# bws tests

## Build

To build a docker image of this project, run:
```bash
docker build \
    --build-arg BISK_DEPLOY_KEY="$(cat secret)" \
    -t inbitcoin/bitcore-tests:0.1.0 .
```

**note**: in order to install biskli, you'll need access to a bisk ssh deploy
key (ask it to the project mantainer);
save it with the name `secret` in the same path of this README.


## Run

To run a test, you'll need a running colored coins stack and biskli installed.
From bisk, run:
```bash
BWS_VERSION=<bws_version_to_test> ./unix_make.sh colored_coins --stack=BWS_CI
./unix_make.sh install_cli
```


### Load tests

Load tests are located in the `load` directory, see its
[README](/tests/load/README.md) for more details.

### Integration tests

Integration tests are located in the `integration` directory, see its
[README](/tests/integration/README.md) for more details.
