#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
addr="${2}"
num_wlt="${3}"

wlt_name="wlt_${num_wlt}"
wlt_report="${report_dir}/${wlt_name}"

get_req_priv_key

[ ! -z "${DISABLE_SYNC_WAIT}" ] || wait_to_start

if [ ! -f "${wlt_report}" ]; then
    echo "No report file found, skipping send" >> ${wlt_report}.err
    exit 1
fi

amt="936700"

url="/v3/txproposals/"
req_args=$(echo \
    "{\"outputs\": [{\"toAddress\": \"${addr}\", \"amount\": ${amt}}]," \
    "\"feePerKb\": 10000}"
)
http_method=${POST}
call_bws
write_output
if [ "${err}" == "true" ]; then
    [ -f "${wlt_report}" ] && mv ${wlt_report}{,.err}
    exit 1
fi
txp=$(jq '.' ${OUTPUT_FILE})
txp_id=$(jq -r '.id' ${OUTPUT_FILE})

url="/v2/txproposals/${txp_id}/publish/"
http_method=${POST}
proposal_sig=$(node ${UTILS_DIR}/signMessage.js "txp" "${txp}" "${req_priv_key}")
req_args="{\"proposalSignature\": \"${proposal_sig}\"}"
call_bws
write_output
if [ "${err}" == "true" ]; then
    [ -f "${wlt_report}" ] && mv ${wlt_report}{,.err}
    exit 1
fi

key_data=$(jq -r '.key' ${WALLET_FILE})
signatures=$(node ${UTILS_DIR}/signMessage.js "publishedTxp" "${txp}" "${key_data}")
signatures=${signatures//\'/\"}
url="/v1/txproposals/${txp_id}/signatures/"
req_args="{\"signatures\": ${signatures}}"
http_method=${POST}
call_bws
write_output
if [ "${err}" == "true" ]; then
    [ -f "${wlt_report}" ] && mv ${wlt_report}{,.err}
    exit 1
fi

url="/v1/txproposals/${txp_id}/broadcast"
http_method=${POST}
call_bws
write_output
if [ "${err}" == "true" ]; then
    [ -f "${wlt_report}" ] && mv ${wlt_report}{,.err}
    exit 1
fi
