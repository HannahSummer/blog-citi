-- ============================================================
-- Métricas de acesso do blog (painel /blog/admin/metricas).
-- Anônimas: não guardam IP nem cookie. `visitante` é um código diário (hash com chave
-- que muda todo dia) usado só para contar visitantes únicos do dia.
-- ============================================================

-- CreateTable
CREATE TABLE "visitas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caminho" TEXT NOT NULL,
    "entrada" BOOLEAN NOT NULL DEFAULT false,
    "origem" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "dispositivo" TEXT NOT NULL,
    "visitante" TEXT NOT NULL,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visitas_criado_em_idx" ON "visitas"("criado_em" DESC);

-- Regras do banco (CHECK)
ALTER TABLE "visitas"
  ADD CONSTRAINT "visitas_caminho_check" CHECK (char_length("caminho") BETWEEN 1 AND 300 AND "caminho" LIKE '/%'),
  ADD CONSTRAINT "visitas_origem_check" CHECK (char_length("origem") <= 200),
  ADD CONSTRAINT "visitas_utm_check" CHECK (char_length("utm_source") <= 100 AND char_length("utm_medium") <= 100 AND char_length("utm_campaign") <= 100),
  ADD CONSTRAINT "visitas_dispositivo_check" CHECK ("dispositivo" IN ('celular','tablet','computador')),
  ADD CONSTRAINT "visitas_visitante_check" CHECK (char_length("visitante") = 16);
