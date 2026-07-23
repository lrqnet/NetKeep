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
git tag -a v1.0.5 -m "NetKeep v1.0.5"
git push origin refs/tags/v1.0.5
```

O workflow:

1. confirma que a tag é anotada, aponta exatamente para a `main` remota e
   corresponde às versões do Compose, changelog, README e guias;
2. rejeita uma release existente ou qualquer tag imutável de imagem já
   publicada, falhando antes de autenticar jobs de build;
3. autentica no GHCR com `GITHUB_TOKEN` e no Docker Hub com os secrets;
4. constrói NetKeep, NetKeep-Updater e NetKeep-Oxidized para `amd64` e `arm64`;
5. publica as tags SemVer do painel e updater e a revisão imutável
   `netkeep-oxidized:0.37.0-r3`;
6. gera SBOM e provenance das imagens e assina seus digests nos dois
   registries;
7. substitui as tags do Compose pelos digests publicados;
8. cria a release no GitHub e anexa Compose, manifesto, bundle Sigstore e
   avisos de terceiros.

O Compose nunca usa `latest`; a tag existe apenas para descoberta manual.

## Conferência

```bash
docker pull lrqnet/netkeep:1.0.5
docker image inspect lrqnet/netkeep:1.0.5
cosign verify \
  --certificate-identity='https://github.com/lrqnet/NetKeep/.github/workflows/release.yml@refs/tags/v1.0.5' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com' \
  docker.io/lrqnet/netkeep:1.0.5

cosign verify \
  --certificate-identity='https://github.com/lrqnet/NetKeep/.github/workflows/release.yml@refs/tags/v1.0.5' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com' \
  docker.io/lrqnet/netkeep-oxidized:0.37.0-r3
```

Verifique também `docker.io/lrqnet/netkeep-updater:1.0.5` com a mesma
identidade e emissor.

Se qualquer registry, assinatura ou criação da release falhar depois de uma
publicação parcial, não execute novamente o workflow, não mova a tag e não
sobrescreva imagens versionadas. Audite Docker Hub, GHCR e GitHub Release e
prepare a correção na próxima versão patch.

## Deploy ou atualização

Em um servidor novo:

```bash
mkdir -p /opt/netkeep
cd /opt/netkeep
curl -fsSLO https://github.com/lrqnet/NetKeep/releases/download/v1.0.5/compose.yaml
docker compose up -d
```

Em uma instalação existente, gere primeiro um backup completo e depois:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

Publicar uma imagem não força atualização dos servidores. O workflow publica e
assina as imagens versionadas, fixa os três digests no Compose, gera
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
