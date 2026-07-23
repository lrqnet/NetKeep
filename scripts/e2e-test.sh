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
export NETKEEP_UPDATER_IMAGE="${NETKEEP_E2E_UPDATER_IMAGE:-netkeep-updater:e2e}"

compose=(
    docker compose
    --project-name "$project"
    --file compose.yaml
    --file compose.dev.yaml
    --file compose.e2e.yaml
)

wait_for_healthy() {
    local service="$1"
    local attempts="${2:-60}"
    local container=''
    local status=''

    for _ in $(seq 1 "$attempts"); do
        container="$("${compose[@]}" ps --quiet "$service")"
        if [[ -n "$container" ]]; then
            status="$(
                docker inspect \
                    --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
                    "$container" 2>/dev/null || true
            )"
            if [[ "$status" == 'healthy' || "$status" == 'running' ]]; then
                return 0
            fi
            if [[ "$status" == 'dead' || "$status" == 'exited' ]]; then
                break
            fi
        fi
        sleep 2
    done

    "${compose[@]}" ps "$service"
    "${compose[@]}" logs --no-color --tail 150 "$service"
    return 1
}

wait_for_https() {
    local attempts="${1:-30}"

    for _ in $(seq 1 "$attempts"); do
        if curl \
            --fail \
            --insecure \
            --max-time 5 \
            --silent \
            --show-error \
            "${NETKEEP_E2E_BASE_URL}/up" >/dev/null; then
            return 0
        fi
        sleep 2
    done

    "${compose[@]}" ps app
    "${compose[@]}" logs --no-color --tail 150 app
    return 1
}

"${compose[@]}" down --volumes --remove-orphans
if [[ "${NETKEEP_E2E_BUILD:-true}" == 'false' ]]; then
    "${compose[@]}" up --detach --no-build --wait
else
    "${compose[@]}" up --detach --build --wait
fi

"${compose[@]}" exec --no-TTY app php artisan config:clear
"${compose[@]}" exec --no-TTY app php artisan migrate:status --no-ansi
"${compose[@]}" exec --no-TTY app php artisan optimize

export NETKEEP_INSTALLATION_TOKEN
NETKEEP_INSTALLATION_TOKEN="$("${compose[@]}" exec --no-TTY app php artisan netkeep:installation-token)"

npx playwright test --project=setup
"${compose[@]}" restart app
wait_for_healthy app
wait_for_https

if [[ "$mode" == "all" ]]; then
    npm run test:e2e:all -- --no-deps
else
    npm run test:e2e:chromium -- --no-deps
fi

diagnostic_status="$(
    "${compose[@]}" exec --no-TTY postgres \
        psql -U netkeep_admin -d netkeep -tAc \
        "SELECT status FROM collection_runs WHERE trigger = 'diagnostic' ORDER BY id DESC LIMIT 1"
)"
artifact_path="$(
    "${compose[@]}" exec --no-TTY postgres \
        psql -U netkeep_admin -d netkeep -tAc \
        "SELECT a.encrypted_path FROM collection_run_artifacts a JOIN collection_runs r ON r.id = a.collection_run_id WHERE r.trigger = 'diagnostic' ORDER BY r.id DESC LIMIT 1"
)"

test "$diagnostic_status" = 'succeeded'
[[ "$artifact_path" =~ ^[0-9a-f-]{36}\.trace$ ]]
"${compose[@]}" exec --no-TTY app \
    sh -c 'test -f "/app/storage/app/private/collection-traces/$1" && ! grep -a -q "NETKEEP-E2E" "/app/storage/app/private/collection-traces/$1"' \
    sh "$artifact_path"

sandbox_clean=''
for _ in $(seq 1 15); do
    sandbox_clean="$(
        "${compose[@]}" exec --no-TTY sandbox \
            sh -c 'find /run/netkeep-diagnostics -mindepth 1 \( -type f -o -type l \) -print -quit'
    )"
    if [[ -z "$sandbox_clean" ]]; then
        break
    fi
    sleep 2
done

test -z "$sandbox_clean"
"${compose[@]}" exec --no-TTY sandbox \
    sh -c 'test ! -e /run/netkeep-diagnostics/repository'
"${compose[@]}" exec --no-TTY sandbox \
    sh -c '! grep -R -a -q "NETKEEP-E2E" /home/oxidized/.config/oxidized 2>/dev/null'

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
"${compose[@]}" restart app
wait_for_healthy app
"${compose[@]}" --profile recovery run --rm --no-deps recovery \
    php artisan netkeep:restore finalize --operation="$operation" --force
"${compose[@]}" restart oxidized sandbox
wait_for_healthy oxidized
wait_for_healthy sandbox
"${compose[@]}" restart worker scheduler
wait_for_healthy worker
wait_for_healthy scheduler

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

if "${compose[@]}" logs --no-color scheduler | grep -q 'failed with exit code'; then
    "${compose[@]}" logs --no-color scheduler
    exit 1
fi

"${compose[@]}" ps
