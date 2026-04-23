-- ============================================
-- Living Word — Bible Content Tables Migration
-- BX4 Technology Solutions | Antigravity Layer
-- Execute no Supabase SQL Editor
-- ============================================

-- Habilitar extensão pgvector (se ainda não ativo)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABELA 1: 40 PARÁBOLAS DE JESUS
-- ============================================
CREATE TABLE IF NOT EXISTS lw_parables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  referencia TEXT NOT NULL,
  evangelho TEXT NOT NULL CHECK (evangelho IN ('Lucas', 'Mateus', 'Marcos', 'João')),
  contexto_epoca TEXT,
  tensoes_culturais TEXT,
  conexao_at TEXT,
  mensagem_central TEXT,
  licoes JSONB DEFAULT '[]',
  aplicacao_moderna TEXT,
  personagens_parabola JSONB DEFAULT '{}',
  temas TEXT[] DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parables_embedding 
  ON lw_parables USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

CREATE INDEX IF NOT EXISTS idx_parables_temas 
  ON lw_parables USING GIN (temas);

CREATE INDEX IF NOT EXISTS idx_parables_evangelho 
  ON lw_parables (evangelho);

-- ============================================
-- TABELA 2: 200 PERSONAGENS BÍBLICOS
-- ============================================
CREATE TABLE IF NOT EXISTS lw_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  nome_alternativo TEXT,
  testamento TEXT NOT NULL CHECK (testamento IN ('AT', 'NT', 'AT/NT')),
  livros_principais TEXT[] DEFAULT '{}',
  periodo_historico TEXT,
  tribo_origem TEXT,
  cargo_funcao TEXT,
  biografia TEXT NOT NULL,
  principais_acoes JSONB DEFAULT '[]',
  licoes JSONB DEFAULT '[]',
  conexoes_personagens JSONB DEFAULT '[]',
  temas TEXT[] DEFAULT '{}',
  versiculo_chave TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_characters_embedding 
  ON lw_characters USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 20);

CREATE INDEX IF NOT EXISTS idx_characters_temas 
  ON lw_characters USING GIN (temas);

CREATE INDEX IF NOT EXISTS idx_characters_testamento 
  ON lw_characters (testamento);

CREATE INDEX IF NOT EXISTS idx_characters_nome 
  ON lw_characters (nome);

-- ============================================
-- TABELA 3: 66 LIVROS — PANORAMA BÍBLICO
-- ============================================
CREATE TABLE IF NOT EXISTS lw_bible_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_canon INT NOT NULL UNIQUE CHECK (numero_canon BETWEEN 1 AND 66),
  nome TEXT NOT NULL UNIQUE,
  abreviacao TEXT NOT NULL UNIQUE,
  testamento TEXT NOT NULL CHECK (testamento IN ('AT', 'NT')),
  secao TEXT NOT NULL,
  -- AT: Pentateuco, Histórico, Poético, Profetas Maiores, Profetas Menores
  -- NT: Evangelhos, História, Paulinas, Epístolas Gerais, Profecia
  autor TEXT,
  data_escrita TEXT,
  idioma_original TEXT NOT NULL DEFAULT 'hebraico',
  destinatarios TEXT,
  proposito TEXT,
  resumo TEXT,
  mensagem_central TEXT,
  versiculos_chave TEXT[] DEFAULT '{}',
  temas_principais TEXT[] DEFAULT '{}',
  conexoes_canonicas TEXT,
  personagens_principais TEXT[] DEFAULT '{}',
  estrutura JSONB DEFAULT '{}',
  contexto_historico TEXT,
  arqueologia TEXT,
  total_capitulos INT,
  total_versiculos INT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_embedding 
  ON lw_bible_books USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

CREATE INDEX IF NOT EXISTS idx_books_testamento 
  ON lw_bible_books (testamento);

CREATE INDEX IF NOT EXISTS idx_books_secao 
  ON lw_bible_books (secao);

-- ============================================
-- TABELA 4: 250 QUIZ BÍBLICO
-- ============================================
CREATE TABLE IF NOT EXISTS lw_quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT UNIQUE,
  pergunta TEXT NOT NULL,
  opcoes JSONB NOT NULL,
  -- {"A": "texto", "B": "texto", "C": "texto", "D": "texto"}
  resposta_correta TEXT NOT NULL CHECK (resposta_correta IN ('A', 'B', 'C', 'D')),
  explicacao TEXT,
  referencia_biblica TEXT,
  nivel_dificuldade TEXT NOT NULL DEFAULT 'basico'
    CHECK (nivel_dificuldade IN ('basico', 'intermediario', 'avancado')),
  categoria TEXT NOT NULL DEFAULT 'geral',
  -- personagens, eventos, doutrina, geografia, livros, versiculos, parabolas
  testamento TEXT DEFAULT 'geral' CHECK (testamento IN ('AT', 'NT', 'geral')),
  temas TEXT[] DEFAULT '{}',
  fonte TEXT DEFAULT 'pdf_250_quiz',
  -- "pdf_250_quiz" | "gerado_ia" | "custom"
  vezes_respondida INT DEFAULT 0,
  vezes_acertada INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_nivel 
  ON lw_quiz (nivel_dificuldade);

CREATE INDEX IF NOT EXISTS idx_quiz_categoria 
  ON lw_quiz (categoria);

CREATE INDEX IF NOT EXISTS idx_quiz_testamento 
  ON lw_quiz (testamento);

CREATE INDEX IF NOT EXISTS idx_quiz_temas 
  ON lw_quiz USING GIN (temas);

-- ============================================
-- TABELA 5: SESSÕES DE QUIZ DOS USUÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS lw_quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  categoria TEXT,
  nivel TEXT,
  testamento TEXT,
  perguntas_ids UUID[] DEFAULT '{}',
  respostas JSONB DEFAULT '{}',
  -- {pergunta_id: {resposta_dada: "A", correta: true, tempo_ms: 4200}}
  pontuacao INT DEFAULT 0,
  total_perguntas INT DEFAULT 0,
  percentual_acerto DECIMAL(5,2),
  tempo_total_segundos INT,
  completado BOOLEAN DEFAULT FALSE,
  modo TEXT DEFAULT 'individual'
    CHECK (modo IN ('individual', 'grupo', 'desafio', 'treinamento')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user 
  ON lw_quiz_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completado 
  ON lw_quiz_sessions (completado);

-- ============================================
-- FUNÇÃO DE BUSCA SEMÂNTICA
-- ============================================
CREATE OR REPLACE FUNCTION search_bible_parables(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  referencia TEXT,
  mensagem_central TEXT,
  temas TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lw_parables.id,
    lw_parables.titulo,
    lw_parables.referencia,
    lw_parables.mensagem_central,
    lw_parables.temas,
    1 - (lw_parables.embedding <=> query_embedding) AS similarity
  FROM lw_parables
  WHERE 1 - (lw_parables.embedding <=> query_embedding) > match_threshold
  ORDER BY lw_parables.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION search_bible_characters(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  cargo_funcao TEXT,
  testamento TEXT,
  temas TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lw_characters.id,
    lw_characters.nome,
    lw_characters.cargo_funcao,
    lw_characters.testamento,
    lw_characters.temas,
    1 - (lw_characters.embedding <=> query_embedding) AS similarity
  FROM lw_characters
  WHERE 1 - (lw_characters.embedding <=> query_embedding) > match_threshold
  ORDER BY lw_characters.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION search_bible_books(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  abreviacao TEXT,
  testamento TEXT,
  mensagem_central TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lw_bible_books.id,
    lw_bible_books.nome,
    lw_bible_books.abreviacao,
    lw_bible_books.testamento,
    lw_bible_books.mensagem_central,
    1 - (lw_bible_books.embedding <=> query_embedding) AS similarity
  FROM lw_bible_books
  WHERE 1 - (lw_bible_books.embedding <=> query_embedding) > match_threshold
  ORDER BY lw_bible_books.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Conteúdo bíblico é público para leitura (todos os usuários autenticados)
ALTER TABLE lw_parables ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_bible_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lw_parables_read_all" ON lw_parables
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "lw_characters_read_all" ON lw_characters
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "lw_bible_books_read_all" ON lw_bible_books
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "lw_quiz_read_all" ON lw_quiz
  FOR SELECT USING (auth.role() = 'authenticated');

-- Sessões: usuário vê só as suas
CREATE POLICY "lw_quiz_sessions_own" ON lw_quiz_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Service role pode inserir/atualizar tudo (para o Antigravity)
CREATE POLICY "lw_parables_service_write" ON lw_parables
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "lw_characters_service_write" ON lw_characters
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "lw_bible_books_service_write" ON lw_bible_books
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "lw_quiz_service_write" ON lw_quiz
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- Execute para confirmar estrutura:
-- SELECT table_name, pg_size_pretty(pg_total_relation_size(table_name::text))
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name LIKE 'lw_%'
-- ORDER BY table_name;
