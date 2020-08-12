#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_calls="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"

url="/v4/addresses/"
req_args='{"ignoreMaxGap": true}'
http_method=${POST}

sign_wait_report
