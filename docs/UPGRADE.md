# Atualização

O NetKeep segue SemVer, detecta releases estáveis oficiais no máximo uma vez
por hora e separa a consulta de versões da instalação. A detecção funciona sem
socket Docker e sem depender do agente de atualização.

## Atualização manual para instalações sem updater

Instalações v1.0.0 e v1.0.1 ainda não possuem o updater integrado. Faça uma
última atualização manual diretamente para v1.0.8:

```bash
cd /opt/netkeep
docker compose exec app php artisan netkeep:backup
curl -fsSLo compose.yaml.next https://github.com/lrqnet/NetKeep/releases/download/v1.0.8/compose.yaml
docker compose -f compose.yaml.next config --quiet
mv compose.yaml.next compose.yaml
docker compose pull
docker compose up -d --wait --remove-orphans
docker compose ps
```

O Compose preserva volumes e portas configuradas. `init` e `database-init`
devem terminar com `Exited (0)`; os demais serviços, incluindo `updater`,
devem permanecer ativos ou saudáveis. Não use `docker compose down -v`.

## Atualizações pelo painel

A partir da v1.0.2, **Atualizações** permite:

- verificar agora ou aguardar a consulta horária agendada;
- revisar release, compatibilidade e indisponibilidade estimada;
- iniciar atualização manual com reautenticação explícita e pedido idempotente;
- acompanhar backup, validação, download, aplicação, reinício e health check;
- preservar progresso, falha e sucesso durante navegação, reload ou reinício;
- configurar atualização automática opcional para patch e minor da major
  instalada, por dias e janela no fuso da empresa.

Toda operação cria antes um snapshot completo local e criptografado. Um destino
local ou S3 pode receber uma cópia adicional. Os três snapshots de atualização
mais recentes são mantidos; o snapshot de uma falha é preservado.

Atualizações major são apenas manuais, exigem digitar a versão de destino e só
são aceitas quando o manifesto assinado declara suporte à origem e nenhuma
etapa externa obrigatória.

## Agente isolado

`netkeep-updater` não expõe porta nem API e usa `network_mode: none`. Laravel e
o agente trocam pedidos e estados por arquivos atômicos no volume
`update_exchange`. O agente verifica offline o bundle Sigstore, a identidade
exata do workflow oficial, hashes, versão, origem, imagens autorizadas e o
Compose antes de solicitar downloads ao daemon Docker.

O socket Docker equivale a acesso root no host. Por isso somente o updater o
recebe, com filesystem somente leitura, capabilities removidas, sem rede e com
limites de memória e processos. Atualizações automáticas ficam desligadas até o
proprietário reautenticar e aceitar explicitamente esse risco.

Quando o manifesto permite rollback e o health check falha, o Compose anterior
é restaurado automaticamente. Caso contrário, a operação entra em
`recovery_required`; preserve volumes e snapshot e siga o guia de restauração.

## Integrações de inventário na v1.0.8

A v1.0.8 mantém as integrações com LibreNMS e NetBox somente leitura e passa
a reduzir falhas de sincronização manual a uma mensagem segura. Dados brutos da
origem externa, inclusive respostas, detalhes de transporte e tokens, não são
persistidos no estado da fonte, na auditoria ou na interface.

Antes de repetir uma sincronização, revise conectividade, token e permissões
da fonte. A configuração e os dispositivos já importados são preservados; a
falha não cria nem aprova equipamentos parcialmente.

## Mudanças de coleta e histórico na v1.0.7

A v1.0.7 trata indisponibilidade da chave SSH durante a aprovação como falha
operacional segura, sem aprovar parcialmente o equipamento. Coletas manuais
entram na fila imediatamente, e o hook `post_store` agenda a reconciliação da
execução sem aguardar o próximo ciclo do scheduler.

O acesso ao Git compartilhado passa a confiar somente no caminho exato do
repositório. Uma coleta só termina com sucesso depois que a configuração está
confirmada no histórico; falhas de acesso ou da primeira persistência geram
erro seguro e retry. O upgrade preserva o volume `oxidized_git` e não altera o
conteúdo das configurações já coletadas.

## Mudanças do fluxo na v1.0.6

A v1.0.6 adiciona `request_id`, último progresso e reconhecimento terminal às
operações existentes. As migrations são executadas automaticamente e não
alteram snapshots, histórico Git ou backups.

Ao selecionar **Atualizar agora**, o navegador confirma a senha em uma
requisição separada e envia o pedido final uma única vez. Fechar a página,
navegar para outra área ou reiniciar o contêiner `app` não cancela nem duplica
a operação. O banner global e a página **Atualizações** recuperam o estado do
PostgreSQL. Falha ou sucesso permanecem visíveis até o proprietário usar
**Dispensar status**.

O reconciliador lê o volume `update_exchange` a cada dez segundos. Se uma etapa
ultrapassar o limite esperado sem novo estado, a interface sinaliza possível
travamento sem iniciar retry, rollback ou nova atualização automaticamente.
Confirme o estado dos serviços e preserve o snapshot antes de qualquer ação
manual.

As tags v1.0.4 e v1.0.5 não possuem release, Compose ou manifesto de atualização
e não são destinos suportados. A v1.0.4 publicou imagens isoladas; a v1.0.5 foi
bloqueada antes da publicação. Instalações existentes devem atualizar
diretamente para v1.0.8. Não use as imagens isoladas da v1.0.4 nem tente
reconstruir seus artefatos.

## Mudanças de dados e sandbox na v1.0.3

A atualização cria as tabelas de eventos e artefatos de coleta durante as
migrations normais. Antes de atualizar, confirme um snapshot completo
criptografado e espaço livre no volume `netkeep_storage`, que passa a guardar
somente os traces já cifrados e ainda dentro da retenção de 24 horas.

O `init` instala de forma idempotente e atômica o hook gerenciado do reporter
nas configurações de produção e sandbox, inclusive em instalações existentes.
Entradas de hooks não relacionadas são preservadas. Após a atualização,
confirme que `init` e `database-init` terminaram com código zero e que app,
worker, scheduler, Oxidized e sandbox estão saudáveis.

O Git usado pelo sandbox deixa de ser persistente e passa para
`/run/netkeep-diagnostics` em `tmpfs`. O volume legado `sandbox_git` permanece
declarado, não é montado e não é removido automaticamente. Não execute
`docker volume rm` durante a atualização; remova um volume legado apenas em uma
janela posterior, depois de confirmar que não contém nenhum dado necessário.

Depois do primeiro ciclo, valide a limpeza sem expor conteúdo de traces:

```bash
docker compose exec app php artisan netkeep:prune-collection-diagnostics
docker compose ps
```

Uma reversão para versão anterior deve usar o snapshot e a política assinada da
release; não tente desfazer migrations manualmente em produção.
