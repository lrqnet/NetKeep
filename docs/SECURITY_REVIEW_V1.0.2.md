# Revisão de segurança da v1.0.2

Data da revisão: 21 de julho de 2026.

## Escopo

A revisão cobre o filesystem do repositório e as imagens NetKeep,
NetKeep-Oxidized, NetKeep-Updater e o simulador SSH E2E. A validação utilizou
Trivy 0.70.0 com a base de vulnerabilidades atualizada, severidades alta e
crítica e somente vulnerabilidades com correção conhecida.

## Correções aplicadas

- dependência `golang.org/x/crypto` atualizada para 0.54.0;
- toolchain Go atualizado para 1.26.5, fixado por digest;
- FrankenPHP atualizado para o digest oficial atual e pacotes Debian
  atualizados durante o build;
- Docker CLI atualizado para 29.6.2 em Alpine 3.24.1;
- Buildx removido do updater por não fazer parte do fluxo de atualização;
- simulador SSH convertido em binário estático sobre `scratch`, sem sistema
  operacional ou pacotes de runtime;
- Oxidized preservado na versão 0.37.0, com pacotes do sistema atualizados no
  build;
- configurações altas e críticas não justificadas passaram a bloquear o CI;
- o backup diário passou a exigir um destino local ou S3 ativo antes de ser
  enfileirado pelo scheduler;
- a autorização sob demanda de certificados para URLs canônicas por IP passou
  a ocorrer em um endpoint interno do Caddy que aceita somente o IP configurado;
- a recarga TLS passou a usar a API administrativa do Caddy e a pré-emissão do
  certificado interno remove a dependência de um worker PHP no handshake;
- o instalador Cosign do workflow foi atualizado para a versão oficial 4.1.2,
  fixada por SHA, que valida o Cosign 3.0.6 pelos bundles Sigstore atuais.

Após as correções, filesystem, NetKeep-Oxidized e simulador não apresentaram
achados altos ou críticos corrigíveis. Os pacotes do sistema e o binário
próprio do updater também ficaram sem achados.

## Achados residuais de upstream

O scan ainda informa achados em três binários oficiais atuais:

- FrankenPHP: um achado alto em uma dependência Go incorporada;
- Cosign 3.0.6: 28 achados altos ou críticos em dependências incorporadas;
- Docker Compose 5.3.1: três achados altos em dependências incorporadas.

Na data da revisão, FrankenPHP no digest usado, Cosign 3.0.6 e Docker Compose
5.3.1 eram as distribuições oficiais atuais disponíveis ao projeto. Não existe
atualização oficial consumível que remova esses achados. Substituir o Cosign
oficial por um binário recompilado localmente enfraqueceria a confiança no
verificador da cadeia de fornecimento e não foi adotado.

O updater é o único serviço que contém Cosign e Docker Compose. Ele não possui
rede nem portas, usa filesystem somente leitura, remove capabilities, aplica
`no-new-privileges` e aceita apenas manifesto, Compose e bundle assinados pelo
workflow oficial. Esses controles reduzem a superfície, mas não eliminam o
risco root-equivalente do socket Docker.

## Decisão de release

Os relatórios das imagens continuam publicados como artefatos e alertas. CVEs
residuais de binários oficiais não bloqueiam automaticamente a release,
conforme a política do projeto. Uma nova versão oficial de qualquer um desses
binários deve ser avaliada e incorporada antes da release seguinte quando
remover os achados sem quebrar o fluxo de verificação offline.
