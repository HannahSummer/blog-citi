<div align="center">

<img src="public/assets/logo-citi.png" alt="CITi" width="120" />

# Blog do CITi

**Ideias que movem negócios. Tecnologia que aproxima pessoas.**

Blog institucional do CITi, a empresa júnior de tecnologia do Centro de Informática da UFPE.
Artigos, radar semanal de notícias, diagnóstico digital para empresas e a história do CITi.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Coolify](https://img.shields.io/badge/deploy-Coolify-6B16ED)

[Rodar o projeto](#-rodar-o-projeto) · [Estrutura](#-estrutura) · [Documentação](#-documentação) · [Deploy](docs/12-BACKEND-E-DEPLOY.md) · [Vai assumir o blog?](docs/13-ROTINA-E-REPASSE.md)

</div>

---

## ✨ O que tem no blog

| Área | Rota | O que faz |
| --- | --- | --- |
| **Home** | `/blog` | Destaque da semana, metodologia "Nosso jeito", temas, radar com globo e "Sobre o CITi" |
| **Artigos** | `/blog/artigos` | Artigos em Markdown, filtráveis por tema e subtema, com capas geradas |
| **Notícias** | `/blog/noticias` | Radar semanal: o leitor gira o globo e lê a notícia de cada continente |
| **Diagnóstico** | `/blog/diagnostico` | Quiz de 6 perguntas com resultado em radar e formulário de contato |
| **Sobre o CITi** | `/blog/sobre` | Momentos do CITi (eventos, conquistas e projetos) com galerias |
| **Painel interno** | `/blog/admin/noticias` · `/blog/admin/leads` | Curadoria das notícias, leads do diagnóstico e newsletter (só editoras) |

Temas fixos do blog:

| Negócios | Soluções | Gestão |
| --- | --- | --- |
| Marketing · Vendas | Dados · Desenvolvimento · Inovação · Experiência do cliente | Gestão empresarial · Big techs · Finanças |

## 🧱 Como funciona

```
 visitante ──► Site (React + nginx) ──► API (NestJS) ──► Postgres
                    │                        ▲
   artigos, notícias e momentos              │ sugestões da semana
   em Markdown no repositório                │
                                   Radar semanal (GitHub Actions + Claude)
```

- **Site:** tudo o que o visitante vê. Conteúdo editorial em Markdown: publicar é fazer um commit.
- **API** (`api/`): recebe diagnósticos e newsletter, guarda as notícias do radar e atende o painel interno.
- **Radar** (`scripts/radar/`): toda segunda coleta notícias, pede a copy ao Claude e envia ao painel para revisão humana.

## 🚀 Rodar o projeto

Você precisa do **Node.js 20+** e do **Docker Desktop**.

```bash
git clone https://github.com/HannahSummer/blog-citi.git
cd blog-citi
docker compose up -d --build
```

| Serviço | Endereço |
| --- | --- |
| Site | http://localhost:5173/blog |
| API | http://localhost:3000/api/saude |
| Postgres | `localhost:5433` (usuário `citi`, senha `citi`, banco `blog_citi`) |

Para entrar no painel local, crie uma editora:

```bash
docker compose exec api npm run editora -- criar voce@citi.org.br "uma senha de teste longa"
```

<details>
<summary><b>Só o site, sem Docker</b></summary>

```bash
npm install
npm run dev
```

Sem a API, os formulários funcionam em **modo demonstração** (nada é gravado) e o painel avisa que a API não está configurada.

</details>

<details>
<summary><b>Dependências antigas no Docker</b></summary>

Reconstrói os containers sem apagar o banco local:

```bash
docker compose up -d --build -V
```

</details>

## 🛠️ Comandos

| Comando | Para quê |
| --- | --- |
| `npm run dev` | Site em desenvolvimento |
| `npm run build` | Valida os artigos e gera o site de produção |
| `npm run typecheck` | Confere os tipos do site |
| `npm run api:typecheck` | Confere os tipos da API |
| `npm run api:build` | Compila a API |
| `npm run check` | Roda tudo que não precisa do navegador: tipos, testes e build do site e da API |
| `npm run test` | Testes do site (regras compartilhadas e conteúdo) |
| `npm run api:test` | Testes de integração da API (usa o banco `blog_citi_teste`) |
| `npm run test:e2e` | Testes de navegador (precisa do `docker compose up -d` no ar) |
| `npm run radar:tipos` | Confere os tipos do radar |
| `npm run radar:semanal` | Roda o radar completo ([guia](docs/03-RADAR-AUTOMATICO.md)) |
| `npm run novo-artigo` | Cria um artigo novo a partir do modelo ([guia](docs/11-COMO-CRIAR-ARTIGO.md)) |
| `npm run validar-artigos` | Confere o front matter e o tamanho dos artigos |
| `npm run capas` | Gera as capas dos artigos |

Antes de abrir um Pull Request, rode `npm run check`. Antes de um deploy, rode também `npm run test:e2e` com o ambiente no ar. Detalhes em [docs/14-TESTES.md](docs/14-TESTES.md).

## 📁 Estrutura

```
blog-citi/
├── src/                        # site (React)
│   ├── pages/                  # uma página por rota
│   │   └── admin/              # painel interno (notícias e leads)
│   ├── components/
│   │   ├── layout/             # cabeçalho, rodapé, busca e SEO
│   │   ├── home/               # blocos exclusivos da Home
│   │   ├── blog/               # cards e destaque de artigos
│   │   ├── noticias/           # globo, cards e lista de notícias
│   │   ├── diagnostico/        # quiz, gráfico de radar e formulário
│   │   ├── sobre/              # abertura animada e seção da Home
│   │   ├── newsletter/         # bloco de inscrição
│   │   ├── painel/             # moldura e login do painel interno
│   │   └── efeitos/            # fundos animados (canvas)
│   ├── content/                # ✍️ conteúdo em Markdown
│   │   ├── posts/              #    artigos
│   │   ├── noticias/           #    notícias escritas à mão
│   │   └── momentos/           #    momentos do "Sobre o CITi"
│   ├── config/                 # textos e regras: site, sobre, diagnóstico, notícias
│   ├── data/                   # leitura do Markdown, temas, subtemas e continentes
│   ├── services/               # chamadas à API
│   ├── lib/                    # utilitários (API, datas, CSV, validação)
│   ├── hooks/ · layouts/ · styles/
├── api/                        # API (NestJS + Prisma) · ver docs/12
│   ├── prisma/                 # tabelas e migrações do banco
│   └── src/                    # módulos: diagnósticos, newsletter, notícias, leads, auth, radar
├── scripts/
│   ├── radar/                  # radar semanal de notícias
│   ├── capas/                  # gerador das capas dos artigos
│   ├── novo-artigo.ts
│   └── validar-artigos.ts
├── public/                     # imagens, capas e logo
├── docs/                       # 📚 guias de conteúdo, operação e repasse
├── docker/                     # Dockerfile de desenvolvimento e config do nginx
├── Dockerfile                  # site em produção
└── docker-compose.yml          # ambiente local completo
```

Algumas regras moram em `src/` e são usadas também pela API (diagnóstico, notícias, temas). Ao mudá-las, publique o site e a API. Detalhes em [docs/12](docs/12-BACKEND-E-DEPLOY.md#regras-compartilhadas).

## 📚 Documentação

| Guia | Para quem |
| --- | --- |
| [13 · Rotina semanal e repasse](docs/13-ROTINA-E-REPASSE.md) | **Comece por aqui** se vai assumir o blog |
| [14 · Testes](docs/14-TESTES.md) | Quem mexe no código ou antes de um deploy |
| [01 · Guia de conteúdo](docs/01-GUIA-DE-CONTEUDO.md) | Quem escreve e publica |
| [11 · Como criar um artigo](docs/11-COMO-CRIAR-ARTIGO.md) | Quem escreve |
| [02 · Notícias](docs/02-NOTICIAS.md) | Curadoria |
| [03 · Radar automático](docs/03-RADAR-AUTOMATICO.md) | Curadoria e dev |
| [04 · Estratégia editorial](docs/04-ESTRATEGIA-EDITORIAL.md) | Marketing e gerência |
| [05 · Diagnóstico e leads](docs/05-DIAGNOSTICO-E-LEADS.md) | Comercial e dev |
| [12 · Backend e deploy](docs/12-BACKEND-E-DEPLOY.md) | Dev |

Índice completo em [docs/README.md](docs/README.md).

## 🤝 Como contribuir

1. Crie uma branch a partir da `main` (`artigo/nome`, `ajuste/nome`…).
2. Faça a mudança e rode as validações.
3. Abra um Pull Request e peça revisão. Conteúdo editorial só vai ao ar depois de revisão humana.
4. Ao juntar na `main`, o Coolify publica o site e a API.

Regras do projeto:
- interface e textos em português do Brasil;
- nada de chaves ou senhas no código (`.env` fica fora do Git);
- resumos próprios, sempre com fonte e link.

## 📌 Pendências antes do lançamento

- [ ] Revisão humana dos artigos e notícias publicados
- [ ] Política de privacidade (link no formulário do diagnóstico)
- [ ] Domínio definitivo e deploy no Coolify ([passo a passo](docs/12-BACKEND-E-DEPLOY.md#deploy-no-coolify))
- [ ] Editoras cadastradas e Secrets do radar no GitHub
- [ ] Aviso ao Comercial a cada lead novo (hoje os leads ficam no painel)

---

<div align="center">
Feito com curiosidade pelo <b>CITi</b> · Recife-PE
</div>
