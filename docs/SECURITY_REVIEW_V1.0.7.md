# Revisão de segurança da v1.0.7

Data da revisão: 24 de julho de 2026.

## Escopo

A revisão cobre falhas esperadas na aprovação SSH, leitura do histórico Git
compartilhado entre contêineres, conclusão fail-closed das coletas, disparo
manual, reconciliação após `post_store`, navegação entre coletas e
configurações, restauração do PostgreSQL, rede do simulador E2E e contraste do
aviso global de atualização.

Não houve mudança de dependências, formato de backup, política de retenção,
permissões de papéis ou capacidade de escrita nos equipamentos.

## Cadeia de fornecimento

- app e updater são publicados com a versão imutável `1.0.7`;
- a imagem derivada do Oxidized recebe a revisão imutável `0.37.0-r4`, sem
  sobrescrever a `0.37.0-r3` já publicada;
- o preflight rejeita release, tag de imagem ou metadados divergentes antes da
  autenticação dos jobs de build;
- o Compose anexado à release substitui as três tags pelos digests produzidos
  no workflow e mantém SBOM, provenance e assinatura Cosign.

## Aprovação SSH

- indisponibilidade, timeout, conexão recusada ou chave inválida retornam uma
  mensagem traduzida e não produzem erro 500;
- o equipamento permanece pendente, desativado e sem fingerprint aprovado;
- `known_hosts` não é alterado e o Oxidized não é recarregado;
- a auditoria registra somente `device.approval_failed` e o código estável
  `ssh_host_key_unavailable`;
- endereço, hostname, stderr e mensagem técnica não são enviados à resposta,
  auditoria ou logs;
- a verificação continua obrigatória e fail-closed.

## Histórico e conclusão de coletas

- cada processo Git confia somente no caminho canônico configurado por meio de
  `safe.directory`; não existe wildcard nem alteração da configuração global;
- argumentos Git não recebem credenciais, e falhas retornam somente
  `configuration_history_unavailable`;
- uma execução só termina com sucesso depois que a versão correspondente é
  confirmada no Git;
- repositório inacessível ou primeira coleta sem versão persistida produz falha
  segura e retry, sem estado saudável enganoso;
- download e diff usam `no-store`, e a tela distingue indisponibilidade de
  histórico vazio;
- o evento `post_store` agenda reconciliação direcionada;
- o pedido manual grava o dispatcher na fila antes do redirect, sem depender de
  callbacks do worker HTTP persistente. O scheduler permanece como fallback.

## Restauração e isolamento

- antes do rename, os bancos envolvidos recusam novas conexões e suas sessões
  residuais são encerradas;
- o banco anterior permanece bloqueado e somente o banco que assume o nome
  ativo volta a aceitar conexões;
- o E2E confirmou `prepare`, `apply`, `finalize`, reinício ordenado, rollback
  preservado até a finalização e restauração dos dados esperados;
- a faixa do simulador é dedicada e configurável, sem ampliar a rede de acesso
  aos equipamentos;
- o diagnóstico permanece no sandbox, com Git e logs efêmeros, trace cifrado e
  ausência do marker em texto claro nos volumes persistentes.

## Interface

- configurações e coletas possuem destinos distintos na lista de equipamentos;
- a aba de coletas pode ser aberta diretamente por URL e mantém semântica de
  teclado;
- o aviso de atualização usa as cores próprias da sidebar e passou a auditoria
  WCAG 2 AA em todas as páginas cobertas.

## Validações

- Pint: 275 arquivos;
- PHPStan: 208 arquivos, sem erros;
- PHPUnit: 210 testes, 1.036 asserções e cinco integrações externas opcionais
  ignoradas no ambiente unitário;
- Playwright Chromium: instalação e 25 cenários, incluindo diagnóstico,
  acessibilidade, navegação, screenshots, passkey, três idiomas, temas e
  atualização;
- integrações E2E: quatro testes e 18 asserções; R2 real ignorado sem
  credenciais dedicadas;
- coleta simulada confirmada no Git, com dispatcher e conclusão abaixo de 30
  segundos;
- restauração portátil E2E concluída, com app, worker, scheduler, Oxidized e
  sandbox saudáveis após a finalização;
- ESLint, Prettier, TypeScript, build Vite e 869 chaves em três idiomas;
- formatação e testes Go do updater, reporter, controller do sandbox e
  simulador;
- Compose de release, desenvolvimento e E2E, além da sintaxe do harness E2E;
- preflight local da `v1.0.7`, incluindo versões do app, updater e Oxidized,
  changelog, README e guias públicos;
- auditorias Composer e npm sem advisories de produção;
- Trivy 0.70 no filesystem, configuração e segredos, sem vulnerabilidades
  altas ou críticas corrigíveis, configurações altas ou críticas ou segredos;
- `git diff --check` sem erros.

## Resultado

Não foi identificada regressão de autorização, exposição de segredo ou bypass
da verificação de host key. Os estados de aprovação, coleta e restauração
permanecem fail-closed. A mudança está apta para pull request; tag, release e
publicação permanecem condicionadas ao merge e aos checks verdes da `main`.
