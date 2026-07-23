# Atualização

O NetKeep segue SemVer, detecta releases estáveis oficiais no máximo uma vez
por hora e separa a consulta de versões da instalação. A detecção funciona sem
socket Docker e sem depender do agente de atualização.

## Atualização manual para instalações sem updater

Instalações v1.0.0 e v1.0.1 ainda não possuem o updater integrado. Faça uma
última atualização manual diretamente para v1.0.3:

```bash
cd /opt/netkeep
docker compose exec app php artisan netkeep:backup
curl -fsSLo compose.yaml.next https://github.com/lrqnet/NetKeep/releases/download/v1.0.3/compose.yaml
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
- iniciar atualização manual com confirmação de senha;
- acompanhar backup, validação, download, aplicação, reinício e health check;
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
