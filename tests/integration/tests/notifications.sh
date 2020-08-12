#!/bin/bash

. ./tests/common.sh

# exported variables:
# arguments:

test_header="testing POST /v1/login/ and GET /v1/notifications/ ... "
echo -n "${test_header}"

report_basename="notifications"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/notifications.sh"
loop_msg="getting notifications for wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${num_calls}"
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    login="$(sed '1q;d' ${wlt_file})"
    login_id="$(jq -r '.' <<< ${login})"
    check_uuid "${login_id}"
    [ "${err}" == "true" ] && handle_error

    notifications=$(sed '2q;d' ${wlt_file})
    jq '.' <<< ${notifications} > /dev/null 2>&1 || handle_error
    declare -a mandatory_params
    mandatory_params=( version createdOn id type data walletId creatorId )
    for param in "${mandatory_params[@]}"; do
        [ "$(jq "all(has(\"${param}\"))" <<< ${notifications})" == "true" ] || \
            handle_error
    done
    declare -a new_copayer_data
    new_copayer_data=( walletId copayerId copayerName )
    for param in "${new_copayer_data[@]}"; do
		[ "$(jq -r "map(select(.type==\"NewCopayer\")) | map(.data) | all(has(\"${param}\"))" <<< ${notifications} )" == "true" ] || \
			handle_error
	done
    declare -a new_address_data
    new_address_data=( address )
    for param in "${new_address_data[@]}"; do
		[ "$(jq -r "map(select(.type==\"NewAddress\")) | map(.data) | all(has(\"${param}\"))" <<< ${notifications} )" == "true" ] || \
			handle_error
	done
    declare -a new_txp_data
    new_txp_data=( txProposalId creatorId amount message )
    for param in "${new_txp_data[@]}"; do
		[ "$(jq -r "map(select(.type==\"NewTxProposal\")) | map(.data) | all(has(\"${param}\"))" <<< ${notifications} )" == "true" ] || \
			handle_error
	done
    declare -a txp_accepted_data
    txp_accepted_data=( txProposalId creatorId amount message copayerId )
    for param in "${txp_accepted_data[@]}"; do
		[ "$(jq -r "map(select(.type==\"TxProposalAcceptedBy\")) | map(.data) | all(has(\"${param}\"))" <<< ${notifications} )" == "true" ] || \
			handle_error
	done
    declare -a txp_finally_accepted_data
    txp_finally_accepted_data=( txProposalId creatorId amount message )
    for param in "${txp_finally_accepted_data[@]}"; do
		[ "$(jq -r "map(select(.type==\"TxProposalFinallyAccepted\")) | map(.data) | all(has(\"${param}\"))" <<< ${notifications} )" == "true" ] || \
			handle_error
	done
    declare -a incoming_tx_data
	incoming_tx_data=( txid address amount tokenAddress )
    for param in "${incoming_tx_data[@]}"; do
		[ "$(jq -r "map(select(.type==\"NewIncomingTx\")) | map(.data) | all(has(\"${param}\"))" <<< ${notifications} )" == "true" ] || \
			handle_error
	done
    declare -a outgoing_tx_data
	outgoing_tx_data=( txProposalId creatorId amount message txid )
    for param in "${outgoing_tx_data[@]}"; do
		[ "$(jq -r "map(select(.type==\"NewOutgoingTx\")) | map(.data) | all(has(\"${param}\"))" <<< ${notifications} )" == "true" ] || \
			handle_error
	done

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
