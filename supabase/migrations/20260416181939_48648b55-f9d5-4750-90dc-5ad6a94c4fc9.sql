-- ============================================================
-- KNOWLEDGE BASE LAYER — Living Word
-- Schema isolado para RAG (Retrieval-Augmented Generation)
-- ============================================================

-- 1. Extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Schema isolado
CREATE SCHEMA IF NOT EXISTS knowledge;

-- 3. Permissões de schema: somente service_role
REVOKE ALL ON SCHEMA knowledge FROM PUBLIC;
REVOKE ALL ON SCHEMA knowledge FROM anon;
REVOKE ALL ON SCHEMA knowledge FROM authenticated;
GRANT ALL ON SCHEMA knowledge TO service_role;
GRANT ALL ON SCHEMA knowledge TO postgres;

-- Defaults para futuros objetos criados nesse schema
ALTER DEFAULT PRIVILEGES IN SCHEMA knowledge
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA knowledge
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA knowledge
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA knowledge
  GRANT ALL ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA knowledge
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA knowledge
  GRANT ALL ON SEQUENCES TO service_role;

-- ============================================================
-- TRIGGER FUNCTION: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION knowledge.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = knowledge, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLE: knowledge.documents
-- ============================================================
CREATE TABLE knowledge.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   TEXT,
  mind          TEXT,
  title         TEXT NOT NULL,
  source        TEXT,
  language      TEXT NOT NULL DEFAULT 'EN',
  bible_refs    TEXT[] DEFAULT '{}',
  themes        TEXT[] DEFAULT '{}',
  full_text     TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  ingested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_mind        ON knowledge.documents (mind);
CREATE INDEX idx_documents_language    ON knowledge.documents (language);
CREATE INDEX idx_documents_external_id ON knowledge.documents (external_id);
CREATE INDEX idx_documents_themes      ON knowledge.documents USING GIN (themes);
CREATE INDEX idx_documents_bible_refs  ON knowledge.documents USING GIN (bible_refs);

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON knowledge.documents
  FOR EACH ROW EXECUTE FUNCTION knowledge.set_updated_at();

ALTER TABLE knowledge.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.documents FORCE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access documents"
  ON knowledge.documents
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLE: knowledge.chunks
-- ============================================================
CREATE TABLE knowledge.chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  chunk_index     INTEGER NOT NULL,
  chunk_text      TEXT NOT NULL,
  token_count     INTEGER,
  embedding       vector(1536),
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_chunks_document_id ON knowledge.chunks (document_id);

-- HNSW para busca por cosseno (m=16, ef_construction=64)
CREATE INDEX idx_chunks_embedding_hnsw
  ON knowledge.chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE knowledge.chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.chunks FORCE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access chunks"
  ON knowledge.chunks
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLE: knowledge.mind_profiles
-- ============================================================
CREATE TABLE knowledge.mind_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mind_key        TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  era             TEXT,
  tradition       TEXT,
  style_summary   TEXT NOT NULL,
  system_prompt   TEXT NOT NULL,
  voice_markers   TEXT[] DEFAULT '{}',
  avoid_list      TEXT[] DEFAULT '{}',
  example_phrases TEXT[] DEFAULT '{}',
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mind_profiles_active ON knowledge.mind_profiles (active);

CREATE TRIGGER trg_mind_profiles_updated_at
  BEFORE UPDATE ON knowledge.mind_profiles
  FOR EACH ROW EXECUTE FUNCTION knowledge.set_updated_at();

ALTER TABLE knowledge.mind_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.mind_profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access mind_profiles"
  ON knowledge.mind_profiles
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLE: knowledge.ingestion_log
-- ============================================================
CREATE TABLE knowledge.ingestion_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table   TEXT NOT NULL,
  records_total  INTEGER NOT NULL DEFAULT 0,
  records_ok     INTEGER NOT NULL DEFAULT 0,
  records_error  INTEGER NOT NULL DEFAULT 0,
  error_details  JSONB DEFAULT '{}'::jsonb,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at    TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'running'
);

CREATE INDEX idx_ingestion_log_started_at ON knowledge.ingestion_log (started_at DESC);
CREATE INDEX idx_ingestion_log_status     ON knowledge.ingestion_log (status);

ALTER TABLE knowledge.ingestion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.ingestion_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access ingestion_log"
  ON knowledge.ingestion_log
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RPC: knowledge.search_corpus
-- Busca semântica por similaridade de cosseno
-- ============================================================
CREATE OR REPLACE FUNCTION knowledge.search_corpus(
  query_embedding      vector(1536),
  filter_mind          TEXT  DEFAULT NULL,
  filter_language      TEXT  DEFAULT NULL,
  filter_bible_ref     TEXT  DEFAULT NULL,
  top_k                INT   DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.70
)
RETURNS TABLE (
  chunk_id        UUID,
  document_id     UUID,
  chunk_index     INTEGER,
  chunk_text      TEXT,
  document_title  TEXT,
  document_source TEXT,
  mind            TEXT,
  language        TEXT,
  bible_refs      TEXT[],
  themes          TEXT[],
  similarity      FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = knowledge, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id            AS chunk_id,
    d.id            AS document_id,
    c.chunk_index,
    c.chunk_text,
    d.title         AS document_title,
    d.source        AS document_source,
    d.mind,
    d.language,
    d.bible_refs,
    d.themes,
    (1 - (c.embedding <=> query_embedding))::float AS similarity
  FROM knowledge.chunks c
  JOIN knowledge.documents d ON d.id = c.document_id
  WHERE
    c.embedding IS NOT NULL
    AND (filter_mind      IS NULL OR d.mind = filter_mind)
    AND (filter_language  IS NULL OR d.language = filter_language)
    AND (filter_bible_ref IS NULL OR filter_bible_ref = ANY (d.bible_refs))
    AND (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY c.embedding <=> query_embedding ASC
  LIMIT top_k;
END;
$$;

-- Bloquear a função para anon e authenticated; liberar somente para service_role
REVOKE ALL ON FUNCTION knowledge.search_corpus(vector, TEXT, TEXT, TEXT, INT, FLOAT) FROM PUBLIC;
REVOKE ALL ON FUNCTION knowledge.search_corpus(vector, TEXT, TEXT, TEXT, INT, FLOAT) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION knowledge.search_corpus(vector, TEXT, TEXT, TEXT, INT, FLOAT) TO service_role;