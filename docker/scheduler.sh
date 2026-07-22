#!/bin/sh
set -eu

MARKER=/var/lib/netkeep/restore-inbox/.maintenance
child_pid=

stop_scheduler() {
    if [ -n "$child_pid" ] && kill -0 "$child_pid" 2>/dev/null; then
        kill -TERM "$child_pid" 2>/dev/null || true
        wait "$child_pid" || true
    fi
    exit 0
}

run_child() {
    "$@" &
    child_pid=$!
    child_status=0
    wait "$child_pid" || child_status=$?
    child_pid=

    return "$child_status"
}

trap stop_scheduler INT TERM

while true; do
    if [ ! -f "$MARKER" ]; then
        run_child php artisan schedule:run --no-interaction
    fi
    run_child sleep 60
done
