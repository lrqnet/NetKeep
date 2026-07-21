#!/bin/sh
set -eu

MARKER=/var/lib/netkeep/restore-inbox/.maintenance
worker_pid=

stop_worker() {
    if [ -n "$worker_pid" ] && kill -0 "$worker_pid" 2>/dev/null; then
        kill -TERM "$worker_pid" 2>/dev/null || true
        wait "$worker_pid" || true
    fi
    exit 0
}

trap stop_worker INT TERM

while true; do
    if [ -f "$MARKER" ]; then
        sleep 5
        continue
    fi

    php artisan queue:work --sleep=3 --tries=3 --max-time=300 &
    worker_pid=$!

    while kill -0 "$worker_pid" 2>/dev/null; do
        if [ -f "$MARKER" ]; then
            kill -TERM "$worker_pid" 2>/dev/null || true
            break
        fi
        sleep 1
    done

    worker_status=0
    wait "$worker_pid" || worker_status=$?
    worker_pid=

    if [ "$worker_status" -ne 0 ]; then
        sleep 1
    fi
done
