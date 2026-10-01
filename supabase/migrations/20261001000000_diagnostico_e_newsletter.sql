-- ============================================================
-- Diagnósticos (leads do formulário "Solicitar diagnóstico")
-- ============================================================
create table if not exists public.diagnosticos (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  nome                   text not null check (char_length(nome) between 2 and 120),
  email                  text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  empresa                text not null check (char_length(empresa) between 2 and 160),
  cargo                  text not null check (char_length(cargo) between 2 and 120),
  telefone               text check (telefone is null or telefone ~ '^[0-9]{10,13}$'),
  como_conheceu          text not null check (como_conheceu in ('linkedin','instagram','indicacao','google','blog','evento','outro')),
  problema               text not null check (char_length(problema) between 30 and 3000),
  consentimento_contato  boolean not null check (consentimento_contato = true),
  newsletter_optin       boolean not null default false,
  consentimento_versao   text not null check (char_length(consentimento_versao) <= 60),
  origem                 text check (char_length(origem) <= 200),
  pagina_referencia      text check (char_length(pagina_referencia) <= 500),
  utm_source             text check (char_length(utm_source) <= 200),
  utm_medium             text check (char_length(utm_medium) <= 200),
  utm_campaign           text check (char_length(utm_campaign) <= 200),
  utm_content            text check (char_length(utm_content) <= 200),
  status                 text not null default 'novo' check (status in ('novo','em_contato','qualificado','descartado'))
);

create index if not exists diagnosticos_created_at_idx on public.diagnosticos (created_at desc);

alter table public.diagnosticos enable row level security;

revoke all on public.diagnosticos from anon, authenticated;
grant insert (nome, email, empresa, cargo, telefone, como_conheceu, problema,
              consentimento_contato, newsletter_optin, consentimento_versao,
              origem, pagina_referencia, utm_source, utm_medium, utm_campaign, utm_content)
  on public.diagnosticos to anon;

create policy "site pode inserir diagnostico"
  on public.diagnosticos for insert to anon
  with check (true);

-- ============================================================
-- Inscrições na newsletter
-- ============================================================
create table if not exists public.newsletter_inscricoes (
  id                    uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  email                 text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  origem                text check (char_length(origem) <= 200),
  consentimento_versao  text not null check (char_length(consentimento_versao) <= 60),
  ativo                 boolean not null default true
);

create unique index if not exists newsletter_email_unico on public.newsletter_inscricoes (lower(email));

alter table public.newsletter_inscricoes enable row level security;

revoke all on public.newsletter_inscricoes from anon, authenticated;
grant insert (email, origem, consentimento_versao) on public.newsletter_inscricoes to anon;

create policy "site pode inserir inscricao"
  on public.newsletter_inscricoes for insert to anon
  with check (true);

-- ============================================================
-- Quem marcar "quero receber a newsletter" no diagnóstico
-- entra automaticamente na lista da newsletter.
-- ============================================================
create or replace function public.diagnostico_para_newsletter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.newsletter_optin then
    insert into public.newsletter_inscricoes (email, origem, consentimento_versao)
    values (lower(new.email), 'diagnostico', new.consentimento_versao)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists diagnostico_para_newsletter on public.diagnosticos;
create trigger diagnostico_para_newsletter
  after insert on public.diagnosticos
  for each row execute function public.diagnostico_para_newsletter();
