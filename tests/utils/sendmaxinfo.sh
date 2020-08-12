#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_wlt="${2}"
wlt_name="wlt_${num_wlt}"

url="/v1/sendmaxinfo/?returnInputs=1"

sign_wait_report
