#!/bin/bash

# exported variables:
# arguments:

. ./tests/common.sh

test_header="testing GET /v1/sendmaxinfo/ ... "
echo -n "${test_header}"

report_basename="sendmaxinfo"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/sendmaxinfo.sh"
loop_msg="requesting sendmaxinfo of wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir}"
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    declare -a mandatory_params
    mandatory_params=( size amount fee feePerKb inputs utxosBelowFee
        amountBelowFee utxosAboveMaxSize amountAboveMaxSize )
    for param in "${mandatory_params[@]}"; do
        [ "$(jq "has(\"${param}\")" ${wlt_file})" == "true" ] || handle_error
    done

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
