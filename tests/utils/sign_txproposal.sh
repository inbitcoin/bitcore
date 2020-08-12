#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
txp="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"
wlt_report="${report_dir}/${wlt_name}"

txp_id=$(jq -r '.id' <<< ${txp})
WALLET_FILE="${WLTS_DIR}/${wlt_name}.dat"
key_data=$(jq '.key' ${WALLET_FILE})
signatures=$(node ${UTILS_DIR}/signMessage.js "publishedTxp" "${txp}" "${key_data}")
signatures=${signatures//\'/\"}

url="/v1/txproposals/${txp_id}/signatures/"
req_args="{\"signatures\": ${signatures}}"
http_method=${POST}
sign_wait_report
