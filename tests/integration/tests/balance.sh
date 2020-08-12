#!/bin/bash

# exported variables:
# arguments:
    # optional: expected_balance

. ./tests/common.sh

test_header="testing GET /v1/balance/ ... "
echo -n "${test_header}"

expected_balance="${1}"

report_basename="balance"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/balance.sh"
loop_msg="requesting balance of wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${num_calls}"
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    declare -a mandatory_params
    mandatory_params=( totalAmount lockedAmount totalConfirmedAmount
        lockedConfirmedAmount availableAmount availableConfirmedAmount
        byAddress )
    for param in "${mandatory_params[@]}"; do
        [ "$(jq "has(\"${param}\")" ${wlt_file})" == "true" ] || handle_error
    done
    if [ -n "${expected_balance}" ]; then
        [ "$(jq '.totalAmount' ${wlt_file})" == "${expected_balance}" ] || handle_error
    fi

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
