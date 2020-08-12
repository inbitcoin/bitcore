#!/bin/bash

# exported variables:
# arguments:

. ./tests/common.sh

test_header="testing PUT /v1/copayers/:id/ ... "
echo -n "${test_header}"

report_basename="addaccess"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/add_access.sh"
loop_msg="adds access to wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir}"
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    [ "$(jq 'has("wallet")' ${wlt_file})" == "true" ] || handle_error

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
