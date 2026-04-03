#!/bin/bash
# ============================================================
# Living Word — Download dos Repositórios de Referência IA
# Execute este script no seu terminal:
#   chmod +x download_referencias.sh && ./download_referencias.sh
# ============================================================

set -e

REFS_DIR="$(dirname "$0")/referencias_ia"
mkdir -p "$REFS_DIR"
cd "$REFS_DIR"

echo "🔽 Baixando repositórios de referência para inteligência bíblica..."
echo ""

# 1. Bible RAG — busca vetorial multilíngue da Bíblia
echo "📖 [1/4] calebyhan/bible-rag (RAG multilíngue)"
if [ ! -d "bible-rag" ]; then
  git clone --depth 1 https://github.com/calebyhan/bible-rag.git
else
  echo "   ✅ Já existe"
fi

# 2. Biblos — análise exegética em camadas (grego, léxicos, Pais da Igreja)
echo "📖 [2/4] biblos-app/biblos (Exegese em camadas)"
if [ ! -d "biblos" ]; then
  git clone --depth 1 https://github.com/dssjon/biblos.git
else
  echo "   ✅ Já existe"
fi

# 3. ai-Bible — MCP Server para buscar versículos sem alucinação
echo "📖 [3/4] AdbC99/ai-bible (MCP Server bíblico)"
if [ ! -d "ai-bible" ]; then
  git clone --depth 1 https://github.com/AdbC99/ai-bible.git
else
  echo "   ✅ Já existe"
fi

# 4. HolySpiritOS — Guardrails teológicos para agentes IA
echo "📖 [4/4] MaxSikorski/HolySpiritOS (Guardrails teológicos)"
if [ ! -d "HolySpiritOS" ]; then
  git clone --depth 1 https://github.com/MaxSikorski/HolySpiritOS.git
else
  echo "   ✅ Já existe"
fi

echo ""
echo "✅ Todos os repositórios baixados em: $REFS_DIR"
echo ""
echo "Próximo passo: analise os padrões desses repos e incorpore no Living Word."
echo "   - bible-rag/     → embeddings e busca vetorial"
echo "   - biblos/         → léxicos grego/hebraico"
echo "   - ai-bible/       → padrão MCP (tool use para busca bíblica)"
echo "   - HolySpiritOS/   → regras de guardrail teológico"
