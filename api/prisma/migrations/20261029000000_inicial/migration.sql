-- ============================================================
-- Estrutura inicial do banco do Blog CITi (migrada do Supabase em out/2026).
-- Tabelas geradas a partir de prisma/schema.prisma + regras CHECK, que o Prisma
-- não descreve no schema. As regras espelham src/lib/diagnostico-schema.ts e
-- os limites do painel de notícias; ao mudar uma, mude a outra.
-- ============================================================

-- CreateTable
CREATE TABLE "diagnosticos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "como_conheceu" TEXT NOT NULL,
    "problema" TEXT,
    "respostas" JSONB NOT NULL,
    "pontuacao" SMALLINT NOT NULL,
    "nivel" TEXT NOT NULL,
    "consentimento_contato" BOOLEAN NOT NULL,
    "newsletter_optin" BOOLEAN NOT NULL DEFAULT false,
    "consentimento_versao" TEXT NOT NULL,
    "origem" TEXT,
    "pagina_referencia" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'novo',

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_inscricoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "origem" TEXT,
    "consentimento_versao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "newsletter_inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editoras" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "noticias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semana" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "titulo" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "por_que_importa" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subtema" TEXT,
    "continente" TEXT,
    "fonte" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "data_fonte" DATE,
    "titulo_original" TEXT NOT NULL,
    "trecho_feed" TEXT,
    "motivo" TEXT,
    "pontuacao" SMALLINT,
    "revisado_por" UUID,
    "revisado_em" TIMESTAMPTZ(6),
    "publicado_em" TIMESTAMPTZ(6),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "noticias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diagnosticos_created_at_idx" ON "diagnosticos"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_inscricoes_email_key" ON "newsletter_inscricoes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "editoras_email_key" ON "editoras"("email");

-- CreateIndex
CREATE UNIQUE INDEX "noticias_link_key" ON "noticias"("link");

-- CreateIndex
CREATE INDEX "noticias_status_publicado_em_idx" ON "noticias"("status", "publicado_em" DESC);

-- CreateIndex
CREATE INDEX "noticias_semana_idx" ON "noticias"("semana" DESC);

-- AddForeignKey
ALTER TABLE "noticias" ADD CONSTRAINT "noticias_revisado_por_fkey" FOREIGN KEY ("revisado_por") REFERENCES "editoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================
-- Regras do banco (CHECK)
-- ============================================================

ALTER TABLE "diagnosticos"
  ADD CONSTRAINT "diagnosticos_nome_check" CHECK (char_length("nome") BETWEEN 2 AND 120),
  ADD CONSTRAINT "diagnosticos_email_check" CHECK (char_length("email") <= 254 AND "email" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT "diagnosticos_empresa_check" CHECK (char_length("empresa") BETWEEN 2 AND 160),
  ADD CONSTRAINT "diagnosticos_cargo_check" CHECK (char_length("cargo") BETWEEN 2 AND 120),
  ADD CONSTRAINT "diagnosticos_telefone_check" CHECK ("telefone" ~ '^[0-9]{10,13}$'),
  ADD CONSTRAINT "diagnosticos_como_conheceu_check" CHECK ("como_conheceu" IN ('linkedin','instagram','indicacao','google','blog','evento','outro')),
  ADD CONSTRAINT "diagnosticos_problema_check" CHECK ("problema" IS NULL OR char_length("problema") BETWEEN 1 AND 3000),
  ADD CONSTRAINT "diagnosticos_respostas_check" CHECK (jsonb_typeof("respostas") = 'object' AND pg_column_size("respostas") <= 4000),
  ADD CONSTRAINT "diagnosticos_pontuacao_check" CHECK ("pontuacao" BETWEEN 0 AND 12),
  ADD CONSTRAINT "diagnosticos_nivel_check" CHECK ("nivel" IN ('inicial','organizacao','evolucao','estruturado')),
  -- Sem consentimento de contato, o lead não entra.
  ADD CONSTRAINT "diagnosticos_consentimento_check" CHECK ("consentimento_contato" = true),
  ADD CONSTRAINT "diagnosticos_consentimento_versao_check" CHECK (char_length("consentimento_versao") <= 60),
  ADD CONSTRAINT "diagnosticos_origem_check" CHECK (char_length("origem") <= 200),
  ADD CONSTRAINT "diagnosticos_pagina_referencia_check" CHECK (char_length("pagina_referencia") <= 500),
  ADD CONSTRAINT "diagnosticos_utm_check" CHECK (char_length("utm_source") <= 200 AND char_length("utm_medium") <= 200 AND char_length("utm_campaign") <= 200 AND char_length("utm_content") <= 200),
  ADD CONSTRAINT "diagnosticos_status_check" CHECK ("status" IN ('novo','em_contato','qualificado','descartado'));

ALTER TABLE "newsletter_inscricoes"
  ADD CONSTRAINT "newsletter_email_check" CHECK (char_length("email") <= 254 AND "email" = lower("email") AND "email" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT "newsletter_origem_check" CHECK (char_length("origem") <= 200),
  ADD CONSTRAINT "newsletter_consentimento_versao_check" CHECK (char_length("consentimento_versao") <= 60);

ALTER TABLE "editoras"
  ADD CONSTRAINT "editoras_email_check" CHECK ("email" = lower("email") AND "email" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

ALTER TABLE "noticias"
  ADD CONSTRAINT "noticias_status_check" CHECK ("status" IN ('pendente','aprovada','rejeitada')),
  ADD CONSTRAINT "noticias_titulo_check" CHECK (char_length("titulo") BETWEEN 10 AND 160),
  ADD CONSTRAINT "noticias_resumo_check" CHECK (char_length("resumo") BETWEEN 40 AND 600),
  ADD CONSTRAINT "noticias_por_que_importa_check" CHECK (char_length("por_que_importa") BETWEEN 40 AND 900),
  ADD CONSTRAINT "noticias_categoria_check" CHECK ("categoria" IN ('negocios','solucoes','gestao')),
  ADD CONSTRAINT "noticias_subtema_check" CHECK ("subtema" IN ('marketing','vendas','dados','desenvolvimento','inovacao','experiencia-do-cliente','gestao-empresarial','big-techs','financas')),
  ADD CONSTRAINT "noticias_continente_check" CHECK ("continente" IN ('america-do-sul','america-do-norte','europa','africa','asia','oceania')),
  ADD CONSTRAINT "noticias_fonte_check" CHECK (char_length("fonte") BETWEEN 2 AND 120),
  ADD CONSTRAINT "noticias_link_check" CHECK ("link" ~ '^https?://');
