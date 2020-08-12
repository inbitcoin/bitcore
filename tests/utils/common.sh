export BWS_HOST=${BWS_HOST:-"bws-new:3232"}

BB_HOST="blockbook:9130"

BITCOIN_CLI="bitcoin-cli -regtest -rpcconnect=bitcoind -rpcuser=user -rpcpassword=pass"

GET="GET"
POST="POST"
PUT="PUT"
DELETE="DELETE"
HEAD_SIGN="x-signature: %s"
HEAD_IDEN="x-identity: %s"

OUTPUT_FILE="/tmp/call_output"

trap ctrl_c INT

function ctrl_c() {
    echo "** Trapped CTRL-C"
    exit 2
}

sign_req_bws() {
    [ -z "${http_method}" ] && http_method=${GET}
    [ -z "${req_args}" ] && req_args="{}"

    get_copayer_id
    get_req_priv_key

    signature=$(node ${UTILS_DIR}/signMessage.js "req" "${http_method}" "${url}" "${req_args}" "${req_priv_key}")

    printf -v head_sign "${HEAD_SIGN}" "${signature}"
    printf -v head_iden "${HEAD_IDEN}" "${copayer_id}"
}

_curl_bws() {
    curl_opts=(
        -sS -X ${http_method}
        -H "Content-Type: application/json" -d "${req_args}"
    )
    [ -z "${disable_authentication}" ] && \
        curl_opts+=(-H "${head_sign}" -H "${head_iden}")
    curl "${curl_opts[@]}" "${BWS_HOST}${url}" 2>&1 > ${OUTPUT_FILE}
    res="$?"
    echo "OUTPUT: $(cat ${OUTPUT_FILE})"
}

_curl_bb() {
    curl -sS "${BB_HOST}${url}" 2>&1 > ${OUTPUT_FILE}
    res="$?"
    echo "OUTPUT: $(cat ${OUTPUT_FILE})"
}

call_bws() {
    disable_authentication="${1}"
    [ -z "${http_method}" ] && http_method=${GET}
    [ -z "${req_args}" ] && req_args="{}"
    [ -z "${signature}" -a -z "${disable_authentication}" ] && sign_req_bws

    _curl_bws
    parse_output
    unset http_method req_args signature
}

call_report() {
    # calls the requested api on bws or blockbook and produces a report file
    # named 'wlt_<num_wltw>'
    # in case of 3 consecutive errors it appends .err to the file name
    # and it stops making the calls
    disable_authentication="${1}"

    [ -z "${http_method}" ] && http_method=${GET}
    [ -z "${req_args}" ] && req_args="{}"
    [ -z "${signature}" -a -z "${disable_authentication}" ] && sign_req_bws

    wlt_report="${report_dir}/wlt_${num_wlt}"
    touch ${wlt_report}

    for i in $(seq 1 ${num_calls}); do
        if [ -z "${use_bb}" ]; then
            _curl_bws
        else
            _curl_bb
        fi
        save_and_parse_output
        [ "${err}" == "true" ] && break
    done
    unset http_method req_args signature err
}

write_output(){
    cat ${OUTPUT_FILE} | tr -d '\n' >> ${wlt_report}
    echo >> ${wlt_report}
}

save_and_parse_output() {
    write_output
    parse_output
    if [ "${err}" == "true" ]; then
        mv ${wlt_report}{,.err}
    fi
}

parse_output() {
    if [ "${res}" == 0 ]; then
        err=$(jq 'if type=="array" or type=="string" then null else . end' ${OUTPUT_FILE} | jq -r '.code')
        if [ "${err}" == "null" ]; then
            err=$(jq 'if type=="array" or type=="string" then null else . end' ${OUTPUT_FILE} | jq -r '.error')
        fi
    else
        err="true"
    fi
    if [ "${err}" != "null" -a "${err}" != "" ]; then
        echo "ERROR"
        err="true"
    fi
}

_wait_sync() {
    while [ ! -f "${sync_file}" ] || [ $(date +%s -r "${sync_file}") -lt ${last_op_timestamp} ]; do
        echo "waiting..."
        sleep 2
    done
}

wait_block() {
    last_op_timestamp=$(date +%s)
    touch ${SYNC_DIR}/${wlt_name}
    sync_file="${SYNC_DIR}/mined"
    _wait_sync
}

wait_to_start() {
    last_op_timestamp=$(date +%s)
    touch ${SYNC_DIR}/${wlt_name}
    sync_file="${SYNC_DIR}/go"
    _wait_sync
}

sign_wait_report() {
    sign_req_bws
    [ ! -z "${DISABLE_SYNC_WAIT}" ] || wait_to_start
    call_report
}

get_copayer_id() {
    WALLET_FILE="${WLTS_DIR}/wlt_${num_wlt}.dat"
    copayer_id=$(jq -r '.cred.copayerId' ${WALLET_FILE})
}

get_req_priv_key() {
    WALLET_FILE="${WLTS_DIR}/wlt_${num_wlt}.dat"
    req_priv_key=$(jq -r '.cred.requestPrivKey' ${WALLET_FILE})
}

get_req_pub_key() {
    WALLET_FILE="${WLTS_DIR}/wlt_${num_wlt}.dat"
    req_pub_key=$(jq -r '.cred.requestPubKey' ${WALLET_FILE})
}

get_x_priv_key() {
    WALLET_FILE="${WLTS_DIR}/wlt_${num_wlt}.dat"
    x_priv_key=$(jq -r '.key.xPrivKey' ${WALLET_FILE})
}

get_x_pub_key() {
    WALLET_FILE="${WLTS_DIR}/wlt_${num_wlt}.dat"
    x_pub_key=$(jq -r '.cred.xPubKey' ${WALLET_FILE})
}

has_space() {
  [[ "$1" != "${1%[[:space:]]*}" ]] && return 0 || return 1
}

check_addr() {
    if has_space "${addr}" || [ "${#addr}" -lt 25 -o "${#addr}" -gt 35 ]; then
        err="true"
    fi
}

check_txid() {
    if has_space "${txid}" || [ "${#txid}" != "64" ]; then
        err="true"
    fi
}
