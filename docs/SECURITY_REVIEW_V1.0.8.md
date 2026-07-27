# Revisão de segurança da v1.0.8

Data da revisão: 26 de julho de 2026.

## Escopo

A revisão cobre as integrações de inventário LibreNMS e NetBox, o laboratório
local de homologação e o tratamento de falhas de sincronização manual.

## Integrações de inventário

- as duas integrações permanecem somente leitura em relação às origens e aos
  equipamentos;
- tokens ficam cifrados no banco e não são reapresentados pela interface;
- a proteção SSRF continua recusando destinos proibidos, redirecionamentos e
  resolução insegura;
- fontes novas criam equipamentos pendentes e desativados;
- alteração de identidade ou IP revoga aprovação e desativa o equipamento;
- ausência externa nunca apaga histórico, backup ou auditoria.

## Falhas e auditoria

- uma falha manual é reduzida a `inventory_sync_failed` antes de persistência,
  auditoria e resposta Inertia;
- respostas, mensagens de transporte, URLs sensíveis e tokens da origem não
  são gravados em `last_error`, auditoria ou enviados ao navegador;
- a configuração da fonte é preservada para nova tentativa depois da correção
  operacional.

## Laboratório local

- o Compose de homologação usa projeto, volumes, redes e portas de loopback
  exclusivos;
- somente app e scheduler recebem aliases de saída para NetBox e LibreNMS;
- bancos, Oxidized, sandbox e demais serviços não recebem essa conectividade;
- credenciais são geradas em arquivo local ignorado pelo Git, com permissões
  restritas e sem valores versionados;
- imagens externas são fixadas por digest e validadas para `linux/arm64`.

## Validações

- APIs reais de NetBox e LibreNMS foram consultadas pelo NetKeep;
- foram cobertos criação pendente, sincronização manual e agendada,
  idempotência, preservação de campos locais, revogação, inatividade, conflito
  de IP, tolerância de ausência e indisponibilidade;
- Pint, PHPStan, PHPUnit, ESLint, Prettier, TypeScript, build Vite, Compose,
  testes Go e revisão de segredos e diff concluíram sem falhas.

## Resultado

Não foi identificado bypass de autorização, aprovação implícita, escrita em
equipamentos ou exposição de credencial. A release publica app e updater como
`1.0.8` e a revisão imutável do Oxidized como `0.37.0-r5`.
