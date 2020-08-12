. ../utils/host_common.sh

TESTS_FAILED_FLAG="integration_tests_failed"

export DISABLE_SYNC_WAIT=1

log_success() {
    msg="${1:-"OK"}"
    echo -e "${GREEN}${msg}${NC}"
    exit 0
}

log_error() {
    error="${1}"
    echo -e "${RED}ERROR: ${error}${NC}"
}

handle_error() {
    log_error "${output}"
    touch ${TESTS_FAILED_FLAG}
    exit 0  # required by start_tests.sh because of set -e
}

handle_unexpected_error() {
    echo -e "${RED}unexpected error${NC}"
    exit 2
}

has_space() {
  [[ "$1" != "${1%[[:space:]]*}" ]] && return 0 || return 1
}

check_txid() {
    txid=${1}
    if has_space "${txid}" || [ "${#txid}" != "64" ]; then
        err="true"
    fi
}

_split_on_char(){
    string="${1}"
    char="${2}"
    IFS="${char}"
    read -ra splitted_string <<< "${string}"
    IFS=' '
}

check_uuid() {
    uuid=${1}
    if has_space "${uuid}" || [ "${#uuid}" != "36" ]; then
        err="true" && return
    fi
    _split_on_char "${uuid}" "-"
    [ "${#splitted_string[0]}" == 8 ] || err="true"
    [ "${#splitted_string[1]}" == 4 ] || err="true"
    [ "${#splitted_string[2]}" == 4 ] || err="true"
    [ "${#splitted_string[3]}" == 4 ] || err="true"
    [ "${#splitted_string[4]}" == 12 ] || err="true"
}
