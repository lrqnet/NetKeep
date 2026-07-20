# Idiomas e localização

O NetKeep oferece Inglês (`en`), Português do Brasil (`pt_BR`) e Espanhol
latino-americano (`es`). Inglês é o padrão de uma instalação nova. O idioma
do navegador não é detectado automaticamente.

## Como o idioma é escolhido

A aplicação usa a primeira preferência válida nesta ordem:

1. idioma do usuário autenticado;
2. cookie criado por uma escolha explícita;
3. idioma padrão da empresa;
4. Inglês.

O seletor com globo está disponível na página inicial, autenticação,
configuração inicial, menu do usuário e perfil. Antes do primeiro acesso, a
escolha acompanha o cadastro do proprietário. Ao concluir a configuração
inicial, o mesmo idioma é salvo no proprietário e na empresa.

Depois da instalação, o seletor altera somente a preferência pessoal. O
idioma padrão para alertas operacionais e novos acessos sem preferência é
administrado em **Sistema**.

Datas, horários e números usam `en-US`, `pt-BR` ou `es-419`. Nomes próprios,
fabricantes, drivers, comandos, protocolos, endereços, chaves de API e
contratos internos permanecem tecnicamente estáveis.

## CSV

A exportação de equipamentos usa cabeçalhos no idioma do usuário e codificação
UTF-8 com BOM. A importação aceita os cabeçalhos de qualquer idioma suportado
e também os identificadores técnicos históricos:

| Campo técnico    | Inglês           | Português         | Espanhol          |
| ---------------- | ---------------- | ----------------- | ----------------- |
| `name`           | `name`           | `nome`            | `nombre`          |
| `hostname`       | `hostname`       | `hostname`        | `hostname`        |
| `ip_address`     | `ip_address`     | `endereco_ip`     | `direccion_ip`    |
| `port`           | `port`           | `porta`           | `puerto`          |
| `transport`      | `transport`      | `transporte`      | `transporte`      |
| `manufacturer`   | `manufacturer`   | `fabricante`      | `fabricante`      |
| `hardware_model` | `hardware_model` | `modelo_fisico`   | `modelo_fisico`   |
| `oxidized_model` | `oxidized_model` | `modelo_oxidized` | `modelo_oxidized` |
| `group`          | `group`          | `grupo`           | `grupo`           |
| `site`           | `site`           | `site`            | `sitio`           |
| `enabled`        | `enabled`        | `ativo`           | `activo`          |

Valores como `ssh`, `telnet`, modelos, IPs e `1`/`0` não são traduzidos.
Cabeçalhos duplicados depois da normalização são rejeitados para evitar
importações ambíguas.

## Desenvolvimento

Os catálogos ficam organizados por domínio em
`resources/js/i18n/catalogs`. Cada chave declara simultaneamente os três
idiomas, e o tipo TypeScript impede a ausência de uma variante. Execute:

```bash
npm run translations:check
```

A verificação rejeita traduções vazias e interpolações incompatíveis. O
backend usa os catálogos em `lang/en`, `lang/pt_BR` e `lang/es`. Códigos de
auditoria, eventos de webhook e chaves de payload nunca são traduzidos;
somente a descrição humana exibida ou enviada é localizada.
