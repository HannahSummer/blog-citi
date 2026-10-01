# 05 — Diagnóstico e leads

## Configuração única

1. Crie o projeto Supabase na organização do CITi, nunca em uma conta pessoal.
2. Abra o SQL Editor do projeto e execute `supabase/migrations/20261001000000_diagnostico_e_newsletter.sql`.
3. Copie a URL e a anon key em Project Settings → API.
4. Crie um `.env` na raiz a partir de `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

5. Reinicie o container com `docker compose up --build`.

A anon key pode estar no frontend por design. Nunca use a `service_role` key no navegador. A segurança depende das políticas RLS da migração.

Sem essas variáveis, o protótipo funciona em modo demonstração: os payloads são exibidos no console e nenhum dado é gravado.

## Onde ver os leads

No Supabase, abra **Table Editor → `diagnosticos`** e ordene por `created_at`. Apenas membros do projeto no Supabase veem esses dados, pois o papel `anon` não tem permissão de leitura. Use o próprio painel para exportar CSV.

## Status do lead

O Comercial pode atualizar `status` no painel:

- `novo`
- `em_contato`
- `qualificado`
- `descartado`

## Newsletter

As inscrições ficam em `newsletter_inscricoes`. Quando a ferramenta de newsletter for escolhida, exporte essa tabela. Se um diagnóstico for enviado com `newsletter_optin` marcado, o trigger do banco cria a inscrição automaticamente.

## LGPD

O banco guarda os dados enviados no formulário para responder à solicitação, além de origem, página de referência e UTMs para atribuição. `consentimento_versao` registra qual texto foi aceito. Pedidos de exclusão devem ser atendidos apagando a linha pelo painel do Supabase, conforme a política publicada pelo CITi.

## Como testar

1. Envie um diagnóstico de teste com `.env` vazio e confira o payload no console.
2. Configure as variáveis do projeto do CITi, reinicie o container e envie outro teste.
3. Confira a linha em `diagnosticos`.
4. Marque a newsletter e confira a inscrição em `newsletter_inscricoes`.
5. Envie o mesmo e-mail novamente e confirme que duplicidade é tratada como sucesso.
6. Apague os registros de teste pelo painel.

## Pendências antes de produção

- Publicar a política de privacidade.
- Criar aviso ao Comercial quando chegar lead novo, via Database Webhook → Slack ou e-mail.
- Validar captcha, como Cloudflare Turnstile em uma Edge Function, se surgir spam.
- Revisar o plano do Supabase, pois projetos gratuitos podem ser pausados por inatividade.
- Confirmar a ferramenta de newsletter e a rotina de exportação.
