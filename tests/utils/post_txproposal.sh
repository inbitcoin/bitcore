#!/bin/bash

# mandatory: addr
# optional: fee, amt, inputs

. ${UTILS_DIR}/common.sh

report_dir="${1}"
addr="${2}"
inputs="${3}"
fee="${4}"
amt="${5}"
num_wlt="${6}"
wlt_name="wlt_${num_wlt}"

[ "${amt}" == "null" ] && amt="5000"

url="/v3/txproposals/"
if [ "${inputs}" == "null" ]; then
    req_args=$(echo \
        "{\"outputs\": [{\"toAddress\": \"${addr}\", \"amount\": ${amt}}]," \
        "\"feePerKb\": 10000}"
    )
elif [ "${fee}" == "null" ]; then
    req_args=$(echo \
        "{\"outputs\": [{\"toAddress\": \"${addr}\", \"amount\": ${amt}}]," \
        "\"feePerKb\": 10000, \"inputs\": ${inputs}}"
    )
else
    req_args=$(echo \
        "{\"outputs\": [{\"toAddress\": \"${addr}\", \"amount\": ${amt}}]," \
        "\"fee\": ${fee}, \"inputs\": ${inputs}}"
    )
fi
echo "request arguments: ${req_args}"
http_method=${POST}

sign_wait_report
