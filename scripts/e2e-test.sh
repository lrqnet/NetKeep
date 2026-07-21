#!/usr/bin/env bash
set -Eeuo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project="${NETKEEP_E2E_PROJECT:-netkeep-e2e}"
mode="${1:-chromium}"

cd "$root"

export NETKEEP_BIND_IP=127.0.0.1
export NETKEEP_HTTP_PORT="${NETKEEP_E2E_HTTP_PORT:-18081}"
export NETKEEP_HTTPS_PORT="${NETKEEP_E2E_HTTPS_PORT:-18444}"
export NETKEEP_E2E_BOOTSTRAP_URL="http://127.0.0.1:${NETKEEP_HTTP_PORT}"
export NETKEEP_E2E_BASE_URL="https://127.0.0.1:${NETKEEP_HTTPS_PORT}"
export NETKEEP_IMAGE="${NETKEEP_E2E_IMAGE:-netkeep:e2e}"
export NETKEEP_OXIDIZED_IMAGE="${NETKEEP_E2E_OXIDIZED_IMAGE:-netkeep-oxidized:e2e}"

compose=(
    docker compose
    --project-name "$project"
    --file compose.yaml
    --file compose.dev.yaml
    --file compose.e2e.yaml
)

"${compose[@]}" down --volumes --remove-orphans
if [[ "${NETKEEP_E2E_BUILD:-true}" == 'false' ]]; then
    "${compose[@]}" up --detach --no-build --wait
else
    "${compose[@]}" up --detach --build --wait
fi

export NETKEEP_INSTALLATION_TOKEN
NETKEEP_INSTALLATION_TOKEN="$("${compose[@]}" exec --no-TTY app php artisan netkeep:installation-token)"

if [[ "$mode" == "all" ]]; then
    npm run test:e2e:all
else
    npm run test:e2e:chromium
fi

"${compose[@]}" exec --no-TTY app php artisan netkeep:dispatch-collections

collection_status=''
for _ in $(seq 1 45); do
    if "${compose[@]}" exec --no-TTY app php artisan netkeep:reconcile-backups; then
        collection_status="$(
            "${compose[@]}" exec --no-TTY postgres \
                psql -U netkeep_admin -d netkeep -tAc \
                "SELECT status FROM collection_runs ORDER BY id DESC LIMIT 1"
        )"
        if [[ "$collection_status" == 'succeeded' ]]; then
            break
        fi
    fi
    sleep 2
done

test "$collection_status" = 'succeeded'

device_uuid="$(
    "${compose[@]}" exec --no-TTY postgres \
        psql -U netkeep_admin -d netkeep -tAc \
        "SELECT uuid FROM devices WHERE name = 'E2E Router'"
)"

test -n "$device_uuid"
"${compose[@]}" exec --no-TTY oxidized \
    git -C /home/oxidized/.config/oxidized/repository \
    show "HEAD:default/$device_uuid" |
    grep -q 'hostname NETKEEP-E2E'

"${compose[@]}" exec --no-TTY app php artisan test --testsuite=Integration
"${compose[@]}" stop app worker scheduler oxidized sandbox

prepare_output="$(
    "${compose[@]}" --profile recovery run --rm --no-deps recovery \
        php artisan netkeep:restore prepare \
        /var/lib/netkeep/restore-inbox/e2e-s3-backup.nkb \
        --password-file=/var/lib/netkeep/restore-inbox/e2e-s3-password
)"
operation="$(
    sed -n 's/^Restore prepared: //p' <<<"$prepare_output"
)"

if [[ ! "$operation" =~ ^[0-9a-f-]{36}$ ]]; then
    printf '%s\n' "$prepare_output"
    exit 1
fi

"${compose[@]}" --profile recovery run --rm --no-deps recovery \
    php artisan netkeep:restore apply --operation="$operation" --force
"${compose[@]}" --profile recovery run --rm --no-deps recovery \
    php artisan netkeep:restore finalize --operation="$operation" --force

"${compose[@]}" up --detach --wait app worker scheduler oxidized sandbox

preserved="$(
    "${compose[@]}" exec --no-TTY postgres \
        psql -U netkeep_admin -d netkeep -tAc \
        "SELECT COUNT(*) FROM sites WHERE name = 'E2E preserved site'"
)"
transient="$(
    "${compose[@]}" exec --no-TTY postgres \
        psql -U netkeep_admin -d netkeep -tAc \
        "SELECT COUNT(*) FROM sites WHERE name = 'E2E transient site'"
)"

test "$preserved" = '1'
test "$transient" = '0'
"${compose[@]}" exec --no-TTY oxidized \
    git -C /home/oxidized/.config/oxidized/repository \
    show "HEAD:default/$device_uuid" |
    grep -q 'hostname NETKEEP-E2E'

"${compose[@]}" ps
