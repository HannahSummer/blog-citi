# 05 — Diagnóstico e leads

Este guia é para quem vai cuidar do blog e dos contatos que chegam pela página **Faça seu diagnóstico** (`/blog/diagnostico`).

## Como a página funciona

1. A pessoa responde 6 perguntas, uma por tela.
2. O site soma os pontos (0 a 12) e mostra um dos 4 níveis: Inicial, Em organização, Em evolução ou Estruturado.
3. Se quiser o resultado completo e uma conversa com o CITi, ela preenche o formulário de contato.
4. Só nesse momento os dados vão para o banco (Supabase). Quem só faz o quiz não deixa nenhum dado gravado.

Tudo o que aparece na página (perguntas, pontos, níveis, textos e opções do formulário) está em um único arquivo: `src/config/diagnostico.ts`.

## 1. Configuração única

Faça isto uma vez, quando o banco for ligado:

1. Crie o projeto no Supabase **dentro da organização do CITi**, nunca em uma conta pessoal.
2. Abra o **SQL Editor** do projeto e rode as migrações, nesta ordem:
   1. `supabase/migrations/20261001000000_diagnostico_e_newsletter.sql`
   2. `supabase/migrations/20261028000000_diagnostico_amarrado.sql`
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
4. Na raiz do projeto, crie um arquivo `.env` a partir do `.env.example` e preencha:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

5. Reinicie o ambiente (`npm run dev` de novo, ou `docker compose up --build`).

A anon key pode ficar no site: ela foi feita para isso. A proteção vem das regras do banco, que deixam o site **apenas inserir** dados, nunca ler, alterar ou apagar. **Nunca** coloque a `service_role` key no `.env` do site.

### Sem o `.env`

- Em `npm run dev`, a página funciona em **modo demonstração**: o formulário aparece, o envio é simulado e os dados aparecem só no console do navegador. Nada é gravado.
- No build publicado sem `.env`, o formulário não aparece. No lugar dele, o resultado mostra o botão **Falar com o CITi**, que usa o `ctaContatoUrl` de `src/config/site.ts`.

### Banco local (desenvolvimento)

Para gravar de verdade no computador, sem usar o projeto na nuvem (precisa do Docker aberto):

1. `npx supabase start` sobe o banco e aplica as migrações de `supabase/migrations/`.
2. `npx supabase status` mostra a `API_URL` e a `ANON_KEY`. Coloque-as no `.env` como `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Rode `npm run dev` e envie o formulário. Os leads aparecem no Studio local, em http://127.0.0.1:54323 (Table Editor → `diagnosticos`).
4. `npx supabase db reset` apaga tudo e reaplica as migrações. `npx supabase stop` desliga o banco.

Esse banco existe só na sua máquina. Para o site publicado, use o projeto na nuvem (passos acima).

## 2. Onde ver os leads

No Supabase: **Table Editor → `diagnosticos`**, ordenando por `created_at` (mais recentes primeiro). Para exportar, use o botão de exportar CSV do próprio painel.

Só quem é membro do projeto no Supabase vê esses dados.

Colunas que merecem explicação:

| Coluna | O que é |
|---|---|
| `nivel` | Resultado do quiz: `inicial` (0 a 3 pontos), `organizacao` (4 a 6), `evolucao` (7 a 9) ou `estruturado` (10 a 12). |
| `pontuacao` | Soma dos pontos, de 0 a 12. |
| `respostas` | Os pontos de cada pergunta, por exemplo `{"processos": 1, "retrabalho": 0, ...}`. Cada pergunta vale 0, 1 ou 2. As chaves são os `id`s em `src/config/diagnostico.ts`. |
| `problema` | O que a pessoa escreveu sobre o problema de negócio. Opcional: fica vazio quando a pessoa não preenche. Quando preenchido, é o campo mais importante para preparar a conversa. |
| `como_conheceu` | `linkedin`, `instagram`, `indicacao`, `google`, `blog`, `evento` ou `outro`. |
| `origem` e `utm_*` | De onde a pessoa veio (por exemplo, o post que levou ao diagnóstico). |
| `consentimento_versao` | Qual versão do texto de consentimento a pessoa aceitou. |
| `status` | Andamento do lead (veja abaixo). |

## 3. Como responder um lead

Todo lead chega com `status = novo`. O Comercial atualiza direto no painel:

1. Ao fazer o primeiro contato: `em_contato`.
2. Depois da conversa: `qualificado` (vale seguir) ou `descartado` (não é o momento ou não tem fit).

## 4. Newsletter

As inscrições ficam na tabela `newsletter_inscricoes`. Entram nela:

- quem se inscreve no bloco de newsletter da Home e das notícias;
- quem marca "Quero receber a newsletter" no formulário do diagnóstico (o banco copia o e-mail sozinho).

O mesmo e-mail não entra duas vezes. Quando a ferramenta de newsletter for escolhida, exporte essa tabela em CSV e importe na ferramenta.

## 5. Como alterar perguntas ou textos

Mude **somente** `src/config/diagnostico.ts`. A página, a pontuação, o formulário e o envio leem tudo de lá. As regras de validação dos campos ficam em `src/lib/diagnostico-schema.ts` e precisam continuar iguais às do banco.

Impacto nos dados já gravados:

- **Mudar só o texto de uma pergunta ou opção** (mantendo o `id` e os pontos): os dados antigos continuam comparáveis. Anote a data da mudança.
- **Trocar o `id`, os pontos ou a pergunta inteira**: as respostas antigas ficam com a chave antiga em `respostas` e deixam de ser comparáveis com as novas. Anote a data e, se possível, mantenha os `id`s.
- **Mudar as faixas de nível**: os leads antigos continuam com o `nivel` calculado na época. Se mudar o número de níveis ou os nomes, crie também uma migração para o `check` da coluna `nivel`.
- **Mudar o texto de consentimento**: atualize `CONSENTIMENTO_VERSAO` em `src/services/leads.ts` (por exemplo, `diagnostico-v2-2027-01`). Assim fica registrado qual texto cada pessoa aceitou.
- **Mudar a pontuação máxima** (mais perguntas): o banco aceita até 12 pontos. Crie uma migração antes de publicar.

## LGPD

O banco guarda os dados do formulário para responder à solicitação, além de origem, página de referência e UTMs. Pedidos de exclusão são atendidos apagando a linha pelo painel do Supabase (e o e-mail em `newsletter_inscricoes`, se houver), conforme a política de privacidade do CITi.

## Como testar

1. Sem `.env`, rode `npm run dev`, faça o quiz, envie o formulário e confira o payload no console.
2. Com o `.env` do CITi, envie um teste e confira a linha em `diagnosticos`, com `respostas`, `pontuacao` e `nivel` preenchidos.
3. Marque a newsletter e confira a linha em `newsletter_inscricoes`. Envie de novo com o mesmo e-mail: não deve dar erro.
4. Apague os registros de teste pelo painel.

## 6. Pendências antes de produção

- **Política de privacidade:** publicar a página e preencher `politicaPrivacidadeUrl` em `src/config/diagnostico.ts`. Hoje o formulário mostra "Política de privacidade (em breve)" sem link.
- **Aviso ao Comercial:** criar um Database Webhook no Supabase (insert em `diagnosticos`) que avise no Slack ou por e-mail quando chegar lead novo.
- **Captcha:** se aparecer spam, adicionar Cloudflare Turnstile validado em uma Edge Function. Hoje há só o campo-armadilha e o tempo mínimo de 3 segundos.
- **Plano do Supabase:** projetos gratuitos podem ser pausados por inatividade. Definir o plano antes de divulgar.
- **Textos:** validar com a Gerente os textos de resultado e de apoio em `src/config/diagnostico.ts`.
- **Contato:** preencher `ctaContatoUrl` em `src/config/site.ts` (usado quando o banco está desligado).
- **Newsletter:** escolher a ferramenta e definir a rotina de exportação.
