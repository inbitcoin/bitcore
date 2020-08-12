#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_calls="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"
wlt_report="${report_dir}/${wlt_name}"

get_x_priv_key

[ ! -z "${DISABLE_SYNC_WAIT}" ] || wait_to_start

i=1
if [ ! -f "${wlt_report}" ]; then
    echo "No report file found, skipping broadcast" >> ${wlt_report}.err
    err="true"
else
    for i in $(seq 1 ${num_calls}); do
        url="/v1/utxos/"
        http_method=${GET}
        call_bws
        [ "${err}" == "true" ] && break
        input=$(jq -r 'map(select(.locked==false))' ${OUTPUT_FILE} | jq -r 'max_by(.satoshis)')

        url="/v4/addresses/"
        req_args='{"ignoreMaxGap": true}'
        http_method=${POST}
        call_bws
        [ "${err}" == "true" ] && break
        addr=$(jq -r '.address' ${OUTPUT_FILE})

        let amt=$(jq '.satoshis' <<< ${input})-7460
        output="{\"address\": \"${addr}\", \"value\": ${amt}}"

        input_txid=$(jq -r '.txid' <<< ${input})
        input_tx_hex=$(${BITCOIN_CLI} getrawtransaction ${input_txid})

        raw_tx=$(node ${UTILS_DIR}/createRawTx.js "${input}" "${output}" "${x_priv_key}" "${input_tx_hex}")

        url="/v1/broadcast_raw/"
        req_args="{\"rawTx\": \"${raw_tx}\", \"network\": \"testnet\"}"
        http_method=${POST}
        call_bws
        txid=$(jq -r '.' ${OUTPUT_FILE})
        check_txid
        if [ "${err}" == "true" ]; then
            write_output
        else
            echo ${txid} >> ${wlt_report}
        fi

        [ "${err}" != "true" ] && wait_block
    done
fi

if [ "${err}" == "true" ]; then
    # summing 1 since last round hasn't called wait_block
    let rounds_left=${num_calls}-${i}+1
    for i in $(seq 1 ${rounds_left}); do
        sleep 5
        wait_block
    done
    [ -f "${wlt_report}" ] && mv ${wlt_report}{,.err}
fi
