# LW Arsenal Package
## Living Word — CEA Intelligence Layer
**BX4 Technology Solutions | Versão 1.0 | Abril 2026**

---

## O QUE É ESTE PACOTE

Tudo que o Antigravity precisa para implementar o
**Centro de Estudos Avançados (CEA)** no Living Word.

Gerado em sessão Claude + Bione Silva, Abril 2026.

---

## ESTRUTURA

```
LW_ARSENAL_PACKAGE/
│
├── .antigravity/
│   ├── agents-registry.json          ← Registry de todos os 9 agentes
│   ├── CLAUDE_CEA_ADDON.md           ← Adicionar ao CLAUDE.md do repo
│   └── skills/
│       ├── cea-orchestrator/SKILL.md     ← Agente roteador principal
│       ├── lw-parables-agent/SKILL.md    ← 40 Parábolas
│       ├── lw-characters-agent/SKILL.md  ← 200 Personagens
│       ├── lw-panorama-agent/SKILL.md    ← 66 Livros
│       ├── lw-bible-research/SKILL.md    ← Grego/Hebraico/Aramaico
│       ├── lw-sermon-agent/SKILL.md      ← Gerador de sermões
│       ├── lw-social-studio/SKILL.md     ← Carrosséis + Social
│       ├── lw-quiz-agent/SKILL.md        ← Quiz gamificado
│       └── lw-devotional/SKILL.md        ← Palavra Amiga trilíngue
│
├── supabase/
│   ├── functions/
│   │   ├── cea-ingest-pdf/index.ts   ← Pipeline RAG (Gemini 768d)
│   │   └── cea-search/index.ts       ← Busca semântica unificada
│   └── migrations/
│       ├── 20260421_lw_bible_content.sql  ← Tabelas base (9 tabelas)
│       └── 20260422_cea_rag_complement.sql ← pgvector + RPC functions
│
├── scripts/
│   ├── ingest-bible-content.js  ← Popula Supabase com os 4 PDFs
│   ├── cea-rag-test.sh          ← Testa o pipeline + descriptografa PDFs
│   └── pdf-sources/             ← Colocar os PDFs descriptografados aqui
│
└── docs/
    ├── CEA_ANTIGRAVITY_INSTRUCAO_MESTRE.md  ← Instrução completa 7 blocos
    ├── LW_PDF_Arsenal_Master.md             ← Schema + ingestão dos PDFs
    └── LW_SKILLS_AGENTS_MASTER.md          ← Visão geral da arquitetura

```

---

## ORDEM DE EXECUÇÃO

### Passo 1 — Preparar PDFs (local, antes de tudo)
```bash
brew install qpdf   # Mac
# ou: apt-get install qpdf

# Descriptografar os 4 PDFs (têm proteção RC4)
qpdf --decrypt 40_Para_bolas_de_JEsus.pdf         scripts/pdf-sources/parabolas.pdf
qpdf --decrypt 200_PERSONAGENS_BI_BLICOS.pdf       scripts/pdf-sources/personagens.pdf
qpdf --decrypt Panorama_Bi_blico.pdf               scripts/pdf-sources/panorama.pdf
qpdf --decrypt 250_quiz_bi_blico.pdf               scripts/pdf-sources/quiz.pdf
```

### Passo 2 — Database
```sql
-- No Supabase SQL Editor, executar nesta ordem:
-- 1. supabase/migrations/20260421_lw_bible_content.sql
-- 2. supabase/migrations/20260422_cea_rag_complement.sql
```

### Passo 3 — Deploy Edge Functions
```bash
supabase functions deploy cea-ingest-pdf
supabase functions deploy cea-search
```

### Passo 4 — Upload PDFs no Storage
```
Supabase Dashboard > Storage > New Bucket: cea_knowledge_base (private)
Upload os 4 PDFs descriptografados
```

### Passo 5 — Ingestão RAG
```bash
# Invocar para cada PDF (ver cea-rag-test.sh para cURLs completos)
curl -X POST .../functions/v1/cea-ingest-pdf \
  -d '{"file_path":"parabolas.pdf","item_type":"parabola","title":"40 Parábolas de Jesus"}'

curl -X POST .../functions/v1/cea-ingest-pdf \
  -d '{"file_path":"personagens.pdf","item_type":"personagem","title":"200 Personagens Bíblicos"}'

curl -X POST .../functions/v1/cea-ingest-pdf \
  -d '{"file_path":"panorama.pdf","item_type":"livro","title":"Panorama Bíblico"}'

curl -X POST .../functions/v1/cea-ingest-pdf \
  -d '{"file_path":"quiz.pdf","item_type":"quiz","title":"250 Quiz Bíblico"}'
```

### Passo 6 — Instalar Skills no repositório
```bash
# No repo living-word-8c0451d6, a partir da raiz:
cp -r .antigravity/ ./   # copia pasta inteira para o repo

# Adicionar ao CLAUDE.md existente:
cat .antigravity/CLAUDE_CEA_ADDON.md >> CLAUDE.md
```

### Passo 7 — Verificação
```sql
-- Verificar ingestão
SELECT metadata->>'item_type', COUNT(*) as chunks
FROM knowledge.chunks
WHERE metadata->>'mind' = 'cea'
GROUP BY metadata->>'item_type';

-- Resultado esperado:
-- parabola  | ~180 chunks
-- personagem| ~420 chunks
-- livro     | ~380 chunks
-- quiz      | ~80 chunks
```

---

## VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Adicionar ao `.env.local` e aos secrets do Supabase:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...           # para embeddings (text-embedding-004)
OPENAI_API_KEY=...           # para GPT-4o (estudos e sermões)
```

---

## CONTEÚDO DOS PDFs INGERIDOS

| PDF | Tipo | Chunks est. | Conteúdo |
|-----|------|-------------|----------|
| 40 Parábolas de Jesus | parabola | ~180 | Contexto histórico, grego, AT, mensagem, lições |
| 200 Personagens Bíblicos | personagem | ~420 | Biografia, período, lições, conexões |
| Panorama Bíblico (66 livros) | livro | ~380 | Autor, data, propósito, mensagem central |
| 250 Quiz Bíblico | quiz | ~80 | Perguntas, respostas, categorias |

---

## AGENTES — VISÃO RÁPIDA

| Agente | Modelo | Função |
|--------|--------|--------|
| cea-orchestrator | gpt-4o | Roteia para agente correto |
| lw-parables-agent | gpt-4o | Estuda as 40 parábolas |
| lw-characters-agent | gpt-4o | Estuda 200 personagens |
| lw-panorama-agent | gpt-4o | Panorama dos 66 livros |
| lw-bible-research | gpt-4o | Análise do original grego/heb |
| lw-sermon-agent | gpt-4o | Gera sermões completos |
| lw-social-studio | gemini-2.5-flash | Carrosséis + social |
| lw-quiz-agent | gpt-4o-mini | Quiz gamificado |
| lw-devotional | gpt-4o | Palavra Amiga trilíngue |

---

*BX4 Technology Solutions | Living Word Platform*
*github.com/Bione-Silva/living-word-8c0451d6*
