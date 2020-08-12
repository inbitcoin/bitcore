IMG_NAME="inbitcoin/bitcore-tests:0.1.0"

BISK_HOST=${BISK_HOST:-"localhost"}

USER="node"
APP_DIR="/srv/app"
USER_HOME="/home/node"
UTILS_DIR="${APP_DIR}/utils"
REPORTS_DIR="${USER_HOME}/reports"
SYNC_DIR="${USER_HOME}/sync"
WLTS_DIR="${USER_HOME}/wallets"

BISK_NETWORK=ccbisk_default
MYUID="$(id -u)"
DOCKER_RUN_D=$(echo \
    "docker run -d --rm" \
    "--memory=256000000 --memory-swap=256000000 --cpus=1" \
    "-v $(dirname $(pwd))/utils:${UTILS_DIR}" \
    "-v $(pwd)/reports:${REPORTS_DIR}" \
    "-v $(pwd)/wallets:${WLTS_DIR}" \
    "-v $(pwd)/sync:${SYNC_DIR}" \
    "-e MYUID=${MYUID}" \
    "-e DISABLE_SYNC_WAIT=${DISABLE_SYNC_WAIT}" \
    "--network=${BISK_NETWORK}"
)

NC='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'

die() {
    echo -e "${RED}$@${NC}" 1>&2;
    exit 2
}

check_biskli_availability() {
    bisk_env_dir="${HOME}/.virtualenvs/bisk-env"
    if [ -d "${bisk_env_dir}" ]; then
        . ${bisk_env_dir}/bin/activate
        which biskli > /dev/null || \
            die "cannot find biskli in bisk-env (hint: ./unix_make install_cli from bisk)"
    else
        die "cannot find bisk-env (hint: ./unix_make install_cli from bisk)"
    fi
}

gen_report_dir() {
    timestamp=$(date +%s)
    report_dir="${REPORTS_DIR}/${report_basename}_${timestamp}"
    report_dir_host="reports/$(basename ${report_dir})"
    mkdir -p ${report_dir_host}
    echo "reports will be saved in: ${report_dir_host}"
}

wait_exit_containers() {
    num_containers=${num_wlts}
    while [ ${num_containers} -gt 0 ]; do
        num_containers=$(docker ps --filter "name=wlt_" --format '{{.Names}}' | wc -l)
        echo "waiting containers to exit (${num_containers} remaining)..."
        sleep 1
    done
}

_wait_sync_containers() {
    num_containers=0
    while [ ${num_containers} -lt ${num_wlts} ]; do
        num_containers=$(ls sync/wlt_* 2> /dev/null | wc -l)
        echo "waiting containers sync (${num_containers}/${num_wlts})..."
        sleep 1
    done
    rm sync/wlt_*
    echo "containers are synced"
}

wait_to_mine() {
    sync_file="mined"
    _wait_sync_containers
    biskli --rpcserver ${BISK_HOST} mine
    touch sync/${sync_file}
}

wait_to_go() {
    sync_file="go"
    _wait_sync_containers
    echo "sleeping..."
    sleep 3
    touch sync/${sync_file}
}

call_cmd_base() {
    for i in $(seq 1 ${num_wlts}); do
        printf "${loop_msg}\n" "${i}"
        printf -v cmd "${cmd_base}" "${i}"
        ${cmd} ${i}
        [ "$?" != 0 ] && \
            die "cannot run docker container"
    done
    return 0
}

call_and_track() {
    start_recording_logs
    call_cmd_base
    if [ "${INTEGRATION_TESTS}" == 1 ]; then
        record_wlt_1_logs
    fi
    [ ! -z "${DISABLE_SYNC_WAIT}" ] || wait_to_go
    start=$(date +%s -r "sync/${sync_file}")
    wait_exit_containers
    end=$(date +%s)
    stop_recording_logs
    time_spent=$((${end} - ${start}))
    write_report
}

start_recording_logs() {
    declare -a CC_SERVICES
    CC_SERVICES=( ccbisk_bws-new_1 ccbisk_mongodb-bws-new_1 ccbisk_blockbook_1 ccbisk_bitcoind_1 )
    CC_PIDS=()
    for srv in "${CC_SERVICES[@]}"; do
        docker logs --tail=0 -f ${srv} &> ${report_dir_host}/${srv}.log &
        CC_PIDS+=($!)
    done
}

stop_recording_logs() {
    for pid in "${CC_PIDS[@]}"; do
        kill ${pid}
    done
}

record_wlt_1_logs() {
    docker logs -f wlt_1 &> ${report_dir_host}/wlt_1.log &
}

write_report() {
    final_report="${report_dir_host}/report.txt"
    echo "reports have been saved in: ${report_dir_host}/"
    echo "requested wallets: ${num_wlts}" >> ${final_report}
    [ -n "${num_calls}" ] && \
        echo "requested calls per wallet: ${num_calls}" >> ${final_report}
    echo "wallets with errors:" \
        "$(find ${report_dir_host} -name '*.err' | wc -l)" | tee -a ${final_report}
    [ -n "${time_spent}" ] && \
        echo "time spent:" \
            "$(date -d@${time_spent} -u +%H:%M:%S)" | tee -a ${final_report}
}

mkdir -p reports sync wallets
rm sync/* 2> /dev/null

# check that bisk is on
if [ ! "$(docker ps --filter "name=bisk" | wc -l)" -gt 1 ]; then
    die "please launch bisk"
fi

# check that bws is on
if [ ! "$(docker ps --filter "name=ccbisk_bws-new_1" | wc -l)" -gt 1 ]; then
    die "please launch bws"
fi

# check that bws is ready
check_tries=30
until [ "$(docker inspect ccbisk_bws-new_1 | jq -r '.[].State.Health.Status')" == "healthy" ]; do
	if [ "${check_tries}" == "0" ]; then
        docker logs ccbisk_bws-new_1 > reports/bws.err.log
        die "max retries reached, bws logs have been saved (reports)"
    fi
    echo "waiting for bws to be ready..."
    sleep 2
    check_tries=$((check_tries - 1))
done
