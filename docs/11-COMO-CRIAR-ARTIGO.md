# Como criar um artigo

1. Abra o terminal na pasta do projeto.
2. Rode `npm run novo-artigo` e responda às perguntas.
3. Abra o arquivo criado em `src/content/posts/`, escreva o texto e preencha `author` e `cover`.
4. Rode `npm run validar-artigos` e corrija os erros que aparecerem.
5. Veja o resultado em `http://localhost:5173/blog/artigos/<slug>`.
6. Troque `draft: true` para `draft: false` quando estiver pronto.
7. Envie pelo fluxo de Pull Request que o time já usa.

## Campos

| Campo | Significado e valores aceitos |
|---|---|
| `title` | Título com até 65 caracteres. |
| `excerpt` | Resumo de uma ou duas frases. |
| `meta_description` | Descrição entre 140 e 160 caracteres. |
| `date` | Data no formato `AAAA-MM-DD`. |
| `categoria` | `negocios`, `solucoes` ou `gestao`. |
| `subtema` | Vazio ou `marketing-comercial`, `inovacao` e `financeiro`, conforme a categoria. |
| `etapa_funil` | `awareness`, `consideracao` ou `intencao`. |
| `cta_tipo` | `diagnostico`, `material-rico` ou `newsletter`. |
| `cover` / `cover_alt` | Caminho `.webp` em `public/images/covers/` e seu texto alternativo. |
| `author` | Nome da pessoa autora. |
| `featured` | `true` em no máximo um artigo; normalmente `false`. |
| `draft` | `true` esconde o artigo; use `false` após a revisão. |
| `palavras_chave` | Lista obrigatória, separada por vírgulas. |

## O que não fazer

- Não usar `institucional` como categoria.
- Não colocar título `#` no corpo do artigo.
- Não publicar sem fonte para número.
- Não remover a revisão humana antes de trocar `draft` para `false`.
