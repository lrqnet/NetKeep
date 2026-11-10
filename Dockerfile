# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM composer:2@sha256:5190d9b445add2fa26090108273cb1ef1e1af98175201c737b85b3c4f90fbf7c AS php-dependencies
WORKDIR /app
COPY scripts/check-php-security.php scripts/check-php-security.php
RUN php scripts/check-php-security.php
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader
COPY app app
COPY bootstrap bootstrap
COPY config config
COPY database database
COPY lang lang
COPY public public
COPY resources resources
COPY routes routes
COPY artisan .
RUN composer dump-autoload --no-dev --classmap-authoritative --no-scripts

FROM composer:2@sha256:5190d9b445add2fa26090108273cb1ef1e1af98175201c737b85b3c4f90fbf7c AS php-test-dependencies
WORKDIR /app
COPY scripts/check-php-security.php scripts/check-php-security.php
RUN php scripts/check-php-security.php
COPY composer.json composer.lock ./
RUN composer install \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

FROM node:22-bookworm-slim@sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY resources resources
COPY public public
COPY components.json tsconfig.json vite.config.ts ./
RUN npm run build

FROM postgres:18.6-bookworm@sha256:f1ea2a1a4fb7b68d4836be1fdcb8a6466a89b072158bf9d97663600538c294c5 AS postgres-client

FROM dunglas/frankenphp:1-php8.4-bookworm@sha256:30061df7626971d597e45962269dfa7c077d972e96d1c4baf7c9259d5f7ecd55 AS runtime-base
COPY scripts/check-php-security.php /usr/local/lib/netkeep/check-php-security.php
RUN php /usr/local/lib/netkeep/check-php-security.php \
    && frankenphp php-cli /usr/local/lib/netkeep/check-php-security.php
RUN install-php-extensions \
        bcmath \
        intl \
        opcache \
        pcntl \
        pdo_pgsql \
        pdo_sqlite \
        zip \
    && apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && apt-get install -y --no-install-recommends \
        age \
        ca-certificates \
        curl \
        git \
        libcap2-bin \
        openssh-client \
        openssl \
        postgresql-client \
        ruby \
        tar \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 20000 netkeep \
    && useradd --uid 20000 --gid 20000 --home-dir /app --no-create-home --shell /usr/sbin/nologin netkeep

ARG NETKEEP_VERSION=dev
LABEL org.opencontainers.image.title="NetKeep" \
    org.opencontainers.image.authors="Lucas Quaresma <keep@lrq.lat>" \
    org.opencontainers.image.source="https://github.com/lrqnet/NetKeep" \
    org.opencontainers.image.licenses="AGPL-3.0-only"
ENV APP_ENV=production \
    APP_DEBUG=false \
    NETKEEP_VERSION=${NETKEEP_VERSION} \
    LOG_CHANNEL=stderr \
    SESSION_DRIVER=database \
    CACHE_STORE=database \
    QUEUE_CONNECTION=database \
    OCTANE_SERVER=frankenphp \
    OXIDIZED_URL=http://oxidized:8888 \
    OXIDIZED_SANDBOX_URL=http://sandbox:8888 \
    OXIDIZED_CONFIG_PATH=/var/lib/netkeep/oxidized \
    OXIDIZED_SANDBOX_CONFIG_PATH=/var/lib/netkeep/sandbox \
    OXIDIZED_GIT_PATH=/var/lib/netkeep/oxidized/repository \
    NETKEEP_BACKUP_PATH=/var/lib/netkeep/backups \
    NETKEEP_UPDATE_EXCHANGE_PATH=/var/lib/netkeep/updates \
    LD_LIBRARY_PATH=/usr/local/lib

WORKDIR /app
COPY --from=php-dependencies /app /app
COPY --from=frontend /app/public/build /app/public/build
COPY --from=postgres-client /usr/lib/postgresql/18 /usr/lib/postgresql/18
COPY --from=postgres-client /usr/lib/*-linux-gnu/libpq.so.5* /usr/local/lib/
COPY docker/Caddyfile /etc/frankenphp/Caddyfile
COPY docker/entrypoint.sh docker/init-secrets.sh docker/worker.sh docker/scheduler.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/init-secrets.sh /usr/local/bin/worker.sh /usr/local/bin/scheduler.sh \
    && printf '%s\n' 'upload_max_filesize=2G' 'post_max_size=2G' 'upload_tmp_dir=/var/lib/netkeep/restore-inbox' > /usr/local/etc/php/conf.d/netkeep-upload.ini \
    && ln -sf /usr/lib/postgresql/18/bin/pg_dump /usr/local/bin/pg_dump \
    && ln -sf /usr/lib/postgresql/18/bin/pg_restore /usr/local/bin/pg_restore \
    && ln -sf /usr/lib/postgresql/18/bin/psql /usr/local/bin/psql \
    && setcap -r /usr/local/bin/frankenphp \
    && ldconfig \
    && find /app/bootstrap/cache -type f ! -name .gitignore -delete \
    && mkdir -p \
        /app/storage/app/public \
        /app/storage/framework/cache \
        /app/storage/framework/sessions \
        /app/storage/framework/views \
        /app/storage/logs \
        /app/bootstrap/cache \
        /var/lib/netkeep/backups \
        /var/lib/netkeep/oxidized \
        /var/lib/netkeep/sandbox \
        /var/lib/netkeep/updates \
        /var/lib/netkeep/restore-inbox \
    && ln -s ../storage/app/public /app/public/storage \
    && chown -R 20000:20000 /app/storage /app/bootstrap/cache /var/lib/netkeep/backups /var/lib/netkeep/restore-inbox

USER 20000:20000

EXPOSE 8080 8443
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["curl", "--fail", "--silent", "http://localhost:8080/up"]

FROM runtime-base AS test
ENV APP_ENV=testing \
    APP_DEBUG=true
COPY --from=php-test-dependencies /usr/bin/composer /usr/local/bin/composer
COPY --from=php-test-dependencies /app/vendor /app/vendor
COPY compose.yaml ./compose.yaml
COPY phpunit.xml phpstan.neon pint.json ./
COPY .env.example .env
COPY tests tests
COPY scripts scripts
COPY Dockerfile Dockerfile.oxidized Dockerfile.updater ./

FROM runtime-base AS production
