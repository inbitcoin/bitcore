#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
txid="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"

note="blablabla إلخ, إلخ бла-бла-бла"

url="/v1/txnotes/${txid}/"
http_method=${PUT}
req_args="{\"txid\": \"${txid}\", \"body\": \"${note}\"}"

sign_wait_report
