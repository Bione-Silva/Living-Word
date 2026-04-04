-- Habilitar a extensão pgvector para consultas RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela raiz para a Bíblia (para uso futuro ou cross-reference)
CREATE TABLE IF NOT EXISTS public.bible_verses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_name VARCHAR(50) NOT NULL,
    chapter_num INTEGER NOT NULL,
    verse_num INTEGER NOT NULL,
    verse_text TEXT NOT NULL
);

-- Tabela para armazenar os comentários dos Doutores e Historiadores (Mentes Brilhantes)
CREATE TABLE IF NOT EXISTS public.historical_commentaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_name VARCHAR(100) NOT NULL, -- Ex: 'Charles Spurgeon', 'Matthew Henry', 'Billy Graham'
    book_name VARCHAR(50) NOT NULL,
    chapter_num INTEGER,
    verse_num INTEGER,
    commentary_text TEXT NOT NULL,
    language VARCHAR(5) DEFAULT 'PT', -- Ex: 'PT', 'EN', 'ES'
    embedding VECTOR(1536), -- Vetor para OpenAI text-embedding-3-small/ada-002
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar um index HNSW no vetor para acelerar consultas de semelhança gigantes
CREATE INDEX IF NOT EXISTS historical_commentaries_embedding_idx ON public.historical_commentaries USING hnsw (embedding vector_cosine_ops);

-- Função plpgsql no Supabase para buscar comentários relevantes com base em um tema
CREATE OR REPLACE FUNCTION match_commentaries (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  author_name varchar,
  book_name varchar,
  commentary_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    historical_commentaries.author_name,
    historical_commentaries.book_name,
    historical_commentaries.commentary_text,
    1 - (historical_commentaries.embedding <=> query_embedding) AS similarity
  FROM historical_commentaries
  WHERE 1 - (historical_commentaries.embedding <=> query_embedding) > match_threshold
  ORDER BY historical_commentaries.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
