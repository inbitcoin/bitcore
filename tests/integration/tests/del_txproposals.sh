#!/bin/bash

# exported variables:
    # mandatory: txp_id
# arguments:

. ./tests/common.sh

test_header="testing DELETE /v1/txproposals/:id/ ... "
echo -n "${test_header}"

report_basename="deltxproposals"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/del_txproposals.sh"
loop_msg="requesting deletion of txproposal of wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${txp_id}"
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    [ "$(jq 'has("success")' ${wlt_file})" == "true" ] || handle_error
    [ "$(jq '.success' ${wlt_file})" == "true" ] || handle_error

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
