-- ============================================================
-- Schema: knowledge  (RAG do CEA — Living Word)
-- Projeto: priumwdestycikzfcysg
-- Rodar via: Supabase SQL Editor
-- ============================================================

-- Habilitar extensão pgvector (necessário para embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar schema isolado para a knowledge base
CREATE SCHEMA IF NOT EXISTS knowledge;

-- ─── Tabela: knowledge.documents ─────────────────────────────────────────────
-- Representa cada arquivo fonte (PDF) ingerido
CREATE TABLE IF NOT EXISTS knowledge.documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  source_path TEXT,
  mind        TEXT NOT NULL DEFAULT 'cea',   -- filtro de domínio
  item_type   TEXT,                           -- parabola|personagem|livro|quiz|devocional|milagre
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: knowledge.chunks ────────────────────────────────────────────────
-- Cada chunk de texto com seu embedding 768d (Gemini text-embedding-004)
CREATE TABLE IF NOT EXISTS knowledge.chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  embedding   vector(768),
  metadata    JSONB DEFAULT '{}',
  chunk_index INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice HNSW para busca semântica rápida
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON knowledge.chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Índice para filtro por mind
CREATE INDEX IF NOT EXISTS chunks_mind_idx
  ON knowledge.chunks ((metadata->>'mind'));

-- Índice para filtro por item_type
CREATE INDEX IF NOT EXISTS chunks_item_type_idx
  ON knowledge.chunks ((metadata->>'item_type'));

-- ─── RPC: match_cea_chunks ────────────────────────────────────────────────────
-- Busca semântica por similaridade coseno com filtros opcionais
CREATE OR REPLACE FUNCTION match_cea_chunks(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.70,
  match_count     INT   DEFAULT 6,
  filter_mind     TEXT  DEFAULT 'cea',
  filter_type     TEXT  DEFAULT NULL
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM knowledge.chunks c
  WHERE
    c.embedding IS NOT NULL
    AND (c.metadata->>'mind') = filter_mind
    AND (filter_type IS NULL OR (c.metadata->>'item_type') = filter_type)
    AND 1 - (c.embedding <=> query_embedding) >= match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- Usuários autenticados podem ler chunks (conteúdo bíblico é público)
ALTER TABLE knowledge.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.chunks    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem documents"
  ON knowledge.documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Autenticados leem chunks"
  ON knowledge.chunks FOR SELECT
  TO authenticated
  USING (true);

-- Service role pode inserir (ingestão via script)
CREATE POLICY "Service role insere documents"
  ON knowledge.documents FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role insere chunks"
  ON knowledge.chunks FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ─── Verificação ─────────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'knowledge'
ORDER BY tablename;
