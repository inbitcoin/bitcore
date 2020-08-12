#!/bin/bash

# exported variables:
# arguments:
    # mandatory: txp_status

. ./tests/common.sh

test_header="testing GET /v2/txproposals/ ... "
echo -n "${test_header}"

txp_status="${1}"

report_basename="gettxproposals"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/get_txproposals.sh"
loop_msg="inspecting txproposal of wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir}"
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    declare -a mandatory_params
    mandatory_params=( actions version createdOn id walletId creatorId coin
        network outputs amount message payProUrl changeAddress inputs walletM
        walletN requiredSignatures requiredRejections status txid broadcastedOn
        inputPaths outputOrder fee feeLevel feePerKb excludeUnconfirmedUtxos
        addressType customData proposalSignature signingMethod
        proposalSignaturePubKey proposalSignaturePubKeySig lockUntilBlockHeight
        gasPrice from nonce gasLimit data tokenAddress destinationTag invoiceID
        derivationStrategy creatorName deleteLockTime )
    for param in "${mandatory_params[@]}"; do
        [ "$(jq "max_by(.createdOn) | has(\"${param}\")" ${wlt_file})" == "true" ] || handle_error
    done
    if [ "${txp_status}" == "accepted" ]; then
        [ "$(jq 'max_by(.createdOn) | has("raw")' ${wlt_file})" == "true" ] || handle_error
        [ "$(jq 'max_by(.createdOn).status == "accepted"' ${wlt_file})" == "true" ] || handle_error
    fi
    if [ "${txp_status}" == "pending" ]; then
        [ "$(jq 'max_by(.createdOn).status == "pending"' ${wlt_file})" == "true" ] || handle_error
    fi

    log_success
fi

if [ -f "${wlt_file}.err" ]; then
    output=$(cat ${wlt_file}.err)
    handle_error
fi

handle_unexpected_error
