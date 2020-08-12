#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_wlt="${2}"
wlt_name="wlt_${num_wlt}"

get_copayer_id
get_x_priv_key
get_req_pub_key

copayer_signature=$(node ${UTILS_DIR}/signMessage.js "reqPubKey" "${x_priv_key}" "${req_pub_key}")

url="/v1/copayers/${copayer_id}/"
req_args=$(echo \
    "{\"copayerId\": \"${copayer_id}\"," \
    "\"requestPubKey\": \"${req_pub_key}\"," \
    "\"signature\": \"${copayer_signature}\"}")
http_method=${PUT}

sign_wait_report
