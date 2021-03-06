#!/bin/bash

. ./tests/common.sh

[ "${1}" == "" ] && echo "specify how many wallets to use" && exit 2
num_wlts="${1}"
check_enough_wlts

[ "${2}" == "" ] && echo "specify how many times make the call" && exit 2
num_calls="${2}"

report_basename="notifications"
gen_report_dir

entrypoint="${UTILS_DIR}/notifications.sh"
loop_msg="getting notifications for wallet n. %s"

cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${num_calls}"
call_and_track
