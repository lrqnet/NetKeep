# Áreas administrativas

Proprietários e administradores acessam três áreas independentes para
configurar serviços externos. Operadores e leitores não recebem acesso a
essas páginas.

## Integrações

**Integrações** conecta fontes de inventário LibreNMS e NetBox em modo
somente leitura. Identidade, IP, local, tags e estado podem ser
sincronizados, mas credenciais, drivers e agendas de coleta permanecem sob
controle do NetKeep.

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
e confirmação do risco.

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
chave SSH, erro de driver e falha do motor.

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
