# Como criar um artigo

## Pelo painel (o jeito mais simples)

1. Entre em `/blog/admin/artigos` com a conta de editora e clique em **Novo artigo**.
2. Preencha os campos. Os contadores avisam os limites (título até 65 caracteres; descrição para o Google entre 140 e 160) e o endereço final aparece logo abaixo do título.
3. Escreva o texto em Markdown: `##` para seções, `**negrito**`, `[texto do link](https://...)`. Use **Prévia** para ver como fica.
4. Clique em **Publicar artigo**. Ele vai ao ar em cerca de 2 minutos. Se preferir revisar antes, marque **Salvar como rascunho**: o arquivo vai para o GitHub com `draft: true` e não aparece no site.

O painel usa as mesmas regras do build, então um artigo aceito pelo painel não quebra o deploy. Para isso funcionar, a API precisa do token do GitHub ([12 — Backend e deploy](12-BACKEND-E-DEPLOY.md#artigos-pelo-painel)).

## Pelo terminal (para quem mexe no código)

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
| `subtema` | Vazio ou, conforme a categoria: Negócios (`marketing`, `vendas`), Soluções (`dados`, `desenvolvimento`, `inovacao`, `experiencia-do-cliente`), Gestão (`gestao-empresarial`, `big-techs`, `financas`). |
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

## Capa

As capas são geradas por código, no degradê azul → verde da marca, com um padrão visual por subtema
(onda para Marketing, leque para Vendas, pontos para Dados, faixas para Desenvolvimento, anéis para
Inovação, fita para Experiência do cliente, curvas para Gestão empresarial, pixels para Big techs e
degraus para Finanças). Cada artigo ganha uma variação única a partir do slug.

1. No front matter, use `cover: "/images/covers/<slug>.webp"`.
2. Rode `npm run capas`. Ele cria só as capas que faltam (precisa do Google Chrome instalado).
3. Preencha `cover_alt` com a descrição do padrão (a lista está em `scripts/capas/estilos.ts`, em `ALT_DO_PADRAO`).

Para refazer uma capa: `npm run capas -- --so <slug>`. Para usar uma capa feita à mão, salve o arquivo
com o mesmo nome em `public/images/covers/`; o script não substitui capas que já existem.
