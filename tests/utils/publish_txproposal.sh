#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
txp_id="${2}"
txp="${3}"
num_wlt="${4}"
wlt_name="wlt_${num_wlt}"

get_req_priv_key

url="/v2/txproposals/${txp_id}/publish/"
http_method=${POST}
proposal_sig=$(node ${UTILS_DIR}/signMessage.js "txp" "${txp}" "${req_priv_key}")
req_args="{\"proposalSignature\": \"${proposal_sig}\"}"

sign_wait_report
