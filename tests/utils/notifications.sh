#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_calls="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"

wlt_report="${report_dir}/wlt_${num_wlt}"

url="/v1/login/"
http_method=${POST}
sign_req_bws
[ ! -z "${DISABLE_SYNC_WAIT}" ] || wait_to_start

for i in $(seq 1 ${num_calls}); do
    url="/v1/login/"
    http_method=${POST}
    call_bws
    save_and_parse_output
    [ "${err}" == "true" ] && break

    url="/v1/notifications/?timeSpan=666&notificationIncludeOwn=true"
    call_bws
    save_and_parse_output
    [ "${err}" == "true" ] && break
done
