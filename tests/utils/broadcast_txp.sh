#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
txp_id="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"

url="/v1/txproposals/${txp_id}/broadcast/"
http_method=${POST}

sign_wait_report
