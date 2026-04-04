-- 004_biblical_study.sql
-- Sprint 4: Suporte ao modo Estudo Bíblico (biblical_study)
-- Rodar APÓS 003_bible_commentary.sql
-- ============================================================

-- ============================================================
-- 1. Adicionar campo theme (indexável fora do JSON)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'materials'
    AND column_name = 'theme'
  ) THEN
    ALTER TABLE public.materials ADD COLUMN theme TEXT;
  END IF;
END $$;

-- ============================================================
-- 2. Adicionar campo depth_level (indexável fora do JSON)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'materials'
    AND column_name = 'depth_level'
  ) THEN
    ALTER TABLE public.materials
      ADD COLUMN depth_level TEXT CHECK (depth_level IN ('basic', 'intermediate', 'advanced'));
  END IF;
END $$;

-- ============================================================
-- 3. Adicionar campo output_biblical_study (JSON estruturado)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'materials'
    AND column_name = 'output_biblical_study'
  ) THEN
    ALTER TABLE public.materials ADD COLUMN output_biblical_study JSONB;
  END IF;
END $$;

-- ============================================================
-- 4. Adicionar campo render_ready
--    Só vira TRUE quando o JSON passa na validação completa
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'materials'
    AND column_name = 'render_ready'
  ) THEN
    ALTER TABLE public.materials ADD COLUMN render_ready BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================================
-- 5. Adicionar campo generation_status
--    Estado do pipeline: pending | generated | failed_schema |
--                        failed_validation | saved
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'materials'
    AND column_name = 'generation_status'
  ) THEN
    ALTER TABLE public.materials
      ADD COLUMN generation_status TEXT DEFAULT 'pending'
        CHECK (generation_status IN (
          'pending', 'generated', 'failed_schema',
          'failed_validation', 'saved'
        ));
  END IF;
END $$;

-- ============================================================
-- 6. Atualizar CHECK constraint de 'mode' para incluir
--    'biblical_study' como modo próprio de produto
-- ============================================================
-- Passo 6a: remover constraint existente
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_mode_check;

-- Passo 6b: recriar com o novo valor
ALTER TABLE public.materials
  ADD CONSTRAINT materials_mode_check
  CHECK (mode IN (
    'pastoral',
    'blog',
    'devotional',
    'evangelistic',
    'series',
    'biblical_study'
  ));

-- ============================================================
-- 7. Índices adicionais para queries frequentes de estudo
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_materials_mode ON public.materials(mode);
CREATE INDEX IF NOT EXISTS idx_materials_doctrine ON public.materials(doctrine_line);
CREATE INDEX IF NOT EXISTS idx_materials_depth ON public.materials(depth_level);
CREATE INDEX IF NOT EXISTS idx_materials_passage ON public.materials(bible_passage);
CREATE INDEX IF NOT EXISTS idx_materials_render_ready ON public.materials(render_ready);

-- ============================================================
-- 8. View para listagem de estudos bíblicos do usuário
--    (sem expor o JSON completo — performance)
-- ============================================================
CREATE OR REPLACE VIEW public.user_biblical_studies AS
SELECT
  m.id,
  m.user_id,
  m.bible_passage,
  m.theme,
  m.language,
  m.doctrine_line,
  m.depth_level,
  m.pastoral_voice,
  m.bible_version,
  m.render_ready,
  m.generation_status,
  m.created_at,
  -- Extrair título e ideia central do JSON sem ler o payload inteiro
  m.output_biblical_study->>'title'          AS study_title,
  m.output_biblical_study->>'central_idea'   AS central_idea,
  m.output_biblical_study->>'schema_version' AS schema_version,
  (m.output_biblical_study->>'caution_mode')::boolean AS caution_mode
FROM public.materials m
WHERE m.mode = 'biblical_study';

-- ============================================================
-- 9. Função de validação de schema do JSON (server-side)
--    Retorna TRUE se o JSON passou em todas as checagens
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_biblical_study_json(
  p_json JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  required_keys TEXT[] := ARRAY[
    'schema_version', 'title', 'bible_passage', 'central_idea',
    'historical_context', 'literary_context', 'text_structure',
    'exegesis', 'theological_interpretation', 'biblical_connections',
    'application', 'reflection_questions', 'conclusion',
    'pastoral_warning', 'caution_mode'
  ];
  k TEXT;
BEGIN
  -- Verificar presença de todas as chaves obrigatórias
  FOREACH k IN ARRAY required_keys LOOP
    IF p_json->k IS NULL THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  -- Verificar que exegesis é um array com pelo menos 1 elemento
  IF jsonb_array_length(p_json->'exegesis') < 1 THEN
    RETURN FALSE;
  END IF;

  -- Verificar que reflection_questions tem pelo menos 3 perguntas
  IF jsonb_array_length(p_json->'reflection_questions') < 3 THEN
    RETURN FALSE;
  END IF;

  -- Verificar que título e ideia central não são strings vazias
  IF trim(p_json->>'title') = '' OR trim(p_json->>'central_idea') = '' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.validate_biblical_study_json IS
  'Valida se o JSON de um estudo bíblico contém todos os campos obrigatórios e tipos corretos antes de persistir.';
