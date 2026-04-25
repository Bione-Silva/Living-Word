-- ============================================================
-- CEA RAG — Migration Complementar
-- Living Word | BX4 Technology Solutions
-- Execute no Supabase SQL Editor APÓS a migration principal
-- ============================================================

-- 1. Garantir que o schema knowledge e pgvector existem
CREATE SCHEMA IF NOT EXISTS knowledge;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verificar/adicionar coluna embedding 768d em knowledge.chunks
-- (ajustar se o schema existente já tem outra dimensão)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'knowledge'
      AND table_name = 'chunks'
      AND column_name = 'embedding'
  ) THEN
    ALTER TABLE knowledge.chunks ADD COLUMN embedding vector(768);
  END IF;
END$$;

-- 3. Índice ivfflat para busca semântica eficiente
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge.chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- 4. Índice no metadata->mind para filtro eficiente
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_mind
  ON knowledge.chunks ((metadata->>'mind'));

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_item_type
  ON knowledge.chunks ((metadata->>'item_type'));

-- 5. Função RPC de busca semântica do CEA
-- Aceita filtro opcional de item_type para busca direcionada
CREATE OR REPLACE FUNCTION knowledge.match_cea_chunks(
  query_embedding    vector(768),
  match_threshold    float    DEFAULT 0.70,
  match_count        int      DEFAULT 6,
  filter_mind        text     DEFAULT 'cea',
  filter_item_type   text     DEFAULT NULL
)
RETURNS TABLE (
  id               uuid,
  document_id      uuid,
  document_title   text,
  content          text,
  metadata         jsonb,
  similarity       float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    d.title AS document_title,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM knowledge.chunks c
  JOIN knowledge.documents d ON d.id = c.document_id
  WHERE
    c.metadata->>'mind' = filter_mind
    AND (filter_item_type IS NULL OR c.metadata->>'item_type' = filter_item_type)
    AND 1 - (c.embedding <=> query_embedding) >= match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. Storage bucket para os PDFs do CEA
-- (executar via Supabase Dashboard > Storage se preferir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cea_knowledge_base',
  'cea_knowledge_base',
  false,                          -- privado
  52428800,                       -- 50MB por arquivo
  ARRAY['application/pdf']        -- apenas PDFs
)
ON CONFLICT (id) DO NOTHING;

-- 7. RLS no bucket: apenas service_role pode ler/escrever
CREATE POLICY "cea_storage_service_only"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'cea_knowledge_base'
  AND auth.role() = 'service_role'
);

-- 8. Verificação final
-- Execute para confirmar que está tudo certo:
/*
SELECT
  COUNT(*) as total_chunks,
  COUNT(DISTINCT document_id) as total_docs,
  metadata->>'mind' as mind,
  metadata->>'item_type' as item_type
FROM knowledge.chunks
GROUP BY mind, item_type
ORDER BY mind, item_type;
*/

-- Teste de busca semântica (substituir pelo embedding real):
/*
SELECT document_title, content, similarity
FROM knowledge.match_cea_chunks(
  '[0.1, 0.2, ...]'::vector(768),  -- embedding da query
  0.70,
  5,
  'cea',
  'parabola'
);
*/
