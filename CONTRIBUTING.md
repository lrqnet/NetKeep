# Contribuindo

Obrigado por ajudar provedores e equipes de rede.

Prepare o ambiente conforme o guia de
[desenvolvimento e testes locais](docs/DEVELOPMENT.md).

1. abra uma issue descrevendo problema, proposta e impacto;
2. crie um branch curto;
3. mantenha a aplicação somente leitura em relação aos equipamentos;
4. não inclua configurações, IPs, tokens ou credenciais reais;
5. adicione testes e traduções para texto novo;
6. execute `composer ci:check` e o build Docker de teste;
7. abra um pull request explicando riscos, migração e validação.

Mudanças de banco devem preservar histórico e ter rollback seguro. Novas
integrações de saída precisam de timeout, redirects desativados, proteção
SSRF, mascaramento de logs e retry limitado. Modelos Ruby guiados devem gerar
somente código escapado.

Ao contribuir, você concorda que sua contribuição será licenciada sob
AGPL-3.0-only.
