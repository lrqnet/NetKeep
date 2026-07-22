# Changelog

Todas as mudanças relevantes serão registradas aqui. O projeto segue
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- scanner Trivy agora bloqueia configurações altas e críticas não justificadas
  e limita a exceção root-equivalente do updater ao arquivo, motivo e prazo de
  revisão definidos;
- simulador SSH E2E substituído por implementação mínima não-root em porta alta,
  sem pacotes de sistema instalados em runtime;
- toolchain Go atualizado para 1.26.5 e `golang.org/x/crypto` para 0.54.0,
  removendo vulnerabilidades corrigidas no servidor SSH de teste;
- bases FrankenPHP e Docker CLI atualizadas para revisões oficiais corrigidas,
  e o plugin Buildx não utilizado removido do updater.

### Fixed

- workflow de release atualizado para o instalador Cosign compatível com os
  bundles Sigstore publicados pelo Cosign 3.x, preservando a verificação do
  binário, das imagens e do manifesto de atualização;
- backup diário não é mais disparado pelo scheduler quando nenhum destino
  local/S3 está ativo;
- recarga da configuração TLS passa pela API administrativa do Caddy,
  preservando conexões e pré-emitindo o certificado interno por IP durante a
  ativação da URL canônica;
- autorização TLS por IP passa a ocorrer no próprio Caddy após o setup,
  eliminando a dependência circular de um worker PHP no handshake;
- healthchecks nativos adicionados às imagens NetKeep, NetKeep-Oxidized e
  NetKeep-Updater, com o agente validando a atualidade do heartbeat persistido;
- alertas Trivy de root no simulador, instalação de pacotes sem versão e
  ausência de healthcheck removidos sem reduzir o isolamento da produção.

## [1.0.2] - 2026-07-21

### Added

- descoberta horária de releases oficiais com ETag, preservação do último
  resultado, verificação manual assíncrona e notificação única por versão;
- card e indicador de atualização exclusivos do proprietário, estados
  operacionais, confirmação e stepper com reconexão após reinício;
- agente multi-arquitetura `netkeep-updater`, sem rede ou API, com validação
  offline de manifesto e Compose assinados por bundle Sigstore;
- snapshots locais criptografados obrigatórios, cópia adicional opcional,
  retenção dos três mais recentes e preservação indefinida após falha;
- política automática opt-in para patch e minor, com dias, janela no fuso da
  empresa, reautenticação e aceite explícito do risco do socket Docker.

### Changed

- WUD, profile, labels e integração HTTP removidos; somente o updater recebe o
  socket Docker e a comunicação com Laravel usa arquivos atômicos;
- workflow de release publica e assina a terceira imagem, fixa três digests e
  anexa Compose, manifesto e bundle Sigstore à release;
- atualização manual permanece disponível independentemente da política
  automática e sempre valida imagens antes da indisponibilidade.

### Security

- agente restringe origem, identidade do workflow, versão, upgrade, imagens,
  socket, symlinks, paths, replay e downgrades antes de aplicar a stack;
- rollback automático do Compose ocorre somente quando a release assinada o
  declara seguro; as demais falhas exigem recuperação com snapshot preservado.

## [1.0.1] - 2026-07-21

### Added

- favicon oficial com o escudo e os nós do NetKeep em SVG, ICO
  multirresolução e Apple Touch Icon, além de geração reproduzível pelo
  Playwright;
- regressões E2E para comandos Artisan após limpeza do cache de configuração e
  para falhas do scheduler durante a inicialização.

### Changed

- worker de filas duradouro com reinicialização controlada a cada cinco
  minutos e encerramento gracioso ao detectar manutenção, reduzindo o consumo
  ocioso sem comprometer restaurações;
- worker e scheduler aguardam o health check do Oxidized antes de iniciar;
- workflow de release substitui a versão SemVer atual por digest sem depender
  de um número de versão fixo.

### Fixed

- comandos Artisan executados com `docker compose exec app` carregam os
  segredos de runtime do volume somente leitura mesmo quando o cache de
  configuração foi removido;
- corrida no primeiro ciclo do scheduler que podia registrar falha ao consultar
  o Oxidized ainda em inicialização;
- favicons padrão do Laravel substituídos pela identidade visual do NetKeep.

## [1.0.0] - 2026-07-20

### Added

- autoria pública padronizada como Lucas Quaresma;
- interface, autenticação, configuração inicial, validações, mensagens,
  e-mails e alertas em Inglês, Português do Brasil e Espanhol
  latino-americano;
- preferência de idioma por usuário, cookie explícito e padrão da empresa,
  com Inglês como fallback;
- CSV com cabeçalhos localizados e importação cruzada entre os três idiomas;
- auditoria com descrições traduzidas e códigos técnicos preservados;
- verificação automática de paridade e interpolação dos catálogos;
- identificação visual do GitHub no acesso ao código-fonte e rodapé traduzido
  com licença, autoria, perfil do criador e acesso ao GitHub Sponsors;
- limites explícitos no cadastro inicial, remoção de espaços durante a
  digitação do e-mail e limite de 128 caracteres para novas senhas;
- remoção do acesso redundante ao login na tela exclusiva de criação do
  primeiro proprietário;
- remoção do convite para registro na tela de login após a criação do primeiro
  proprietário;
- limites explícitos no login, remoção de espaços durante a digitação do e-mail
  e validação equivalente das credenciais no backend;
- formulário contextual para canais Webhook, Telegram e SMTP, seleção de
  eventos e cartões com estado, último teste e ativação ou pausa auditada;
- áreas administrativas separadas para Integrações, Notificações e Proteção
  de dados, com resumo do estado dos canais e contratos sem segredos;
- resumo e cartões operacionais dos destinos de proteção, com última execução,
  falhas, ativação e pausa auditadas sem exposição de erros ou credenciais;
- README público em inglês com instalação, uso, segurança e suporte, além da
  identidade visual oficial do NetKeep servida pelo próprio repositório;
- modo seguro padrão com Telnet, Ruby arbitrário, drivers não revisados, login
  HTTP/IP e WUD desativados e concentrados em Recursos perigosos;
- fila persistente controlada pelo NetKeep, identidade técnica por UUID,
  deduplicação, locks, cooldown manual, retries em 1/5/15 minutos, jitter e
  limites globais e por site;
- aprovação administrativa de destino, DNS, porta, transporte, credencial,
  driver e fingerprint SSH antes da primeira coleta;
- invalidação automática da aprovação após troca de credencial ou publicação
  de modelo, com nova avaliação dos recursos perigosos na fila, no despacho e
  na fonte interna do Oxidized;
- alertas de risco para intervalo, timeout e concorrência, modal de coleta
  manual e estimativa de capacidade do ciclo;
- modelos guiados limitados a comandos revisados e testes em motor sandbox
  isolado;
- URL HTTPS canônica, hosts confiáveis, token local de posse, sessões e
  passkeys endurecidos e invariantes de proprietário;
- proteção SSRF fail-closed aplicada às integrações e destinos de saída;
- aplicação PostgreSQL sem privilégios administrativos e segredos de recovery
  em volume separado;
- atualização idempotente de instalações legadas, com conversão do usuário
  bootstrap do PostgreSQL em uma conta sem login e correção automática da
  porta interna e dos limites seguros do Oxidized;
- backup portátil v2 integralmente criptografado, preparação em banco
  temporário, restore por CLI ou upload e rollback automático;
- token de posse persistente em volume dedicado, sem regeneração após consumo
  e invalidado também ao finalizar restaurações por CLI;
- restauração validada em instalação vazia, com reparo e saneamento do
  repositório Git restaurado, rotação dos tokens internos e preservação das
  chaves portáteis;
- HTTPS canônico por IP com certificado interno e HTTP/1.1 fixado para evitar
  instabilidade observada no runtime HTTP/2 do FrankenPHP;
- contêineres não root, filesystem somente leitura, capabilities removidas,
  limites de recursos e redes separadas para acesso a equipamentos;
- imagens-base por digest, Actions por SHA e release assinada com SBOM e
  provenance para NetKeep e NetKeep-Oxidized;
- Playwright e Axe com Chromium em pull requests e matriz noturna para
  Chromium, Firefox, WebKit, desktop e mobile;
- jornada isolada de instalação, setup, credencial, equipamento SSH simulado,
  coleta Oxidized, Git, S3Mock e restauração portátil completa;
- integração compatível com a API JSON do Oxidized 0.37.0, repositório Git
  único por diretórios de grupo, fingerprints SSH normalizados e `known_hosts`
  persistente no caminho usado pelo Net::SSH;
- inicialização e reinicialização idempotentes do Git, inclusive após
  restauração de volumes pertencentes ao usuário não root do Oxidized;
- validações reais de Webhook e Telegram com WireMock, SMTP com Mailpit e smoke
  test opcional em Cloudflare R2;
- scanner de segredos bloqueante, mantendo relatórios de vulnerabilidades sem
  bloquear automaticamente a release;
- implementação inicial do painel NetKeep;
- inventário, credenciais, histórico Git, modelos e integrações;
- instalação autocontida com PostgreSQL, FrankenPHP e Oxidized 0.37.0;
- backup completo criptografado, restauração e atualização controlada;
- documentação, auditoria, segurança e automação de release;
- imagens multi-arquitetura espelhadas no Docker Hub e GHCR;
- ambiente local isolado, metadados de autoria e proteção contra segredos.

### Fixed

- geração dos assets Vite antes das suítes PHP em SQLite e PostgreSQL no CI;
- resolução DNS de serviços Compose opcionais sem HTTP 500, preservando a
  rejeição fail-closed de destinos sem resolução e o bloqueio de endereços
  internos;
- preservação dos relatórios SARIF do Trivy como artefato e publicação
  best-effort no Code Scanning quando o recurso estiver habilitado no GitHub;
- ambiente PostgreSQL do CI alinhado ao arquivo de teste e asserções de
  mensagens independentes do idioma configurado.

[Unreleased]: https://github.com/lrqnet/NetKeep/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/lrqnet/NetKeep/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/lrqnet/NetKeep/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/lrqnet/NetKeep/releases/tag/v1.0.0
