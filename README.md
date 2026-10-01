# Blog CITi

Protótipo do blog institucional do CITi, empresa júnior de tecnologia B2B da UFPE/CIn. A interface está em português do Brasil e foi preparada para validação com CRO e Gerente antes da revisão de um dev para produção.

## Stack

React 18, TypeScript, Vite, Tailwind CSS v4, React Router, React Markdown, React Helmet Async, Lucide React, Inter Tight local via Fontsource e Supabase opcional. Sem `.env`, os formulários continuam em modo demonstração.

## Documentação

O índice editorial e operacional está em [docs/README.md](docs/README.md). Ele aponta para o guia de conteúdo, notícias, radar automático e estratégia editorial.

## Radar de notícias

O radar coleta feeds, pontua candidatos e gera relatórios para revisão humana:

```bash
npm run radar -- --checar-fontes
npm run radar
npm run radar:promover -- <id> <id>
```

Os rascunhos ficam em `radar/rascunhos/` e só aparecem no site depois de revisados e movidos para `src/content/noticias/`.

## Rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

Com Docker:

```bash
docker compose up --build -d
```

Se o volume de dependências estiver antigo:

```bash
docker compose down -v
docker compose up --build -d
```

O `Dockerfile` e o `docker-compose.yml` não precisam de alterações para esta versão.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run typecheck` | Checagem TypeScript |
| `npm run radar:tipos` | Checagem TypeScript do radar |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |

## Rotas

| Rota | Página |
| --- | --- |
| `/` | Redireciona para `/blog` |
| `/blog` | Home, metodologia, destaque, radar, sobre e newsletter |
| `/blog/artigos` | Lista de artigos |
| `/blog/artigos?categoria=gestao` | Lista filtrada por categoria |
| `/blog/artigos/:slug` | Artigo individual |
| `/blog/noticias` | Notícias mock agrupadas em lista |
| `/blog/diagnostico?origem=<slug>` | Formulário de diagnóstico demo ou Supabase |
| `*` | Página 404 |

## Estrutura

```text
src/
├── App.tsx
├── main.tsx
├── config/site.ts          # Menu e textos fixos de interface
├── components/             # Header, busca, cards, footer, SEO e newsletter
├── layouts/SiteLayout.tsx
├── pages/                  # Home, artigos, notícias, diagnóstico e 404
├── content/
│   ├── posts/*.md
│   └── noticias/*.md
├── data/                   # Posts, notícias e categorias
├── hooks/useUtm.ts
├── services/leads.ts       # Persistência Supabase ou modo demonstração
├── lib/supabase.ts         # Cliente Supabase opcional
└── styles/
    ├── tokens.css
    └── app.css

public/assets/logo-citi.png
```

## Publicar um artigo

1. Crie um arquivo `.md` em `src/content/posts/`.
2. Use o front matter abaixo.
3. Escreva o conteúdo editorial no corpo do Markdown.
4. Rode `npm run typecheck` e `npm run build`.

```md
---
title: "Título do artigo"
excerpt: "Resumo curto"
meta_description: "Descrição para SEO com aproximadamente 150 caracteres."
date: "2026-09-30"
categoria: "negocios"
etapa_funil: "awareness"
cta_tipo: "newsletter"
author: "CITi"
featured: false
accent: "lime"
---

Texto do artigo em Markdown.
```

Categorias: `negocios`, `solucoes`, `inovacao`, `institucional` e `gestao`. CTAs: `newsletter`, `diagnostico` e `material-rico`.

## Publicar uma notícia

1. Crie um arquivo `.md` em `src/content/noticias/`.
2. Use resumo próprio e nunca copie o texto da fonte.
3. Informe a fonte e o link original.
4. Rode as validações antes de publicar.

```md
---
title: "Título da notícia"
date: "2026-09-30"
categoria: "inovacao"
fonte: "Nome do veículo"
link: "https://exemplo.com/materia"
resumo: "Resumo em palavras próprias."
---

Por que isso importa para o seu negócio.
```

As notícias atuais têm `[EXEMPLO]`, `Fonte exemplo` e `#` de propósito, para não serem confundidas com conteúdo real.

## Onde editar

- Menu, hero, metodologia e sobre: `src/config/site.ts`
- Categorias: `src/data/categorias.ts`
- Formulários mock: `src/services/leads.ts`
- Supabase e migração: `src/lib/supabase.ts` e `supabase/migrations/`
- UTM: `src/hooks/useUtm.ts`
- Logo: `public/assets/logo-citi.png`

## TODOs antes de produção

- Validar com CRO e Gerente os textos do hero e da metodologia.
- Substituir números provisórios da seção Sobre por dados reais.
- Confirmar prazo de retorno com o Comercial.
- Definir a política de privacidade.
- Fornecer a logo SVG oficial, se disponível.
- Integrar o aviso de novos leads ao backend/CRM ou webhook do Supabase.
- Trocar notícias mock por curadoria aprovada.
- Revisar acessibilidade, SEO e conteúdo com um dev antes da publicação.

## Checklist de teste

- `/blog`: hero, categorias, âncoras de metodologia/sobre, radar e newsletter.
- `/blog/artigos?categoria=gestao`: filtro e URL.
- `/blog/artigos/:slug`: leitura, CTA e artigos relacionados.
- `/blog/noticias`: âncoras e links de fonte.
- `/blog/diagnostico?origem=<slug>&utm_source=linkedin`: validação e payload mock no console.
- Atalho `/`, busca, menu mobile, Escape e navegação por teclado.