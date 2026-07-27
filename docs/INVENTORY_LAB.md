# Laboratório de inventário

O laboratório local executa uma instância isolada do NetKeep, NetBox e LibreNMS para validar as integrações de inventário com APIs reais. Ele não compartilha contêineres, redes, volumes ou portas com instalações existentes.

## Iniciar

```bash
scripts/inventory-lab.sh up
```

O primeiro uso cria `.inventory-lab.env` com tokens e senhas efêmeros, com permissões restritas e ignorado pelo Git. Preserve esse arquivo enquanto o laboratório estiver em uso; apagá-lo sem remover os volumes impede a autenticação dos serviços existentes.
O script também prepara contas e tokens de API locais para a validação dos dois
conectores. Não copie esse arquivo para outro ambiente nem o adicione ao Git.

As interfaces ficam disponíveis apenas no loopback:

- NetKeep: `https://127.0.0.1:28543`
- NetBox: `http://127.0.0.1:28181`
- LibreNMS: `http://127.0.0.1:28182`

## Verificação ponta a ponta

```bash
scripts/inventory-lab-verify.sh
```

O verificador adiciona dados fictícios ao NetBox pela API, cria uma fixture
descartável no banco do LibreNMS e confirma que as duas APIs reais são lidas
pelo NetKeep. Cada execução usa identificadores novos e não altera uma
instalação fora do projeto do laboratório.

## Operação

```bash
scripts/inventory-lab.sh config
scripts/inventory-lab.sh logs
scripts/inventory-lab.sh down
```

`down` interrompe somente os contêineres do laboratório e preserva seus volumes. Não use volumes de instalações NetKeep existentes para testes de integração.
