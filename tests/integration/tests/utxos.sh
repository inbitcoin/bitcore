#!/bin/bash

# exported variables:
# arguments:

. ./tests/common.sh

test_header="testing GET /v1/utxos/ ... "
echo -n "${test_header}"

report_basename="utxos"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/utxos.sh"
loop_msg="requesting utxos of wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${num_calls}"
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    declare -a mandatory_params
    mandatory_params=( address satoshis amount fullPath scriptPubKey txid vout
        locked confirmations path addressIndex publicKeys )
    for param in "${mandatory_params[@]}"; do
        [ "$(jq "all(has(\"${param}\"))" ${wlt_file})" == "true" ] || handle_error
    done

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
