# Backup e restauração

O formato portátil v2 inclui PostgreSQL, histórico Git, modelos, identidade
visual, manifesto, `APP_KEY` e o segredo das passkeys. A senha do PostgreSQL e
o token interno do Oxidized não são restaurados: o NetKeep gera valores novos
durante a troca.

O conteúdo é produzido como stream e criptografado antes de ser persistido:

- `.nkb`: Argon2id e secretstream XChaCha20-Poly1305, protegido por senha;
- `.age`: criptografia `age`, protegida por uma identidade mantida fora do
  NetKeep.

Não existe dump ou arquivo TAR em texto claro. A publicação usa arquivo
parcial, checksum, UUID e rename atômico. Guarde a senha ou identidade privada
fora da instalação.

## Criar e verificar

Crie um destino local ou S3 em **Proteção de dados** e inicie o backup pelo
painel. Cada destino aceita apenas um job por vez. O painel mostra estado,
tamanho, horário e SHA-256.

Teste periodicamente a restauração em uma instalação isolada. Um upload
concluído não prova que banco, chaves e histórico podem ser recuperados.

## Preparar pelo painel

Abra `/restore`:

- um proprietário autenticado precisa ter confirmado a senha nos últimos cinco
  minutos;
- sem autenticação, informe o token local de posse da instalação.

O token pode ser consultado ou rotacionado somente no servidor:

```bash
docker compose exec app php artisan netkeep:installation-token
docker compose exec app php artisan netkeep:installation-token --rotate
```

O upload aceita `.nkb` ou `.age` até 2 GiB. O painel apenas grava uma
solicitação protegida no volume `restore_inbox`; ele não recebe acesso ao
socket Docker nem privilégios de recuperação. Em seguida, execute no servidor
o comando exibido pela interface:

```bash
docker compose --profile recovery run --rm recovery \
  php artisan netkeep:restore prepare \
  --web-request=UUID-DA-SOLICITACAO
```

Depois de uma preparação web válida feita com token de instalação, o token é
invalidado. Toda finalização, inclusive via CLI, também invalida o token. Um
novo token só é criado pelo comando local com `--rotate`.

## Preparar arquivos maiores

Arquivos acima de 2 GiB devem ser copiados diretamente para `restore_inbox`.
Os comandos abaixo não exibem a senha no histórico do shell:

```bash
docker compose --profile recovery run --rm -T recovery \
  sh -c 'umask 077; cat > /var/lib/netkeep/restore-inbox/restore.nkb' \
  < netkeep-backup.v2.nkb

docker compose --profile recovery run --rm -T recovery \
  sh -c 'umask 077; cat > /var/lib/netkeep/restore-inbox/recovery-password' \
  < recovery-password

docker compose --profile recovery run --rm recovery \
  php artisan netkeep:restore prepare \
  /var/lib/netkeep/restore-inbox/restore.nkb \
  --password-file=/var/lib/netkeep/restore-inbox/recovery-password
```

Para `age`, copie a identidade com o mesmo procedimento e troque
`--password-file` por:

```bash
--identity=/var/lib/netkeep/restore-inbox/age-identity.txt
```

`prepare` descriptografa em streaming, limita quantidade de arquivos e tamanho
expandido, rejeita path traversal e links, valida manifesto e hashes e restaura
o dump em um banco temporário. Nenhum dado ativo é alterado nessa etapa.

## Aplicar, validar e finalizar

Anote o UUID retornado por `prepare` e aplique:

```bash
docker compose --profile recovery run --rm recovery \
  php artisan netkeep:restore apply \
  --operation=UUID-DA-OPERACAO \
  --force
```

O serviço de recuperação ativa a manutenção, espera filas e coletas em
execução terminarem, preserva banco e diretórios atuais e só então troca banco,
Git, modelos, branding e chaves. A troca bloqueia novas conexões nos bancos
envolvidos antes de encerrar sessões residuais e renomeá-los. O banco anterior
permanece indisponível para conexões e somente o banco restaurado, já com o nome
ativo, volta a aceitá-las.

Reinicie os processos para carregarem as chaves restauradas e o token interno
rotacionado:

```bash
docker compose restart app
docker compose ps app
docker compose --profile recovery run --rm recovery \
  php artisan netkeep:restore finalize \
  --operation=UUID-DA-OPERACAO \
  --force
docker compose restart oxidized sandbox
docker compose ps oxidized sandbox
docker compose restart worker scheduler
```

Antes de avançar para o próximo comando, aguarde os serviços exibidos por
`docker compose ps` ficarem saudáveis. O `finalize` retira o app do modo de
manutenção antes de reiniciar os motores. Essa ordem garante que eles só
consultem a API interna após o app carregar as chaves restauradas e voltar a
aceitar requisições, e que worker e scheduler só iniciem quando os motores
estiverem prontos.

`finalize` valida a propriedade única, banco, Git e chaves antes de remover o
estado anterior e invalida o token de posse. Se essa verificação falhar, o
rollback é executado automaticamente. Reinicie novamente os serviços após um
rollback automático.

## Rollback manual

Enquanto a operação não foi finalizada, é possível retornar explicitamente:

```bash
docker compose --profile recovery run --rm recovery \
  php artisan netkeep:restore rollback \
  --operation=UUID-DA-OPERACAO \
  --force

docker compose restart app worker scheduler oxidized sandbox
```

Não remova os volumes, arquivos `.netkeep-previous-*` nem o banco anterior
antes de `finalize`.

## Backups legados e S3

Backups anteriores ao formato v2 não são portáteis sem a `APP_KEY` original.
Trate-os como recuperação assistida e nunca substitua a única cópia conhecida.

Para S3, prefira credenciais temporárias e baixe o objeto criptografado
diretamente para `restore_inbox`. Não grave credenciais permanentes no Compose,
no shell ou no repositório.

Git-Crypt pode proteger um espelho Git externo em ambientes avançados, mas não
substitui o backup completo criptografado.
