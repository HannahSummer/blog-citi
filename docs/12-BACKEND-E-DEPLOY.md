# 12 — Backend e deploy (API, banco e Coolify)

Este guia é para quem cuida da parte técnica do blog: a API, o banco de dados e a publicação no Coolify.
Para a rotina de quem só escreve e revisa conteúdo, veja [13 — Rotina e repasse](13-ROTINA-E-REPASSE.md).

## Como as peças se ligam

```
                 ┌──────────────────────┐
 visitante ────► │ Site (React + nginx) │  arquivos estáticos: artigos, notícias em Markdown, páginas
                 └──────────┬───────────┘
                            │ fetch (VITE_API_URL)
                 ┌──────────▼───────────┐       ┌────────────┐
                 │ API (NestJS)         │ ────► │ Postgres   │
                 │ /api/...             │       │ (Prisma)   │
                 └──────────▲───────────┘       └────────────┘
                            │ POST /api/radar/noticias (RADAR_TOKEN)
                 ┌──────────┴───────────┐
                 │ Radar semanal        │  GitHub Actions, toda segunda às 8h
                 └──────────────────────┘
```

- **Site** (pasta raiz, `src/`): tudo o que o visitante vê. Artigos e momentos ficam em Markdown dentro do repositório; publicar um artigo é fazer um commit.
- **API** (pasta `api/`): recebe diagnósticos e inscrições da newsletter, guarda as notícias do radar e serve o painel interno. NestJS 11 + Prisma 6.
- **Banco** (Postgres): leads, newsletter, notícias do radar e as contas de editora.
- **Radar** (`scripts/radar/`): coleta notícias, pede a copy ao Claude e envia para a API como pendentes ([03 — Radar](03-RADAR-AUTOMATICO.md)).

### Regras compartilhadas

A API importa arquivos do site para não existir uma segunda cópia das regras:

| Arquivo | O que define |
|---|---|
| `src/config/diagnostico.ts` | Perguntas, pontuação, níveis e opções do diagnóstico |
| `src/lib/diagnostico-schema.ts` | Validação dos campos do formulário |
| `src/config/noticias.ts` | Status e limites de tamanho das notícias |
| `src/data/categorias.ts`, `subtemas.ts`, `continentes.ts` | Valores aceitos em categoria, subtema e continente |

Ao mudar um desses arquivos, publique **o site e a API**. Se a mudança alterar o que o banco aceita, crie também uma migração ([Mudar o banco](#mudar-o-banco)).

## Estrutura da pasta `api/`

```
api/
├── Dockerfile                 # imagem de produção (e o estágio "dev" do docker-compose)
├── .env.example               # todas as variáveis, com explicação
├── prisma/
│   ├── schema.prisma          # tabelas
│   └── migrations/            # histórico do banco (SQL), aplicado sozinho a cada deploy
└── src/
    ├── main.ts                # sobe a API (prefixo /api, CORS, proxy)
    ├── config.ts              # lê e confere as variáveis de ambiente
    ├── diagnosticos/          # POST /api/diagnosticos
    ├── newsletter/            # POST /api/newsletter
    ├── noticias/              # notícias públicas, curadoria e cadastro manual
    ├── leads/                 # painel de contatos (lista, Kanban) e exportação
    ├── artigos/               # publica artigo pelo painel (commit no GitHub)
    ├── metricas/              # contagem anônima de acessos e resumo do painel
    ├── auth/                  # login das editoras (senha com scrypt, token JWT de 8 horas)
    ├── radar/                 # recebe as sugestões do radar
    ├── limite/                # limite de envios por IP
    ├── saude/                 # GET /api/saude (healthcheck)
    ├── app.setup.ts           # configuração comum (prefixo, CORS, Swagger), usada também nos testes
    └── cli/editora.ts         # comando para cadastrar editoras
```

### Rotas

| Rota | Quem usa | Proteção |
|---|---|---|
| `GET /api/saude` | Coolify (healthcheck) | aberta |
| `POST /api/diagnosticos` | formulário do diagnóstico | 5 envios/minuto por IP |
| `POST /api/newsletter` | bloco de newsletter | 5 envios/minuto por IP |
| `GET /api/noticias` | páginas de notícias e globo | aberta (só aprovadas, só colunas públicas) |
| `POST /api/auth/entrar`, `GET /api/auth/eu` | login do painel | 5 tentativas/minuto por IP |
| `GET /api/admin/noticias`, `PATCH /api/admin/noticias/:id` | painel de notícias | token de editora |
| `GET /api/admin/diagnosticos`, `PATCH /api/admin/diagnosticos/:id`, `GET /api/admin/newsletter` | painel de contatos (lista e Kanban) | token de editora |
| `POST /api/admin/noticias` | cadastro manual de notícia (publica na hora) | token de editora |
| `GET /api/admin/artigos/configuracao`, `POST /api/admin/artigos` | publicar artigo pelo painel (commit no GitHub) | token de editora |
| `POST /api/metricas/visita` | o site avisa cada página aberta (anônimo) | 60 por minuto por IP |
| `GET /api/admin/metricas?dias=30` | painel de métricas | token de editora |
| `POST /api/radar/noticias` | radar semanal | `RADAR_TOKEN` |

Ninguém de fora lê leads: só as editoras logadas, pelo painel.

## Documentação da API (Swagger)

Com `SWAGGER_HABILITADO=true`, a API publica a documentação interativa em `/api/docs`, com todas as rotas, os campos aceitos e um botão **Authorize** para testar as rotas do painel (use o token obtido em `POST /api/auth/entrar`).

- No computador (`docker compose`): já vem ligado em http://localhost:3000/api/docs.
- Em produção: deixe `SWAGGER_HABILITADO` **desligado** (padrão). Com ele desligado, `/api/docs` responde 404 e a documentação não fica pública.
- Para consultar a documentação em produção sem publicá-la, ligue a variável só por um tempo, teste e desligue de novo.

## Variáveis de ambiente

| Onde | Variável | Para quê |
|---|---|---|
| Site (Coolify, **Build Variable**) | `VITE_API_URL` | Endereço da API, sem `/api` no fim |
| API (Coolify) | `DATABASE_URL` | Endereço interno do Postgres |
| API (Coolify) | `JWT_SECRET` | Assina o login das editoras (48+ caracteres aleatórios) |
| API (Coolify) | `RADAR_TOKEN` | Senha do radar (32+ caracteres aleatórios) |
| API (Coolify) | `SWAGGER_HABILITADO` | `false` (padrão). `true` publica a documentação em `/api/docs` |
| API (Coolify) | `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` | Opcionais. Liberam a publicação de artigos pelo painel ([Artigos pelo painel](#artigos-pelo-painel)) |
| API (Coolify) | `SITE_URL` | Endereço do site; só ele pode chamar a API pelo navegador. Vários? Separe por vírgula |
| GitHub Secrets | `ANTHROPIC_API_KEY`, `API_URL`, `RADAR_TOKEN` | Radar semanal |

Para gerar `JWT_SECRET` e `RADAR_TOKEN`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

A API **não sobe** se faltar alguma variável obrigatória; o motivo aparece no log do deploy.
Nenhuma dessas chaves vai para o repositório. `.env` e `api/.env` estão no `.gitignore`.

## Rodar no computador

Precisa do Docker Desktop aberto.

```bash
docker compose up -d --build
```

| Serviço | Endereço |
|---|---|
| Site | http://localhost:5173/blog |
| API | http://localhost:3000/api/saude |
| Postgres | `localhost:5433`, usuário `citi`, senha `citi`, banco `blog_citi` |

A API aplica as migrações sozinha ao subir e recompila ao salvar um arquivo. Para criar uma editora local:

```bash
docker compose exec api npm run editora -- criar voce@citi.org.br "uma senha de teste longa"
```

Comandos úteis:

```bash
docker compose logs -f api          # acompanhar a API
docker compose restart api          # reiniciar a API
docker compose down                 # desligar tudo (os dados do banco ficam)
docker compose down -v              # desligar e APAGAR o banco local
npm run api:typecheck               # conferir tipos da API
npm run api:build                   # compilar a API
```

## Deploy no Coolify

São três recursos no mesmo projeto do Coolify: **Postgres**, **API** e **Site**. Faça nessa ordem.
Os nomes dos campos podem variar um pouco entre versões do Coolify.

### 1. Postgres

1. No projeto, **+ New → Database → PostgreSQL** (versão 17).
2. Abra o banco e copie a **Postgres URL (internal)**. Ela é a `DATABASE_URL` da API.
3. Em **Backups**, ative um backup agendado (diário). Se o CITi tiver um bucket S3, configure como destino; senão, o backup fica no próprio servidor.
4. Não marque o banco como público. Só a API precisa falar com ele, pela rede interna.

### 2. API

1. **+ New → Application**, escolha o repositório `blog-citi` (GitHub App do Coolify) e a branch.
2. **Build Pack:** Dockerfile.
   - **Base Directory:** `/`
   - **Dockerfile Location:** `/api/Dockerfile`
3. **Ports Exposes:** `3000`.
4. **Environment Variables:** `DATABASE_URL`, `JWT_SECRET`, `RADAR_TOKEN` e `SITE_URL` (tabela acima). Não precisam ser de build.
5. **Healthcheck:** caminho `/api/saude`, porta `3000`.
6. **Domains:** um domínio próprio, por exemplo `https://api.blog.citi.org.br`. O Coolify gera o HTTPS.
7. **Deploy.** No log, procure `API do Blog CITi ouvindo na porta 3000`. As migrações rodam antes de a API subir; se uma falhar, a API não sobe e o erro aparece no log.
8. Abra `https://<domínio da API>/api/saude`. Deve responder `{"ok":true}`.

### 3. Site

1. **+ New → Application**, mesmo repositório e branch.
2. **Build Pack:** Dockerfile. **Base Directory:** `/`. **Dockerfile Location:** `/Dockerfile`.
3. **Ports Exposes:** `8080`.
4. **Environment Variables:** `VITE_API_URL` = domínio da API, com a opção de **variável de build** marcada (Build Variable / Available at Buildtime). Sem ela, o site sobe sem formulários.
5. **Domains:** o domínio do blog, por exemplo `https://blog.citi.org.br`.
6. **Deploy.** O build roda a validação dos artigos; se um artigo tiver erro, o deploy para e o erro aparece no log.
7. Volte na API e confira se `SITE_URL` é exatamente o domínio do site (com `https://`, sem barra no fim). Se mudou, faça redeploy da API.

Enquanto o site estiver num endereço temporário do Coolify (`*.sslip.io`), o nginx avisa o Google para não indexar. No domínio definitivo, a indexação é normal.

### 4. Deploy automático

Ative **Auto Deploy** nos dois apps. Cada push na branch configurada publica de novo. Recomendado: configurar a branch `main` e só juntar mudanças nela por Pull Request.

### 5. Depois do primeiro deploy

1. Cadastre as editoras ([Editoras](#editoras)).
2. Cadastre os Secrets do radar no GitHub ([03 — Radar](03-RADAR-AUTOMATICO.md)) e rode o workflow uma vez pela aba **Actions → Radar semanal → Run workflow**.
3. Faça um diagnóstico de teste no site e confira em `/blog/admin/leads`. Depois mude o status dele para Descartado.

## Editoras

As contas do painel interno (`/blog/admin/noticias` e `/blog/admin/leads`) são criadas por comando, no **Terminal** do app da API no Coolify:

```bash
npm run editora -- criar     pessoa@citi.org.br "senha com 12 ou mais caracteres"
npm run editora -- senha     pessoa@citi.org.br "nova senha"      # troca a senha e reativa
npm run editora -- desativar pessoa@citi.org.br                   # corta o acesso na hora
npm run editora -- listar
```

Passe a senha para a pessoa por um canal privado e peça para ela não reutilizar. Quando alguém sair do CITi, **desative** a conta no mesmo dia.

## Artigos pelo painel

Em `/blog/admin/artigos`, uma editora escreve o artigo e clica em **Publicar**. A API cria o arquivo `src/content/posts/<endereço>.md` com um commit no GitHub, e o Coolify publica sozinho em cerca de 2 minutos (deploy automático).

- **Regras:** o formulário usa as mesmas regras do build (`src/config/artigos.ts`). Se o painel aceitar, o deploy não quebra.
- **Endereço:** gerado a partir do título. Se já existir um artigo com o mesmo endereço, o painel recusa (não sobrescreve).
- **Rascunho:** marcando "Salvar como rascunho", o arquivo vai com `draft: true` e não aparece no site. Para publicar depois, troque para `draft: false` no GitHub.
- **Capa:** o artigo novo usa a capa padrão da categoria. Para uma capa própria, gere com `npm run capas` e faça o commit.
- **Corrigir um artigo no ar:** edite o arquivo direto no GitHub ou pelo fluxo de [11 — Como criar artigo](11-COMO-CRIAR-ARTIGO.md).

Para ligar, cadastre na API do Coolify:

1. No GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - **Repository access:** só o repositório do blog.
   - **Permissions → Contents:** Read and write. Nenhuma outra permissão.
   - Validade: até 1 ano. Anote quando vence (a tabela de acessos do [guia 13](13-ROTINA-E-REPASSE.md) tem espaço para isso).
2. No Coolify, na API: `GITHUB_TOKEN` (o token), `GITHUB_REPO` (`HannahSummer/blog-citi`, ou o repositório da organização se ele for transferido) e `GITHUB_BRANCH` (a branch que o Coolify publica: hoje `deploy-coolify`; depois do merge, `main`).
3. Redeploy da API. O aviso amarelo some da página de artigos.

O token só fica na API. Se ele vazar, revogue no GitHub e gere outro. Sem as variáveis, o resto do painel funciona normalmente.

## Métricas de acesso

O site avisa a API a cada página aberta e o painel `/blog/admin/metricas` mostra visitantes, visitas, páginas mais vistas, de onde as pessoas vieram (Instagram, LinkedIn, Google, acesso direto), campanhas e aparelhos, em 7, 30 ou 90 dias.

A contagem é **anônima**:
- não usa cookies nem guarda nada no navegador;
- não guarda o IP: cada visitante vira um código que muda todo dia (hash do IP e do navegador com uma chave diária), usado só para contar visitantes únicos do dia;
- não conta o painel interno, robôs nem quem ativou "não rastrear" no navegador.

Por isso não dá para saber **quem** visitou; quem quer ser contatado aparece em Contatos, pelo diagnóstico ou pela newsletter. A política de privacidade do CITi deve mencionar essa contagem anônima de acessos.

Para medir uma divulgação, use links com campanha, por exemplo:
`https://blog.citi.org.br/blog?utm_source=instagram&utm_campaign=lancamento`.
Os dados ficam na tabela `visitas` do Postgres.

## Mudar o banco

A estrutura do banco está em `api/prisma/schema.prisma`; o histórico, em `api/prisma/migrations/`. Nunca altere uma migração que já foi aplicada em produção: crie outra.

1. Com o ambiente local rodando, edite `schema.prisma`.
2. Gere a migração sem aplicar:
   ```bash
   cd api
   DATABASE_URL=postgresql://citi:citi@localhost:5433/blog_citi npm run db:nova-migracao -- --name descricao-curta
   ```
   No PowerShell: `$env:DATABASE_URL="postgresql://citi:citi@localhost:5433/blog_citi"; npm run db:nova-migracao -- --name descricao-curta`.
3. Abra o `migration.sql` gerado. Se a regra precisar de `CHECK` (tamanho, valores permitidos), escreva no SQL, como na migração inicial.
4. `docker compose restart api` aplica no banco local. Teste.
5. Commit e deploy: a API aplica a migração sozinha ao subir em produção.

Antes de uma migração que apaga ou renomeia coluna, faça um backup manual do Postgres no Coolify.

## Backups e restauração

- O backup agendado do Postgres fica em **Coolify → banco → Backups**. Confira uma vez por mês se está rodando.
- Para restaurar, use a opção de restore do Coolify ou `pg_restore` no terminal do banco.
- Os artigos, notícias em Markdown e momentos não estão no banco: estão no GitHub.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Formulários somem no site publicado | `VITE_API_URL` não foi cadastrada como variável de build. Corrija e faça redeploy do site. |
| Formulário dá "Não conseguimos enviar agora" | API fora do ar (`/api/saude`) ou `SITE_URL` diferente do domínio do site (erro de CORS no console do navegador). |
| API não sobe | Variável faltando (mensagem no log) ou migração com erro. |
| Painel diz "Sessão expirada" | O login dura 8 horas. Entre de novo. |
| Radar falha com 401 | `RADAR_TOKEN` diferente no GitHub e no Coolify. |
| "Muitas tentativas" no login | Mais de 5 tentativas em 1 minuto. Espere um minuto. |
