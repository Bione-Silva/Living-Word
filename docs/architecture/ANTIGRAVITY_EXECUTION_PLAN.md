# ANTIGRAVITY PLANO DE EXECUÇÃO — LIVING WORD

Este documento define o plano operacional do AI Antigravity para consolidar e executar a plataforma Living Word. 

---

## 1. ESTRUTURA DE DIRETÓRIOS RECOMENDADA

A estrutura de monorepo foi desenhada visando independência de serviços e clareza na manutenção do projeto SaaS completo:

```text
living-word/
├── apps/
│   ├── web/                     # Frontend em Next.js (Dashboard, UX)
│   ├── api/                     # Backend API Core em FastAPI/Supabase
│   ├── worker-orchestrator/     # Serviço Maestro em background
│   ├── worker-media/            # Serviços assíncronos (fal.ai, whisper)
│   └── worker-indexer/          # Pipelines de Ingestão e Vetorização
├── services/
│   ├── orchestrator-service/
│   ├── theology-service/
│   ├── devotional-service/
│   ├── sermon-service/
│   ├── seo-content-service/
│   ├── pastoral-insight-service/
│   ├── publishing-service/
│   ├── analytics-service/
│   └── billing-service/         # Integração Stripe/Créditos
├── packages/
│   ├── agent-prompts/           # Prompts dos agentes estruturados
│   ├── shared-types/            # Tipos globais (TS/Python)
│   ├── ui-components/           # Component design system
│   ├── skills/                  # Funções e scripts unificados das tools
│   └── connectors/              # Bridges OAuth e ERP
├── data/
│   ├── bible/
│   │   ├── scrollmapper/
│   │   ├── translations/
│   │   └── crossrefs/
│   ├── lexicons/
│   │   └── strongs/
│   ├── classics/
│   │   └── spurgeon/
│   └── theology/
│       ├── theologai-cache/
│       └── kjvstudy-cache/
├── ingestion/
│   ├── github_etl/
│   ├── vectorization/
│   ├── cleaning/
│   └── indexing/
├── agents/
│   ├── ceo/                     # Onde vive o Maestro Central
│   ├── theology/
│   ├── pastoral/
│   ├── growth/
│   └── engineering/
└── docs/
    ├── architecture/
    ├── prompts/
    ├── routing-rules/
    └── schemas/
```

---

## 2. ORDEM DE EXECUÇÃO (Phases)

Este é o cronograma de ação do Antigravity.

### Fase 1 — Fundação Base
1. Inicializar estrutura do monorepo acima.
2. Criar instâncias/schemas de banco de dados (PostgreSQL + pgvector).
3. Configurar Storage para mídia/PDFs.
4. Definir migrações/schemas para `verses`, `lexicon_entries`, `sermon_corpus`, `media_assets`, etc.

### Fase 2 — ETL & Ingestão da Base de Dados
1. Importar JSONs/estruturas do `scrollmapper/bible_databases`.
2. Processar e estruturar `openscriptures/strongs`.
3. Inserir `spurgeon-gems` na base para RAG orgânico.
4. Vetorizar sermões anteriores, comentários e manuscritos locais (O livro de Regras/Documentos).
5. Estabelecer hooks para conectar-se ao `TheologAI` e sistema de consultas leves no `bible-mcp`.

### Fase 3 — Deploy dos Agentes (Os Operários)
1. Iniciar o processo "Maestro Living Word".
2. Registrar e acender os agentes centrais:
   - Guardião Teológico
   - Hermeneutic Master
   - Bibliographic Data Scientist
   - Study Bible Compiler
   - Radar do Rebanho
   - GEO / pSEO

### Fase 4 — Entrega dos Produtos Visuais
1. Habilitar rota `Devocional Diário`.
2. Lançar o produto `Estúdio de Sermão` na UI.
3. Consolidar canal `Blog SEO` com postador embutido.
4. Criar views de geração de `Carrossel e Snippets Locais`.
5. Fechar "My Workspace" do Pastor. 

### Fase 5 — Validação QA e Pontuação
1. Plugar o pipeline externo `agentic-sermon-review`.
2. Integrar regras rigorosas de "Fidelidade Bíblica" e "Risco Teológico".
3. Lançar algoritmo/score que qualifica se um sermão ou post está seguro para publicação.

### Fase 6 — Expansão Mídia e Live
1. Integrar `sermon-ai-audio-processor` e `fal-audio/imagen` nas views de pos-culto.
2. Injetar ux reference do `Ministry_Ai_Hub`.
3. Validar arquitetura `Rhema` (captura na live) como projeto de Q3/Q4.

---

## 3. REGRAS DE ROTEAMENTO DO MAESTRO

A engine principal do Maestro decidirá a matriz de fluxo da seguinte forma:

- **Se o Produto demandado = `Devocional`:**
  - `Ativa:` Radar do Rebanho → Bibliographic Data Scientist → Hermeneutic Master → Guardião Teológico → beautiful-prose.
  
- **Se o Produto demandado = `Sermão Completo`:**
  - `Ativa:` Sermon Workflow → Bibliographic Data Scientist → Topical Journey Mapper → Study Bible Compiler → Hermeneutic Master → Guardião Teológico → agentic-sermon-review.

- **Se o Produto demandado = `Estudo Bíblico`:**
  - `Ativa:` TheologAI / kjvstudy / bible-mcp → canonical-indexer / ontology-cross-referencer → Study Bible Compiler.

- **Se o Produto demandado = `Blog ou Post SEO`:**
  - `Ativa:` apify-trend-analysis → GEO Authority Agent → pSEO Ingestor → copywriting → clarity-gate → Guardião Teológico.

- **Se o Produto demandado = `Carrossel/Mídia de Culto Local`:**
  - `Ativa:` sermon-ai-audio-processor → copywriting → imagen / fal-image-edit → auto-social-poster.

- **Se a tarefa for Infra ou Correção (Manutenção):**
  - `Ativa:` PM/PO, Architect, Data Engineer, QA.
