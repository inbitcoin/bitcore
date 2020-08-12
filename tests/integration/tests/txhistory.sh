#!/bin/bash

# exported variables:
# arguments:

. ./tests/common.sh

test_header="testing GET /v1/txhistory/ ... "
echo -n "${test_header}"

report_basename="txhistory"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/txhistory.sh"
loop_msg="requesting txhistory of wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${num_calls}"
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    declare -a mandatory_params
    mandatory_params=( id txid confirmations blockheight fees time amount
        action outputs )
    for param in "${mandatory_params[@]}"; do
        [ "$(jq "all(has(\"${param}\"))" ${wlt_file})" == "true" ] || handle_error
    done
    [ "$(jq 'map(select(.action=="sent")) | all(.addressTo != null)' ${wlt_file})" == "true" ] || \
        handle_error
    [ "$(jq 'map(select(.action=="moved")) | all(.addressTo == null)' ${wlt_file})" == "true" ] || \
        handle_error
    [ "$(jq 'map(select(.action=="received")) | any(has("addressTo")) | not' ${wlt_file})" == "true" ] || \
        handle_error
    [ "$(jq -r 'map(select(has("proposalId"))) | all(has("createdOn"))' ${wlt_file})" == "true" ] || \
        handle_error
    [ "$(jq -r 'map(select(has("proposalId"))) | all(has("creatorName"))' ${wlt_file})" == "true" ] || \
        handle_error
    [ "$(jq -r 'map(select(has("proposalId"))) | all(has("message"))' ${wlt_file})" == "true" ] || \
        handle_error
    [ "$(jq -r 'map(select(has("proposalId"))) | all(has("actions"))' ${wlt_file})" == "true" ] || \
        handle_error
    [ "$(jq -r 'map(select(has("proposalId"))) | all(has("customData"))' ${wlt_file})" == "true" ] || \
        handle_error

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
