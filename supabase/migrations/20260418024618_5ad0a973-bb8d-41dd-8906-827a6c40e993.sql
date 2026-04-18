-- Tabela para rastrear cada documento individual da esteira de ingestão
CREATE TABLE IF NOT EXISTS public.kb_ingestion_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mind            text NOT NULL,
  source_url      text NOT NULL,
  source_format   text NOT NULL DEFAULT 'html', -- html | txt | pdf
  title           text NOT NULL,
  language        text NOT NULL DEFAULT 'en',   -- en | pt | es
  target_language text NOT NULL DEFAULT 'en',   -- idioma final do doc após tradução opcional
  bible_refs      text[] DEFAULT '{}',
  themes          text[] DEFAULT '{}',
  metadata        jsonb DEFAULT '{}'::jsonb,
  status          text NOT NULL DEFAULT 'pending',
    -- pending | fetching | chunking | embedding | translating | ingested | error | skipped
  attempts        integer NOT NULL DEFAULT 0,
  last_error      text,
  document_id     uuid, -- FK lógica para knowledge.documents (não força FK cross-schema)
  chunks_count    integer DEFAULT 0,
  batch_id        text, -- agrupa execuções (ex: 'wesley-pilot-2026-04-18')
  started_at      timestamptz,
  finished_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_jobs_status      ON public.kb_ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_kb_jobs_mind        ON public.kb_ingestion_jobs(mind);
CREATE INDEX IF NOT EXISTS idx_kb_jobs_batch       ON public.kb_ingestion_jobs(batch_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_kb_jobs_url_lang
  ON public.kb_ingestion_jobs(source_url, target_language);

ALTER TABLE public.kb_ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage ingestion jobs"
  ON public.kb_ingestion_jobs
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service role full access kb jobs"
  ON public.kb_ingestion_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- trigger para updated_at
CREATE OR REPLACE FUNCTION public.touch_kb_ingestion_jobs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_kb_ingestion_jobs ON public.kb_ingestion_jobs;
CREATE TRIGGER trg_touch_kb_ingestion_jobs
  BEFORE UPDATE ON public.kb_ingestion_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_kb_ingestion_jobs();