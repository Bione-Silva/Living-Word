-- ============================================================
-- Migration: 018_elite_minds_knowledge.sql
-- Tabela de Conhecimento Profundo para o Squad of Elite (RAG)
-- ============================================================

-- Tabela para armazenar os fatias (chunks) de conteúdo dos clássicos
CREATE TABLE IF NOT EXISTS public.elite_mind_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mind_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_chunk TEXT NOT NULL,
  embedding vector(1536),              -- suporte para OpenAI text-embedding-3-small
  metadata JSONB DEFAULT '{}'::jsonb,  -- {sermon_no, bible_reference, score, volume}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.elite_mind_content ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública para usuários autenticados
CREATE POLICY "elite_mind_content_read" ON public.elite_mind_content
  FOR SELECT TO authenticated USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_elite_mind_content_mind ON public.elite_mind_content(mind_id);

-- Índice HNSW para busca vetorial rápida (opcional, dependendo do volume, IVFFLAT ou HNSW)
-- CREATE INDEX ON public.elite_mind_content USING hnsw (embedding vector_cosine_ops);

-- Função de Busca Semântica por Mind
CREATE OR REPLACE FUNCTION public.match_elite_knowledge(
  p_mind_id TEXT,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content_chunk TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    emc.id,
    emc.title,
    emc.content_chunk,
    emc.metadata,
    1 - (emc.embedding <=> p_query_embedding) AS similarity
  FROM public.elite_mind_content emc
  WHERE emc.mind_id = p_mind_id
    AND 1 - (emc.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY emc.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;
