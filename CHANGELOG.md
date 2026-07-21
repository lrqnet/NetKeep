# Changelog

Todas as mudanças relevantes serão registradas aqui. O projeto segue
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/lrqnet/NetKeep/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/lrqnet/NetKeep/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/lrqnet/NetKeep/releases/tag/v1.0.0
