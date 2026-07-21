#!/bin/sh
set -eu

if [ "${1:-}" = "init-secrets" ]; then
    exec /usr/local/bin/init-secrets.sh
fi

if [ ! -r /run/netkeep-secrets/app.env ]; then
    echo "NetKeep secrets are missing. Run the init service first." >&2
    exit 1
fi

set -a
. /run/netkeep-secrets/app.env
set +a

mkdir -p \
    /app/storage/app/public \
    /app/storage/framework/cache \
    /app/storage/framework/sessions \
    /app/storage/framework/views \
    /app/storage/logs \
    /var/lib/netkeep/backups

if [ "${1:-}" = "frankenphp" ]; then
    rm -f /app/bootstrap/cache/*.php
    php artisan migrate --force
    php artisan netkeep:migrate-git-identity
    php artisan netkeep:caddy-configure
    php artisan optimize
fi

exec "$@"
