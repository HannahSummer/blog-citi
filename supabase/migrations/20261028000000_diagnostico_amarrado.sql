-- ============================================================
-- Diagnóstico amarrado: grava as respostas do quiz, a pontuação e o nível
-- junto com o lead.
--
-- Roda DEPOIS de 20261001000000_diagnostico_e_newsletter.sql, que já criou
-- `diagnosticos`, `newsletter_inscricoes`, as políticas de insert e o trigger
-- da newsletter. Esta migração só acrescenta o que falta; o resultado final é
-- a estrutura definida no prompt do diagnóstico amarrado.
--
-- Se a tabela `diagnosticos` já tiver linhas de teste, apague-as antes:
-- as colunas novas e o telefone são obrigatórios (not null) e o comando falha com linhas antigas.
-- ============================================================

alter table public.diagnosticos
  add column if not exists respostas jsonb not null
    check (jsonb_typeof(respostas) = 'object' and pg_column_size(respostas) <= 4000),
  add column if not exists pontuacao smallint not null
    check (pontuacao between 0 and 12),
  add column if not exists nivel text not null
    check (nivel in ('inicial','organizacao','evolucao','estruturado'));

-- Telefone / WhatsApp passa a ser obrigatório (só a newsletter é opcional no formulário).
alter table public.diagnosticos
  alter column telefone set not null;

-- O problema de negócio passa a ser opcional: vazio vira null; preenchido, até 3000 caracteres.
alter table public.diagnosticos
  alter column problema drop not null,
  drop constraint if exists diagnosticos_problema_check,
  add constraint diagnosticos_problema_check
    check (problema is null or char_length(problema) between 1 and 3000);

-- O site (anon) só pode inserir, inclusive nas colunas novas. Nenhuma leitura.
grant insert (respostas, pontuacao, nivel) on public.diagnosticos to anon;
