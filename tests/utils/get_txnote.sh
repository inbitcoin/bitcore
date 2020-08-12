#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
txid="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"

url="/v1/txnotes/${txid}/"

sign_wait_report
