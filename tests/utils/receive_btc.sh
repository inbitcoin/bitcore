#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_wlt="${2}"

wlt_name="wlt_${num_wlt}"
export WALLET_FILE="${WLTS_DIR}/${wlt_name}.dat"
wlt_report="${report_dir}/${wlt_name}"

amt="0.01"

url="/v4/addresses/"
req_args='{"ignoreMaxGap": true}'
http_method=${POST}
call_bws
[ "${err}" == "true" ] && break
addr=$(jq -r '.address' ${OUTPUT_FILE})
check_addr
echo ${addr} >> ${wlt_report}

[ ! -z "${DISABLE_SYNC_WAIT}" ] || wait_to_start

if [ "${err}" == "true" ]; then
    mv ${wlt_report}{,.err}
    exit 1
fi

txid="$(biskli --rpcserver=bisk send "${addr}" "${amt}")"
res="$?"
echo "biskli send OUTPUT: ${txid}"
if [ "${res}" == 0 ] && [[ ! "${txid}" =~ "StatusCode" ]]; then
    txid="$(jq -r '.txid' <<< ${txid})"
    check_txid
else
    err="true"
fi
echo ${txid} >> ${wlt_report}

if [ "${err}" == "true" ]; then
    mv ${wlt_report}{,.err}
    exit 1
fi
