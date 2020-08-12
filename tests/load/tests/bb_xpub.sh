#!/bin/bash

. ./tests/common.sh

[ "${1}" == "" ] && echo "specify how many wallets to use" && exit 2
num_wlts="${1}"
check_enough_wlts

[ "${2}" == "" ] && echo "specify how many times make the call" && exit 2
num_calls="${2}"

report_basename="bb_xpub"
gen_report_dir

entrypoint="${UTILS_DIR}/bb_xpub.sh"
loop_msg="scanning xpub of wallet n. %s"

cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${num_calls}"
call_and_track
