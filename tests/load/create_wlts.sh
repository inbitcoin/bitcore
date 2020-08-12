#!/bin/bash

. ./tests/common.sh

[ "${1}" == "" ] && echo "specify how many wallets to use" && exit 2
num_wlts="${1}"

report_basename="createwlts"
gen_report_dir

existing_wlts=0
ending_wlt=${num_wlts}
if [ ! -z "$(ls -A wallets)" ]; then
    existing_wlts=$(ls wallets/wlt_*.dat | wc -l)
    ending_wlt=$((${num_wlts} + ${existing_wlts}))
fi
starting_wlt=$((${existing_wlts} + 1))

entrypoint="${UTILS_DIR}/create_wlts.sh"
loop_msg="creating ${num_wlts} wallets"
cmd_base="${DOCKER_RUN_D} --name wlt_%s ${IMG_NAME} ${entrypoint} ${report_dir} ${starting_wlt} ${ending_wlt}"
previous_num_wlts=${ending_wlt}
num_wlts="1"  # to make 'call_cmd_base' use a single container
call_cmd_base
wait_to_go
wait_exit_containers

num_wlts=${previous_num_wlts}
if [ "$(ls ./wallets/wlt_*.dat 2> /dev/null | wc -l)" == "${num_wlts}" ]; then
    echo "OK"
    exit 0
else
    echo "KO"
    exit 1
fi
