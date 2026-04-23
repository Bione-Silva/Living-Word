#!/bin/bash
# Script de descriptografia e teste para o pipeline RAG do CEA

echo "Descriptografando PDFs (removendo proteção RC4 copy:no)..."

qpdf --decrypt "40 Parábolas de Jesus.pdf" "40_Parabolas_decrypted.pdf"
qpdf --decrypt "200 Personagens Bíblicos.pdf" "200_Personagens_decrypted.pdf"
qpdf --decrypt "Panorama Bíblico.pdf" "Panorama_Biblico_decrypted.pdf"
qpdf --decrypt "250 Quiz Bíblico.pdf" "250_Quiz_decrypted.pdf"

echo "PDFs descriptografados com sucesso. Por favor, faça o upload dos arquivos *_decrypted.pdf no bucket 'cea_knowledge_base'."

echo "--------------------------------------------------------"
echo "Comandos de teste cURL para Edge Functions:"
echo "--------------------------------------------------------"

# 1. Ingest
echo "# 1. Ingest 40 Parábolas"
echo "curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/cea-ingest-pdf' \\"
echo "  -H 'Authorization: Bearer [ANON_KEY]' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"fileName\": \"40_Parabolas_decrypted.pdf\", \"item_type\": \"parabola\", \"force_reingest\": false}'"
echo ""

# 2. Ingest Characters
echo "# 2. Ingest 200 Personagens"
echo "curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/cea-ingest-pdf' \\"
echo "  -H 'Authorization: Bearer [ANON_KEY]' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"fileName\": \"200_Personagens_decrypted.pdf\", \"item_type\": \"personagem\", \"force_reingest\": false}'"
echo ""

# 3. Search 
echo "# 3. Buscar 'Filho Pródigo' (Parábolas)"
echo "curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/cea-search' \\"
echo "  -H 'Authorization: Bearer [ANON_KEY]' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"query\": \"Filho Pródigo\", \"item_type\": \"parabola\"}'"
echo ""

# 4. Search
echo "# 4. Buscar 'Davi' (Personagens)"
echo "curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/cea-search' \\"
echo "  -H 'Authorization: Bearer [ANON_KEY]' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"query\": \"Davi pecado e arrependimento\", \"item_type\": \"personagem\"}'"
echo ""

echo "--------------------------------------------------------"
echo "Consultas SQL de verificação:"
echo "--------------------------------------------------------"
echo "1. Contagem de chunks agrupados por item_type:"
echo "SELECT metadata->>'item_type' AS item_type, count(*) "
echo "FROM knowledge.documents d "
echo "JOIN knowledge.chunks c ON c.document_id = d.id "
echo "WHERE d.mind = 'cea' "
echo "GROUP BY item_type;"
echo ""
echo "2. Verificar dados da busca diretamente no banco:"
echo "SELECT chunk_text, similarity "
echo "FROM match_cea_chunks((SELECT embedding FROM knowledge.chunks LIMIT 1), 'parabola', 5);"
