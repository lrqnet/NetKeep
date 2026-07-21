#!/bin/sh
set -eu

MARKER=/var/lib/netkeep/restore-inbox/.maintenance

while true; do
    if [ ! -f "$MARKER" ]; then
        php artisan schedule:run --no-interaction
    fi
    sleep 60
done
