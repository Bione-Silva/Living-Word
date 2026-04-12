-- ============================================================
-- Migration: 016_biblical_knowledge_base.sql
-- Centro de Conhecimento Bíblico — base de dados estruturada
-- extraída dos ebooks licenciados
-- ============================================================

-- Tabela de bibliotecas (fontes dos ebooks)
CREATE TABLE IF NOT EXISTS content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'parabolas', 'milagres', 'personagens', 'panorama', 'quiz', 'plano_leitura'
  )),
  license_type TEXT NOT NULL DEFAULT 'licensed' CHECK (license_type IN (
    'licensed', 'public_domain', 'internal'
  )),
  source_file TEXT,
  total_items INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela central de conteúdo (parábolas, milagres, personagens, panorama)
CREATE TABLE IF NOT EXISTS content_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID REFERENCES content_library(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'parabolas', 'milagres', 'personagens', 'panorama'
  )),
  reference TEXT,                    -- 'João 2:1-11'
  book TEXT,                          -- 'João'
  testament TEXT CHECK (testament IN ('AT', 'NT', NULL)),
  
  -- Campos comuns
  historical_context TEXT,
  theological_message TEXT,
  practical_application TEXT,
  reflection_questions JSONB,         -- array de strings
  summary TEXT,
  
  -- Campos específicos por categoria
  metadata JSONB,                     -- dados extras (miracle_type, period, genre, etc.)
  
  -- Busca full-text
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(reference, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(summary, '')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(historical_context, '')), 'D')
  ) STORED,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice de busca full-text
CREATE INDEX IF NOT EXISTS idx_content_sections_search ON content_sections USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_content_sections_category ON content_sections(category);
CREATE INDEX IF NOT EXISTS idx_content_sections_testament ON content_sections(testament);
CREATE INDEX IF NOT EXISTS idx_content_sections_book ON content_sections(book);
CREATE INDEX IF NOT EXISTS idx_content_sections_library ON content_sections(library_id);

-- Tabela de Quiz Bíblico
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID REFERENCES content_library(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  reference TEXT,
  difficulty TEXT CHECK (difficulty IN ('facil', 'medio', 'dificil')),
  category TEXT,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce(question, '') || ' ' || coalesce(answer, ''))
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_search ON quiz_questions USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_quiz_difficulty ON quiz_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_category ON quiz_questions(category);

-- Tabelas de Plano de Leitura
CREATE TABLE IF NOT EXISTS reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID REFERENCES content_library(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES reading_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  passage TEXT NOT NULL,             -- 'Gênesis 1-2'
  book TEXT,
  chapters TEXT,
  testament TEXT CHECK (testament IN ('AT', 'NT', NULL)),
  theme TEXT,
  UNIQUE(plan_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_rpd_plan ON reading_plan_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_rpd_book ON reading_plan_days(book);

-- Progresso do usuário no plano de leitura
CREATE TABLE IF NOT EXISTS user_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_urp_user ON user_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_urp_plan ON user_reading_progress(plan_id, user_id);

-- Bookmarks/favoritos de conteúdo do usuário
CREATE TABLE IF NOT EXISTS user_content_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id UUID REFERENCES content_sections(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_exactly_one CHECK (
    (section_id IS NOT NULL)::INT + (quiz_id IS NOT NULL)::INT = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_ucb_user ON user_content_bookmarks(user_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_bookmarks ENABLE ROW LEVEL SECURITY;

-- content_library: público (read-only para todos autenticados)
CREATE POLICY "content_library_read" ON content_library
  FOR SELECT TO authenticated USING (true);

-- content_sections: leitura baseada em plano
-- Planos knowledge, church, ministry têm acesso completo
-- Outros veem apenas resumo (limitado via app, não via RLS pois RLS é row-level)
CREATE POLICY "content_sections_read" ON content_sections
  FOR SELECT TO authenticated USING (true);

-- quiz_questions: público para autenticados
CREATE POLICY "quiz_questions_read" ON quiz_questions
  FOR SELECT TO authenticated USING (true);

-- reading_plans: público para autenticados
CREATE POLICY "reading_plans_read" ON reading_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reading_plan_days_read" ON reading_plan_days
  FOR SELECT TO authenticated USING (true);

-- user_reading_progress: somente o próprio usuário
CREATE POLICY "user_reading_progress_select" ON user_reading_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_reading_progress_insert" ON user_reading_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_reading_progress_delete" ON user_reading_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_content_bookmarks: somente o próprio usuário
CREATE POLICY "user_bookmarks_all" ON user_content_bookmarks
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── FUNÇÃO DE BUSCA SEMÂNTICA ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_biblical_content(
  query_text TEXT,
  category_filter TEXT DEFAULT NULL,
  testament_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  reference TEXT,
  book TEXT,
  testament TEXT,
  summary TEXT,
  rank REAL
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    cs.id,
    cs.title,
    cs.category,
    cs.reference,
    cs.book,
    cs.testament,
    cs.summary,
    ts_rank(cs.search_vector, websearch_to_tsquery('portuguese', query_text)) AS rank
  FROM content_sections cs
  WHERE
    cs.search_vector @@ websearch_to_tsquery('portuguese', query_text)
    AND (category_filter IS NULL OR cs.category = category_filter)
    AND (testament_filter IS NULL OR cs.testament = testament_filter)
  ORDER BY rank DESC
  LIMIT limit_count;
$$;

-- ─── FUNÇÃO DE PROGRESSO DO USUÁRIO ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_reading_stats(p_user_id UUID, p_plan_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_days INTEGER;
  v_completed_days INTEGER;
  v_current_streak INTEGER;
  v_last_completed DATE;
BEGIN
  SELECT total_days INTO v_total_days FROM reading_plans WHERE id = p_plan_id;
  
  SELECT COUNT(*) INTO v_completed_days
  FROM user_reading_progress
  WHERE user_id = p_user_id AND plan_id = p_plan_id;
  
  -- Calcular streak
  SELECT COUNT(*) INTO v_current_streak
  FROM (
    SELECT completed_at::DATE AS d,
           ROW_NUMBER() OVER (ORDER BY completed_at::DATE DESC) AS rn
    FROM user_reading_progress
    WHERE user_id = p_user_id AND plan_id = p_plan_id
    GROUP BY completed_at::DATE
  ) sub
  WHERE d = (CURRENT_DATE - (rn - 1));
  
  SELECT MAX(completed_at::DATE) INTO v_last_completed
  FROM user_reading_progress
  WHERE user_id = p_user_id AND plan_id = p_plan_id;
  
  RETURN json_build_object(
    'total_days', v_total_days,
    'completed_days', v_completed_days,
    'percentage', ROUND((v_completed_days::NUMERIC / NULLIF(v_total_days, 0)) * 100, 1),
    'current_streak', v_current_streak,
    'last_completed', v_last_completed,
    'next_day', v_completed_days + 1
  );
END;
$$;

-- ─── COMENTÁRIOS ─────────────────────────────────────────────────────────────
COMMENT ON TABLE content_library IS 'Registro dos ebooks licenciados que alimentam o Centro de Conhecimento Bíblico';
COMMENT ON TABLE content_sections IS 'Conteúdo bíblico estruturado: parábolas, milagres, personagens e panorama dos livros';
COMMENT ON TABLE quiz_questions IS '250 perguntas do quiz bíblico com respostas e dificuldade';
COMMENT ON TABLE reading_plans IS 'Planos de leitura da Bíblia (ex: 365 dias)';
COMMENT ON TABLE reading_plan_days IS 'Cada dia de leitura com passagem e livro';
COMMENT ON TABLE user_reading_progress IS 'Progresso individual do usuário nos planos de leitura';
COMMENT ON TABLE user_content_bookmarks IS 'Favoritos e anotações pessoais do usuário no conteúdo bíblico';
