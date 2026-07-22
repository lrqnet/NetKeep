# Arquitetura e modelo de confiança

```text
LAN administrativa / Internet
            |
          80/443
            |
    FrankenPHP + Caddy
       |       |       \
       |       |        \ egress validado
       |       +----- worker -------- integrações, alertas, S3 e Git
       |              /
       +------ scheduler
       |
       +---- rede internal ---- PostgreSQL
       |                     usuário não privilegiado
       |
       +---- rede internal ---- Oxidized 0.37.0 ---- Git permanente
                    |              |
              device_access    equipamentos aprovados
       |
       +---- sandbox_internal -- Oxidized sandbox ---- Git isolado
                                   |
                            sandbox_device_access

Docker socket ---- updater sem rede ---- volume update_exchange ---- Laravel
```

Web, worker e scheduler usam a mesma imagem NetKeep, executada como UID 20000.
Os motores usam uma imagem derivada do Oxidized 0.37.0 sem alterar seu código,
executada como UID 30000. PostgreSQL, Oxidized, sandbox e recovery não publicam
portas no host.

Worker e scheduler só iniciam depois que a aplicação e o Oxidized estão
saudáveis. O worker mantém um processo de fila duradouro e observa o marcador de
manutenção a cada segundo, encerrando-o de forma graciosa antes de restaurações.

Os contêineres permanentes usam filesystem somente leitura, `cap_drop: ALL`,
`no-new-privileges`, limites de memória/processos, `tmpfs` para temporários e
apenas os volumes explicitamente graváveis. `init` e `recovery` são processos
root de execução única e não recebem rede externa nem socket Docker.

## Atualizações integradas

O scheduler consulta releases oficiais com ETag e persistência no PostgreSQL,
sem acessar o socket Docker. A instalação é separada e usa arquivos atômicos no
volume `update_exchange`. O updater não possui rede ou API e é o único serviço
com o socket Docker, equivalente a root no host.

Antes de aplicar qualquer mudança, Laravel cria um snapshot completo
criptografado e baixa Compose, manifesto e bundle Sigstore de uma URL oficial.
O updater verifica offline assinatura, identidade exata do workflow, origem,
SemVer, hashes, imagens permitidas, ausência de downgrade, isolamento e
exposição do socket. Imagens são baixadas pelo daemon antes da indisponibilidade.
O Compose completo é aplicado, os serviços recebem até dez minutos para ficar
saudáveis e o rollback automático só ocorre quando a política assinada da
release o declara seguro.

## Controle das coletas

Oxidized opera com `interval: 0`, `retries: 0` e `next_adds_job: false`.
NetKeep é o único agendador:

- fila persistente com estados queued, dispatched, running, succeeded, failed,
  cooldown e cancelled;
- uma única coleta pendente ou ativa por UUID de equipamento;
- lock distribuído, concorrência global padrão 5 e máxima 20;
- no máximo duas coletas simultâneas por site;
- cooldown manual padrão de 300 segundos;
- retries após 1, 5 e 15 minutos, sem contornar locks ou limites;
- jitter de até 10% para evitar rajadas.

O UUID é a identidade técnica no motor e no Git. Nome e grupo são apenas
apresentação, evitando colisões. O painel estima a duração mínima do ciclo e
alerta quando ela não cabe no menor intervalo configurado.

Equipamentos novos ou sincronizados entram desativados e pendentes. Somente
proprietário ou administrador aprova destino, DNS resolvido, porta, transporte,
credencial, driver e fingerprint SSH. Alterar qualquer um desses campos revoga
a aprovação.

## Limites de rede

O endpoint `GET /internal/oxidized/nodes` exige token rotativo e retorna apenas
equipamentos habilitados, aprovados e revalidados. O motor alcança equipamentos
pela rede `device_access`, mas sua API permanece na rede interna.

O cliente de saída resolve DNS em modo fail-closed, bloqueia loopback,
link-local, metadata, multicast, unspecified, IPv4 mapeado e nomes ou endereços
dos serviços Compose. A resolução validada é fixada à conexão e repetida a cada
uso. A proteção é aplicada a inventário, webhooks, Telegram, SMTP, S3 e Git.
IPs públicos e privados de equipamentos são permitidos depois da aprovação
administrativa.

SSH usa verificação de host. O fingerprint é apresentado antes da aprovação,
materializado em `known_hosts` e qualquer mudança pausa a coleta e gera alerta.

## Dados e segredos

A aplicação conecta ao PostgreSQL com o papel `netkeep`, sem superuser,
`CREATEDB` ou `CREATEROLE`. A credencial administrativa fica em volume separado
e só é montada em `database-init` e `recovery`.

Cada processo PHP carrega o arquivo `app.env` do volume `netkeep_secrets`
somente quando ele está legível e preserva variáveis já definidas pelo Compose.
Isso mantém comandos Artisan executados via `docker compose exec` funcionais
sem incluir valores secretos na definição pública do contêiner ou na linha de
comando.

Credenciais, tokens e configurações de destinos usam criptografia do Laravel.
A chave fica fora do banco, no volume de segredos. Valores secretos não são
devolvidos ao navegador nem gravados em eventos de auditoria.

O token de posse usa o volume dedicado `netkeep_claim`, gravável somente pelos
serviços que criam o proprietário ou coordenam a recuperação. O token inicial
deixa de ser aceito assim que existe um proprietário, não reaparece em
reinicializações e só pode ser rotacionado por comando local.

O Git é o histórico permanente. Excluir um equipamento é soft delete e não
remove commits. Backups v2 incluem banco, Git, modelos, branding e chaves em um
stream integralmente criptografado.

## Modo seguro e modelos

No modo seguro:

- Telnet, Ruby arbitrário, drivers não revisados e login HTTP/IP estão
  desativados;
- drivers precisam constar no manifesto revisado de somente leitura;
- modelos guiados aceitam apenas comandos constantes aprovados por driver;
- testes de modelo usam um motor, configuração, Git e nó isolados.

Recursos perigosos são exclusivos do proprietário, exigem reautenticação de
cinco minutos, confirmação textual e auditoria. Ativar Telnet, Ruby raw ou
driver não revisado torna condicional a garantia de que o NetKeep nunca aplica
configurações. Ruby raw pode executar qualquer código disponível dentro do
contêiner e deve ser tratado como controle do motor.

## Restauração

O serviço `recovery` prepara o dump em banco temporário, valida manifesto,
hashes, limites e chaves e preserva banco e diretórios atuais. A troca só ocorre
depois dessa validação. Um health check malsucedido executa rollback automático.
O painel apenas prepara uploads; nunca recebe privilégios de recuperação.
