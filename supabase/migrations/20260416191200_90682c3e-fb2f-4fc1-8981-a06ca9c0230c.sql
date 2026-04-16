ALTER TABLE knowledge.chunks ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE knowledge.chunks ADD COLUMN IF NOT EXISTS embedding_model text;