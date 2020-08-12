#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_wlt="${2}"
wlt_name="wlt_${num_wlt}"

export WALLET_FILE="${WLTS_DIR}/${wlt_name}.dat"
wlt_report="${report_dir}/${wlt_name}"

url="/v2/txproposals/"

sign_wait_report
