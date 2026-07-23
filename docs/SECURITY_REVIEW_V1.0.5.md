# Revisão de segurança da v1.0.5

Data da revisão: 23 de julho de 2026.

## Escopo

A revisão cobre a reautenticação de atualizações, idempotência do pedido,
persistência e reconciliação do progresso, feedback global, reconhecimento do
resultado, migração de operações existentes, rate limits e controles da
cadeia de publicação. Também inclui o filesystem, as dependências e as imagens
NetKeep, NetKeep-Oxidized e NetKeep-Updater.

## Controles do fluxo de atualização

- a senha é enviada somente ao endpoint de reautenticação e é removida antes
  do pedido final;
- o backend exige confirmação ocorrida nos cinco minutos anteriores;
- cada intenção usa UUID estável, lock global, transação e restrição única no
  banco para criar uma única operação e despachar um único job;
- repetição exata retorna a operação existente e nunca inicia retry
  automaticamente;
- somente o proprietário recebe o estado global e acessa os endpoints de
  execução, leitura e reconhecimento;
- respostas de estado usam `no-store`, códigos estáveis e mensagens seguras;
- reautenticação, execução e leitura de status possuem rate limiters
  independentes;
- worker e reconciliador persistem o último progresso e a reconciliação ocorre
  a cada dez segundos;
- possível travamento é apenas sinalizado ao usuário e não provoca nova
  execução;
- resultados terminais permanecem visíveis até reconhecimento explícito e
  auditado;
- a migração reconhece somente resultados históricos já terminais e preserva
  qualquer operação ativa durante o upgrade.

## Cadeia de fornecimento

App e updater são preparados para `1.0.5`, e a imagem derivada do Oxidized
recebe a revisão imutável `0.37.0-r3`. Um preflight obrigatório ocorre antes
de qualquer job de publicação: exige tag SemVer anotada no commit atual da
`main`, confere Compose, changelog, README e guias, rejeita GitHub Release
existente e valida de forma fail-closed que as seis tags imutáveis ainda não
existem no Docker Hub e GHCR.

Os três jobs de imagem dependem do preflight. Qualquer publicação parcial torna
a versão não repetível e exige uma nova versão patch; tags Git, imagens ou
releases públicas nunca são movidas ou sobrescritas.

## Validações

- Composer metadata válido, Pint em 270 arquivos e PHPStan sem erros;
- PHPUnit: 201 testes, 947 asserções e cinco integrações opcionais ignoradas;
- PostgreSQL 18.4: todas as migrations e 154 testes Feature com 791 asserções;
- Playwright Chromium: 26 cenários, incluindo reautenticação única,
  idempotência, navegação, reload, reinício real do app, persistência do
  resultado, reconhecimento explícito, acessibilidade, temas e três idiomas;
  o harness reinicia o app com a configuração TLS final e valida HTTPS entre
  a instalação e os cenários autenticados;
- integrações simuladas e backup/restauração: quatro testes e 18 asserções; R2
  real ignorado sem credenciais dedicadas;
- testes e formatação Go do updater, reporter, controller do sandbox e
  simulador;
- ESLint, Prettier, TypeScript, build Vite e 863 chaves em três idiomas;
- Compose de release, desenvolvimento e E2E, além da substituição simulada das
  três imagens por digests;
- auditorias Composer e npm sem advisories de produção;
- Trivy 0.70.0 do filesystem, configuração, segredos e três imagens;
- três SBOMs CycloneDX 1.6 validadas, com 496 componentes no NetKeep, 276 no
  NetKeep-Oxidized e 422 no NetKeep-Updater.

O scan de filesystem encontrou zero vulnerabilidades altas ou críticas nos
lockfiles e módulos Go, zero configurações altas ou críticas nos quatro
Dockerfiles e nenhum segredo. As imagens não possuem vulnerabilidades críticas.
NetKeep-Oxidized não apresentou achados altos; NetKeep apresentou um achado
alto no gRPC incorporado ao FrankenPHP; NetKeep-Updater apresentou 31 achados
altos nos binários oficiais Cosign 3.0.6 e Docker Compose 5.3.1.

## Achados residuais de upstream

O achado do NetKeep está em `google.golang.org/grpc` dentro do FrankenPHP e não
participa do caminho HTTP usado pelo produto.

Os achados do updater pertencem aos binários oficiais incorporados:

- Cosign: bibliotecas Fulcio, Rekor, `x/crypto`, `x/net`, gRPC e runtime Go;
- Docker Compose: cliente Docker, gRPC e runtime Go.

O updater usa Cosign somente para verificar offline o manifesto assinado e usa
Docker Compose como cliente do daemon para aplicar o Compose oficial depois da
validação. Ele permanece sem rede, sem API e é o único contêiner com o socket
Docker. Esses limites reduzem a superfície, mas não removem os achados.

Há versões corrigidas indicadas para bibliotecas internas desses binários. A
adoção depende de novas distribuições oficiais compatíveis e deve ocorrer em
mudança de dependências separada, com rebuild, scans e testes próprios, sem
substituir binários dentro das imagens de terceiros de forma ad hoc.

## Decisão de release

Não foram encontrados segredos, configurações altas ou críticas nem
vulnerabilidades críticas. Os achados altos são upstream, permanecem visíveis
e não receberam nova exceção. A publicação da v1.0.5 continua condicionada aos
checks da pull request e da `main`, à avaliação das atualizações oficiais
compatíveis em mudança separada e à conferência autenticada de assinaturas,
digests, plataformas, SBOM, provenance e manifesto Sigstore.
