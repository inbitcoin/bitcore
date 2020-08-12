#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_calls="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"

get_x_pub_key

url="/api/v2/xpub/${x_pub_key}?details=txs&gap=20"
use_bb="true"
[ ! -z "${DISABLE_SYNC_WAIT}" ] || wait_to_start
call_report
