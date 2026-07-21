#!/bin/sh
set -eu

MARKER=/var/lib/netkeep/restore-inbox/.maintenance

while true; do
    if [ -f "$MARKER" ]; then
        sleep 5
        continue
    fi
    php artisan queue:work --sleep=3 --tries=3 --max-jobs=1 --stop-when-empty
    sleep 1
done
