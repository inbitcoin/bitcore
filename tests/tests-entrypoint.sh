#!/bin/bash

if [ $# -eq 0 ]; then
    echo "please provide a command"
fi

if [ -n "${MYUID}" ] && [ "${MYUID}" -gt 1000 ]; then
    echo "setting ownership to files..."
    usermod -u "${MYUID}" "${USER}"
fi

exec gosu "${USER}" $@
