# Release, Docker Hub e deploy

## Repositórios de imagem

Cada release publica a mesma imagem multi-arquitetura em:

- `docker.io/lrqnet/netkeep`;
- `ghcr.io/lrqnet/netkeep`;
- `docker.io/lrqnet/netkeep-oxidized`;
- `ghcr.io/lrqnet/netkeep-oxidized`;
- `docker.io/lrqnet/netkeep-updater`;
- `ghcr.io/lrqnet/netkeep-updater`.

O Compose anexado à release usa Docker Hub por padrão e fixa os digests exatos
das três imagens. O GHCR permanece como espelho. Todas suportam `linux/amd64` e
`linux/arm64`, incluem SBOM e provenance e são assinadas com Cosign.

## Preparar o Docker Hub

1. Crie os repositórios públicos `lrqnet/netkeep`,
   `lrqnet/netkeep-oxidized` e `lrqnet/netkeep-updater` no Docker Hub.
2. Em **Account settings > Personal access tokens**, crie um token com
   permissão de leitura e escrita. Não use a senha da conta.
3. No GitHub, abra **Settings > Secrets and variables > Actions**.
4. Crie os secrets:

    - `DOCKERHUB_USERNAME`: usuário ou conta de automação com acesso ao
      repositório;
    - `DOCKERHUB_TOKEN`: token criado no Docker Hub.

O token fica somente no cofre de secrets do GitHub e não deve ser salvo em
`.env`, workflow, issue, log ou documentação.

## Publicação automática

O workflow `.github/workflows/release.yml` é acionado por tags SemVer:

```bash
git tag -a v1.0.2 -m "NetKeep v1.0.2"
git push origin v1.0.2
```

O workflow:

1. autentica no GHCR com `GITHUB_TOKEN`;
2. autentica no Docker Hub com os secrets;
3. constrói NetKeep, NetKeep-Oxidized e NetKeep-Updater para `amd64` e `arm64`;
4. publica as tags SemVer do painel e updater e `0.37.0-r1` do motor;
5. gera SBOM e provenance para as três imagens;
6. assina os digests nos dois registries;
7. substitui as tags do Compose pelos digests publicados;
8. cria a release no GitHub e anexa o Compose imutável.

O Compose nunca usa `latest`; a tag existe apenas para descoberta manual.

## Conferência

```bash
docker pull lrqnet/netkeep:1.0.2
docker image inspect lrqnet/netkeep:1.0.2
cosign verify \
  --certificate-identity-regexp='github.com/lrqnet/NetKeep' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com' \
  docker.io/lrqnet/netkeep:1.0.2

cosign verify \
  --certificate-identity-regexp='github.com/lrqnet/NetKeep' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com' \
  docker.io/lrqnet/netkeep-oxidized:0.37.0-r1
```

Verifique também `docker.io/lrqnet/netkeep-updater:1.0.2` com a mesma
identidade e emissor.

## Deploy ou atualização

Em um servidor novo:

```bash
mkdir -p /opt/netkeep
cd /opt/netkeep
curl -fsSLO https://github.com/lrqnet/NetKeep/releases/download/v1.0.2/compose.yaml
docker compose up -d
```

Em uma instalação existente, gere primeiro um backup completo e depois:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

Publicar uma imagem não força atualização dos servidores. O workflow publica e
assina as três imagens, fixa seus digests no Compose, gera
`update-manifest.json`, assina o manifesto com Cosign keyless e anexa o bundle
Sigstore. O painel só aplica esse conjunto depois do snapshot obrigatório e da
verificação offline. Atualização automática fica desligada por padrão. O
socket Docker do updater equivale a acesso root no host.

## Cadeia de fornecimento

Todos os `uses:` dos workflows são fixados por SHA completo. Imagens-base são
fixadas por digest. Trivy, Composer e npm continuam gerando relatórios mesmo
quando encontram CVEs altas ou críticas; a política aceita alertar sem bloquear
a release. Atualizações com correção disponível devem ser incorporadas antes da
publicação sempre que forem compatíveis.

O scanner de segredos é uma exceção deliberada: qualquer segredo detectado
falha o workflow. Pull requests também executam a jornada Chromium com
PostgreSQL, Oxidized, S3Mock, WireMock, Mailpit e restauração. O workflow
noturno acrescenta Firefox, WebKit, perfis móveis, screenshots e o smoke test
R2 quando as credenciais opcionais estão configuradas.
