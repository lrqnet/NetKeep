# Atualização

NetKeep segue SemVer. Leia o `CHANGELOG` e faça backup completo antes de
trocar a versão.

## Manual

```bash
cd /opt/netkeep
docker compose exec app php artisan netkeep:backup
curl -fsSLo compose.yaml https://github.com/lrqnet/NetKeep/releases/download/v1.0.1/compose.yaml
docker compose pull
docker compose up -d
docker compose ps
```

Migrations são executadas pelo contêiner web antes de ele ficar saudável.
Web, worker e scheduler usam a mesma imagem.

Ao atualizar uma instalação criada antes da separação das credenciais do
PostgreSQL, o inicializador preserva o papel bootstrap obrigatório como uma
conta sem login, cria o papel restrito `netkeep` e transfere para ele somente
os objetos da aplicação. A mesma etapa corrige configurações legadas do
Oxidized para `interval: 0`, `retries: 0`, `next_adds_job: false`, SSH seguro e
a porta interna atual, preservando o limite de threads quando estiver entre 1
e 20.

Para voltar, restaure o Compose e o backup da versão anterior. Um rollback de
imagem sem rollback do banco não é garantido.

## Perfil `auto-update`

```bash
docker compose --profile auto-update up -d
```

O WUD observa somente o contêiner `app` rotulado e somente tags da versão
principal `1.x`. Ele não atualiza sozinho: o proprietário habilita o recurso
no painel, escolhe um destino de backup e o NetKeep encadeia backup completo
e trigger interno. Alterações de versão principal são sempre manuais.
