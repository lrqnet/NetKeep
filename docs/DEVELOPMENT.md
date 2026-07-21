# Desenvolvimento e testes locais

## Teste completo com Docker

Esse é o caminho mais próximo de uma instalação real. Use um nome de projeto
exclusivo para não compartilhar volumes com outra instalação.

```bash
docker build \
  --target production \
  --build-arg NETKEEP_VERSION=local \
  --tag netkeep:local \
  .

export COMPOSE_PROJECT_NAME=netkeep-local
export NETKEEP_IMAGE=netkeep:local
export NETKEEP_BIND_IP=127.0.0.1
export NETKEEP_HTTP_PORT=8080
export NETKEEP_HTTPS_PORT=8443

docker compose up -d --wait
docker compose ps
curl -fsS http://127.0.0.1:8080/up
```

Abra `http://127.0.0.1:8080`, crie o primeiro proprietário e conclua o
assistente. PostgreSQL e Oxidized não publicam portas no host.

O primeiro build pode levar alguns minutos porque instala e compila as
extensões do PHP. As execuções seguintes reutilizam o cache do Docker e são
consideravelmente mais rápidas, desde que a base e as dependências não tenham
mudado. A saída HTML de `/up` confirma que o Laravel está saudável; a interface
fica na raiz `/`.

Se as portas padrão já estiverem ocupadas, escolha outras antes de subir:

```bash
export NETKEEP_HTTP_PORT=18080
export NETKEEP_HTTPS_PORT=18443
docker compose up -d --wait
```

Para acompanhar a aplicação:

```bash
docker compose logs --follow app worker scheduler oxidized
```

Para reiniciar e confirmar persistência:

```bash
docker compose restart
docker compose up -d --wait
curl -fsS http://127.0.0.1:8080/up
```

Ao terminar:

```bash
docker compose down
```

Use `docker compose down --volumes` somente para apagar integralmente os dados
desse ambiente local.

## Testes PHP isolados

```bash
docker build --target test --tag netkeep:test .
docker run --rm --entrypoint composer netkeep:test test
```

Esse comando executa Pint, PHPStan e PHPUnit. A suíte inclui autenticação,
papéis, inventário, fonte HTTP do Oxidized, histórico Git, modelos, alertas,
integrações, backup e catálogo com 5.000 equipamentos.

## Jornada E2E completa

O ambiente E2E é separado da instalação local e usa o projeto Compose
`netkeep-e2e`. Ele adiciona somente durante os testes:

- S3Mock para upload, download, checksum, criptografia e restauração;
- WireMock para payloads, assinatura HMAC, retries e Telegram;
- Mailpit para entrega SMTP e inspeção das mensagens;
- um equipamento Cisco IOS simulado por SSH para aprovação, coleta e commit
  Git reais.

Esses serviços estão exclusivamente em `compose.e2e.yaml`. Eles não fazem
parte do `compose.yaml` distribuído nas releases e não são instalados nos
servidores dos usuários.

Instale o Chromium do Playwright e execute a jornada usada em pull requests:

```bash
npm ci
npx playwright install chromium
./scripts/e2e-test.sh chromium
```

O teste parte de volumes vazios e percorre:

1. seleção de idioma, criação do proprietário e setup;
2. confirmação de senha, credencial e equipamento;
3. fingerprint SSH, aprovação e coleta pelo Oxidized;
4. commit da configuração no repositório Git;
5. Webhook, Telegram e SMTP contra os simuladores;
6. backup v2 criptografado, upload e download no S3Mock;
7. `prepare`, `apply` e `finalize` pelo contêiner de recuperação;
8. prova no PostgreSQL e no Git de que o estado anterior foi restaurado.

O ambiente permanece disponível ao final em
`https://127.0.0.1:18444`. Os serviços de inspeção usam apenas loopback:

| Serviço  | Endereço local            |
| -------- | ------------------------- |
| NetKeep  | `https://127.0.0.1:18444` |
| Mailpit  | `http://127.0.0.1:18025`  |
| WireMock | `http://127.0.0.1:18082`  |
| S3Mock   | `http://127.0.0.1:19090`  |

Para executar Chromium, Firefox, WebKit e os perfis móveis:

```bash
npx playwright install chromium firefox webkit
./scripts/e2e-test.sh all
```

Relatórios, traces, vídeos e screenshots ficam em `playwright-report` e
`test-results`. Para remover somente esse ambiente:

```bash
docker compose \
  -p netkeep-e2e \
  -f compose.yaml \
  -f compose.dev.yaml \
  -f compose.e2e.yaml \
  down --volumes --remove-orphans
```

### Cloudflare R2 opcional

A execução noturna sempre usa S3Mock. Um smoke test adicional contra um bucket
R2 real é habilitado somente quando estes secrets existem no GitHub:

- `NETKEEP_R2_ENDPOINT`;
- `NETKEEP_R2_BUCKET`;
- `NETKEEP_R2_ACCESS_KEY`;
- `NETKEEP_R2_SECRET_KEY`.

Use um bucket exclusivo para testes e credenciais limitadas a listar, gravar,
ler e excluir objetos nesse bucket. O teste usa um prefixo `netkeep-e2e`,
confere o conteúdo e remove o objeto em `finally`. Na ausência dos secrets ele
é ignorado, sem enfraquecer a jornada obrigatória com S3Mock.

## Frontend

Com Node.js 22:

```bash
npm ci
npm run format:check
npm run lint:check
npm run translations:check
npm run types:check
npm run build
```

O favicon usa o mesmo escudo com nós da interface. Depois de alterar
`public/favicon.svg`, gere o ICO multirresolução e o Apple Touch Icon com o
Chromium fornecido pelo Playwright:

```bash
npx playwright install chromium
npm run assets:favicons
```

## Desenvolvimento nativo

Requer PHP 8.4, Composer 2, Node.js 22 e PostgreSQL.

```bash
cp .env.example .env
composer install
npm ci
php artisan key:generate
php artisan migrate
npm run dev
php artisan serve
```

Esse modo não inicializa automaticamente o Oxidized. Para validar a integração
completa, prefira a pilha Docker.

## Verificações antes de enviar mudanças

```bash
composer validate --strict --no-check-publish
composer ci:check
docker compose config --quiet
docker build --target production --build-arg NETKEEP_VERSION=local .
```

Revise também todos os arquivos novos e confirme que `.env`, chaves privadas,
dumps, backups e configurações reais de equipamentos não estão versionados.
