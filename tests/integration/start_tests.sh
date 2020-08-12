#!/bin/bash

echo "Starting tests"

. ./tests/common.sh

rm -f ${TESTS_FAILED_FLAG}

tests_failed() {
    rm -f ${TESTS_FAILED_FLAG}
    die "integration tests failed"
}

tests_passed() {
    log_success "integration tests passed"
}

trap tests_failed INT

export num_wlts=1
export num_calls=1

export INTEGRATION_TESTS=1

check_biskli_availability

_get_last_report_file() {
    last_report_dir=$(ls -td ./reports/*/ | head -1)
    wlt_file="${last_report_dir}wlt_1"
    [ ! -f "${wlt_file}" ] && abort_lifecycle_test && return 1
    return 0
}

abort_lifecycle_test() {
    log_error "aborting ${test_name} for intermediate test failure"
    touch ${TESTS_FAILED_FLAG}
}

recreate_wallet() {
    rm -f wallets/wlt_1.dat

    ./tests/create_wlt.sh
}

receive_btc_lifecycle() {
    test_name="receive btc lifecycle test"
    echo "BEGIN ${test_name}"

    ./tests/post_addresses.sh
    _get_last_report_file || return 0
    export addr="$(jq -r '.address' ${wlt_file})"

    amt="0.02"
    biskli --rpcserver=${BISK_HOST} send "${addr}" "${amt}" > /dev/null || \
        ((abort_lifecycle_test && return 0))

    biskli --rpcserver ${BISK_HOST} mine > /dev/null

    unset addr
    echo "END ${test_name}"
}

move_btc_lifecycle() {
    test_name="move btc lifecycle test"
    echo "BEGIN ${test_name}"

    ./tests/post_addresses.sh
    _get_last_report_file || return 0
    export addr="$(jq -r '.address' ${wlt_file})"

    ./tests/utxos.sh
    _get_last_report_file || return 0
    input="$(jq -rc 'map(select(.locked==false)) | max_by(.satoshis)' ${wlt_file})"
    [ "${input}" == "null" ] && \
        abort_lifecycle_test && return 0
    export inputs="[${input}]"

    ./tests/post_txproposal.sh
    _get_last_report_file || return 0
    export txp=$(cat ${wlt_file})
    export txp_id=$(jq -r '.id' <<< ${txp})

    ./tests/publish_txproposal.sh
    _get_last_report_file || return 0

    ./tests/sign_txproposal.sh
    _get_last_report_file || return 0

    ./tests/broadcast_txproposal.sh
    _get_last_report_file || return 0
    export txid=$(jq -r '.txid' ${wlt_file})

    ./tests/add_txnote.sh
    _get_last_report_file || return 0

    ./tests/get_txnote.sh
    _get_last_report_file || return 0

    unset addr inputs txp txp_id txid
    echo "END ${test_name}"
}

send_btc_lifecycle() {
    test_name="send btc lifecycle test"
    echo "BEGIN ${test_name}"

    export addr=$(biskli --rpcserver ${BISK_HOST} getaddress | jq -r '.address')
    amt="0.009367"

    ./tests/post_txproposal.sh
    _get_last_report_file || return 0
    export txp=$(cat ${wlt_file})
    export txp_id=$(jq -r '.id' <<< ${txp})

    ./tests/publish_txproposal.sh
    _get_last_report_file || return 0

    ./tests/sign_txproposal.sh
    _get_last_report_file || return 0

    ./tests/broadcast_txproposal.sh
    _get_last_report_file || return 0

    biskli --rpcserver ${BISK_HOST} mine > /dev/null

    unset addr txp txp_id
    echo "END ${test_name}"
}

broadcast_raw_lifecycle() {
    test_name="broadcast raw tx lifecycle test"
    echo "BEGIN ${test_name}"

    ./tests/post_addresses.sh
    _get_last_report_file || return 0
    export addr="$(jq -r '.address' ${wlt_file})"

    ./tests/utxos.sh
    _get_last_report_file || return 0
    input="$(jq -rc 'map(select(.locked==false)) | max_by(.satoshis)' ${wlt_file})"
    [ "${input}" == "null" ] && \
        abort_lifecycle_test && return 0
    export inputs="[${input}]"

    ./tests/broadcast_raw.sh
    _get_last_report_file || return 0

    unset addr inputs
    echo "END ${test_name}"
}

txproposal_lifecycle() {
    test_name="tx proposal lifecycle test"
    echo "BEGIN ${test_name}"

    ./tests/post_addresses.sh
    _get_last_report_file || return 0
    export addr="$(jq -r '.address' ${wlt_file})"

    ./tests/utxos.sh
    _get_last_report_file || return 0
    input="$(jq -rc 'map(select(.locked==false)) | max_by(.satoshis)' ${wlt_file})"
    [ "${input}" == "null" ] && \
        abort_lifecycle_test && return 0
    export inputs="[${input}]"

    ./tests/post_txproposal.sh
    _get_last_report_file || return 0
    export txp=$(cat ${wlt_file})
    export txp_id=$(jq -r '.id' <<< ${txp})

    ./tests/publish_txproposal.sh
    _get_last_report_file || return 0

    ./tests/get_txproposals.sh "pending"
    _get_last_report_file || return 0

    ./tests/sign_txproposal.sh
    _get_last_report_file || return 0

    ./tests/get_txproposals.sh "accepted"
    _get_last_report_file || return 0

    ./tests/del_txproposals.sh
    _get_last_report_file || return 0

    unset addr inputs txp txp_id
    echo "END ${test_name}"
}

sendmaxinfo_lifecycle() {
    test_name="sendmaxinfo lifecycle test"
    echo "BEGIN ${test_name}"

    export addr=$(biskli --rpcserver=${BISK_HOST} getaddress | jq -r '.address')

    ./tests/sendmaxinfo.sh
    _get_last_report_file || return 0
    export amt=$(jq '.amount' ${wlt_file})
    export fee=$(jq '.fee' ${wlt_file})
    export inputs=$(jq -rc '.inputs' ${wlt_file})
    [ "${inputs}" == "[]" ] && \
        abort_lifecycle_test && return 0

    ./tests/post_txproposal.sh "1"
    _get_last_report_file || return 0
    export txp=$(cat ${wlt_file})
    export txp_id=$(jq -r '.id' <<< ${txp})
    [ "${txp_id}" == "null" ] && \
        abort_lifecycle_test && return 0

    ./tests/publish_txproposal.sh
    _get_last_report_file || return 0

    ./tests/sign_txproposal.sh
    _get_last_report_file || return 0

    ./tests/broadcast_txproposal.sh
    _get_last_report_file || return 0

    biskli --rpcserver=${BISK_HOST} mine > /dev/null

    # check that balance is 0
    ./tests/balance.sh "0"
    _get_last_report_file || return 0

    unset addr amt fee inputs txp txp_id
    echo "END ${test_name}"
}

set -e

recreate_wallet
receive_btc_lifecycle
move_btc_lifecycle
send_btc_lifecycle
txproposal_lifecycle
broadcast_raw_lifecycle
./tests/notifications.sh
./tests/balance.sh
./tests/txnotes.sh
./tests/version.sh
./tests/feelevels.sh
./tests/wallets.sh
./tests/utxos.sh
./tests/get_addresses.sh
./tests/scan.sh
 ./tests/add_access_copayer.sh
sendmaxinfo_lifecycle
./tests/txhistory.sh

# report tests success or failure
[ -f "${TESTS_FAILED_FLAG}" ] && tests_failed
tests_passed
