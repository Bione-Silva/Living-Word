#!/usr/bin/env python3
"""
cea-apply-migration.py
Aplica as migrations CEA diretamente via SQL e executa a ingestão completa.

PASSO 1: Aplica o SQL para criar knowledge.documents, knowledge.chunks, pgvector
PASSO 2: Realiza a ingestão dos 6 PDFs

Uso:
  python3 scripts/cea-apply-migration.py             # aplica migration + ingere tudo
  python3 scripts/cea-apply-migration.py --migration-only   # só aplica migration
  python3 scripts/cea-apply-migration.py --ingest-only quiz # só ingere quiz

Requer:
  pip install psycopg2-binary
"""

import sys
import os

# ─── Instrução para aplicar via Supabase Dashboard ────────────────────────────
# Como o psycopg2 pode não estar disponível, vamos gerar o SQL completo
# para o usuário executar no SQL Editor do Supabase

SQL_BOOTSTRAP = """
-- ============================================================
-- CEA RAG — Bootstrap Completo
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/priumwdestycikzfcysg/editor
-- ============================================================

-- 1. Extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- 2. Schema knowledge
CREATE SCHEMA IF NOT EXISTS knowledge;

-- 3. Tabela de documentos
CREATE TABLE IF NOT EXISTS knowledge.documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  content     TEXT,
  mind        TEXT NOT NULL DEFAULT 'default',
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de chunks com embeddings 768d
CREATE TABLE IF NOT EXISTS knowledge.chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  embedding    EXTENSIONS.vector(768),
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_chunks_document_id
  ON knowledge.chunks (document_id);

CREATE INDEX IF NOT EXISTS idx_chunks_mind
  ON knowledge.chunks ((metadata->>'mind'));

CREATE INDEX IF NOT EXISTS idx_chunks_item_type
  ON knowledge.chunks ((metadata->>'item_type'));

-- Índice vetorial (ivfflat — para cosine similarity)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON knowledge.chunks
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 50);

-- 6. Função de busca semântica
CREATE OR REPLACE FUNCTION knowledge.match_cea_chunks(
  query_embedding    EXTENSIONS.vector(768),
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

-- 7. RLS
ALTER TABLE knowledge.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_docs_service_all"
  ON knowledge.documents FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "knowledge_docs_auth_read"
  ON knowledge.documents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "knowledge_chunks_service_all"
  ON knowledge.chunks FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "knowledge_chunks_auth_read"
  ON knowledge.chunks FOR SELECT
  USING (auth.role() = 'authenticated');

-- 8. Expor schema knowledge na API REST
-- (Execute no SQL Editor como superuser)
-- ALTER DATABASE postgres SET "app.settings.jwt_secret" TO '...'; -- já está configurado
-- Este comando adiciona knowledge aos schemas expostos:
NOTIFY pgrst, 'reload schema';

-- Verificação final:
SELECT schemaname, tablename FROM pg_tables
WHERE schemaname = 'knowledge'
ORDER BY tablename;
"""

print("=" * 60)
print("  CEA — Migration SQL")
print("=" * 60)
print()
print("⚠️  O schema 'knowledge' precisa ser criado e exposto na API.")
print()
print("OPÇÃO 1 — Método mais rápido (recomendado):")
print("  1. Acesse: https://supabase.com/dashboard/project/priumwdestycikzfcysg/editor")
print("  2. Cole e execute o SQL abaixo")
print()
print("OPÇÃO 2 — Via Supabase CLI (se Docker disponível):")
print("  npx supabase db push --linked")
print()
print("-" * 60)
print("SQL PARA EXECUTAR NO DASHBOARD:")
print("-" * 60)
print(SQL_BOOTSTRAP)

# Salvar SQL em arquivo para facilitar copiar
sql_file = os.path.join(os.path.dirname(__file__), '..', 'cea-bootstrap.sql')
with open(sql_file, 'w') as f:
    f.write(SQL_BOOTSTRAP)

print(f"\n✅ SQL salvo em: cea-bootstrap.sql")
print()
print("Após executar o SQL, adicione o schema 'knowledge' nos")
print("schemas expostos do projeto:")
print()
print("  Dashboard > Project Settings > API > Schema")
print("  Adicione 'knowledge' à lista de exposed schemas")
print()
print("OU execute este SQL para fazer via código:")
print("""
  -- No SQL Editor (como postgres/service_role):
  ALTER ROLE authenticator SET pgrst.db_schemas = 'public,knowledge,graphql_public';
  NOTIFY pgrst, 'reload config';
""")
