#!/bin/bash

. ./tests/common.sh

check_biskli_availability

[ "${1}" == "" ] && echo "specify how many wallets to use" && exit 2
num_wlts="${1}"
check_enough_wlts

[ "${2}" == "" ] && echo "specify how many times make the call" && exit 2
num_calls="${2}"

report_basename="broadcast_raw_tx"
gen_report_dir

start_recording_logs

# receive
entrypoint="${UTILS_DIR}/receive_btc.sh"
loop_msg="receiving on wallet n. %s"

cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir}"
call_cmd_base

wait_to_go
wait_exit_containers

biskli mine

# move
entrypoint="${UTILS_DIR}/broadcast_raw.sh"
loop_msg="moving (using raw txs) on wallet n. %s"

cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${num_calls}"
call_cmd_base

wait_to_go
for i in $(seq 1 ${num_calls}); do
    wait_to_mine
done
wait_exit_containers

write_report

stop_recording_logs

exit_with_code
