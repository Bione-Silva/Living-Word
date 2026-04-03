# LIVING WORD — Sprint 1 · Antigravity Implementation Prompt
## 3 Edge Functions + Supabase Schema

---

Você é o Antigravity, meu agente de engenharia backend. Vamos implementar o Sprint 1 completo da plataforma **Living Word** — um copiloto pastoral trilíngue (PT/EN/ES) com motor de geração de conteúdo cristão e publicação automatizada.

Implemente tudo na ordem exata abaixo. Não pule etapas. Após cada bloco, aguarde confirmação antes de continuar.

---

## CONTEXTO DO PROJETO

**Living Word** (Palavra Viva / Palabra Viva) é uma plataforma SaaS com duas frentes:

- **Frente A — Estúdio Pastoral:** o pastor fornece uma passagem bíblica + público + dor do momento e recebe 6 formatos (sermão, esboço, devocional, reels, bilíngue, célula)
- **Frente B — Motor de Conteúdo:** geração de artigos devocionais e de blog cristão por categoria, com publicação automática em WordPress

**Stack:**
- Frontend: React + Tailwind + shadcn/ui (Lovable — separado, conecta via API)
- Backend: Supabase (Postgres + Edge Functions Deno + Auth + RLS)
- IA: OpenAI API — modelo `gpt-4o-mini` (variável de ambiente `LLM_MODEL`)
- Bible APIs: wldeh/bible-api (PT), API.Bible (EN), ApiBiblia (ES)
- Publishing: WordPress REST API
- Pagamento: Stripe (Sprint 3)

**Repositório GitHub:** `bx4usa-boamargem/livingword` (criar se não existir)

---

## BLOCO 1 — SCHEMA SUPABASE

Crie todas as tabelas com RLS habilitado. Execute no SQL Editor do Supabase.

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =============================================
-- TABELA: users (extensão do auth.users)
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pastoral','church','ministry')),
  language_preference TEXT NOT NULL DEFAULT 'PT' CHECK (language_preference IN ('PT','EN','ES')),
  doctrine_preference TEXT DEFAULT 'evangelical_general',
  pastoral_voice TEXT DEFAULT 'welcoming',
  bible_version TEXT DEFAULT 'ARA',
  generation_count_month INTEGER NOT NULL DEFAULT 0,
  generation_reset_date DATE NOT NULL DEFAULT date_trunc('month', NOW()),
  blog_url TEXT,
  handle TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: user_editorial_profile
-- =============================================
CREATE TABLE public.user_editorial_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tone TEXT DEFAULT 'welcoming',
  depth TEXT DEFAULT 'intermediate' CHECK (depth IN ('introductory','intermediate','deep')),
  writing_style TEXT DEFAULT 'narrative',
  preferred_length TEXT DEFAULT 'medium' CHECK (preferred_length IN ('short','medium','long')),
  publish_frequency TEXT DEFAULT 'weekly',
  priority_themes TEXT[] DEFAULT '{}',
  active_sites JSONB DEFAULT '[]',
  -- Estrutura de active_sites:
  -- [{ "url": "https://joao.livingword.app", "name": "Blog de João",
  --    "wp_rest_url": "...", "wp_username": "...",
  --    "wp_app_password_encrypted": "...", "language": "PT" }]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: materials
-- =============================================
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('pastoral','blog','devotional','evangelistic','series')),
  language TEXT NOT NULL CHECK (language IN ('PT','EN','ES')),
  bible_passage TEXT,
  audience TEXT,
  pain_point TEXT, -- não indexado para busca pública (dados sensíveis)
  doctrine_line TEXT,
  pastoral_voice TEXT,
  bible_version TEXT,
  category TEXT,
  -- Frente A
  output_sermon TEXT,
  output_outline TEXT,
  output_devotional TEXT,
  output_reels JSONB, -- array de 5 frases
  output_bilingual TEXT,
  output_cell TEXT,
  -- Frente B
  output_blog TEXT,
  article_title TEXT,
  meta_description TEXT,
  seo_slug TEXT,
  tags TEXT[],
  word_count INTEGER,
  -- Auditoria teológica
  theology_layer_marked BOOLEAN DEFAULT FALSE,
  citation_audit JSONB DEFAULT '{}',
  -- {"direct_quotes": 3, "paraphrases": 2, "allusions": 1, "bible_version_used": "ARA"}
  sensitive_topic_detected TEXT,
  generation_time_ms INTEGER,
  -- Publicação
  is_published BOOLEAN DEFAULT FALSE,
  published_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: editorial_queue
-- =============================================
CREATE TABLE public.editorial_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  target_site_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','scheduled','published','archived')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_url TEXT,
  wp_post_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: series
-- =============================================
CREATE TABLE public.series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT,
  passages TEXT[] DEFAULT '{}',
  total_weeks INTEGER DEFAULT 4,
  language TEXT DEFAULT 'PT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: library_tags
-- =============================================
CREATE TABLE public.library_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  tag TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: generation_logs (billing + observabilidade)
-- =============================================
CREATE TABLE public.generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id),
  language TEXT,
  mode TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  generation_time_ms INTEGER,
  llm_model TEXT DEFAULT 'gpt-4o-mini',
  theology_guardrails_triggered BOOLEAN DEFAULT FALSE,
  sensitive_topic_detected TEXT,
  error_code TEXT,
  -- Custo calculado: input_tokens * 0.00000015 + output_tokens * 0.0000006
  cost_usd NUMERIC(10,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: admin_cost_snapshot (snapshot diário)
-- =============================================
CREATE TABLE public.admin_cost_snapshot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL UNIQUE,
  users_free INTEGER DEFAULT 0,
  users_pastoral INTEGER DEFAULT 0,
  users_church INTEGER DEFAULT 0,
  users_ministry INTEGER DEFAULT 0,
  total_mrr NUMERIC(10,2) DEFAULT 0,
  total_api_cost NUMERIC(10,4) DEFAULT 0,
  total_margin NUMERIC(10,2) DEFAULT 0,
  tokens_input_total BIGINT DEFAULT 0,
  tokens_output_total BIGINT DEFAULT 0,
  conversion_rate_free_to_paid NUMERIC(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_materials_user_id ON public.materials(user_id);
CREATE INDEX idx_materials_created_at ON public.materials(created_at DESC);
CREATE INDEX idx_editorial_queue_user_status ON public.editorial_queue(user_id, status);
CREATE INDEX idx_generation_logs_user_date ON public.generation_logs(user_id, created_at DESC);
CREATE INDEX idx_generation_logs_cost ON public.generation_logs(cost_usd);

-- =============================================
-- RLS — ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_editorial_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_cost_snapshot ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário acessa apenas seus próprios dados
CREATE POLICY "users_own" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "profile_own" ON public.user_editorial_profile
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "materials_own" ON public.materials
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "queue_own" ON public.editorial_queue
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "series_own" ON public.series
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "tags_own" ON public.library_tags
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "logs_own" ON public.generation_logs
  FOR ALL USING (auth.uid() = user_id);

-- admin_cost_snapshot: apenas service_role (painel admin)
CREATE POLICY "admin_only" ON public.admin_cost_snapshot
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- TRIGGER: criar users row ao registrar
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, language_preference)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'language', 'PT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: reset mensal de gerações
-- =============================================
CREATE OR REPLACE FUNCTION public.reset_monthly_generations()
RETURNS void AS $$
UPDATE public.users
SET generation_count_month = 0,
    generation_reset_date = date_trunc('month', NOW())
WHERE generation_reset_date < date_trunc('month', NOW());
$$ LANGUAGE sql SECURITY DEFINER;

-- Cron: roda dia 1 de cada mês às 00:00 UTC
SELECT cron.schedule('reset-monthly-gens', '0 0 1 * *', 'SELECT public.reset_monthly_generations()');
```

**Confirme que o schema foi criado sem erros antes de continuar.**

---

## BLOCO 2 — VARIÁVEIS DE AMBIENTE

Configure no Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=<sua_chave_openai>
APIBIBLE_KEY=<chave_scripture_api_bible>
ESV_API_KEY=<chave_esv_api>
APIBIBLIA_KEY=<chave_apibiblia>
SUPABASE_URL=<url_do_projeto>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

**Nunca commitar essas chaves no repositório. Nunca expor ao frontend.**

---

## BLOCO 3 — EDGE FUNCTION: `fetch-bible-verse`

Crie o arquivo: `supabase/functions/fetch-bible-verse/index.ts`

Esta é uma função de uso **interno** — chamada pelas funções de geração, não exposta diretamente ao frontend.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

type BibleVersion = "ARA" | "ACF" | "NVI-PT" | "NIV" | "ESV" | "NLT" | "KJV" | "RVR60" | "NVI-ES" | "DHH"

interface VerseResult {
  text: string
  source: string
  version: BibleVersion
  is_official: boolean // false = gerado pelo modelo (NVI-PT)
}

// Converte "João 15:1-8" para formato de API
function normalizePassage(passage: string, format: "wldeh" | "esv" | "apibible" | "apibiblia"): string {
  // João → JHN, Mateus → MAT, etc.
  const bookMap: Record<string, string> = {
    "gênesis": "GEN", "genesis": "GEN",
    "êxodo": "EXO", "exodo": "EXO",
    "salmos": "PSA", "salmo": "PSA",
    "provérbios": "PRO", "proverbios": "PRO",
    "isaías": "ISA", "isaias": "ISA",
    "jeremias": "JER",
    "mateus": "MAT", "matthew": "MAT",
    "marcos": "MRK", "mark": "MRK",
    "lucas": "LUK", "luke": "LUK",
    "joão": "JHN", "joao": "JHN", "john": "JHN",
    "atos": "ACT", "acts": "ACT",
    "romanos": "ROM", "romans": "ROM",
    "1 coríntios": "1CO", "1 corintios": "1CO",
    "2 coríntios": "2CO", "2 corintios": "2CO",
    "gálatas": "GAL", "galatas": "GAL",
    "efésios": "EPH", "efesios": "EPH",
    "filipenses": "PHP",
    "colossenses": "COL",
    "1 tessalonicenses": "1TH",
    "2 tessalonicenses": "2TH",
    "1 timóteo": "1TI", "1 timoteo": "1TI",
    "2 timóteo": "2TI", "2 timoteo": "2TI",
    "tito": "TIT",
    "hebreus": "HEB", "hebrews": "HEB",
    "tiago": "JAS", "james": "JAS",
    "1 pedro": "1PE", "1 peter": "1PE",
    "2 pedro": "2PE", "2 peter": "2PE",
    "1 joão": "1JN", "1 joao": "1JN",
    "apocalipse": "REV", "revelation": "REV"
  }

  const lower = passage.toLowerCase().trim()
  let bookCode = ""
  let ref = ""

  for (const [book, code] of Object.entries(bookMap)) {
    if (lower.startsWith(book)) {
      bookCode = code
      ref = passage.slice(book.length).trim()
      break
    }
  }

  if (!bookCode) return passage

  if (format === "esv") return `${bookCode} ${ref}`
  if (format === "apibiblia") return passage // usa referência natural
  if (format === "apibible") return `${bookCode}.${ref.replace(":", ".").replace("-", "-${bookCode}.")}`
  return passage
}

async function fetchFromWldeh(passage: string, lang: "pt_AA" | "pt_ACF"): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(passage)
    const res = await fetch(
      `https://cdn.jsdelivr.net/gh/wldeh/bible-api@main/bibles/${lang}/books/john/chapters/15/verses/1.json`
      // Nota: implementar parsing completo de passagens no Antigravity
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.text ?? null
  } catch {
    return null
  }
}

async function fetchFromESV(passage: string): Promise<string | null> {
  try {
    const key = Deno.env.get("ESV_API_KEY")
    if (!key) return null
    const encoded = encodeURIComponent(normalizePassage(passage, "esv"))
    const res = await fetch(
      `https://api.esv.org/v3/passage/text/?q=${encoded}&include-headings=false&include-footnotes=false&include-verse-numbers=true`,
      { headers: { "Authorization": `Token ${key}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.passages?.[0] ?? null
  } catch {
    return null
  }
}

async function fetchFromApiBiblia(passage: string, version: "rvr60" | "nvi"): Promise<string | null> {
  try {
    const key = Deno.env.get("APIBIBLIA_KEY")
    if (!key) return null
    const encoded = encodeURIComponent(passage)
    const res = await fetch(
      `https://api.apibiblia.com/v1/passage?ref=${encoded}&version=${version}`,
      { headers: { "X-API-Key": key } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.text ?? null
  } catch {
    return null
  }
}

export async function fetchBibleVerse(
  passage: string,
  version: BibleVersion,
  _language: string
): Promise<VerseResult | null> {
  let text: string | null = null
  let source = version
  let is_official = true

  switch (version) {
    case "ARA":
      text = await fetchFromWldeh(passage, "pt_AA")
      break
    case "ACF":
      text = await fetchFromWldeh(passage, "pt_ACF")
      break
    case "NVI-PT":
      // Sem API pública legal — o modelo usa conhecimento de treinamento
      is_official = false
      source = "NVI-PT (estilo — sem licença comercial ativa)"
      return { text: "", source, version, is_official }
    case "ESV":
      text = await fetchFromESV(passage)
      break
    case "RVR60":
      text = await fetchFromApiBiblia(passage, "rvr60")
      break
    case "NVI-ES":
      text = await fetchFromApiBiblia(passage, "nvi")
      break
    default:
      // NIV, NLT, KJV, DHH — via API.Bible (implementar com APIBIBLE_KEY)
      is_official = false
      break
  }

  if (!text) return null
  return { text, source, version, is_official }
}

// Handler HTTP (para testes diretos)
serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const { passage, version, language } = await req.json()
  if (!passage || !version) {
    return new Response(JSON.stringify({ error: "passage and version required" }), { status: 400 })
  }

  const result = await fetchBibleVerse(passage, version, language ?? "PT")
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  })
})
```

---

## BLOCO 4 — EDGE FUNCTION: `generate-pastoral-material`

Crie o arquivo: `supabase/functions/generate-pastoral-material/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://esm.sh/openai@4"
import { fetchBibleVerse } from "../fetch-bible-verse/index.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! })

const PLAN_LIMITS: Record<string, number> = {
  free: 5, pastoral: 40, church: 200, ministry: 500
}

const SENSITIVE_KEYWORDS: Record<string, string[]> = {
  PT: ["depressão","depressao","trauma","abuso","violência","violencia","documentos","deportação","deportacao","suicídio","suicidio","luto","separação","separacao","ansiedade"],
  EN: ["depression","trauma","abuse","violence","documents","deportation","suicide","grief","separation","anxiety"],
  ES: ["depresión","depresion","trauma","abuso","violencia","documentos","deportación","deportacion","suicidio","duelo","separación","separacion","ansiedad"]
}

function detectSensitiveTopics(text: string, language = "PT"): string[] {
  const lower = text.toLowerCase()
  const keywords = SENSITIVE_KEYWORDS[language] ?? SENSITIVE_KEYWORDS.PT
  return keywords.filter(k => lower.includes(k))
}

function buildPromptMaster(params: {
  language: string
  doctrine_line: string
  pastoral_voice: string
  bible_version: string
  audience: string
  pain_point: string
  bible_passage: string
  verse_text: string
  sensitive_topics: string[]
  output_modes: string[]
}): string {
  const sensitiveBlock = params.sensitive_topics.length > 0
    ? `\nSENSITIVE CONTEXT DETECTED: ${params.sensitive_topics.join(", ")}\nActivate CAUTION MODE: use welcoming tone only, never prescriptive, never give legal/clinical advice, add note recommending qualified pastoral or professional support.\n`
    : ""

  const sectionsRequested = params.output_modes.map(m => {
    const labels: Record<string, string> = {
      sermon: "=== SERMÃO / SERMON / SERMÓN ===",
      outline: "=== ESBOÇO / OUTLINE / ESQUEMA ===",
      devotional: "=== DEVOCIONAL ===",
      reels: "=== REELS (5 frases) ===",
      bilingual: "=== VERSÃO BILÍNGUE ===",
      cell: "=== CULTO / CÉLULA ==="
    }
    return labels[m] ?? ""
  }).filter(Boolean).join("\n")

  return `You are a pastoral theological AI copilot for Living Word platform. Your role is to help pastors and Christian leaders prepare faithful, clear, and applicable biblical material.

Respond in ${params.language}. Generate content that sounds like a native pastoral voice — NOT a translation, NOT generic AI.

INVIOLABLE RULES:
1. Every generation begins: passage → literary context → historical context → interpretation → application
2. Always distinguish with tags: [TEXT] | [INTERPRETATION] | [APPLICATION]
3. NEVER invent Bible verses. If unsure of any reference, omit it entirely.
4. If application exceeds what the text supports: add ⚠️ AVISO PASTORAL / PASTORAL WARNING
5. All Bible quotes must use version: ${params.bible_version}
6. Mark each citation: [CITAÇÃO DIRETA / DIRECT QUOTE] | [PARÁFRASE / PARAPHRASE] | [ALUSÃO / ALLUSION]
7. Doctrinal line: ${params.doctrine_line}
8. Pastoral voice and style: ${params.pastoral_voice}
${sensitiveBlock}
PASSAGE: ${params.bible_passage}
VERSE TEXT (${params.bible_version}): ${params.verse_text || "(buscar no próprio conhecimento, marcar como PARÁFRASE)"}
AUDIENCE: ${params.audience}
PAIN / CONTEXT: ${params.pain_point}

Generate the following sections. Each section must start exactly with its delimiter:

${sectionsRequested}

End every section with the watermark in ${params.language}:
PT: ⚠️ Rascunho gerado com IA. Revise, ore e pregue com sua voz.
EN: ⚠️ AI-generated draft. Review, pray, and preach with your own voice.
ES: ⚠️ Borrador generado con IA. Revisa, ora y predica con tu propia voz.`
}

function parseOutputSections(raw: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const delimiters = [
    { key: "sermon", pattern: /=== SERMÃO.*?===/i },
    { key: "outline", pattern: /=== ESBOÇO.*?===/i },
    { key: "devotional", pattern: /=== DEVOCIONAL.*?===/i },
    { key: "reels", pattern: /=== REELS.*?===/i },
    { key: "bilingual", pattern: /=== VERSÃO BILÍNGUE.*?===/i },
    { key: "cell", pattern: /=== CULTO.*?===/i },
  ]

  for (let i = 0; i < delimiters.length; i++) {
    const match = raw.search(delimiters[i].pattern)
    if (match === -1) continue
    const start = match + raw.slice(match).search(/\n/) + 1
    const nextDelim = delimiters.slice(i + 1).map(d => raw.search(d.pattern)).find(n => n > match) ?? raw.length
    sections[delimiters[i].key] = raw.slice(start, nextDelim).trim()
  }

  return sections
}

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, content-type"
      }
    })
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  // Auth
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return new Response("Unauthorized", { status: 401 })

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  )
  if (authError || !user) return new Response("Unauthorized", { status: 401 })

  // Parse body
  const body = await req.json()
  const {
    bible_passage, audience = "", pain_point = "",
    doctrine_line, language = "PT", pastoral_voice,
    bible_version, output_modes = ["sermon","outline","devotional","reels","bilingual","cell"]
  } = body

  if (!bible_passage) {
    return new Response(JSON.stringify({ error: "bible_passage is required" }), { status: 400 })
  }

  // Buscar dados do usuário (plano + preferências + limite)
  const { data: userData } = await supabase
    .from("users")
    .select("plan, generation_count_month, generation_reset_date, doctrine_preference, pastoral_voice, bible_version, language_preference")
    .eq("id", user.id)
    .single()

  if (!userData) return new Response("User not found", { status: 404 })

  // Verificar reset mensal
  const today = new Date()
  const resetDate = new Date(userData.generation_reset_date)
  if (today.getMonth() !== resetDate.getMonth() || today.getFullYear() !== resetDate.getFullYear()) {
    await supabase.from("users").update({
      generation_count_month: 0,
      generation_reset_date: today.toISOString().slice(0, 10)
    }).eq("id", user.id)
    userData.generation_count_month = 0
  }

  // Verificar limite do plano
  const limit = PLAN_LIMITS[userData.plan] ?? 5
  if (userData.generation_count_month >= limit) {
    return new Response(JSON.stringify({
      error: "generation_limit_reached",
      limit,
      plan: userData.plan
    }), { status: 429 })
  }

  // Resolver preferências (input > perfil do usuário)
  const resolvedDoctrine = doctrine_line ?? userData.doctrine_preference ?? "evangelical_general"
  const resolvedVoice = pastoral_voice ?? userData.pastoral_voice ?? "welcoming"
  const resolvedVersion = bible_version ?? userData.bible_version ?? "ARA"
  const resolvedLanguage = language ?? userData.language_preference ?? "PT"

  // Detectar tópicos sensíveis
  const sensitiveTopics = detectSensitiveTopics(
    `${pain_point} ${audience}`, resolvedLanguage
  )

  // Buscar versículo real
  const verseResult = await fetchBibleVerse(bible_passage, resolvedVersion, resolvedLanguage)
  const verseText = verseResult?.text ?? ""

  // Montar e enviar prompt
  const prompt = buildPromptMaster({
    language: resolvedLanguage,
    doctrine_line: resolvedDoctrine,
    pastoral_voice: resolvedVoice,
    bible_version: resolvedVersion,
    audience,
    pain_point,
    bible_passage,
    verse_text: verseText,
    sensitive_topics: sensitiveTopics,
    output_modes
  })

  const start = Date.now()
  let llmResponse

  try {
    llmResponse = await openai.chat.completions.create({
      model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.7
    })
  } catch (e) {
    // Retry 1x em timeout
    try {
      llmResponse = await openai.chat.completions.create({
        model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.7
      })
    } catch {
      return new Response(JSON.stringify({ error: "llm_timeout" }), { status: 503 })
    }
  }

  const generationMs = Date.now() - start
  const rawOutput = llmResponse.choices[0].message.content ?? ""
  const outputs = parseOutputSections(rawOutput)

  // Auditoria de citações (contagem básica)
  const directQuotes = (rawOutput.match(/\[CITAÇÃO DIRETA\]|\[DIRECT QUOTE\]/gi) ?? []).length
  const paraphrases = (rawOutput.match(/\[PARÁFRASE\]|\[PARAPHRASE\]/gi) ?? []).length
  const allusions = (rawOutput.match(/\[ALUSÃO\]|\[ALLUSION\]/gi) ?? []).length
  const layersMarked = rawOutput.includes("[TEXT]") || rawOutput.includes("[TEXTO]")

  // Calcular custo
  const inputTokens = llmResponse.usage?.prompt_tokens ?? 0
  const outputTokens = llmResponse.usage?.completion_tokens ?? 0
  const costUsd = (inputTokens * 0.00000015) + (outputTokens * 0.0000006)

  // Salvar material
  const { data: material } = await supabase.from("materials").insert({
    user_id: user.id,
    mode: "pastoral",
    language: resolvedLanguage,
    bible_passage,
    audience,
    pain_point,
    doctrine_line: resolvedDoctrine,
    pastoral_voice: resolvedVoice,
    bible_version: resolvedVersion,
    output_sermon: outputs.sermon,
    output_outline: outputs.outline,
    output_devotional: outputs.devotional,
    output_reels: outputs.reels ? [outputs.reels] : [],
    output_bilingual: outputs.bilingual,
    output_cell: outputs.cell,
    theology_layer_marked: layersMarked,
    citation_audit: { direct_quotes: directQuotes, paraphrases, allusions, bible_version_used: resolvedVersion },
    sensitive_topic_detected: sensitiveTopics.join(",") || null,
    generation_time_ms: generationMs
  }).select().single()

  // Incrementar contador
  await supabase.from("users")
    .update({ generation_count_month: userData.generation_count_month + 1 })
    .eq("id", user.id)

  // Log de billing
  await supabase.from("generation_logs").insert({
    user_id: user.id,
    material_id: material?.id,
    language: resolvedLanguage,
    mode: "pastoral",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    generation_time_ms: generationMs,
    llm_model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
    theology_guardrails_triggered: layersMarked,
    sensitive_topic_detected: sensitiveTopics.join(",") || null,
    cost_usd: costUsd
  })

  return new Response(JSON.stringify({
    material_id: material?.id,
    outputs,
    theology_layers_marked: layersMarked,
    citation_audit: { direct_quotes: directQuotes, paraphrases, allusions, bible_version_used: resolvedVersion },
    sensitive_topic_detected: sensitiveTopics.length > 0 ? sensitiveTopics : null,
    generation_time_ms: generationMs,
    generations_remaining: limit - (userData.generation_count_month + 1)
  }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  })
})
```

---

## BLOCO 5 — EDGE FUNCTION: `generate-blog-article`

Crie o arquivo: `supabase/functions/generate-blog-article/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://esm.sh/openai@4"
import { fetchBibleVerse } from "../fetch-bible-verse/index.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)
const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! })

const PLAN_LIMITS: Record<string, number> = {
  free: 5, pastoral: 40, church: 200, ministry: 500
}

const TARGET_LENGTH: Record<string, { min: number; max: number }> = {
  short:  { min: 300, max: 500 },
  medium: { min: 600, max: 900 },
  long:   { min: 1000, max: 1500 }
}

function buildBlogPrompt(params: {
  language: string
  doctrine_line: string
  pastoral_voice: string
  bible_version: string
  audience: string
  pain_point: string
  bible_passage: string
  verse_text: string
  category: string
  target_length: string
  article_goal: string
  sensitive_topics: string[]
  author_name: string
}): string {
  const lengths = TARGET_LENGTH[params.target_length] ?? TARGET_LENGTH.medium
  const sensitiveBlock = params.sensitive_topics.length > 0
    ? `\nSENSITIVE CONTEXT: ${params.sensitive_topics.join(", ")} — use welcoming, non-prescriptive tone only.\n`
    : ""

  return `You are a pastoral blog writer for Living Word platform. Write a ${params.category} article in ${params.language}.

RULES:
1. Write ${lengths.min}–${lengths.max} words
2. Use ${params.bible_version} for all Bible quotes. Mark: [DIRECT QUOTE] | [PARAPHRASE] | [ALLUSION]
3. Never invent Bible verses
4. Doctrinal line: ${params.doctrine_line}
5. Pastoral voice: ${params.pastoral_voice}
6. Article goal: ${params.article_goal}
7. Author: ${params.author_name} (use first person)
${sensitiveBlock}
PASSAGE: ${params.bible_passage}
VERSE TEXT: ${params.verse_text || "(use training knowledge, mark as PARAPHRASE)"}
AUDIENCE: ${params.audience}
CONTEXT/PAIN: ${params.pain_point}

Return ONLY valid JSON (no markdown, no backticks):
{
  "title": "...",
  "meta_description": "... (max 160 chars)",
  "seo_slug": "...",
  "body": "... (full article in ${params.language})",
  "tags": ["...", "..."],
  "word_count": 0,
  "watermark": "..."
}`
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, content-type"
      }
    })
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return new Response("Unauthorized", { status: 401 })

  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  )
  if (error || !user) return new Response("Unauthorized", { status: 401 })

  const {
    bible_passage, audience = "", pain_point = "",
    doctrine_line, language = "PT", pastoral_voice,
    bible_version, category = "devotional",
    target_length = "medium", article_goal = "encourage"
  } = await req.json()

  if (!bible_passage || !category) {
    return new Response(JSON.stringify({ error: "bible_passage and category required" }), { status: 400 })
  }

  const { data: userData } = await supabase
    .from("users")
    .select("plan, generation_count_month, doctrine_preference, pastoral_voice, bible_version, language_preference, full_name")
    .eq("id", user.id)
    .single()

  if (!userData) return new Response("User not found", { status: 404 })

  const limit = PLAN_LIMITS[userData.plan] ?? 5
  if (userData.generation_count_month >= limit) {
    return new Response(JSON.stringify({ error: "generation_limit_reached", limit }), { status: 429 })
  }

  const resolvedLanguage = language ?? userData.language_preference ?? "PT"
  const resolvedVersion = bible_version ?? userData.bible_version ?? "ARA"
  const resolvedDoctrine = doctrine_line ?? userData.doctrine_preference ?? "evangelical_general"
  const resolvedVoice = pastoral_voice ?? userData.pastoral_voice ?? "welcoming"
  const authorName = userData.full_name ?? "Autor"

  const sensitiveTopics = (pain_point + audience).toLowerCase().includes("depress") ||
    (pain_point + audience).toLowerCase().includes("traum") ||
    (pain_point + audience).toLowerCase().includes("suic")
    ? ["sensitive_context_detected"] : []

  const verseResult = await fetchBibleVerse(bible_passage, resolvedVersion, resolvedLanguage)
  const verseText = verseResult?.text ?? ""

  const prompt = buildBlogPrompt({
    language: resolvedLanguage,
    doctrine_line: resolvedDoctrine,
    pastoral_voice: resolvedVoice,
    bible_version: resolvedVersion,
    audience, pain_point, bible_passage,
    verse_text: verseText,
    category, target_length, article_goal,
    sensitive_topics: sensitiveTopics,
    author_name: authorName
  })

  const start = Date.now()
  const llmResponse = await openai.chat.completions.create({
    model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
    temperature: 0.75
  })

  const generationMs = Date.now() - start
  const rawOutput = llmResponse.choices[0].message.content ?? "{}"
  const inputTokens = llmResponse.usage?.prompt_tokens ?? 0
  const outputTokens = llmResponse.usage?.completion_tokens ?? 0
  const costUsd = (inputTokens * 0.00000015) + (outputTokens * 0.0000006)

  let article
  try {
    article = JSON.parse(rawOutput.replace(/```json|```/g, "").trim())
  } catch {
    article = { title: "Artigo gerado", body: rawOutput, meta_description: "", seo_slug: "", tags: [], word_count: 0 }
  }

  const { data: material } = await supabase.from("materials").insert({
    user_id: user.id,
    mode: "blog",
    language: resolvedLanguage,
    bible_passage, audience, pain_point,
    doctrine_line: resolvedDoctrine,
    pastoral_voice: resolvedVoice,
    bible_version: resolvedVersion,
    category,
    output_blog: article.body,
    article_title: article.title,
    meta_description: article.meta_description,
    seo_slug: article.seo_slug,
    tags: article.tags ?? [],
    word_count: article.word_count ?? 0,
    sensitive_topic_detected: sensitiveTopics.length > 0 ? "detected" : null,
    generation_time_ms: generationMs
  }).select().single()

  await supabase.from("editorial_queue").insert({
    user_id: user.id,
    material_id: material?.id,
    status: "draft"
  })

  await supabase.from("users")
    .update({ generation_count_month: userData.generation_count_month + 1 })
    .eq("id", user.id)

  await supabase.from("generation_logs").insert({
    user_id: user.id,
    material_id: material?.id,
    language: resolvedLanguage,
    mode: "blog",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    generation_time_ms: generationMs,
    llm_model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
    cost_usd: costUsd
  })

  return new Response(JSON.stringify({
    material_id: material?.id,
    article,
    generation_time_ms: generationMs,
    generations_remaining: limit - (userData.generation_count_month + 1)
  }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  })
})
```

---

## BLOCO 6 — DEPLOY E TESTE

```bash
# Deploy das 3 funções
supabase functions deploy fetch-bible-verse
supabase functions deploy generate-pastoral-material
supabase functions deploy generate-blog-article

# Teste rápido — gerar material pastoral em PT
curl -X POST https://<seu-projeto>.supabase.co/functions/v1/generate-pastoral-material \
  -H "Authorization: Bearer <user_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "bible_passage": "João 15:1-8",
    "audience": "Imigrantes brasileiros",
    "pain_point": "Solidão, saudade de casa",
    "language": "PT",
    "bible_version": "ARA",
    "output_modes": ["sermon", "devotional"]
  }'

# Teste — gerar artigo de blog em EN
curl -X POST https://<seu-projeto>.supabase.co/functions/v1/generate-blog-article \
  -H "Authorization: Bearer <user_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "bible_passage": "Matthew 5:13-16",
    "audience": "Brazilian immigrants in the US",
    "category": "immigrant",
    "language": "EN",
    "bible_version": "NIV",
    "target_length": "medium"
  }'
```

**Critério de sucesso do Sprint 1:**
- [ ] Schema criado sem erros no Supabase
- [ ] As 3 funções deployadas sem erros de compilação
- [ ] Geração pastoral retorna os 6 formatos em ≤ 15 segundos
- [ ] Geração de blog retorna JSON válido com título, corpo e meta
- [ ] `generation_logs` registra tokens e custo após cada chamada
- [ ] `generation_count_month` incrementa corretamente
- [ ] Limite de plano retorna 429 ao atingir o máximo

---

*Sprint 1 completo. Sprint 2 (provision-user-blog + publish-to-wordpress) começa após validação.*
