#!/bin/bash

ECHO="/bin/echo"

error() {
    log "$@"
    exit 1
}

log() {
	$ECHO "`date`: $@"
}

WAIT_SECONDS=${WAIT_SECONDS:-5}
DB_HOST=${DB_HOST:-"mongodb"}
DB_PORT=${DB_PORT:-"27017"}
COMMAND=${1:-""}

if [ "$COMMAND" == "" ]; then
    error "Missing first parameter"
elif [ ! -f "$COMMAND" ]; then
    error "'$COMMAND' does not exist"
fi

SERVER="$DB_HOST:$DB_PORT"

log "Check mongodb ($SERVER) status"

until $ECHO 'db.stats().ok' | mongo $SERVER --quiet >/dev/null; do
	log "Waiting $WAIT_SECONDS seconds to retry..."
	sleep $WAIT_SECONDS
done

log "'$SERVER' status OK"

log "Start '$COMMAND'"
exec ${COMMAND}
