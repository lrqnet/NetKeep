# Atualização

O NetKeep segue SemVer, detecta releases estáveis oficiais no máximo uma vez
por hora e separa a consulta de versões da instalação. A detecção funciona sem
socket Docker e sem depender do agente de atualização.

## Última atualização manual para v1.0.2

Instalações v1.0.0 e v1.0.1 ainda não possuem o updater integrado. Faça uma
última atualização manual para v1.0.2:

```bash
cd /opt/netkeep
docker compose exec app php artisan netkeep:backup
curl -fsSLo compose.yaml.next https://github.com/lrqnet/NetKeep/releases/download/v1.0.2/compose.yaml
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
