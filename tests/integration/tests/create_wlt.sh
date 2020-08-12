#!/bin/bash

# exported variables:
# arguments:

. ./tests/common.sh

test_header="testing POST /v2/wallets/ and POST /v2/wallets/:id/copayers/ ... "
echo -n "${test_header}"

report_basename="createwlts"
gen_report_dir > /dev/null

starting_wlt=1
ending_wlt=1

entrypoint="${UTILS_DIR}/create_wlts.sh"
loop_msg="creating ${num_wlts} wallet"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${starting_wlt} ${ending_wlt}"
num_wlts="1"  # to make 'call_cmd_base' use a single container
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    [ "$(ls ./wallets/wlt_*.dat 2> /dev/null | wc -l)" == "${num_wlts}" ] || \
        handle_error

    creation="$(sed '1q;d' ${wlt_file})"
    [ "$(jq 'has("walletId")' <<< ${creation})" == "true" ] || handle_error
    wallet_id="$(jq -r '.walletId' <<< ${creation})"
    check_uuid "${wallet_id}"
    [ "${err}" == "true" ] && handle_error

    join="$(sed '2q;d' ${wlt_file})"
    declare -a mandatory_params
    mandatory_params=( copayerId wallet )
    for param in "${mandatory_params[@]}"; do
        [ "$(jq "has(\"${param}\")" <<< ${join})" == "true" ] || handle_error
    done

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
