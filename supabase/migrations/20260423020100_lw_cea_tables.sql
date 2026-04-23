-- ============================================
-- Living Word — CEA Additional Tables
-- Centro de Estudos Avançados
-- BX4 Technology Solutions | Antigravity Layer
-- ============================================

-- Word Studies cache (análise do original)
CREATE TABLE IF NOT EXISTS lw_word_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palavra TEXT NOT NULL,
  transliteracao TEXT,
  idioma TEXT NOT NULL CHECK (idioma IN ('grego', 'hebraico', 'aramaico')),
  strongs_number TEXT,
  referencia_exemplo TEXT,
  morfologia JSONB DEFAULT '{}',
  -- {classe, genero, numero, tempo, modo, voz, ...}
  significado_literal TEXT,
  insight_teologico TEXT,
  versoes_comparadas JSONB DEFAULT '[]',
  frequencia_at INT DEFAULT 0,
  frequencia_nt INT DEFAULT 0,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(palavra, idioma)
);

-- Verse versions comparison
CREATE TABLE IF NOT EXISTS lw_verse_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referencia TEXT NOT NULL,
  -- ex: "João 3:16"
  livro TEXT NOT NULL,
  capitulo INT NOT NULL,
  versiculo INT NOT NULL,
  versoes JSONB NOT NULL DEFAULT '{}',
  -- {"NVI": "texto...", "ARA": "texto...", "ACF": "texto...", "KJV": "texto..."}
  notas_traducao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referencia)
);

-- Deep research cache (estudos gerados por IA)
CREATE TABLE IF NOT EXISTS lw_deep_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL,
  -- hash da query para cache
  source_type TEXT NOT NULL CHECK (source_type IN ('parabola', 'personagem', 'livro', 'word_study', 'tema')),
  source_id UUID,
  source_ref TEXT,
  -- ex: "João 3:16" ou "Filho Pródigo"
  nivel TEXT DEFAULT 'intermediario',
  conteudo JSONB NOT NULL,
  -- estrutura completa do estudo
  modelo_usado TEXT,
  tokens_usados INT,
  custo_usd DECIMAL(10,6),
  vezes_servido INT DEFAULT 0,
  -- quantas vezes foi retornado do cache
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(query_hash)
);

-- CEA progress tracking
CREATE TABLE IF NOT EXISTS lw_cea_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  modulo TEXT NOT NULL CHECK (modulo IN ('parabolas', 'personagens', 'panorama', 'quiz', 'pesquisa')),
  item_id UUID NOT NULL,
  status TEXT DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido')),
  percentual INT DEFAULT 0 CHECK (percentual BETWEEN 0 AND 100),
  notas TEXT,
  favorito BOOLEAN DEFAULT FALSE,
  ultima_visita TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, modulo, item_id)
);

-- Achievements & gamification
CREATE TABLE IF NOT EXISTS lw_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  achievement_key TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  badge_icon TEXT,
  pontos INT DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- CEA generated materials
CREATE TABLE IF NOT EXISTS lw_cea_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('estudo_parabola','estudo_personagem','word_study','plano_leitura','estudo_grupo','devocional')),
  titulo TEXT NOT NULL,
  source_table TEXT,
  source_id UUID,
  conteudo JSONB NOT NULL,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  exportado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_word_studies_palavra ON lw_word_studies (palavra);
CREATE INDEX IF NOT EXISTS idx_word_studies_strongs ON lw_word_studies (strongs_number);
CREATE INDEX IF NOT EXISTS idx_deep_research_hash ON lw_deep_research (query_hash);
CREATE INDEX IF NOT EXISTS idx_deep_research_source ON lw_deep_research (source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_cea_progress_user ON lw_cea_progress (user_id, modulo);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON lw_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_cea_materials_user ON lw_cea_materials (user_id, tipo);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE lw_word_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_verse_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_deep_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_cea_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_cea_materials ENABLE ROW LEVEL SECURITY;

-- Conteúdo compartilhado: leitura por todos autenticados
CREATE POLICY "word_studies_read_all" ON lw_word_studies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "word_studies_service_write" ON lw_word_studies FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "verse_versions_read_all" ON lw_verse_versions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "verse_versions_service_write" ON lw_verse_versions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "deep_research_read_all" ON lw_deep_research FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "deep_research_service_write" ON lw_deep_research FOR ALL USING (auth.role() = 'service_role');

-- Dados pessoais: usuário acessa só os seus
CREATE POLICY "cea_progress_own" ON lw_cea_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cea_progress_service" ON lw_cea_progress FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "achievements_own" ON lw_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "achievements_service" ON lw_achievements FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "cea_materials_own" ON lw_cea_materials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cea_materials_service" ON lw_cea_materials FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name LIKE 'lw_%' ORDER BY table_name;
-- Deve retornar: lw_achievements, lw_bible_books, lw_cea_materials,
--               lw_cea_progress, lw_characters, lw_deep_research,
--               lw_parables, lw_quiz, lw_quiz_sessions,
--               lw_verse_versions, lw_word_studies
