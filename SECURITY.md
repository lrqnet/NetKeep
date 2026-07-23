# Política de segurança

## Relatar uma vulnerabilidade

Não abra issue pública com exploração, credenciais ou configurações reais.
Use o recurso **Report a vulnerability** na aba Security do repositório
`lrqnet/NetKeep`. Inclua versão, impacto, pré-condições e uma reprodução
mínima sem dados de clientes.

O projeto pretende confirmar o recebimento em até 7 dias e coordenar correção
e divulgação. Não há garantia de SLA comercial.

## Versões

A versão principal atual recebe correções de segurança. Releases antigas
podem deixar de receber patches após anúncio no `CHANGELOG`.

## Recomendações operacionais

- criptografe o disco/volume do host;
- limite 80/443 às redes administrativas quando possível;
- habilite 2FA para contas privilegiadas;
- use repositório Git privado e bucket S3 privado;
- nunca publique logs, CSV, dumps ou backups em issues;
- guarde senha/identidade de recuperação fora da instalação;
- teste restauração e rotação de credenciais;
- mantenha o modo seguro e revise todo Ruby personalizado antes de publicar;
- aprove fingerprints SSH presencialmente ou por um canal independente;
- não reduza intervalos nem aumente concorrência sem conferir a capacidade
  estimada e o impacto nos equipamentos;
- consulte o token de instalação somente no terminal local e rotacione-o se
  houver suspeita de exposição.
- abra traces de diagnóstico somente em uma estação administrativa protegida e
  nunca os envie a issues, chats ou sistemas de ticket sem cofre apropriado;

O Oxidized e suas dependências mantêm políticas próprias. Achados puramente
upstream devem ser relatados também ao projeto correspondente.

## Garantia de somente leitura

A garantia de que o NetKeep não aplica configurações vale para o modo seguro,
drivers revisados e modelos guiados. Telnet, Ruby arbitrário e drivers não
revisados são exceções explícitas. Quando habilitados, código ou comandos fora
do conjunto auditado podem alterar equipamentos; a interface mostra que a
garantia passa a ser condicional.

## Controles da instalação padrão

- somente 80/443 são publicados;
- PostgreSQL usa um papel de aplicação não privilegiado;
- Oxidized e sandbox não expõem API;
- equipamentos exigem aprovação de destino, credencial, driver e host key;
- DNS e conexões de saída bloqueiam classes especiais e serviços internos;
- o Oxidized recebe somente o IP literal aprovado e não refaz DNS;
- login HTTP/IP, Telnet, Ruby raw e atualização automática ficam desativados;
- app, worker, scheduler e motores são não root, sem capabilities e com
  filesystem somente leitura;
- somente o updater sem rede recebe o socket Docker e aceita exclusivamente
  manifestos oficiais assinados e verificados offline;
- backups são criptografados antes de tocar disco ou S3;
- falhas de produção não capturam dados brutos; diagnóstico é manual,
  reautenticado, auditado e executado no sandbox;
- traces de diagnóstico são cifrados em stream, limitados a 5 MiB, respondidos
  sem cache e expurgados automaticamente após 24 horas;
- restauração prepara banco temporário e preserva rollback.

## Diagnóstico e traces sensíveis

O acesso à timeline segura é permitido a todos os papéis. Mensagens técnicas,
contexto e referência do motor ficam restritos a proprietário e administrador
e são sanitizados antes do banco. Senhas, tokens, comunidades, enable secrets,
userinfo de URLs, chaves privadas e padrões `password`/`secret` são removidos,
e a mensagem resultante é limitada a 2 KiB.

O trace bruto é deliberadamente diferente: pode conter segredos que não podem
ser sanitizados sem destruir o diagnóstico. Por isso ele nunca nasce de uma
falha de produção, exige ação explícita e senha confirmada nos últimos cinco
minutos e só existe cifrado no volume persistente. Visualizar ou baixar exige
nova autorização, gera auditoria e usa `Cache-Control: no-store`.

O plaintext existe apenas no `tmpfs` do sandbox durante a conexão. O reporter
não usa shell nem entrada do equipamento na linha de comando, limita nomes e
paths, não segue symlinks e remove trace e repositório efêmero mesmo quando a
entrega falha. Se o host ou o volume do NetKeep for comprometido enquanto a
aplicação está operando, a `APP_KEY` pode permitir decifrar traces ainda dentro
das 24 horas; criptografia de disco e menor privilégio continuam obrigatórios.

O controlador do sandbox aceita somente `POST /restart`, exige o token interno
e `Host: sandbox`, não recebe corpo e não publica porta. Ele gerencia apenas o
processo Oxidized filho, para que `input.debug` seja carregado e removido nos
limites da execução diagnóstica.

## Dependências e imagens

Imagens-base e Actions são fixadas por digest ou SHA. Releases produzem SBOM,
provenance e assinaturas Cosign para NetKeep, NetKeep-Oxidized e
NetKeep-Updater. O Compose e o manifesto de atualização também são anexados à
release, e o manifesto recebe assinatura keyless com bundle Sigstore.

O updater permanece root dentro do seu contêiner porque instalações Docker
rootful não oferecem um GID portátil para o socket. Executá-lo como usuário
com acesso ao grupo do socket continuaria permitindo controle root-equivalente
do host e apenas esconderia esse risco do scanner. A exceção `AVD-DS-0002` é
restrita ao `Dockerfile.updater`, possui expiração para revisão periódica e é
compensada por ausência de rede e portas, filesystem somente leitura,
capabilities removidas, `no-new-privileges`, limites de recursos, validação
offline de assinatura e teste automático que impede outro serviço de montar o
socket.

Auditorias de dependências e Trivy publicam relatórios e SARIF. Por decisão do
projeto, CVEs altas ou críticas restantes não bloqueiam automaticamente uma
release; cada release deve documentar os riscos conhecidos. Configurações
altas ou críticas não justificadas bloqueiam o CI. Isso não reduz a obrigação
de atualizar dependências quando houver correção disponível.

O relatório específico da v1.0.3 está em
[`docs/SECURITY_REVIEW_V1.0.3.md`](docs/SECURITY_REVIEW_V1.0.3.md). A revisão
anterior permanece em
[`docs/SECURITY_REVIEW_V1.0.2.md`](docs/SECURITY_REVIEW_V1.0.2.md).

## Limites

Nenhum painel elimina o risco de armazenar configurações completas ou de
conectar a equipamentos de produção. Criptografe o disco do host, mantenha
backups e métodos de recuperação offline, limite acesso administrativo e teste
restore em ambiente separado.
