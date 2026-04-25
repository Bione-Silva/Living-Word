#!/bin/bash
# Migra todas as Edge Functions do Lovable Gateway → OpenAI direto
# gpt-4o-mini em tudo, gpt-4o apenas em ai-tool (Sermões)

set -e
FUNCTIONS_DIR="$(dirname "$0")/../supabase/functions"

echo "🔄 Iniciando migração de Edge Functions para OpenAI direto..."
echo ""

migrate_function() {
  local file="$1"
  local fn_name
  fn_name=$(basename "$(dirname "$file")")

  # Pula funções que não usam o gateway legado
  if ! grep -q "ai.gateway.lovable\|LOVABLE_API_KEY" "$file"; then
    return
  fi

  echo "📝 Migrando: $fn_name"

  # 1. Substitui a URL do gateway pela API da OpenAI
  sed -i '' \
    's|https://ai\.gateway\.lovable\.dev/v1/chat/completions|https://api.openai.com/v1/chat/completions|g' \
    "$file"

  # 2. Substitui LOVABLE_API_KEY por OPENAI_API_KEY
  sed -i '' \
    "s|Deno\.env\.get('LOVABLE_API_KEY')|Deno.env.get('OPENAI_API_KEY')|g" \
    "$file"
  sed -i '' \
    's|Deno\.env\.get("LOVABLE_API_KEY")|Deno.env.get("OPENAI_API_KEY")|g' \
    "$file"
  sed -i '' \
    's|LOVABLE_API_KEY|OPENAI_API_KEY|g' \
    "$file"

  # 3. Normaliza variáveis que ainda se chamam lovableApiKey → openAIApiKey
  sed -i '' \
    's|const lovableApiKey|const openAIApiKey|g' \
    "$file"
  sed -i '' \
    's|lovableApiKey|openAIApiKey|g' \
    "$file"

  # 4. Troca modelos com prefixo "openai/" para o formato puro do OpenAI
  #    (o gateway aceita "openai/gpt-4o", a API direta só aceita "gpt-4o")
  sed -i '' \
    's|"openai/gpt-4o-mini"|"gpt-4o-mini"|g' \
    "$file"
  sed -i '' \
    's|"openai/gpt-4o"|"gpt-4o"|g' \
    "$file"
  sed -i '' \
    "s|'openai/gpt-4o-mini'|'gpt-4o-mini'|g" \
    "$file"
  sed -i '' \
    "s|'openai/gpt-4o'|'gpt-4o'|g" \
    "$file"

  # 5. Garante que qualquer modelo genérico seja gpt-4o-mini (exceto ai-tool que já tem gpt-4o)
  if [[ "$fn_name" != "ai-tool" ]]; then
    # Troca modelos alternativos que não sejam os nossos dois alvo
    sed -i '' \
      's|"gpt-4-turbo"|"gpt-4o-mini"|g' \
      "$file"
    sed -i '' \
      's|"gpt-4"|"gpt-4o-mini"|g' \
      "$file"
    sed -i '' \
      's|"gpt-3\.5-turbo"|"gpt-4o-mini"|g' \
      "$file"
  fi

  echo "   ✅ $fn_name migrado"
}

# Percorre todos os index.ts
find "$FUNCTIONS_DIR" -name "index.ts" | while read -r f; do
  migrate_function "$f"
done

echo ""
echo "🎉 Migração concluída!"
