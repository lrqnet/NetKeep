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
- login HTTP/IP, Telnet, Ruby raw e atualização automática ficam desativados;
- app, worker, scheduler e motores são não root, sem capabilities e com
  filesystem somente leitura;
- somente o updater sem rede recebe o socket Docker e aceita exclusivamente
  manifestos oficiais assinados e verificados offline;
- backups são criptografados antes de tocar disco ou S3;
- restauração prepara banco temporário e preserva rollback.

## Dependências e imagens

Imagens-base e Actions são fixadas por digest ou SHA. Releases produzem SBOM,
provenance e assinaturas Cosign para NetKeep, NetKeep-Oxidized e
NetKeep-Updater. O Compose e o manifesto de atualização também são anexados à
release, e o manifesto recebe assinatura keyless com bundle Sigstore.

Auditorias de dependências e Trivy publicam relatórios e SARIF. Por decisão do
projeto, CVEs altas ou críticas restantes não bloqueiam automaticamente uma
release; cada release deve documentar os riscos conhecidos. Isso não reduz a
obrigação de atualizar dependências quando houver correção disponível.

## Limites

Nenhum painel elimina o risco de armazenar configurações completas ou de
conectar a equipamentos de produção. Criptografe o disco do host, mantenha
backups e métodos de recuperação offline, limite acesso administrativo e teste
restore em ambiente separado.
