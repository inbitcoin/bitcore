#!/bin/bash

# exported variables:
    # mandatory: addr
    # optional: fee, amt, inputs
# arguments:
    # optional: not_check_fee_per_kb

. ./tests/common.sh

test_header="testing POST /v3/txproposals/ ... "
echo -n "${test_header}"

not_check_fee_per_kb="${1}"

report_basename="posttxproposals"
gen_report_dir > /dev/null

fee=${fee:-"null"}
amt=${amt:-"null"}
inputs=${inputs:-"null"}

entrypoint="${UTILS_DIR}/post_txproposal.sh"
loop_msg="requesting creation of txproposal for wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} "${addr}" "${inputs}" "${fee}" "${amt}""
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    declare -a mandatory_params
    mandatory_params=( actions version id walletId creatorId coin network
        signingMethod changeAddress outputs outputOrder walletM walletN
        requiredSignatures requiredRejections status excludeUnconfirmedUtxos
        addressType amount inputs inputPaths fee nonce )
    for param in "${mandatory_params[@]}"; do
        [ "$(jq "has(\"${param}\")" ${wlt_file})" == "true" ] || handle_error
    done
    if [ -z "${not_check_fee_per_kb}" ]; then
        [ "$(jq 'has("feePerKb")' ${wlt_file})" == "true" ] || handle_error
    fi

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
