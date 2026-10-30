# 14 — Testes

Este guia explica o que é testado, como rodar cada parte e o que fazer quando um teste falha. Para quem vai mexer no código ou no conteúdo antes de um deploy.

## Visão geral

| Camada | O que cobre | Onde fica | Comando | Precisa de |
| --- | --- | --- | --- | --- |
| **Regras do site** | Pontuação e níveis do diagnóstico, validação do formulário, datas, envio em modo demonstração, conteúdo em Markdown (categorias, subtemas, capas e fotos que existem) | `src/**/*.test.ts` | `npm run test` | nada |
| **API** | Rotas, validações, consentimento, login, token do radar, limite de envios, painel de notícias e leads | `api/test/*.spec.ts` | `npm run api:test` | Postgres de teste (ver abaixo) |
| **Navegador** | Páginas abrem sem erro, quiz e formulário do diagnóstico, newsletter, busca, painel (login, abas, sair) | `e2e/*.spec.ts` | `npm run test:e2e` | site e API no ar (`docker compose up -d`) |

Tudo de uma vez, sem o navegador:

```bash
npm run check
```

O `check` roda, nesta ordem: tipos do site, tipos do radar, tipos da API, testes do site, testes da API e build de produção. Se algum passo falhar, ele para e mostra o erro.

Na CI (GitHub Actions, arquivo `.github/workflows/ci.yml`), esses mesmos passos rodam em cada Pull Request. Os testes de navegador não rodam na CI, porque precisam do ambiente no ar.

## Testes da API

Os testes sobem a API inteira, igual à de produção, e gravam no **banco de teste** `blog_citi_teste`. Esse banco é separado do de desenvolvimento e é esvaziado entre os testes.

### Banco de teste

Com o ambiente local no ar (`docker compose up -d`), crie o banco de teste uma vez:

```bash
docker compose exec postgres psql -U citi -d blog_citi -c "create database blog_citi_teste"
```

Se o banco já existir, o comando avisa e não faz nada. Depois, `npm run api:test` aplica as migrações nele sozinho.

Para apontar para outro banco, defina `DATABASE_URL` antes de rodar. Nunca aponte os testes para o banco de produção.

### O que cada arquivo cobre

| Arquivo | Cobre |
| --- | --- |
| `diagnosticos.spec.ts` | Envio do diagnóstico: cálculo da pontuação feito pela API, consentimento, respostas, telefone, e-mail, limites de tamanho, newsletter automática |
| `newsletter.spec.ts` | Inscrição, e-mail em minúsculas, repetição sem duplicar, validações |
| `auth.spec.ts` | Login, mensagem genérica de erro, conta desativada, token adulterado, acesso derrubado na hora ao desativar |
| `noticias.spec.ts` | Site público só vê aprovadas e sem campos internos; painel: aprovar, tirar do ar, editar, validar campos, link repetido, 404 e id inválido |
| `radar.spec.ts` | Token do radar, limite de 50 itens, item inválido não derruba os outros, links repetidos, data da semana |
| `leads.spec.ts` | Painel de leads: token obrigatório, listagem, mudança de status, newsletter ativa |
| `limite.spec.ts` | Limite real de envios por IP (5 por minuto no diagnóstico e no login) |
| `infra.spec.ts` | Healthcheck, CORS só para o site, Swagger, vários envios seguidos |
| `regras.spec.ts` | Hash das senhas, validação de edição e de sugestões, variáveis obrigatórias |

### Limite de envios nos testes

Nos testes, o limite de envios por IP fica **desligado** (`LIMITE_ENVIOS=false`), para não travar a suíte. O arquivo `limite.spec.ts` liga o limite de propósito e confere se ele funciona. Em produção a variável não existe, então o limite fica sempre ligado.

## Testes do site

Os testes do site (Vitest) ficam ao lado do código que testam, com o sufixo `.test.ts`. Eles não precisam de navegador nem de rede.

- **`config/diagnostico.test.ts`:** pontuação, faixas de nível (incluindo os limites exatos, como 3, 4, 6, 7, 9, 10) e opções de "como conheceu".
- **`lib/diagnostico-schema.test.ts`:** regras do formulário. Elas são as mesmas usadas pela API.
- **`lib/datas.test.ts`:** datas completas, só mês e ano.
- **`services/leads.test.ts`:** envio em modo demonstração (sem API) e o contrato com a API (versão do consentimento e cálculo do resultado).
- **`data/conteudo.test.ts`:** confere o conteúdo em Markdown: categorias e subtemas válidos, títulos e descrições para SEO, capas e fotos que de fato existem em `public/`, notícias com continente válido e slugs únicos.

Se o `conteudo.test.ts` falhar, quase sempre é um erro de digitação em um arquivo de `src/content/`. A mensagem mostra qual arquivo.

## Testes de navegador

Os testes de navegador usam o Chrome que já está instalado na máquina (não baixam navegador extra). Antes de rodar, suba o ambiente:

```bash
docker compose up -d --build
npm run test:e2e
```

### Conta de editora para o teste do painel

Os testes de login real do painel só rodam se você informar uma conta de editora existente:

```bash
E2E_EDITORA_EMAIL=editora@citi.org.br E2E_EDITORA_SENHA=sua-senha npm run test:e2e
```

Sem essas variáveis, esses testes aparecem como "pulados" (skipped) e o resto roda normalmente.

### Para rodar em outro endereço

```bash
E2E_BASE_URL=https://blog.citi.org.br npm run test:e2e
```

Use com cuidado: o teste do diagnóstico **envia um lead de teste** de verdade (com o nome "Teste Automatizado") e a newsletter também grava um e-mail de teste. Apague esses registros no painel depois, ou rode em ambiente de teste.

### Quando o diagnóstico de teste falha por limite

O ambiente local já vem com o limite desligado (`LIMITE_ENVIOS=false` no `docker-compose.yml`). Se você apontar o teste para um ambiente com o limite ligado e rodar a suíte duas vezes em um minuto, o envio pode ser bloqueado (erro 429). Espere um minuto e rode de novo.

## Quando um teste falha

1. **Leia a mensagem completa**: o nome do teste diz a regra que quebrou.
2. **Rode só o teste que falhou**, por exemplo:
   ```bash
   npm run api:test -- -t "recusa telefone"
   npx playwright test e2e/diagnostico.spec.ts
   ```
3. **Se mudou uma regra de propósito**, atualize o teste junto. A regra e o teste mudam no mesmo commit.
4. **Se não mudou nada**, não publique. Um teste que falha antes do deploy é justamente o que ele deve fazer.

Falhas no navegador geram uma captura de tela e um arquivo de rastreamento na pasta `test-results/` (no seu computador, não vai para o Git). Para abrir o rastreamento:

```bash
npx playwright show-trace test-results/<pasta-do-teste>/trace.zip
```

## Antes de cada deploy

Checklist mínimo, na ordem:

- [ ] `npm run check` passa.
- [ ] `npm run test:e2e` passa, com o ambiente local no ar.
- [ ] A CI do Pull Request está verde.
- [ ] Se mudou regra compartilhada (`src/config/diagnostico.ts`, `src/lib/diagnostico-schema.ts`, `src/config/noticias.ts`, `src/data/`), o site **e** a API foram testados juntos.

## Adicionar um teste novo

- **Regra do site ou do conteúdo:** crie `nome.test.ts` ao lado do arquivo e use `describe`/`it` do Vitest.
- **Rota da API:** adicione um caso em `api/test/` seguindo o padrão dos arquivos existentes (uma função `criarApp()`, `limparBanco()` no `beforeEach` e `prisma` para conferir o banco).
- **Fluxo no navegador:** adicione um arquivo em `e2e/` e use seletores de papel (`getByRole`) ou o `id` dos campos, como os existentes.
