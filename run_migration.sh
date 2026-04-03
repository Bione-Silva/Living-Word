#!/bin/bash
# ============================================================
# Living Word — Executa a migração SQL no Supabase via API
# Rode: chmod +x run_migration.sh && ./run_migration.sh
# ============================================================

set -e

PROJECT_REF="priumwdestycikzfcysg"
ACCESS_TOKEN="sbp_731e6b92e13d0842c91aca79821b39489a176e93"
SQL_FILE="$(dirname "$0")/supabase/migrations/001_initial_schema.sql"

echo "🗄️  Executando migração SQL no Supabase..."
echo "   Projeto: $PROJECT_REF"
echo ""

# Ler o SQL do arquivo
SQL_CONTENT=$(cat "$SQL_FILE")

# Enviar via API Management do Supabase
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg q "$SQL_CONTENT" '{query: $q}')")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Migração executada com sucesso!"
  echo ""
  echo "Tabelas criadas:"
  echo "  ✓ users"
  echo "  ✓ user_editorial_profile"
  echo "  ✓ materials"
  echo "  ✓ editorial_queue"
  echo "  ✓ series"
  echo "  ✓ library_tags"
  echo "  ✓ generation_logs"
  echo "  ✓ admin_cost_snapshot"
  echo "  ✓ conversion_events"
  echo "  ✓ bible_commentary_embeddings (pgvector)"
  echo ""
  echo "🔒 RLS ativado em todas as tabelas"
  echo "⚡ Triggers e funções criados"
  echo ""
  echo "Próximo passo: conectar o Lovable ao Supabase!"
else
  echo "❌ Erro na migração (HTTP $HTTP_CODE)"
  echo "$BODY"
  echo ""
  echo "Se falhar, copie o conteúdo de:"
  echo "  $SQL_FILE"
  echo "E cole no SQL Editor do seu Supabase Dashboard:"
  echo "  https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
fi
