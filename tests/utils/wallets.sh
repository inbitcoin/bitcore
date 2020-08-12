#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_calls="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"

url="/v3/wallets/?includeExtendedInfo=0&twoStep=0&serverMessageArray=1"

sign_wait_report
