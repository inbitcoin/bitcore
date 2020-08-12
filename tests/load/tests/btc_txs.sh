#!/bin/bash

. ./tests/common.sh

check_biskli_availability

[ "${1}" == "" ] && echo "specify how many wallets to use" && exit 2
num_wlts="${1}"
check_enough_wlts

report_basename="btc_txs"
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
entrypoint="${UTILS_DIR}/move_btc.sh"
loop_msg="moving on wallet n. %s"

cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} 1"
call_cmd_base

wait_to_go
wait_to_mine
wait_exit_containers

# send
entrypoint="${UTILS_DIR}/send_btc.sh"
loop_msg="sending from wallet n. %s"

addr=$(biskli getaddress | jq -r '.address')

cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${addr}"
call_cmd_base

wait_to_go
wait_exit_containers

biskli mine

write_report

stop_recording_logs

exit_with_code
