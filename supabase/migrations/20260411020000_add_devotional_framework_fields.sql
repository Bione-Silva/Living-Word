-- Migration: Adiciona campos do Framework Living Word à tabela devotionals
-- Gerado em: 2026-04-11

ALTER TABLE devotionals
  ADD COLUMN IF NOT EXISTS today_action TEXT,
  ADD COLUMN IF NOT EXISTS supplementary_reading TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

COMMENT ON COLUMN devotionals.today_action         IS 'Aplicação de hoje — ação prática iniciando com verbo no imperativo';
COMMENT ON COLUMN devotionals.supplementary_reading IS 'Leitura complementar — referências bíblicas opcionais para aprofundar';
COMMENT ON COLUMN devotionals.cover_image_url       IS 'URL pública da imagem de capa gerada pelo Imagen 3';
