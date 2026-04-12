#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}🚀 Iniciando Deploy do Pipeline de Devocional Autônomo...${NC}"

# 1. Configurar Secret do Gemini (necessário para Texto, Imagem e Áudio)
echo "🔑 Configurando GEMINI_API_KEY no Supabase..."
supabase secrets set GEMINI_API_KEY="AIzaSyBrJEuwwcdnM50gMbeTBFgrvt8galq771U"

# 2. Deploy das funções
echo "📤 Fazendo deploy da função de geração (batch)..."
supabase functions deploy generate-devotional-batch

echo "📤 Fazendo deploy da função de busca (get-today)..."
supabase functions deploy get-devotional-today

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo "Agora o devocional de amanhã será gerado automaticamente com Texto, Imagem e os 3 Áudios."
