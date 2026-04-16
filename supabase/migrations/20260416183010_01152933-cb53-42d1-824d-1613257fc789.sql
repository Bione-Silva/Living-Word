-- 1. Drop existing HNSW index (depends on the column)
DROP INDEX IF EXISTS knowledge.chunks_embedding_hnsw_idx;

-- 2. Drop the old 1536-dim column
ALTER TABLE knowledge.chunks DROP COLUMN IF EXISTS embedding;

-- 3. Add new 768-dim column for Gemini embeddings
ALTER TABLE knowledge.chunks ADD COLUMN embedding vector(768);

-- 4. Update default embedding model name
ALTER TABLE knowledge.chunks
  ALTER COLUMN embedding_model SET DEFAULT 'text-embedding-004';

-- 5. Recreate HNSW index with cosine ops on the new 768-dim column
CREATE INDEX chunks_embedding_hnsw_idx
  ON knowledge.chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 6. Recreate search_corpus RPC with vector(768) signature
DROP FUNCTION IF EXISTS knowledge.search_corpus(vector, text, text, text, int, float);

CREATE OR REPLACE FUNCTION knowledge.search_corpus(
  query_embedding      vector(768),
  filter_mind          text   DEFAULT NULL,
  filter_language      text   DEFAULT NULL,
  filter_bible_ref     text   DEFAULT NULL,
  top_k                int    DEFAULT 5,
  similarity_threshold float  DEFAULT 0.70
)
RETURNS TABLE (
  chunk_id         uuid,
  document_id      uuid,
  chunk_index      integer,
  chunk_text       text,
  document_title   text,
  document_source  text,
  mind             text,
  language         text,
  bible_refs       text[],
  themes           text[],
  similarity       float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = knowledge, public
AS $$
  SELECT
    c.id                                       AS chunk_id,
    d.id                                       AS document_id,
    c.chunk_index,
    c.chunk_text,
    d.title                                    AS document_title,
    d.source                                   AS document_source,
    d.mind,
    d.language,
    d.bible_refs,
    d.themes,
    1 - (c.embedding <=> query_embedding)      AS similarity
  FROM knowledge.chunks c
  JOIN knowledge.documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND (filter_mind      IS NULL OR d.mind = filter_mind)
    AND (filter_language  IS NULL OR d.language = filter_language)
    AND (filter_bible_ref IS NULL OR filter_bible_ref = ANY(d.bible_refs))
    AND (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT top_k;
$$;

-- 7. Lock down: only service_role can execute
REVOKE ALL ON FUNCTION knowledge.search_corpus(vector, text, text, text, int, float) FROM PUBLIC;
REVOKE ALL ON FUNCTION knowledge.search_corpus(vector, text, text, text, int, float) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION knowledge.search_corpus(vector, text, text, text, int, float) TO service_role;