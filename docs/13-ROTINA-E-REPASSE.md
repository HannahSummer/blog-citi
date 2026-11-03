# 13 — Rotina semanal e repasse do blog

Este guia é para quem assume o blog do CITi. Ele resume o que fazer toda semana, quais acessos existem e o que conferir quando alguém entra ou sai da equipe.

## Rotina semanal

| Quando | O quê | Quem | Onde |
|---|---|---|---|
| Segunda, 8h (automático) | O radar coleta notícias, o Claude escreve a copy e as sugestões chegam como pendentes | GitHub Actions | aba **Actions** do repositório |
| Segunda ou terça | Revisar as sugestões: editar, aprovar ou rejeitar. Três boas valem mais que cinco medianas | Curadoria | `/blog/admin/noticias` ([02 — Notícias](02-NOTICIAS.md)) |
| Toda semana | Ver as pessoas novas e mover os leads no Kanban (Novo, Em contato, Qualificado, Descartado) | Comercial | Painel → Contatos ([05 — Diagnóstico](05-DIAGNOSTICO-E-LEADS.md)) |
| Quando houver artigo | Escrever e publicar pelo painel (ou por Pull Request, para quem mexe no código) | Conteúdo | Painel → Artigos ([11 — Como criar artigo](11-COMO-CRIAR-ARTIGO.md)) |
| Quando houver notícia fora do radar | Cadastrar à mão, com fonte e link | Curadoria | Painel → Notícias → Cadastrar notícia ([02 — Notícias](02-NOTICIAS.md)) |
| Quando houver evento | Publicar um momento em "Sobre o CITi" (um arquivo `.md` por momento, fotos em `public/images/sobre/`) | Conteúdo | `src/content/momentos/` |
| Uma vez por mês | Olhar as métricas: o que mais foi lido e de onde vieram as visitas | Marketing | Painel → Métricas |
| Uma vez por mês | Conferir se o backup do banco rodou e se o radar não está com fontes quebradas | Técnico | Coolify → Postgres → Backups; `npm run radar -- --checar-fontes` |

Se o radar falhar numa segunda, a aba **Actions** mostra o erro e é possível rodar de novo em **Run workflow**. Rodar duas vezes na mesma semana não duplica notícias.

## Como uma mudança chega ao site

1. Crie uma branch a partir da `main` (por exemplo, `artigo/nome-do-artigo`).
2. Faça a mudança e rode as validações:
   ```bash
   npm run check
   ```
   Isso confere tipos, testes e build do site e da API. Antes de um deploy, rode também `npm run test:e2e` com o ambiente no ar. Detalhes em [14 — Testes](14-TESTES.md).
3. Abra um Pull Request para a `main` e peça revisão.
4. Ao juntar na `main`, o Coolify publica sozinho (site e API).

Conteúdo editorial (artigos e notícias) só vai ao ar depois de revisão humana.

## Acessos que precisam ser repassados

Mantenha esta lista atualizada com o nome de quem é responsável hoje. Todos os acessos devem estar em contas do CITi, nunca em contas pessoais.

| Acesso | Para quê | Responsável hoje |
|---|---|---|
| GitHub: repositório `blog-citi` (admin) | Código, Pull Requests, Secrets do radar | _preencher_ |
| Coolify (servidor do CITi) | Deploy do site, da API e do banco; terminal para cadastrar editoras | _preencher_ |
| Anthropic Console (conta do CITi) | Chave do Claude usada pelo radar e controle de custo | _preencher_ |
| DNS do domínio `citi.org.br` | Domínios do blog e da API | _preencher_ |
| Token do GitHub da API (`GITHUB_TOKEN`) | Publicar artigos pelo painel. **Vence:** _preencher a data_; gere outro antes | _preencher_ |
| Contas de editora do painel | Notícias, contatos, artigos e métricas | lista com `npm run editora -- listar` |

## Quando alguém sai da equipe

No mesmo dia:

1. **Desative a conta de editora:** `npm run editora -- desativar pessoa@citi.org.br` no terminal da API no Coolify.
2. **Remova o acesso** ao repositório no GitHub e ao Coolify, se a pessoa tinha.
3. Se a pessoa tinha acesso a segredos (`JWT_SECRET`, `RADAR_TOKEN`, chave da Anthropic):
   - gere novos valores ([12 — Backend e deploy](12-BACKEND-E-DEPLOY.md#variáveis-de-ambiente));
   - troque no Coolify e, no caso do `RADAR_TOKEN` e da chave da Anthropic, também nos Secrets do GitHub;
   - faça redeploy da API. Trocar o `JWT_SECRET` desconecta todas as editoras, que só precisam entrar de novo.
4. Atualize a tabela de acessos acima.

## Quando alguém entra na equipe

1. Leia, nesta ordem: [README da documentação](README.md), este guia e o guia do seu papel (02, 05 ou 11).
2. Para quem vai mexer no código: [12 — Backend e deploy](12-BACKEND-E-DEPLOY.md) e o `README.md` da raiz. Rode `docker compose up -d --build` e confira se o site, a API e o painel abrem no seu computador.
3. Peça uma conta de editora a quem cuida da API, se for revisar notícias ou leads.

## Onde está cada coisa

| Preciso mudar… | Arquivo |
|---|---|
| Menu, textos da Home, redes sociais | `src/config/site.ts` |
| Textos do "Sobre o CITi" | `src/config/sobre.ts` |
| Perguntas do diagnóstico | `src/config/diagnostico.ts` ([05](05-DIAGNOSTICO-E-LEADS.md#5-como-alterar-perguntas-ou-textos)) |
| Temas e subtemas | `src/data/categorias.ts`, `src/data/subtemas.ts` |
| Fontes e termos do radar | `scripts/radar/config.ts` ([03](03-RADAR-AUTOMATICO.md)) |
| Capas dos artigos | `npm run capas` (`scripts/capas/`) |
| Regras do banco | `api/prisma/` ([12](12-BACKEND-E-DEPLOY.md#mudar-o-banco)) |
