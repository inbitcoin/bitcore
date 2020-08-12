. ../utils/host_common.sh

check_enough_wlts() {
    existing_wlts="$(ls wallets/wlt_*.dat | wc -l)"
    [ "${existing_wlts}" -lt "${num_wlts}" ] && \
        die "not enough wallets to proceed," \
             "$((${num_wlts} - ${existing_wlts})) more needed"
}

exit_with_code() {
    if [ "$(ls ${report_dir_host}/wlt_* 2> /dev/null | wc -l)" == "${num_wlts}" ]; then
        exit 0
    else
        exit 1
    fi
}
