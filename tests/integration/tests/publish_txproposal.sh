#!/bin/bash

# exported variables:
    # mandatory: txp_id, txp
# arguments:

. ./tests/common.sh

test_header="testing POST /v2/txproposals/:id/publish/ ... "
echo -n "${test_header}"

report_basename="publishtxproposal"
gen_report_dir > /dev/null

entrypoint="${UTILS_DIR}/publish_txproposal.sh"
loop_msg="publishing txproposal of wallet n. %s"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} "${txp_id}" "${txp}""
call_and_track > /dev/null || handle_unexpected_error

wlt_file="${report_dir_host}/wlt_1"

if [ -f "${wlt_file}" ]; then
    output=$(cat ${wlt_file})

    jq '.' ${wlt_file} > /dev/null 2>&1 || handle_error
    declare -a mandatory_params
    mandatory_params=( actions version createdOn id walletId creatorId coin
        network outputs amount message payProUrl changeAddress inputs walletM
        walletN requiredSignatures requiredRejections status inputPaths
        outputOrder fee feeLevel feePerKb excludeUnconfirmedUtxos
        addressType customData proposalSignature signingMethod
        gasPrice from nonce gasLimit data tokenAddress destinationTag invoiceID
        derivationStrategy creatorName )
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
