#!/bin/bash

# exported variables:
    # mandatory: txp_id
# arguments:

. ./tests/common.sh

test_header="testing POST /v1/txproposals/:id/broadcast/ ... "
echo -n "${test_header}"

report_basename="broadcasttxproposal"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/broadcast_txp.sh"
loop_msg="broadcasting txproposal of wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} "${txp_id}""
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
        derivationStrategy creatorName raw )
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
