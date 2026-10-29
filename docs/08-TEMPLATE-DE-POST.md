# Template de post

Use este front matter no início de cada arquivo em `src/content/posts/`:

```yaml
---
title: "Título com até 65 caracteres"
excerpt: "Resumo em uma ou duas frases."
meta_description: "Descrição para buscadores com 140 a 160 caracteres."
date: "AAAA-MM-DD"
categoria: "negocios" # negocios, solucoes ou gestao
subtema: "" # negocios: marketing, vendas | solucoes: dados, desenvolvimento, inovacao, experiencia-do-cliente | gestao: gestao-empresarial, big-techs, financas
etapa_funil: "awareness" # awareness, consideracao ou intencao
cta_tipo: "diagnostico" # diagnostico, material-rico ou newsletter
cover: "/images/covers/exemplo.webp"
cover_alt: "Descrição da imagem"
author: "Nome da pessoa autora"
featured: false
draft: true
palavras_chave: "palavra principal, palavra secundária"
---
```

O corpo não deve repetir o título com `#`. Recomenda-se escrever de 500 a 900 palavras para `awareness` e de 800 a 1.400 para `consideracao`. `draft: true` mantém o artigo escondido do site até a revisão e publicação.
