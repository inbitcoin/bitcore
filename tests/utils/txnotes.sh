#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_calls="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"

url="/v1/txnotes/"

sign_wait_report
