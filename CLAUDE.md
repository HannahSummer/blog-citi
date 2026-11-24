# Blog CITi - instruções para o Claude Code

## Objetivo do projeto

Este é o blog institucional do CITi, uma empresa júnior de tecnologia B2B da UFPE/CIn.
A interface é em português do Brasil e o projeto está em fase de MVP.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- React Markdown
- API em NestJS 11 + Prisma 6 + Postgres (pasta `api/`)
- Scripts do Radar em TypeScript
- Deploy no Coolify (docs/12-BACKEND-E-DEPLOY.md)

## Comandos de validação

Antes de concluir uma alteração, use os comandos relevantes:

```bash
npm run typecheck
npm run radar:tipos
npm run api:typecheck
npm run build
```

Para desenvolvimento (site, API e Postgres):

```bash
docker compose up -d --build
```

## Regras de trabalho

- Preserve alterações locais existentes e não reverta mudanças que não foram feitas
  pela tarefa atual.
- Não exponha chaves, tokens ou credenciais no código, no frontend ou em commits.
- Mantenha a interface e os textos voltados para português do Brasil.
- Siga os padrões existentes de componentes, configuração, dados e estilos antes de
  criar uma nova abstração.
- Para conteúdo editorial, não copie textos de fontes externas; produza resumos
  próprios e preserve a atribuição da fonte e o link original.
- Notícias em `src/content/noticias/` só devem ser publicadas após revisão humana.
- Não altere migrações ou configurações de produção sem explicar o impacto.
- Faça mudanças pequenas e relacionadas ao pedido. Não corrija problemas não
  relacionados.

## Áreas importantes

- `src/components/`: componentes reutilizáveis
- `src/pages/`: páginas e rotas
- `src/config/`: configurações de interface e negócio
- `src/content/`: conteúdo Markdown do blog
- `src/services/`: integrações e persistência
- `scripts/radar/`: coleta, pontuação e promoção de notícias
- `api/`: API NestJS (diagnóstico, newsletter, notícias, painel); banco em `api/prisma/`.
  Ela importa regras de `src/config/diagnostico.ts`, `src/lib/diagnostico-schema.ts`,
  `src/config/noticias.ts` e `src/data/`: ao mudar esses arquivos, valide o site e a API.
  Migrações já aplicadas nunca são editadas; crie uma nova.
- `docs/`: documentação editorial e operacional

## Fluxo esperado

1. Leia os arquivos relacionados antes de editar.
2. Explique brevemente o plano quando a tarefa envolver mais de um arquivo.
3. Faça a alteração mínima necessária.
4. Execute as validações aplicáveis.
5. Relate arquivos alterados, validações executadas e qualquer pendência.
