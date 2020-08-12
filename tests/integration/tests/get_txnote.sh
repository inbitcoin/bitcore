#!/bin/bash

# exported variables:
    # mandatory: txid
# arguments:

. ./tests/common.sh

test_header="testing GET /v1/txnotes/:txid/ ... "
echo -n "${test_header}"

report_basename="gettxnote"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/get_txnote.sh"
loop_msg="getting note associated to a tx of wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} "${txid}""
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    declare -a mandatory_params
    mandatory_params=( version createdOn walletId txid body editedOn editedBy
        editedByName )
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
