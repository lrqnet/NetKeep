# Instalação

## Requisitos

- servidor Linux `amd64` ou `arm64`;
- Docker Engine 25 ou superior;
- Docker Compose plugin 2.24 ou superior;
- portas TCP 80 e 443 livres;
- DNS apontado para o servidor caso HTTPS por domínio seja usado;
- armazenamento persistente com espaço compatível com o histórico.

Recomendamos volume ou disco criptografado no host, firewall permitindo o
painel somente das redes administrativas e uma rotina externa de backup.

## Instalar uma versão

Baixe sempre o Compose anexado a uma release. Esse arquivo fixa por digest as
imagens `netkeep`, `netkeep-oxidized`, `netkeep-updater` e PostgreSQL. As imagens próprias
também são espelhadas no GHCR.

```bash
mkdir -p /opt/netkeep
cd /opt/netkeep
curl -fsSLO https://github.com/lrqnet/NetKeep/releases/download/v1.0.3/compose.yaml
docker compose up -d --wait
docker compose ps
```

O primeiro `up`:

1. gera chaves e tokens em `netkeep_secrets`, o token de posse em
   `netkeep_claim` e a credencial administrativa do banco em
   `netkeep_recovery_secrets`;
2. cria um usuário PostgreSQL não privilegiado para a aplicação;
3. inicializa repositórios, executa migrations e materializa configurações;
4. inicia web, worker, scheduler, Oxidized, sandbox e o updater isolado;
5. publica somente 80/443. PostgreSQL e as APIs dos motores não são publicados.

Consulte o token de posse sem procurar dentro do volume e sem expô-lo em logs:

```bash
docker compose exec app php artisan netkeep:installation-token
```

Processos PHP iniciados por `docker compose exec app` carregam o ambiente de
runtime diretamente do volume `netkeep_secrets`, que é montado somente para
leitura. O arquivo não é impresso, copiado para o host nem incluído no comando.
Evite `docker compose run app` para consultas administrativas, pois esse formato
também inicia dependências de execução única sem necessidade.

Abra `http://IP-DO-SERVIDOR`, informe esse token e crie o proprietário. O token
é invalidado depois da criação. Uma transação, um bloqueio e um índice parcial
garantem exatamente um proprietário.

No assistente, defina empresa, idioma, fuso, URL HTTPS canônica, logo,
intervalos e retenção. O painel mostra em vermelho o impacto de intervalos
baixos, timeouts altos, retries e concorrência. LibreNMS e NetBox ficam em
**Integrações**; webhook, Telegram e SMTP em **Notificações**; Git, S3 e cópias
locais em **Proteção de dados**.

## HTTPS

Após criar um registro A/AAAA, informe o domínio como URL canônica. Caddy tenta
ACME e mantém uma autoridade interna para IP fixo. Nesse caso, instale a raiz
da autoridade interna nos navegadores administrativos para remover o aviso de
certificado. Links de convite e recuperação usam exclusivamente essa URL,
nunca o cabeçalho `Host`.

Extraia somente o certificado público da autoridade interna:

```bash
docker compose cp app:/data/caddy/pki/authorities/local/root.crt ./netkeep-root-ca.crt
```

Distribua `netkeep-root-ca.crt` apenas aos dispositivos administrativos. O
volume `caddy_data` também contém a chave privada dessa autoridade e deve ser
protegido como segredo; nunca copie nem publique o arquivo `root.key`.

Depois do setup, o modo seguro bloqueia login e passkeys por HTTP/IP. O acesso
por IP mostra somente orientação de recuperação. Liberar login HTTP por IP
exige habilitar um recurso perigoso pelo proprietário e cria uma sessão
separada de cinco minutos. Não exponha diretamente o contêiner `app` atrás de
outro proxy sem preservar as restrições de host e de `/internal`.

## Verificações

```bash
docker compose ps
curl -fsS http://127.0.0.1/up
docker compose exec app php artisan about
```

`postgres`, `app`, `worker`, `scheduler`, `oxidized`, `sandbox` e `updater` devem ficar
saudáveis. `init` e `database-init` devem aparecer como `Exited (0)`, pois são
serviços de execução única concluídos com sucesso. Reiniciar a pilha não
regenera segredos existentes. O healthcheck do updater valida a atualização
recente do heartbeat no volume `update_exchange`; um estado unhealthy indica
que o agente não está processando sua fila e deve impedir uma atualização.

Confirme que a conta usada pela aplicação não possui privilégios elevados:

```bash
docker compose exec postgres sh -c \
  'PGPASSWORD="$(cat /run/netkeep-recovery-secrets/postgres_admin_password)" psql -U netkeep_admin -d postgres -c "\du netkeep"'
```

## Volumes

- `postgres_data`: banco;
- `netkeep_secrets`: chaves e tokens internos;
- `netkeep_claim`: token de posse inicial ou de recuperação, invalidado após o
  uso;
- `netkeep_recovery_secrets`: credencial administrativa, acessível somente aos
  serviços de inicialização e recuperação;
- `netkeep_storage`: uploads, logs, sessões e traces diagnósticos já
  criptografados durante a retenção de 24 horas;
- `oxidized_config` e `sandbox_config`: configurações e modelos isolados;
- `oxidized_git`: histórico permanente;
- `sandbox_git`: volume legado declarado e não montado; o Git e os traces em
  plaintext do sandbox atual ficam somente em `tmpfs`;
- `backup_data`: arquivos completos locais;
- `restore_inbox`: uploads e estado transacional de restauração;
- `update_exchange`: pedidos atômicos, heartbeat e estados do updater;
- `caddy_data` e `caddy_config`: certificados e estado do Caddy.

Não remova volumes durante uma atualização.

## Serviços privilegiados e opcionais

O serviço `recovery` só inicia com `--profile recovery` e não recebe o socket
Docker. O `updater` inicia por padrão, não possui rede nem porta e é o único
serviço com o socket Docker. Esse acesso equivale a root no host; o agente só
aceita Compose e manifestos oficiais assinados e nunca recebe comandos HTTP.
