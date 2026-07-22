#!/bin/sh
set -eu
umask 077

SECRET_DIR=/run/netkeep-secrets
RECOVERY_SECRET_DIR=/run/netkeep-recovery-secrets
CLAIM_DIR=/var/lib/netkeep/claim
OXIDIZED_DIR=/var/lib/netkeep/oxidized
SANDBOX_DIR=/var/lib/netkeep/sandbox
STORAGE_DIR=/var/lib/netkeep/storage
BACKUP_DIR=/var/lib/netkeep/backups
RESTORE_DIR=/var/lib/netkeep/restore-inbox
UPDATE_DIR=/var/lib/netkeep/updates
CACHE_DIR=/var/lib/netkeep/bootstrap-cache
CADDY_DATA_DIR=/var/lib/netkeep/caddy-data
CADDY_CONFIG_DIR=/var/lib/netkeep/caddy-config
mkdir -p "$SECRET_DIR" "$RECOVERY_SECRET_DIR" "$CLAIM_DIR" "$OXIDIZED_DIR/model" "$OXIDIZED_DIR/.ssh" "$OXIDIZED_DIR/repository" "$SANDBOX_DIR/model" "$SANDBOX_DIR/.ssh" "$SANDBOX_DIR/repository" "$STORAGE_DIR/app/public" "$STORAGE_DIR/framework/cache" "$STORAGE_DIR/framework/sessions" "$STORAGE_DIR/framework/views" "$STORAGE_DIR/logs" "$BACKUP_DIR" "$RESTORE_DIR" "$UPDATE_DIR/queue" "$UPDATE_DIR/requests" "$UPDATE_DIR/status" "$CACHE_DIR" "$CADDY_DATA_DIR" "$CADDY_CONFIG_DIR"
touch "$CADDY_CONFIG_DIR/netkeep-canonical.caddy"
touch "$CADDY_CONFIG_DIR/netkeep-global.caddy"
rm -f "$CACHE_DIR"/*.php

generate_secret() {
    target="$1"
    bytes="$2"
    if [ ! -s "$target" ]; then
        openssl rand -base64 "$bytes" | tr -d '\n' > "$target"
        printf '\n' >> "$target"
    fi
}

generate_secret "$SECRET_DIR/postgres_password" 36
generate_secret "$RECOVERY_SECRET_DIR/postgres_admin_password" 48
generate_secret "$SECRET_DIR/oxidized_token" 48
generate_secret "$SECRET_DIR/passkey_secret" 48
if [ ! -e "$CLAIM_DIR/installation_claim_token" ]; then
    if [ -e "$SECRET_DIR/installation_claim_token" ]; then
        mv "$SECRET_DIR/installation_claim_token" "$CLAIM_DIR/installation_claim_token"
    else
        printf 'initial:' > "$CLAIM_DIR/installation_claim_token"
        openssl rand -base64 24 | tr -d '\n' >> "$CLAIM_DIR/installation_claim_token"
        printf '\n' >> "$CLAIM_DIR/installation_claim_token"
    fi
fi

if [ ! -s "$SECRET_DIR/app_key" ]; then
    printf 'base64:' > "$SECRET_DIR/app_key"
    openssl rand -base64 32 | tr -d '\n' >> "$SECRET_DIR/app_key"
    printf '\n' >> "$SECRET_DIR/app_key"
fi

POSTGRES_PASSWORD="$(tr -d '\n' < "$SECRET_DIR/postgres_password")"
APP_KEY="$(tr -d '\n' < "$SECRET_DIR/app_key")"
OXIDIZED_TOKEN="$(tr -d '\n' < "$SECRET_DIR/oxidized_token")"
PASSKEY_SECRET="$(tr -d '\n' < "$SECRET_DIR/passkey_secret")"

{
    printf 'APP_NAME=NetKeep\n'
    printf 'APP_KEY=%s\n' "$APP_KEY"
    printf 'APP_URL=http://localhost\n'
    printf 'DB_CONNECTION=pgsql\n'
    printf 'DB_HOST=postgres\n'
    printf 'DB_PORT=5432\n'
    printf 'DB_DATABASE=netkeep\n'
    printf 'DB_USERNAME=netkeep\n'
    printf 'DB_PASSWORD=%s\n' "$POSTGRES_PASSWORD"
    printf 'OXIDIZED_INTERNAL_TOKEN=%s\n' "$OXIDIZED_TOKEN"
    printf 'PASSKEYS_USER_HANDLE_SECRET=%s\n' "$PASSKEY_SECRET"
} > "$SECRET_DIR/app.env"

if [ ! -s "$SANDBOX_DIR/config" ]; then
    {
        printf '%s\n' '---'
        printf '%s\n' 'resolve_dns: false'
        printf '%s\n' 'interval: 0'
        printf '%s\n' 'threads: 1'
        printf '%s\n' 'use_max_threads: false'
        printf '%s\n' 'timeout: 20'
        printf '%s\n' 'timelimit: 300'
        printf '%s\n' 'retries: 0'
        printf '%s\n' 'next_adds_job: false'
        printf '%s\n' 'extensions:'
        printf '%s\n' '  oxidized-web:'
        printf '%s\n' '    load: true'
        printf '%s\n' '    listen: 0.0.0.0'
        printf '%s\n' '    port: 8888'
        printf '%s\n' '    vhosts:'
        printf '%s\n' '      - sandbox'
        printf '%s\n' 'input:'
        printf '%s\n' '  default: ssh'
        printf '%s\n' '  debug: false'
        printf '%s\n' '  ssh:'
        printf '%s\n' '    secure: true'
        printf '%s\n' 'output:'
        printf '%s\n' '  default: git'
        printf '%s\n' '  git:'
        printf '%s\n' '    user: NetKeep Sandbox'
        printf '%s\n' '    email: netkeep@localhost'
        printf '%s\n' '    single_repo: true'
        printf '%s\n' '    repo: /home/oxidized/.config/oxidized/repository'
        printf '%s\n' 'source:'
        printf '%s\n' '  default: http'
        printf '%s\n' '  http:'
        printf '%s\n' '    url: http://app:8080/internal/oxidized/sandbox-nodes'
        printf '%s\n' '    scheme: http'
        printf '%s\n' '    read_timeout: 30'
        printf '%s\n' '    map:'
        printf '%s\n' '      name: name'
        printf '%s\n' '      ip: ip'
        printf '%s\n' '      model: model'
        printf '%s\n' '      group: group'
        printf '%s\n' '      username: username'
        printf '%s\n' '      password: password'
        printf '%s\n' '      input: input'
        printf '%s\n' '      timeout: timeout'
        printf '%s\n' '    vars_map:'
        printf '%s\n' '      enable: enable'
        printf '%s\n' '      remove_secret: remove_secret'
        printf '%s\n' '      ssh_port: ssh_port'
        printf '%s\n' '      ssh_keys: ssh_keys'
        printf '%s\n' '    headers:'
        printf "      X-NetKeep-Token: '%s'\n" "$OXIDIZED_TOKEN"
    } > "$SANDBOX_DIR/config"
fi

if [ ! -s "$OXIDIZED_DIR/config" ]; then
    {
        printf '%s\n' '---'
        printf '%s\n' 'resolve_dns: false'
        printf '%s\n' 'interval: 0'
        printf '%s\n' 'threads: 5'
        printf '%s\n' 'use_max_threads: false'
        printf '%s\n' 'timeout: 20'
        printf '%s\n' 'timelimit: 300'
        printf '%s\n' 'retries: 0'
        printf '%s\n' 'next_adds_job: false'
        printf '%s\n' 'vars:'
        printf '%s\n' '  remove_secret: false'
        printf '%s\n' 'groups: {}'
        printf '%s\n' 'models: {}'
        printf '%s\n' 'extensions:'
        printf '%s\n' '  oxidized-web:'
        printf '%s\n' '    load: true'
        printf '%s\n' '    listen: 0.0.0.0'
        printf '%s\n' '    port: 8888'
        printf '%s\n' '    vhosts:'
        printf '%s\n' '      - oxidized'
        printf '%s\n' 'input:'
        printf '%s\n' '  default: ssh'
        printf '%s\n' '  debug: false'
        printf '%s\n' '  ssh:'
        printf '%s\n' '    secure: true'
        printf '%s\n' 'output:'
        printf '%s\n' '  default: git'
        printf '%s\n' '  git:'
        printf '%s\n' '    user: NetKeep'
        printf '%s\n' '    email: netkeep@localhost'
        printf '%s\n' '    single_repo: true'
        printf '%s\n' '    repo: /home/oxidized/.config/oxidized/repository'
        printf '%s\n' 'source:'
        printf '%s\n' '  default: http'
        printf '%s\n' '  http:'
        printf '%s\n' '    url: http://app:8080/internal/oxidized/nodes'
        printf '%s\n' '    scheme: http'
        printf '%s\n' '    read_timeout: 120'
        printf '%s\n' '    map:'
        printf '%s\n' '      name: name'
        printf '%s\n' '      ip: ip'
        printf '%s\n' '      model: model'
        printf '%s\n' '      group: group'
        printf '%s\n' '      username: username'
        printf '%s\n' '      password: password'
        printf '%s\n' '      input: input'
        printf '%s\n' '      timeout: timeout'
        printf '%s\n' '    vars_map:'
        printf '%s\n' '      enable: enable'
        printf '%s\n' '      remove_secret: remove_secret'
        printf '%s\n' '      ssh_port: ssh_port'
        printf '%s\n' '      telnet_port: telnet_port'
        printf '%s\n' '      ssh_keys: ssh_keys'
        printf '%s\n' '    headers:'
        printf "      X-NetKeep-Token: '%s'\n" "$OXIDIZED_TOKEN"
        printf '%s\n' 'logger:'
        printf '%s\n' '  appenders:'
        printf '%s\n' '    - type: stdout'
        printf '%s\n' '      level: info'
    } > "$OXIDIZED_DIR/config"
fi

harden_engine_config() {
    config="$1"
    mode="$2"
    grep -q '^  ssh:' "$config"
    secure_present=0
    if grep -q '^    secure:' "$config"; then
        secure_present=1
    fi
    single_repo_present=0
    if grep -q '^    single_repo:' "$config"; then
        single_repo_present=1
    fi
    temporary="${config}.secure.$$"
    awk -v mode="$mode" -v secure_present="$secure_present" -v single_repo_present="$single_repo_present" '
        BEGIN {
            interval_seen = 0
            threads_seen = 0
            max_threads_seen = 0
            retries_seen = 0
            next_job_seen = 0
        }
        /^interval:/ {
            print "interval: 0"
            interval_seen = 1
            next
        }
        /^threads:/ {
            current = $2
            if (mode == "sandbox" || current !~ /^[0-9]+$/ || current < 1 || current > 20) {
                current = mode == "sandbox" ? 1 : 5
            }
            print "threads: " current
            threads_seen = 1
            next
        }
        /^use_max_threads:/ {
            print "use_max_threads: false"
            max_threads_seen = 1
            next
        }
        /^retries:/ {
            print "retries: 0"
            retries_seen = 1
            next
        }
        /^next_adds_job:/ {
            print "next_adds_job: false"
            next_job_seen = 1
            next
        }
        /^    url: http:\/\/app(:[0-9]+)?\/internal\/oxidized\/(sandbox-)?nodes$/ {
            print "    url: http://app:8080/internal/oxidized/" (mode == "sandbox" ? "sandbox-nodes" : "nodes")
            next
        }
        /^  ssh:/ {
            print
            if (! secure_present) {
                print "    secure: true"
            }
            next
        }
        /^    secure:/ {
            print "    secure: true"
            next
        }
        /^  git:/ {
            print
            if (! single_repo_present) {
                print "    single_repo: true"
            }
            next
        }
        /^    single_repo:/ {
            print "    single_repo: true"
            next
        }
        {
            print
        }
        END {
            if (! interval_seen) print "interval: 0"
            if (! threads_seen) print "threads: " (mode == "sandbox" ? 1 : 5)
            if (! max_threads_seen) print "use_max_threads: false"
            if (! retries_seen) print "retries: 0"
            if (! next_job_seen) print "next_adds_job: false"
        }
    ' "$config" > "$temporary"
    chmod 0640 "$temporary"
    mv "$temporary" "$config"
}

harden_engine_config "$OXIDIZED_DIR/config" production
harden_engine_config "$SANDBOX_DIR/config" sandbox

prepare_repository() {
    repository="$1"
    username="$2"
    if [ ! -d "$repository/.git" ]; then
        git -C "$repository" init --initial-branch=main
    fi
    mkdir -p "$repository/.git/objects/info" "$repository/.git/objects/pack" "$repository/.git/refs/heads" "$repository/.git/refs/tags"
    rm -rf "$repository/.git/hooks"
    mkdir -p "$repository/.git/hooks"
    rm -f "$repository/.git/config" "$repository/.git/config.worktree" "$repository/.git/objects/info/alternates" "$repository/.git/objects/info/http-alternates"
    printf 'ref: refs/heads/main\n' > "$repository/.git/HEAD"
    git config --file "$repository/.git/config" core.repositoryFormatVersion 0
    git config --file "$repository/.git/config" core.fileMode true
    git config --file "$repository/.git/config" core.bare false
    git config --file "$repository/.git/config" core.logAllRefUpdates true
    git config --file "$repository/.git/config" core.sharedRepository group
    git config --file "$repository/.git/config" user.name "$username"
    git config --file "$repository/.git/config" user.email netkeep@localhost
    git -c safe.directory="$repository" -C "$repository" rev-parse --verify HEAD >/dev/null 2>&1 \
        || git -c safe.directory="$repository" -C "$repository" commit --allow-empty --message "Initialize NetKeep configuration history"
}

prepare_repository "$OXIDIZED_DIR/repository" NetKeep
prepare_repository "$SANDBOX_DIR/repository" "NetKeep Sandbox"

rm -f "$OXIDIZED_DIR/pid" "$OXIDIZED_DIR/crash"
rm -f "$SANDBOX_DIR/pid" "$SANDBOX_DIR/crash"

chown -R 30000:30000 "$OXIDIZED_DIR" "$SANDBOX_DIR"
chown -R 20000:20000 "$STORAGE_DIR" "$BACKUP_DIR" "$RESTORE_DIR" "$UPDATE_DIR" "$CACHE_DIR" "$CADDY_DATA_DIR" "$CADDY_CONFIG_DIR"
find "$UPDATE_DIR" -type d -exec chmod 2770 {} \;
find "$UPDATE_DIR" -type f -exec chmod 0660 {} \;
chown -R root:20000 "$SECRET_DIR"
chown -R root:20000 "$RECOVERY_SECRET_DIR"
chown -R root:20000 "$CLAIM_DIR"
chmod 0750 "$SECRET_DIR" "$RECOVERY_SECRET_DIR"
chmod 0770 "$CLAIM_DIR"
chmod 0770 "$UPDATE_DIR" "$UPDATE_DIR/queue" "$UPDATE_DIR/requests" "$UPDATE_DIR/status"
chmod 2770 "$OXIDIZED_DIR" "$SANDBOX_DIR" "$OXIDIZED_DIR/model" "$OXIDIZED_DIR/.ssh" "$OXIDIZED_DIR/repository" "$SANDBOX_DIR/model" "$SANDBOX_DIR/.ssh" "$SANDBOX_DIR/repository"
find "$OXIDIZED_DIR/repository" "$SANDBOX_DIR/repository" -type d -exec chmod 2770 {} +
find "$OXIDIZED_DIR/repository" "$SANDBOX_DIR/repository" -type f -exec chmod 0660 {} +
chmod 0640 "$SECRET_DIR"/* "$RECOVERY_SECRET_DIR"/* "$OXIDIZED_DIR/config" "$SANDBOX_DIR/config"
chmod 0660 "$CLAIM_DIR/installation_claim_token"
