FROM debian:bookworm-20260623-slim@sha256:60eac759739651111db372c07be67863818726f754804b8707c90979bda511df

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssh-client openssh-server \
    && rm -rf /var/lib/apt/lists/*

COPY network-cli /usr/local/bin/network-cli

RUN chmod 0755 /usr/local/bin/network-cli \
    && useradd --create-home --shell /usr/local/bin/network-cli netkeep \
    && printf 'netkeep:e2e\n' | chpasswd \
    && mkdir -p /run/sshd \
    && ssh-keygen -A \
    && printf '%s\n' \
        'PasswordAuthentication yes' \
        'PermitRootLogin no' \
        'UsePAM no' \
        'PrintMotd no' \
        'LogLevel ERROR' \
        'AllowUsers netkeep' \
        >> /etc/ssh/sshd_config

EXPOSE 22

HEALTHCHECK --interval=5s --timeout=3s --retries=20 CMD ssh-keyscan -T 2 localhost >/dev/null 2>&1

CMD ["/usr/sbin/sshd", "-D", "-e"]
