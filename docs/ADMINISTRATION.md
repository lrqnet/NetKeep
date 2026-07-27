# Áreas administrativas

Proprietários e administradores acessam três áreas independentes para
configurar serviços externos. Operadores e leitores não recebem acesso a
essas páginas.

## Integrações

**Integrações** conecta fontes de inventário LibreNMS e NetBox em modo
somente leitura. Identidade, IP, local, tags e estado podem ser
sincronizados, mas credenciais, drivers e agendas de coleta permanecem sob
controle do NetKeep.

Uma sincronização que falha mantém a fonte configurada e apresenta somente uma
mensagem segura. O estado e a auditoria registram um código estável, sem corpo
de resposta, token, URL sensível ou detalhes de transporte da origem externa.
Revise conectividade, token e permissões da fonte antes de tentar novamente.

## Notificações

**Notificações** gerencia canais Webhook, Telegram e E-mail/SMTP. O resumo
mostra canais ativos, pausados e com falha no último teste. Cada canal define
os eventos atendidos e pode ser testado mesmo enquanto estiver pausado.

Tokens, senhas, segredos HMAC e erros internos não são devolvidos ao
navegador. Pausar um canal preserva sua configuração e impede alertas
operacionais até uma nova ativação.

## Proteção de dados

**Proteção de dados** reúne backups completos criptografados em armazenamento
local ou S3 e espelhamento para um repositório Git privado. Backups são
criptografados antes do armazenamento. O método de recuperação deve ser
guardado fora do NetKeep.

O resumo mostra destinos ativos, pausados e com falha na última execução.
Cada cartão informa o último estado e horário conhecido, permite iniciar a
operação correspondente e preservar a configuração ao pausar o destino.
Destinos pausados não executam backups ou espelhamentos.

As ações de criação, ativação, pausa, backup e espelhamento exigem confirmação
de senha e são registradas na auditoria sem incluir configurações secretas,
erros internos ou credenciais.

## Segurança das coletas

O NetKeep, e não o scheduler nativo do Oxidized, controla filas, prioridades,
retries e concorrência. Em **Sistema**, o card vermelho apresenta o risco atual
e a capacidade estimada:

- intervalo de 300 a 899 segundos: alto risco;
- intervalo de 900 a 3.599 segundos: atenção;
- concorrência de 6 a 10: atenção;
- concorrência de 11 a 20: alto risco e reautenticação;
- timeout de 61 a 180 segundos: atenção;
- timeout de 181 a 300 segundos: alto risco.

O limite padrão é cinco coletas globais e duas por site. Aumentar concorrência
não faz o motor compensar atrasos automaticamente. Se o ciclo estimado não
couber no menor intervalo, aumente o intervalo, distribua sites ou investigue
timeouts antes de aumentar conexões.

A coleta manual mostra destino, transporte, driver, estado, última coleta e
próximo horário permitido. Operadores sempre respeitam o cooldown de cinco
minutos. Proprietário e administrador podem forçar somente após reautenticação
e confirmação do risco. Depois da confirmação, o NetKeep aciona o dispatcher
sem aguardar o próximo minuto do scheduler. A fila continua persistente e o
scheduler permanece como recuperação caso o job imediato não seja processado.

## Aprovação de equipamentos

Criação manual por operador, CSV, LibreNMS e NetBox produz rascunhos
desativados. Proprietário ou administrador deve conferir e aprovar:

- hostname/IP e endereços DNS resolvidos;
- porta e transporte;
- perfil de credencial;
- driver revisado;
- fingerprint da chave SSH.

Mudanças nesses valores revogam automaticamente a aprovação e pausam coletas.
Uma alteração de chave SSH nunca é aceita silenciosamente.

Se o NetKeep não conseguir alcançar o serviço SSH ou obter a chave do host, a
aprovação falha com uma mensagem segura e o equipamento permanece desativado e
pendente. Verifique rota, firewall, porta e serviço SSH antes de tentar
novamente. A verificação da chave nunca é ignorada.

## Histórico e diagnóstico por equipamento

A tela de edição separa **Configuração** e **Coletas**. Todos os papéis podem
consultar a lista paginada de 25 execuções, filtrar por status, origem e período
e acompanhar a timeline segura. A lista informa solicitante, tentativa,
horários, duração, execução anterior de um retry, motivo seguro e estado do
trace. Referências do motor, mensagens técnicas e contexto interno aparecem
somente para proprietário e administrador.

Enquanto uma execução está ativa, o navegador acompanha eventos e status por
SSE. O stream aceita `Last-Event-ID`, envia heartbeat a cada dez segundos,
encerra em 30 segundos ou ao concluir e reconecta automaticamente. Há limite de
dois streams simultâneos por usuário e execução. O botão de atualização é o
fallback manual quando a conexão ao vivo estiver indisponível.

Uma falha de produção registra timeline e categoria sanitizada, mas nunca cria
trace bruto automaticamente. Para investigar, proprietário ou administrador
deve confirmar a senha nos últimos cinco minutos, digitar `DIAGNOSTIC` e iniciar
um novo diagnóstico. O pedido é rejeitado se o equipamento estiver desativado,
sem aprovação técnica vigente ou com outra execução ativa. O sandbox revalida
DNS, política de segurança e chave SSH e usa a credencial, driver e timeout
atuais sem criar commit ou `BackupRun` de produção.

O trace bruto pode conter configuração integral, senhas, tokens e comunidades.
Ele é limitado a 5 MiB, criptografado em stream antes de tocar o volume
persistente e expira após 24 horas. Visualização e download exigem nova
confirmação de senha, são auditados e respondem com `no-store`. Nunca copie um
trace para issue, chat ou armazenamento não protegido.

Execuções e eventos terminais são removidos após 30 dias. Essa retenção não
remove commits do Git, backups completos nem eventos de auditoria. A limpeza é
agendada de hora em hora e também pode ser executada localmente:

```bash
docker compose exec app php artisan netkeep:prune-collection-diagnostics
```

As categorias seguras conhecidas cobrem autenticação, conexão recusada,
timeout de conexão, limite total da coleta, prompt não detectado, mudança de
chave SSH, erro de driver, falha do motor, histórico Git indisponível e
configuração não persistida.

O sucesso informado pelo motor não é suficiente para marcar o equipamento como
saudável. O hook `post_store` solicita a verificação direcionada do repositório
e o reconciliador periódico funciona como fallback. A execução só termina com
sucesso quando uma versão permanente é confirmada no Git. Se o repositório
compartilhado não puder ser lido ou não contiver uma versão, a execução falha
com uma categoria segura e segue a política normal de retry.

Na lista de equipamentos, **Configurações** abre o histórico Git permanente e
**Coletas** abre diretamente a timeline operacional. Se o histórico estiver
indisponível, a página mostra um alerta explícito e desativa o download, sem
exibir comando, caminho do volume ou saída do Git.

## Atualizações do NetKeep

Somente o proprietário acessa **Atualizações**. A confirmação de senha ocorre
em uma requisição separada; depois dela, o navegador envia exatamente um pedido
com UUID idempotente. A senha não integra o payload final nem é mantida para
retry. Reenvios do mesmo UUID recuperam a operação existente em vez de criar
outro snapshot, job ou evento de auditoria.

O estado fica no PostgreSQL e aparece na página e em um banner global enquanto
o proprietário navega. Reload e reinício do contêiner `app` não apagam a
operação. A interface mostra etapa, tempo decorrido, último progresso, duração
esperada, reconexão e possível stall. O reconciliador consome estados atômicos
do updater a cada dez segundos; a detecção de stall é informativa e nunca
dispara outra operação automaticamente.

Falhas exibem uma categoria sanitizada e uma referência estável. Não são
mostrados logs, comandos, paths, respostas do daemon ou detalhes internos. O
resultado de sucesso, falha ou recuperação necessária permanece visível até o
proprietário usar **Dispensar status**. Reautenticação, criação e reconhecimento
são auditados sem senha ou dados do manifesto.

## Recursos perigosos

**Sistema > Recursos perigosos** concentra as exceções ao modo seguro:

- Telnet;
- modelos Ruby arbitrários;
- drivers não revisados;
- login HTTP por IP;
- atualização automática integrada com janela, snapshot obrigatório e socket
  Docker isolado no updater.

Somente o proprietário pode alterar essas opções. Habilitar exige confirmação
de senha recente, texto exato e auditoria. Telnet ainda precisa ser autorizado
por equipamento. O estado inseguro deve permanecer visível enquanto a exceção
estiver ativa.
