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

## Recursos perigosos

**Sistema > Recursos perigosos** concentra as exceções ao modo seguro:

- Telnet;
- modelos Ruby arbitrários;
- drivers não revisados;
- login HTTP por IP;
- atualização automática com WUD e socket Docker.

Somente o proprietário pode alterar essas opções. Habilitar exige confirmação
de senha recente, texto exato e auditoria. Telnet ainda precisa ser autorizado
por equipamento. O estado inseguro deve permanecer visível enquanto a exceção
estiver ativa.
