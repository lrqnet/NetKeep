#!/usr/bin/env bash
set -Eeuo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project="${NETKEEP_INVENTORY_LAB_PROJECT:-netkeep-inventory-lab}"
env_file="$root/.inventory-lab.env"

export NETKEEP_BIND_IP=127.0.0.1
export NETKEEP_HTTP_PORT="${NETKEEP_LAB_HTTP_PORT:-28180}"
export NETKEEP_HTTPS_PORT="${NETKEEP_LAB_HTTPS_PORT:-28543}"

if [[ ! -f "$env_file" ]]; then
    umask 077
    {
        printf 'NETKEEP_LAB_NETBOX_DATABASE_PASSWORD=%s\n' "$(openssl rand -hex 24)"
        printf 'NETKEEP_LAB_NETBOX_REDIS_PASSWORD=%s\n' "$(openssl rand -hex 24)"
        printf 'NETKEEP_LAB_NETBOX_SECRET_KEY=%s\n' "$(openssl rand -hex 32)"
        printf 'NETKEEP_LAB_NETBOX_SUPERUSER_PASSWORD=%s\n' "$(openssl rand -hex 24)"
        printf 'NETKEEP_LAB_NETBOX_V1_TOKEN=%s\n' "$(openssl rand -hex 20)"
        printf 'NETKEEP_LAB_NETBOX_TOKEN_PEPPER=%s\n' "$(openssl rand -hex 32)"
        printf 'NETKEEP_LAB_LIBRENMS_DATABASE_PASSWORD=%s\n' "$(openssl rand -hex 24)"
        printf 'NETKEEP_LAB_LIBRENMS_ROOT_PASSWORD=%s\n' "$(openssl rand -hex 24)"
        printf 'NETKEEP_LAB_LIBRENMS_USER_PASSWORD=%s\n' "$(openssl rand -hex 20)"
        printf 'NETKEEP_LAB_LIBRENMS_TOKEN=%s\n' "$(openssl rand -hex 16)"
    } > "$env_file"
fi

if ! grep --quiet '^NETKEEP_LAB_NETBOX_TOKEN_PEPPER=' "$env_file"; then
    printf 'NETKEEP_LAB_NETBOX_TOKEN_PEPPER=%s\n' "$(openssl rand -hex 32)" >> "$env_file"
fi

if ! grep --quiet '^NETKEEP_LAB_NETBOX_V1_TOKEN=' "$env_file"; then
    printf 'NETKEEP_LAB_NETBOX_V1_TOKEN=%s\n' "$(openssl rand -hex 20)" >> "$env_file"
fi

if ! grep --quiet '^NETKEEP_LAB_LIBRENMS_USER_PASSWORD=' "$env_file"; then
    printf 'NETKEEP_LAB_LIBRENMS_USER_PASSWORD=%s\n' "$(openssl rand -hex 20)" >> "$env_file"
fi

if ! grep --quiet '^NETKEEP_LAB_LIBRENMS_TOKEN=' "$env_file"; then
    printf 'NETKEEP_LAB_LIBRENMS_TOKEN=%s\n' "$(openssl rand -hex 16)" >> "$env_file"
fi

set -a
source "$env_file"
set +a

compose=(
    docker compose
    --project-name "$project"
    --file "$root/compose.yaml"
    --file "$root/compose.dev.yaml"
    --file "$root/compose.inventory-lab.yaml"
)

wait_for_healthy() {
    local service="$1"
    local container
    local state

    for _ in $(seq 1 90); do
        container="$("${compose[@]}" ps --quiet "$service")"
        state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || true)"

        if [[ "$state" == healthy ]]; then
            return 0
        fi

        if [[ "$state" == unhealthy || "$state" == exited ]]; then
            return 1
        fi

        sleep 5
    done

    return 1
}

provision_netbox_token() {
    "${compose[@]}" exec --no-TTY netbox \
        /opt/netbox/venv/bin/python /opt/netbox/netbox/manage.py shell -c \
        "from os import environ; from users.choices import TokenVersionChoices; from users.models import Token, User; user = User.objects.get(username='netkeep-lab'); token = environ['NETKEEP_LAB_API_TOKEN']; Token.objects.update_or_create(user=user, description='NetKeep lab', defaults={'version': TokenVersionChoices.V1, 'plaintext': token, 'key': None, 'pepper_id': None, 'hmac_digest': None})" \
        >/dev/null
}

provision_librenms_token() {
    "${compose[@]}" exec --no-TTY \
        -e NETKEEP_LAB_LIBRENMS_USER_PASSWORD="$NETKEEP_LAB_LIBRENMS_USER_PASSWORD" \
        librenms sh -lc 'cd /opt/librenms && ./lnms user:add netkeep-lab --password="$NETKEEP_LAB_LIBRENMS_USER_PASSWORD" --role=admin --email=netkeep-lab@example.test --full-name="NetKeep Lab" --quiet || true' \
        >/dev/null
    "${compose[@]}" exec --no-TTY \
        -e NETKEEP_LAB_LIBRENMS_TOKEN="$NETKEEP_LAB_LIBRENMS_TOKEN" \
        librenms php /opt/librenms/artisan tinker --execute='$user = \App\Models\User::query()->where("username", "netkeep-lab")->firstOrFail(); $token = \App\Models\ApiToken::query()->where("user_id", $user->user_id)->where("description", "NetKeep lab")->first() ?? new \App\Models\ApiToken; $token->user_id = $user->user_id; $token->description = "NetKeep lab"; $token->token_hash = getenv("NETKEEP_LAB_LIBRENMS_TOKEN"); $token->disabled = false; $token->save();' \
        >/dev/null
}

case "${1:-up}" in
    up)
        "${compose[@]}" up --detach --build --quiet-build
        wait_for_healthy app
        wait_for_healthy netbox
        provision_netbox_token
        wait_for_healthy librenms
        provision_librenms_token
        ;;
    down)
        "${compose[@]}" down
        ;;
    logs)
        "${compose[@]}" logs --follow --tail 200
        ;;
    config)
        "${compose[@]}" config --quiet
        ;;
    *)
        printf '%s\n' 'Usage: scripts/inventory-lab.sh [up|down|logs|config]' >&2
        exit 64
        ;;
esac
