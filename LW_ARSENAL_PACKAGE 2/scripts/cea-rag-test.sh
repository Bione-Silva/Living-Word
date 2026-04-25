#!/bin/bash
# CEA RAG — Scripts de Teste e Pré-processamento
# BX4 Technology Solutions | Living Word
# ============================================================

# ─── PRÉ-REQUISITO: Descriptografar PDFs ────────────────────
# Os PDFs têm proteção RC4 (copy:no). Executar antes do upload:
#
# Instalar qpdf (Mac):
#   brew install qpdf
#
# Instalar qpdf (Ubuntu/Debian):
#   apt-get install qpdf

echo "=== Descriptografando PDFs do CEA ==="

PDFS_DIR="./pdf-sources"
OUTPUT_DIR="./pdf-decrypted"
mkdir -p "$OUTPUT_DIR"

for pdf in "$PDFS_DIR"/*.pdf; do
  filename=$(basename "$pdf")
  output="$OUTPUT_DIR/$filename"

  echo "Processando: $filename"
  qpdf --decrypt "$pdf" "$output"

  if [ $? -eq 0 ]; then
    echo "  OK: $output"
  else
    echo "  ERRO: Falha ao descriptografar $filename"
  fi
done

echo ""
echo "PDFs prontos em: $OUTPUT_DIR"
echo "Agora faça upload manual no Supabase Storage > cea_knowledge_base"
echo ""

# ─── TESTE 1: Invocar ingestão via cURL ─────────────────────

echo "=== Exemplo de chamada para cea-ingest-pdf ==="

SUPABASE_URL="https://SEU_PROJECT_REF.supabase.co"
SUPABASE_ANON_KEY="SUA_ANON_KEY"  # ou service_role_key

cat << 'CURL_EXAMPLE'

# Ingerir PDF das Parábolas
curl -X POST \
  "$SUPABASE_URL/functions/v1/cea-ingest-pdf" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "parabolas/40_parabolas_decrypted.pdf",
    "item_type": "parabola",
    "title": "40 Parábolas de Jesus",
    "force_reingest": false
  }'

# Resposta esperada:
# {
#   "success": true,
#   "document_id": "uuid-aqui",
#   "chunks_created": 187,
#   "total_chars": 124500,
#   "message": "Ingestão concluída: 187 chunks de \"40 Parábolas de Jesus\" indexados com sucesso."
# }

# ─── TESTE 2: Ingerir os 200 Personagens ────────────────────

curl -X POST \
  "$SUPABASE_URL/functions/v1/cea-ingest-pdf" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "personagens/200_personagens_decrypted.pdf",
    "item_type": "personagem",
    "title": "200 Personagens Bíblicos"
  }'

# ─── TESTE 3: Ingerir o Panorama ────────────────────────────

curl -X POST \
  "$SUPABASE_URL/functions/v1/cea-ingest-pdf" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "panorama/panorama_biblico_decrypted.pdf",
    "item_type": "livro",
    "title": "Panorama Bíblico — 66 Livros"
  }'

# ─── TESTE 4: Busca semântica após ingestão ─────────────────

curl -X POST \
  "$SUPABASE_URL/functions/v1/cea-search" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Filho Pródigo perdão e restauração",
    "item_type": "parabola",
    "top_k": 5,
    "similarity_threshold": 0.70
  }'

# Resposta esperada (parcial):
# {
#   "query": "Filho Pródigo perdão e restauração",
#   "total_results": 5,
#   "results": [
#     {
#       "chunk_id": "...",
#       "content": "A Parábola do Filho Pródigo se passa em...",
#       "similarity": 0.891,
#       "item_type": "parabola",
#       "document_title": "40 Parábolas de Jesus",
#       "page_estimate": 12
#     },
#     ...
#   ]
# }

CURL_EXAMPLE

# ─── VERIFICAÇÃO no SQL Editor ──────────────────────────────

cat << 'SQL_CHECKS'

-- Verificar chunks criados por documento
SELECT
  d.title,
  d.metadata->>'item_type' as tipo,
  COUNT(c.id) as total_chunks,
  AVG(LENGTH(c.content))::int as media_chars_por_chunk,
  MIN(c.metadata->>'page_estimate')::int as pagina_inicio,
  MAX(c.metadata->>'page_estimate')::int as pagina_fim
FROM knowledge.documents d
JOIN knowledge.chunks c ON c.document_id = d.id
WHERE d.metadata->>'mind' = 'cea'
GROUP BY d.id, d.title, d.metadata->>'item_type'
ORDER BY d.title;

-- Verificar se embeddings foram gerados (não devem ser NULL)
SELECT
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as com_embedding,
  COUNT(*) FILTER (WHERE embedding IS NULL) as sem_embedding,
  COUNT(*) as total
FROM knowledge.chunks c
JOIN knowledge.documents d ON d.id = c.document_id
WHERE d.metadata->>'mind' = 'cea';

SQL_CHECKS

echo "Scripts prontos."
