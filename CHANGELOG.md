# Changelog

Todas as mudanças relevantes serão registradas aqui. O projeto segue
[Semantic Versioning](https://semver.org/).

## [1.0.8] - 2026-07-26

### Added

- laboratório Docker isolado e reproduzível para validar integrações reais com
  LibreNMS e NetBox, com portas locais exclusivas, credenciais efêmeras fora
  do Git e imagens fixadas por digest;

### Fixed

- falhas de sincronização manual de inventário agora preservam somente o código
  estável `inventory_sync_failed` no estado e na auditoria, sem persistir ou
  enviar detalhes brutos da origem externa ao navegador.

## [1.0.7] - 2026-07-24

### Fixed

- indisponibilidade do serviço SSH durante a aprovação agora retorna uma
  orientação segura, mantém o equipamento pendente e registra a tentativa sem
  expor destino ou saída técnica, em vez de responder com erro 500;
- leitura do histórico Git compartilhado entre os contêineres passa a confiar
  somente no caminho configurado para o repositório, evitando que ownerships
  distintos ocultem versões e o conteúdo já coletado;
- sucesso do motor só conclui a coleta depois da confirmação do commit no Git;
  falhas de acesso ou persistência agora deixam a execução em falha com motivo
  seguro e retry, em vez de marcar o equipamento como saudável sem histórico;
- coletas manuais enfileiram o dispatcher antes do redirect e o hook
  `post_store` agenda reconciliação direcionada, reduzindo a espera pelo ciclo
  do scheduler sem depender de callbacks do worker HTTP persistente;
- lista de equipamentos diferencia os atalhos de configurações e coletas, e a
  tela de histórico informa explicitamente indisponibilidade sem aparentar uma
  primeira coleta vazia;
- rede do simulador E2E usa uma faixa dedicada configurável, evitando colisão
  com instalações locais do Compose já ativas;
- restaurações bloqueiam novas conexões nos bancos envolvidos antes de encerrar
  sessões e renomeá-los, eliminando a corrida com processos que tentem
  reconectar durante a troca;
- cartão global de atualização usa as cores próprias da sidebar para manter
  contraste WCAG AA quando uma nova versão está disponível.

### Security

- downloads e diffs de configuração usam `no-store`; falhas do Git retornam
  somente mensagem traduzida e código estável, sem comando, path ou saída do
  processo.

## [1.0.6] - 2026-07-23

### Added

- estado durável da operação de atualização, com tempo decorrido, último
  progresso, estimativa por etapa, detecção de stall, reconexão e resultado
  terminal persistente até o reconhecimento do proprietário;
- banner global exclusivo do proprietário para acompanhar a atualização fora
  da página administrativa e após reload, navegação ou reinício da aplicação;
- identificador UUID idempotente por pedido, impedindo duplicação da operação,
  da fila e do evento de auditoria em reenvios da mesma solicitação.

### Changed

- reautenticação da atualização manual passa por endpoint explícito e o pedido
  final é enviado uma única vez depois da confirmação da identidade;
- reconciliação de estados do updater passa a cada dez segundos, com loop
  contínuo do scheduler e pausa responsiva durante manutenção;
- workflow de release executa preflight antes de qualquer publicação, exige
  tag anotada no commit atual da `main` e rejeita release ou tags imutáveis de
  imagem já existentes;
- imagem derivada do Oxidized passa para a revisão imutável
  `netkeep-oxidized:0.37.0-r3`.

### Security

- senha confirmada nunca integra o payload final da atualização e a janela de
  reautenticação de cinco minutos também é aplicada no backend;
- buckets independentes limitam reautenticação, criação e consulta de estado
  sem permitir que o polling bloqueie o reconhecimento terminal;
- endpoint de estado é exclusivo do proprietário, responde `no-store` e
  expõe apenas códigos de falha estáveis e mensagens traduzidas.

### Fixed

- confirmação de senha não perde mais o `POST /updates/run` ao retornar para a
  página, evitando a falsa impressão de que a atualização foi iniciada;
- progresso e sucesso deixam de desaparecer após navegação ou reinício, e o
  resultado terminal só é ocultado por ação explícita e auditada;
- falhas conhecidas agora exibem categorias seguras, referência estável e
  orientação de recuperação sem revelar detalhes internos;
- contraste do texto auxiliar da reautenticação atende ao mínimo WCAG 2 AA;
- jornada E2E reinicia o app após a ativação inicial do TLS, confirma o
  endpoint HTTPS e repete somente falhas transitórias do handshake antes de
  manter a navegação autenticada estritamente validada;
- preflight valida a tag anotada e seu commit pela referência remota, sem
  depender da referência local convertida pelo checkout do runner;
- jobs que publicam imagens agora dependem do preflight, evitando nova
  publicação quando tag, commit, Compose, documentação ou registries divergem.

## [1.0.5] - 2026-07-23

### Withdrawn

- a tag anotada aponta para o commit correto da `main`, mas o checkout do
  runner substituiu a referência local pelo commit antes da validação;
- o preflight bloqueou a execução antes de autenticar nos registries, construir
  imagens ou criar GitHub Release e assets;
- a tag foi preservada para manter a rastreabilidade. A v1.0.5 não é um destino
  de instalação ou atualização; a correção segue na v1.0.6.

## [1.0.4] - 2026-07-23

### Withdrawn

- a tag foi publicada antes do merge da implementação e aponta para o mesmo
  commit da v1.0.3;
- o workflow publicou imagens parcialmente, mas falhou antes de criar Compose,
  manifesto, bundle Sigstore ou GitHub Release;
- a revisão `netkeep-oxidized:0.37.0-r2` foi republicada e não deve mais ser
  tratada como referência imutável;
- a tag foi preservada para manter a rastreabilidade. A v1.0.4 não é um destino
  de instalação ou atualização; a correção segue na v1.0.6.

## [1.0.3] - 2026-07-22

### Added

- aba **Coletas** por equipamento com paginação, filtros, origem, solicitante,
  tentativas, duração, relação de retry e timeline segura acompanhada por SSE;
- eventos idempotentes do ciclo de coleta e reporter mínimo em Go para os hooks
  oficiais `node_success`, `node_fail` e `post_store` do Oxidized;
- diagnóstico manual no sandbox isolado, exclusivo de proprietário e
  administrador, com reautenticação, confirmação textual e trava compartilhada
  com testes de modelos;
- trace bruto do diagnóstico transmitido em stream, limitado a 5 MiB,
  criptografado com chave derivada da `APP_KEY` e disponível para visualização
  ou download auditados sem cache;
- retenção automática de 24 horas para traces e 30 dias para execuções e
  eventos terminais, sem alterar Git, backups ou auditoria.

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
- repositório Git do sandbox passa a ser efêmero em `tmpfs`; o volume legado
  `sandbox_git` permanece apenas declarado para não remover dados durante uma
  atualização e não recebe novas configurações diagnósticas.

### Security

- detalhes técnicos e referências do motor são serializados apenas para
  proprietário e administrador; operador e leitor recebem a timeline segura em
  JSON e SSE sem campos técnicos;
- falhas de produção nunca ativam captura bruta automática: o motivo é
  sanitizado e o diagnóstico isolado precisa ser iniciado explicitamente;
- reporter interno exige token, `Host: app`, payload limitado, UUID validado e
  rejeita replay entre equipamentos, traversal e symlinks sem registrar
  credenciais ou conteúdo bruto.

### Fixed

- healthcheck do PostgreSQL descarta a saída do `pg_isready`, impedindo que um
  pipe encerrado pelo runtime force recovery do banco sob pressão de I/O;
- workflow de release atualizado para o instalador Cosign compatível com os
  bundles Sigstore publicados pelo Cosign 3.x, preservando a verificação do
  binário, das imagens e do manifesto de atualização;
- restauração E2E alinhada ao fluxo de manutenção que drena filas antes da
  troca de dados, com encerramento gracioso do scheduler e reinicialização dos
  serviços em ordem de dependência após a finalização do modo de manutenção;
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

[Unreleased]: https://github.com/lrqnet/NetKeep/compare/v1.0.8...HEAD
[1.0.8]: https://github.com/lrqnet/NetKeep/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/lrqnet/NetKeep/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/lrqnet/NetKeep/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/lrqnet/NetKeep/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/lrqnet/NetKeep/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/lrqnet/NetKeep/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/lrqnet/NetKeep/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/lrqnet/NetKeep/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/lrqnet/NetKeep/releases/tag/v1.0.0
