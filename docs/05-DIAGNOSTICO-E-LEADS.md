# 05 — Diagnóstico e leads

Este guia é para quem vai cuidar do blog e dos contatos que chegam pela página **Faça seu diagnóstico** (`/blog/diagnostico`).

## Como a página funciona

1. A pessoa responde 6 perguntas, uma por tela.
2. O site soma os pontos (0 a 12) e mostra um dos 4 níveis: Inicial, Em organização, Em evolução ou Estruturado.
3. Se quiser o resultado completo e uma conversa com o CITi, ela preenche o formulário de contato.
4. Só nesse momento os dados vão para o banco, pela API do blog. Quem só faz o quiz não deixa nenhum dado gravado.

Tudo o que aparece na página (perguntas, pontos, níveis, textos e opções do formulário) está em um único arquivo: `src/config/diagnostico.ts`. A API usa esse mesmo arquivo para conferir os dados e recalcular a pontuação, então não existe uma segunda cópia das regras.

## 1. Configuração

O banco (Postgres) e a API ficam no Coolify. A configuração completa está em [12 — Backend e deploy](12-BACKEND-E-DEPLOY.md). Para o site, basta uma variável:

```env
VITE_API_URL=https://endereco-da-api
```

No Coolify, ela é cadastrada no serviço do site como **Build Variable**, porque o Vite a grava no site durante o build.

### Sem a variável

- Em `npm run dev`, a página funciona em **modo demonstração**: o formulário aparece, o envio é simulado e os dados aparecem só no console do navegador. Nada é gravado.
- No build publicado sem a variável, o formulário não aparece. No lugar dele, o resultado mostra o botão **Falar com o CITi**, que usa o `ctaContatoUrl` de `src/config/site.ts`.

### Ambiente local

`docker compose up -d --build` sobe o site, a API e um Postgres no seu computador, já ligados entre si. Os leads enviados em `http://localhost:5173/blog/diagnostico` aparecem no painel local (`/blog/admin/leads`).

## 2. Onde ver os contatos

No painel interno, seção **Contatos** (`/blog/admin/leads`), com o login de editora (cadastro em [12 — Backend e deploy](12-BACKEND-E-DEPLOY.md#editoras)). Há duas visões:

**Pessoas** (abre primeiro): todo mundo que chegou pelo blog, do mais recente para o mais antigo.
- Quem fez o diagnóstico aparece com o selo **Diagnóstico** e a etapa atual; quem só assinou a newsletter aparece com o selo **Newsletter**. A mesma pessoa não aparece duas vezes.
- Busca por nome, e-mail ou empresa e filtro por como a pessoa chegou (Todas, Diagnóstico, Só newsletter).
- Clicar na pessoa abre os detalhes: contatos (o e-mail abre o programa de e-mail; o telefone abre uma conversa no WhatsApp), resultado do diagnóstico, como conheceu, problema descrito e a etapa.

**Acompanhamento** (Kanban): uma coluna por etapa (Novo, Em contato, Qualificado, Descartado).
- Arraste o card para a coluna da nova etapa. No celular, ou pelo teclado, use o seletor de etapa que fica no próprio card.
- A mudança é salva na hora. Se algo falhar, o card volta para a coluna anterior e aparece um aviso.

**Leads (CSV)** e **Newsletter (CSV)** baixam planilhas que abrem direto no Excel ou no Google Planilhas.

O que cada informação significa:

| Campo | O que é |
|---|---|
| Nível | Resultado do quiz: Inicial (0 a 3 pontos), Em organização (4 a 6), Em evolução (7 a 9) ou Estruturado (10 a 12). |
| Pontuação | Soma dos pontos, de 0 a 12. |
| Problema | O que a pessoa escreveu sobre o problema de negócio. Opcional. Quando preenchido, é o campo mais importante para preparar a conversa. |
| Veio por | Como conheceu o CITi e, se houver, a campanha (`utm_source`). |
| Respostas (no banco) | Os pontos de cada pergunta, por exemplo `{"processos": 1, "retrabalho": 0, ...}`. As chaves são os `id`s em `src/config/diagnostico.ts`. |
| `consentimento_versao` (no banco) | Qual versão do texto de consentimento a pessoa aceitou. |

## 3. Como responder um lead

Todo lead chega como **Novo**. O Comercial muda a etapa no Kanban (arrastando o card) ou nos detalhes da pessoa:

1. Ao fazer o primeiro contato: **Em contato**.
2. Depois da conversa: **Qualificado** (vale seguir) ou **Descartado** (não é o momento ou não tem fit).

## 4. Newsletter

As inscrições ficam na tabela `newsletter_inscricoes`. Entram nela:

- quem se inscreve no bloco de newsletter da Home e das notícias;
- quem marca "Quero receber a newsletter" no formulário do diagnóstico (a API copia o e-mail sozinha).

O mesmo e-mail não entra duas vezes. Quando a ferramenta de newsletter for escolhida, use **Newsletter (CSV)** na seção Contatos do painel e importe a planilha na ferramenta.

## 5. Como alterar perguntas ou textos

Mude **somente** `src/config/diagnostico.ts`. A página, a pontuação, o formulário, o envio e a API leem tudo de lá. As regras de validação dos campos ficam em `src/lib/diagnostico-schema.ts` (também usadas pela API) e precisam continuar iguais às regras do banco, em `api/prisma/migrations/`.

Depois de mudar, publique **o site e a API** (os dois usam o arquivo).

Impacto nos dados já gravados:

- **Mudar só o texto de uma pergunta ou opção** (mantendo o `id` e os pontos): os dados antigos continuam comparáveis. Anote a data da mudança.
- **Trocar o `id`, os pontos ou a pergunta inteira**: as respostas antigas ficam com a chave antiga e deixam de ser comparáveis com as novas. Anote a data e, se possível, mantenha os `id`s.
- **Mudar as faixas de nível**: os leads antigos continuam com o nível calculado na época. Se mudar o número de níveis ou os nomes, crie também uma migração para a regra da coluna `nivel` ([12 — Backend e deploy](12-BACKEND-E-DEPLOY.md#mudar-o-banco)).
- **Mudar o texto de consentimento**: atualize `CONSENTIMENTO_VERSAO` em `src/services/leads.ts` (por exemplo, `diagnostico-v2-2027-01`). Assim fica registrado qual texto cada pessoa aceitou.
- **Mudar a pontuação máxima** (mais perguntas): o banco aceita até 12 pontos. Crie uma migração antes de publicar.

## LGPD

O banco guarda os dados do formulário para responder à solicitação, além de origem, página de referência e UTMs. Pedidos de exclusão são atendidos por quem cuida da API, no terminal do Postgres no Coolify:

```sql
delete from diagnosticos where email = 'pessoa@empresa.com.br';
delete from newsletter_inscricoes where email = 'pessoa@empresa.com.br';
```

Siga a política de privacidade do CITi e registre a data do pedido.

## Como testar

1. Sem `VITE_API_URL`, rode `npm run dev`, faça o quiz, envie o formulário e confira o payload no console.
2. Com o ambiente local (`docker compose up -d --build`), envie um teste e confira o lead em `/blog/admin/leads`, com nível e pontuação.
3. Marque a newsletter e baixe o CSV da newsletter. Envie de novo com o mesmo e-mail: não deve dar erro nem duplicar.

## 6. Pendências antes de produção

- **Política de privacidade:** publicar a página e preencher `politicaPrivacidadeUrl` em `src/config/diagnostico.ts`. Hoje o formulário mostra "Política de privacidade (em breve)" sem link.
- **Aviso ao Comercial:** hoje é preciso abrir o painel para ver leads novos. Uma melhoria futura é a API avisar por e-mail ou Slack a cada lead.
- **Captcha:** se aparecer spam, adicionar Cloudflare Turnstile validado na API. Hoje há o campo-armadilha, o tempo mínimo de 3 segundos e o limite de 5 envios por minuto por pessoa.
- **Textos:** validar com a Gerente os textos de resultado e de apoio em `src/config/diagnostico.ts`.
- **Contato:** preencher `ctaContatoUrl` em `src/config/site.ts` (usado quando a API está desligada).
- **Newsletter:** escolher a ferramenta e definir a rotina de exportação.
