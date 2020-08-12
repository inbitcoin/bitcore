#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
starting_wlt="${2}"
ending_wlt="${3}"

wlt_name="wlt_1"  # to make 'wait_to_start' touch file correctly
[ ! -z "${DISABLE_SYNC_WAIT}" ] || wait_to_start

for i in $(seq ${starting_wlt} ${ending_wlt}); do
    num_wlt="${i}"
    wlt_name="wlt_${num_wlt}"
    wallet_dat="${WLTS_DIR}/${wlt_name}.dat"
    wlt_report="${report_dir}/wlt_${num_wlt}"

    create_wlt_data="$(node ${UTILS_DIR}/createWlt.js "create" "${wlt_name}")"
    jq -c '.walletData' <<< ${create_wlt_data} > ${wallet_dat}

    url="/v2/wallets/"
    req_args="$(jq '.args' <<< ${create_wlt_data})"
    http_method=${POST}
    call_bws 1  # unauthenticated call
    save_and_parse_output
    [ "${err}" == "true" ] && break

    wallet_id=$(jq -r '.walletId' ${OUTPUT_FILE})
    url="/v2/wallets/${wallet_id}/copayers/"
    req_args="$(node ${UTILS_DIR}/createWlt.js "join" "${wlt_name}" "${wallet_id}" "${create_wlt_data}")"
    http_method=${POST}
    call_bws 1  # unauthenticated call
    save_and_parse_output
    [ "${err}" == "true" ] && break
done
