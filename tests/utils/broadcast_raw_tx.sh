#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
addr="${2}"
inputs="${3}"
num_wlt="${4}"
wlt_name="wlt_${num_wlt}"
wlt_report="${report_dir}/${wlt_name}"

get_x_priv_key

input="$(jq '.[0]' <<< ${inputs})"
let amt=$(jq '.satoshis' <<< ${input})-7460
output="{\"address\": \"${addr}\", \"value\": ${amt}}"

input_txid=$(jq -r '.txid' <<< ${input})
input_tx_hex=$(${BITCOIN_CLI} getrawtransaction ${input_txid})

raw_tx=$(node ${UTILS_DIR}/createRawTx.js "${input}" "${output}" "${x_priv_key}" "${input_tx_hex}")

url="/v1/broadcast_raw/"
req_args="{\"rawTx\": \"${raw_tx}\", \"network\": \"testnet\"}"
http_method=${POST}

sign_wait_report
