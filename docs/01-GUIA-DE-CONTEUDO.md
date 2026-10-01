# 01 — Guia de conteúdo: como criar e publicar um post

## Onde ficam os posts

Cada post é um arquivo `.md` em `src/content/posts/`. O **nome do arquivo vira o endereço** do post:

`src/content/posts/comprar-ou-construir-software.md` → `/blog/artigos/comprar-ou-construir-software`

Regras para o nome: minúsculas, sem acento, palavras separadas por hífen, curto e com a palavra-chave principal.

## Modelo do arquivo

```markdown
---
title: "Comprar, adaptar ou construir: como decidir o software da sua empresa"
excerpt: "Antes de escolher uma ferramenta, entenda qual problema ela precisa resolver e quanto custa não resolvê-lo."
meta_description: "Guia prático para decidir entre comprar, adaptar ou desenvolver software sob medida, com critérios de custo, risco e prazo."
date: "2026-10-14"
categoria: "solucoes"
etapa_funil: "consideracao"
cta_tipo: "diagnostico"
cta_link: ""
cover: "/images/covers/comprar-ou-construir.webp"
author: "Nome Sobrenome"
featured: false
---

Introdução: 1 a 2 parágrafos que descrevem o PROBLEMA de negócio na linguagem de quem sente.

## Seção 1

## Seção 2

## Seção 3

Fechamento: o que o leitor deve levar e qual o próximo passo.
```

### O que cada campo faz

| Campo | Obrigatório | Valores | Para que serve |
|---|---|---|---|
| `title` | sim | até ~65 caracteres | Título do post e da aba do navegador |
| `excerpt` | sim | 1 a 2 frases | Resumo nos cards |
| `meta_description` | sim | ~150 caracteres | Texto que aparece no Google e na prévia do LinkedIn |
| `date` | sim | `AAAA-MM-DD` | Ordenação e data exibida |
| `categoria` | sim | `negocios`, `solucoes`, `inovacao`, `institucional`, `gestao` | Filtro e posts relacionados |
| `etapa_funil` | sim | `awareness`, `consideracao`, `intencao` | Define o CTA certo e permite medir o que gera MQL |
| `cta_tipo` | sim | `newsletter`, `material-rico`, `diagnostico` | Bloco de chamada no fim do post |
| `cta_link` | só p/ material rico | URL | Link do material |
| `cover` | recomendado | caminho em `public/` | Capa; sem ela, entra um placeholder |
| `author` | sim | nome | Autoria |
| `featured` | não | `true` / `false` | Post em destaque na Home (deixe só um como `true`) |

O tempo de leitura é calculado sozinho.

### Qual CTA usar

| etapa_funil | O leitor está... | cta_tipo recomendado |
|---|---|---|
| `awareness` | Descobrindo que tem um problema | `newsletter` |
| `consideracao` | Comparando caminhos para resolver | `material-rico` (ou `newsletter` se ainda não houver material) |
| `intencao` | Pronto para agir | `diagnostico` |

## Passo a passo para publicar

1. Crie uma branch: `git checkout -b post/nome-do-post`.
2. Crie o arquivo em `src/content/posts/` copiando o modelo acima.
3. Se houver uma capa local, coloque-a em `public/assets/` e use o caminho no campo `cover`; sem capa, o site usa o placeholder visual.
4. Rode o projeto (`docker compose up`) e confira em `http://localhost:5173/blog/artigos/<nome-do-arquivo>`.
5. Passe pelo checklist abaixo.
6. Faça commit, abra um Pull Request e peça revisão (técnica + editorial). Nos primeiros 60 dias, a aprovação da Gerente/CRO é obrigatória.
7. Depois do merge e do deploy, distribua nas redes com link com UTM.

## Checklist de publicação

**Conteúdo**
- [ ] A introdução começa pelo problema de negócio, não pela tecnologia.
- [ ] Tem 3 a 4 seções com `##` e um fechamento com próximo passo.
- [ ] Nenhuma buzzword sem explicação ("disruptivo", "transformação digital" solto etc.).
- [ ] Dados citados têm fonte com link.
- [ ] Revisão técnica feita por quem entende do assunto.

**Campos e SEO**
- [ ] `title` com até ~65 caracteres e a palavra-chave principal.
- [ ] `meta_description` com ~150 caracteres, escrita para convencer o clique.
- [ ] `categoria`, `etapa_funil` e `cta_tipo` coerentes entre si (ver tabela acima).
- [ ] Capa com texto alternativo adequado.
- [ ] Pelo menos 1 link interno para outro post do blog.

**Distribuição**
- [ ] Link com UTM para cada rede. Padrão: `?utm_source=linkedin&utm_medium=social&utm_campaign=blog&utm_content=<nome-do-post>`.
- [ ] Post no LinkedIn escrito para a rede (não só o link), com o gancho do problema.

## Template de briefing (antes de escrever)

Preencha no cartão da pauta antes de qualquer rascunho:

- **Problema de negócio:** qual dor, em uma frase, na voz do cliente?
- **Persona:** empresa digitalizando processos / startup buscando MVP / empreendedor com necessidade específica.
- **Etapa do funil e CTA:**
- **O que o leitor deve saber ou decidir depois de ler:**
- **Por que o CITi pode falar disso:** case, projeto, especialista.
- **Especialista (SME) a entrevistar:**
- **Palavra-chave principal e 2 secundárias:**
- **Fontes e dados:**
