# Revisão de segurança da v1.0.3

Data da revisão: 22 de julho de 2026.

## Escopo

A revisão cobre o histórico de coletas, eventos SSE, diagnóstico isolado,
reporter Oxidized, controller do sandbox, criptografia e retenção de traces,
filesystem do repositório e as imagens NetKeep, NetKeep-Oxidized e
NetKeep-Updater. A validação utilizou Trivy 0.70.0 com base atualizada,
severidades alta e crítica e vulnerabilidades com correção conhecida.

## Controles da funcionalidade

- falhas de produção registram somente motivo sanitizado e nunca ativam trace
  bruto automaticamente;
- diagnóstico exige proprietário ou administrador, senha confirmada nos cinco
  minutos anteriores, texto `DIAGNOSTIC`, throttle e equipamento aprovado sem
  execução ativa;
- a mesma trava global impede concorrência entre diagnóstico e teste de modelo;
- destino, DNS, `known_hosts`, Telnet, Ruby raw e drivers perigosos são
  revalidados antes da execução;
- detalhes técnicos ficam ausentes de JSON e SSE para operador e leitor;
- trace plaintext permanece em `tmpfs`, é limitado a 5 MiB e apagado depois da
  tentativa de entrega;
- a aplicação cifra o trace em stream com XChaCha20-Poly1305 secretstream,
  chave derivada e separação de domínio antes da persistência;
- visualização e download exigem papel privilegiado, reautenticação, auditoria
  e resposta `no-store`;
- traces expiram em 24 horas e runs/eventos terminais em 30 dias sem remover
  Git, backups ou auditoria.

## Isolamento do motor

O Oxidized upstream permanece sem fork. A imagem derivada inclui um reporter Go
mínimo para hooks oficiais e um controller usado somente pelo sandbox. O
controller reinicia o processo filho para aplicar e restaurar `input.debug`,
aceita somente chamada interna autenticada e não é usado no motor de produção.

Hosts DNS são convertidos para o primeiro endereço literal aprovado antes de
chegar ao Oxidized com `resolve_dns: false`. O arquivo `known_hosts` preserva o
hostname original e os endereços aprovados, mantendo a conexão fixada ao alvo
validado em fail-closed.

## Validações

- PHPUnit: 196 testes, 863 asserções e cinco skips opcionais;
- Pint em 268 arquivos e PHPStan sem erros;
- Playwright Chromium: 25 cenários, incluindo diagnóstico SSH, ciphertext no
  disco, ausência de plaintext persistente, restauração do sandbox e coleta de
  produção posterior;
- integrações simuladas: quatro testes e 18 asserções; R2 real ignorado sem
  credenciais dedicadas;
- testes Go do reporter, controller, updater e simulador SSH;
- ESLint, Prettier, TypeScript, build Vite e 814 chaves em três idiomas;
- Compose release, desenvolvimento e E2E, builds das três imagens, backup e
  restauração;
- Trivy de filesystem, configuração e segredos, auditorias Composer/npm e três
  SBOMs CycloneDX.

O preparo final de versão reconfirmou esses resultados. Durante uma primeira
repetição E2E, pressão de I/O no runtime encerrou o pipe de saída do
`pg_isready` e o PostgreSQL entrou brevemente em recovery. O healthcheck passou
a descartar sua saída, recebeu regressão dedicada e a repetição completa passou
com 25 cenários, integrações, backup e restauração saudáveis.

A execução no GitHub também revelou uma janela transitória do handshake TLS
após o reinício deliberado do app. O harness agora confirma o endpoint HTTPS e
repete somente `ERR_SSL_PROTOCOL_ERROR` com espera progressiva. Qualquer outro
erro continua encerrando o teste imediatamente. A execução local limpa passou
com o setup, os 25 cenários Chromium, integrações, backup e restauração.

## Achados residuais de upstream

O scan de imagens informa achados altos, sem críticos, em componentes oficiais
incorporados: gRPC no FrankenPHP, dependências do Cosign 3.0.6 e dependências do
Docker Compose 5.3.1. As distribuições oficiais fixadas permanecem as versões
compatíveis atuais consumidas pelo projeto.

O código gRPC sinalizado não é usado pelo caminho HTTP do NetKeep. O updater
invoca Cosign somente em `verify-blob --offline` e não executa os servidores
Fulcio ou Rekor. O Docker Compose atua como cliente de um daemon externo e não
executa daemon nem plugins AuthZ dentro do contêiner. Os achados continuam
visíveis nos relatórios, sem nova exceção ou redução de regra.

## Decisão de release

Não foram encontrados segredos, configurações altas ou críticas não
justificadas nem vulnerabilidades críticas nas imagens. Os riscos residuais de
upstream permanecem documentados e sujeitos a atualização assim que houver
distribuição oficial compatível. A publicação continua condicionada aos checks
da pull request, aos workflows da `main` e à conferência de assinaturas,
digests, SBOM, provenance e manifesto Sigstore da release.
