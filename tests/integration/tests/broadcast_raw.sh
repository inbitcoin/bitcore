#!/bin/bash

# exported variables:
	# mandatory: addr, inputs
# arguments:

. ./tests/common.sh

test_header="testing POST /v1/broadcast_raw/ ... "
echo -n "${test_header}"

report_basename="broadcastraw"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/broadcast_raw_tx.sh"
loop_msg="broadcasting raw tx from wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} "${addr}" "${inputs}""
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    txid=$(jq -r '.' ${wlt_file})
    check_txid ${txid}
    [ "${err}" == "true" ] && handle_error

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
