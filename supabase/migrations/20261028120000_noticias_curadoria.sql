-- ============================================================
-- Curadoria semanal de notícias.
--
-- O radar (GitHub Actions, com a service_role key guardada nos Secrets)
-- insere as sugestões da semana já com a copy escrita pelo Claude, como
-- `pendente`. Marketing revisa no painel /blog/admin/noticias e aprova
-- ou rejeita. O site público só enxerga as `aprovada`.
--
-- Quem pode revisar: só quem estiver em `editores` (cadastro manual, ver
-- docs/02-NOTICIAS.md). Ter login no Supabase não basta.
-- ============================================================

create table if not exists public.editores (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  email     text not null,
  criado_em timestamptz not null default now()
);

alter table public.editores enable row level security;
-- O Supabase dá acesso total a tabelas novas; aqui começa do zero e libera só o necessário.
revoke all on public.editores from anon, authenticated;

-- security definer: a função lê `editores` sem expor a tabela.
create or replace function public.eh_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.editores where user_id = auth.uid());
$$;

revoke all on function public.eh_editor() from public;
grant execute on function public.eh_editor() to anon, authenticated;

create policy "editor vê o próprio cadastro" on public.editores
  for select to authenticated using (user_id = auth.uid());
grant select on public.editores to authenticated;

create table if not exists public.noticias (
  id                 uuid primary key default gen_random_uuid(),
  semana             date not null,
  status             text not null default 'pendente'
                       check (status in ('pendente','aprovada','rejeitada')),
  titulo             text not null check (char_length(titulo) between 10 and 160),
  resumo             text not null check (char_length(resumo) between 40 and 600),
  por_que_importa    text not null check (char_length(por_que_importa) between 40 and 900),
  categoria          text not null check (categoria in ('negocios','solucoes','gestao')),
  subtema            text check (subtema in ('marketing','vendas','dados','desenvolvimento','inovacao','experiencia-do-cliente','gestao-empresarial','big-techs','financas')),
  -- Posiciona a notícia no globo da página de notícias.
  continente         text check (continente in ('america-do-sul','america-do-norte','europa','africa','asia','oceania')),
  fonte              text not null check (char_length(fonte) between 2 and 120),
  link               text not null unique check (link ~ '^https?://'),
  data_fonte         date,
  -- Contexto para quem revisa; não aparece no site.
  titulo_original    text not null,
  trecho_feed        text,
  motivo             text,
  pontuacao          smallint,
  revisado_por       uuid references auth.users (id),
  revisado_em        timestamptz,
  publicado_em       timestamptz,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);

create index if not exists noticias_status_publicado on public.noticias (status, publicado_em desc);
create index if not exists noticias_semana on public.noticias (semana desc);

alter table public.noticias enable row level security;
revoke all on public.noticias from anon, authenticated;

-- Site público: só notícias aprovadas e só as colunas que aparecem na página.
create policy "público lê aprovadas" on public.noticias
  for select to anon, authenticated using (status = 'aprovada');
grant select (id, titulo, resumo, por_que_importa, categoria, subtema, continente, fonte, link, data_fonte, publicado_em, status)
  on public.noticias to anon;

-- Editores: leem tudo e editam a copy e o status. Não inserem nem apagam.
create policy "editor lê tudo" on public.noticias
  for select to authenticated using (public.eh_editor());
create policy "editor revisa" on public.noticias
  for update to authenticated using (public.eh_editor()) with check (public.eh_editor());
grant select on public.noticias to authenticated;
-- `link` é editável porque os do Google Notícias são redirecionamentos.
grant update (titulo, resumo, por_que_importa, categoria, subtema, continente, link, status) on public.noticias to authenticated;

-- Carimba revisão e publicação no banco, sem confiar no navegador.
create or replace function public.noticias_carimbar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  if new.status is distinct from old.status then
    new.revisado_por := auth.uid();
    new.revisado_em := now();
    new.publicado_em := case when new.status = 'aprovada' then now() else null end;
  end if;
  return new;
end;
$$;

create trigger noticias_carimbar
  before update on public.noticias
  for each row execute function public.noticias_carimbar();
