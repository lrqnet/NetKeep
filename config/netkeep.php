<?php

return [
    'session' => [
        'lifetime' => (int) env('SESSION_LIFETIME', 120),
        'expire_on_close' => (bool) env('SESSION_EXPIRE_ON_CLOSE', false),
    ],

    'version' => env('NETKEEP_VERSION', 'dev'),
    'source_url' => env('NETKEEP_SOURCE_URL', 'https://github.com/lrqnet/NetKeep'),
    'oxidized' => [
        'url' => env('OXIDIZED_URL', 'http://oxidized:8888'),
        'token' => env('OXIDIZED_INTERNAL_TOKEN'),
        'config_path' => env('OXIDIZED_CONFIG_PATH', storage_path('app/oxidized')),
        'git_path' => env('OXIDIZED_GIT_PATH', storage_path('app/oxidized/repository')),
        'timeout' => (int) env('OXIDIZED_HTTP_TIMEOUT', 10),
    ],
    'collections' => [
        'concurrency' => (int) env('NETKEEP_COLLECTION_CONCURRENCY', 5),
        'max_concurrency' => 20,
        'site_concurrency' => (int) env('NETKEEP_SITE_COLLECTION_CONCURRENCY', 2),
        'manual_cooldown' => (int) env('NETKEEP_MANUAL_COLLECTION_COOLDOWN', 300),
        'retry_delays' => [60, 300, 900],
    ],
    'sandbox' => [
        'url' => env('OXIDIZED_SANDBOX_URL', 'http://sandbox:8888'),
        'config_path' => env('OXIDIZED_SANDBOX_CONFIG_PATH', storage_path('app/oxidized-sandbox')),
        'timeout' => (int) env('OXIDIZED_SANDBOX_HTTP_TIMEOUT', 10),
    ],
    'installation_claim_path' => env('NETKEEP_INSTALLATION_CLAIM_PATH', '/run/netkeep-claim/installation_claim_token'),
    'app_key_path' => env('NETKEEP_APP_KEY_PATH', '/run/netkeep-secrets/app_key'),
    'passkey_secret_path' => env('NETKEEP_PASSKEY_SECRET_PATH', '/run/netkeep-secrets/passkey_secret'),
    'database_admin' => [
        'username' => env('NETKEEP_DATABASE_ADMIN_USERNAME', 'netkeep_admin'),
        'password_path' => env(
            'NETKEEP_DATABASE_ADMIN_PASSWORD_PATH',
            '/run/netkeep-recovery-secrets/postgres_admin_password',
        ),
    ],
    'restore_inbox' => env('NETKEEP_RESTORE_INBOX', '/var/lib/netkeep/restore-inbox'),
    'restore_max_expanded_size' => (int) env('NETKEEP_RESTORE_MAX_EXPANDED_SIZE', 21474836480),
    'restore_max_files' => (int) env('NETKEEP_RESTORE_MAX_FILES', 200000),
    'caddy_dynamic_path' => env('NETKEEP_CADDY_DYNAMIC_PATH', '/config/netkeep-canonical.caddy'),
    'caddy_global_path' => env('NETKEEP_CADDY_GLOBAL_PATH', '/config/netkeep-global.caddy'),
    'backup_path' => env('NETKEEP_BACKUP_PATH', storage_path('app/backups')),
    'updates' => [
        'wud_url' => env('WUD_URL', 'http://wud:3000'),
    ],
];
