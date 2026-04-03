# LIVING WORD — Edge Functions Spec v1.0
**Runtime:** Supabase Edge Functions (Deno)  
**Modelo:** gpt-4o-mini (OpenAI) — variável `LLM_MODEL`  
**Auth:** Bearer token via Supabase Auth em todas as funções  
**Data:** Abril 2026 · BX4 / Severino Bione

---

## Funções

| # | Função | Trigger | Frente |
|---|---|---|---|
| 1 | `generate-pastoral-material` | POST manual | A |
| 2 | `generate-blog-article` | POST manual | B |
| 3 | `publish-to-wordpress` | POST manual / auto | B |
| 4 | `schedule-publication` | POST manual | B |
| 5 | `provision-user-blog` | Webhook Supabase Auth (novo usuário) | Core |
| 6 | `fetch-bible-verse` | Chamada interna das funções 1 e 2 | Core |

---

## 1. `generate-pastoral-material`

**Responsabilidade:** gerar os 6 formatos pastorais da Frente A a partir do input do usuário.

### Request
```http
POST /functions/v1/generate-pastoral-material
Authorization: Bearer <user_jwt>
Content-Type: application/json
```

```json
{
  "bible_passage": "João 15:1-8",
  "audience": "Imigrantes brasileiros recém-chegados",
  "pain_point": "Solidão, saudade de casa, medo do futuro",
  "doctrine_line": "evangelical_general",
  "language": "PT",
  "pastoral_voice": "welcoming_expository",
  "bible_version": "ARA",
  "output_modes": ["sermon", "outline", "devotional", "reels", "bilingual", "cell"]
}
```

**Campos obrigatórios:** `bible_passage`, `language`  
**Campos opcionais:** todos os demais (fallback para preferências do usuário em `users`)

**Valores válidos:**
- `doctrine_line`: `evangelical_general | baptist | assemblies | reformed | pentecostal | charismatic | catholic`
- `language`: `PT | EN | ES`
- `pastoral_voice`: `welcoming | expository | narrative | apologetic | prophetic | pastoral_soft`
- `bible_version`: `ARA | ACF | NVI-PT | NIV | ESV | NLT | KJV | RVR60 | NVI-ES | DHH`
- `output_modes`: array com 1 a 6 valores de `["sermon","outline","devotional","reels","bilingual","cell"]`

### Lógica interna

```typescript
// 1. Verificar autenticação e plano
const user = await supabase.auth.getUser(jwt)
const { plan, generation_count_month } = await getUser(user.id)
const limit = PLAN_LIMITS[plan] // { free: 5, pastoral: 40, church: 200, ministry: 500 }
if (generation_count_month >= limit) return 429 // Too Many Requests

// 2. Detectar tópico sensível
const sensitiveTopics = detectSensitiveTopics(pain_point + audience)
// keywords: depressão, trauma, abuso, violência, imigração doc, luto, suicídio

// 3. Buscar versículo real para DIRECT QUOTE (se bible_version disponível)
const verseText = await fetchBibleVerse(bible_passage, bible_version, language)

// 4. Montar prompt master v3
const prompt = buildPromptMaster({
  language, doctrine_line, pastoral_voice, bible_version,
  audience, pain_point, bible_passage,
  verseText, sensitiveTopics,
  outputModes
})

// 5. Chamar OpenAI
const start = Date.now()
const response = await openai.chat.completions.create({
  model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
  max_tokens: 4000,
  temperature: 0.7
})

// 6. Parsear saída por seção (delimitadores no prompt)
const outputs = parseOutputSections(response.choices[0].message.content)

// 7. Salvar material no Supabase
const material = await supabase.from("materials").insert({
  user_id: user.id,
  mode: "pastoral",
  language, bible_passage, audience, pain_point,
  doctrine_line, pastoral_voice, bible_version,
  output_sermon: outputs.sermon,
  output_outline: outputs.outline,
  output_devotional: outputs.devotional,
  output_reels: outputs.reels,
  output_bilingual: outputs.bilingual,
  output_cell: outputs.cell,
  theology_layer_marked: outputs.layersPresent,
  citation_audit: outputs.citationAudit,
  generation_time_ms: Date.now() - start
})

// 8. Incrementar contador de gerações
await incrementGenerationCount(user.id)

// 9. Log para analytics/billing
await logGeneration({
  user_id: user.id, material_id: material.id,
  input_tokens: response.usage.prompt_tokens,
  output_tokens: response.usage.completion_tokens,
  generation_time_ms: Date.now() - start,
  sensitive_topic_detected: sensitiveTopics.join(",") || null
})

return { material_id: material.id, outputs, generation_time_ms }
```

### Response
```json
{
  "material_id": "uuid",
  "outputs": {
    "sermon": "...",
    "outline": "...",
    "devotional": "...",
    "reels": ["...", "...", "...", "...", "..."],
    "bilingual": "...",
    "cell": "..."
  },
  "theology_layers_marked": true,
  "citation_audit": {
    "direct_quotes": 3,
    "paraphrases": 2,
    "allusions": 1,
    "bible_version_used": "ARA"
  },
  "generation_time_ms": 8400,
  "sensitive_topic_detected": null
}
```

### Erros
| Código | Situação |
|---|---|
| 401 | JWT inválido ou expirado |
| 429 | Limite de gerações do plano atingido |
| 400 | `bible_passage` ausente ou inválido |
| 503 | OpenAI API timeout (>15s) — retry automático 1x |

---

## 2. `generate-blog-article`

**Responsabilidade:** gerar artigo de blog cristão (Frente B) por categoria e público-alvo.

### Request
```http
POST /functions/v1/generate-blog-article
Authorization: Bearer <user_jwt>
Content-Type: application/json
```

```json
{
  "bible_passage": "Mateus 5:13-16",
  "audience": "Imigrantes brasileiros",
  "pain_point": "Identidade e propósito na nova terra",
  "doctrine_line": "evangelical_general",
  "language": "PT",
  "pastoral_voice": "narrative",
  "bible_version": "ARA",
  "category": "immigrant",
  "target_length": "medium",
  "article_goal": "encourage"
}
```

**Campos obrigatórios:** `bible_passage`, `language`, `category`

**Valores válidos:**
- `category`: `devotional | sermon_article | biblical_reflection | new_converts | family | immigrant | evangelistic`
- `target_length`: `short (300-500) | medium (600-900) | long (1000-1500)`
- `article_goal`: `encourage | teach | evangelise | reflect | challenge`

### Lógica interna

```typescript
// 1-2. Auth + limite (igual à função 1)

// 3. Buscar versículo real
const verseText = await fetchBibleVerse(bible_passage, bible_version, language)

// 4. Detectar tópico sensível
const sensitiveTopics = detectSensitiveTopics(pain_point + audience)

// 5. Prompt específico para blog (diferente do pastoral)
const prompt = buildBlogPrompt({
  language, doctrine_line, pastoral_voice, bible_version,
  audience, pain_point, bible_passage, verseText,
  category, targetLength, articleGoal, sensitiveTopics
})

// 6. Chamar OpenAI
const response = await openai.chat.completions.create({
  model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
  max_tokens: 2000,
  temperature: 0.75
})

// 7. Extrair metadados do artigo (gerados pelo modelo)
const article = parseArticle(response.choices[0].message.content)
// article: { title, meta_description, body, word_count, tags[], seo_slug }

// 8. Salvar como rascunho editorial
const material = await supabase.from("materials").insert({...})
await supabase.from("editorial_queue").insert({
  user_id: user.id,
  material_id: material.id,
  status: "draft",
  target_site_url: null
})

return { material_id, article, editorial_queue_id }
```

### Response
```json
{
  "material_id": "uuid",
  "editorial_queue_id": "uuid",
  "article": {
    "title": "Sal da Terra: Como Ser Luz em Terra Estranha",
    "meta_description": "Reflexão sobre Mateus 5:13-16 para brasileiros nos EUA...",
    "body": "...",
    "word_count": 712,
    "tags": ["imigrante", "identidade", "Mateus 5", "propósito"],
    "seo_slug": "sal-da-terra-como-ser-luz-em-terra-estranha",
    "bible_version_used": "ARA",
    "watermark": "Rascunho gerado com IA. Revise, ore e publique com sua voz."
  },
  "generation_time_ms": 6200
}
```

---

## 3. `publish-to-wordpress`

**Responsabilidade:** publicar artigo no WordPress do usuário via REST API. Reuso direto da infraestrutura OmniSeen Publisher.

### Request
```http
POST /functions/v1/publish-to-wordpress
Authorization: Bearer <user_jwt>
Content-Type: application/json
```

```json
{
  "material_id": "uuid",
  "site_url": "https://joao.livingword.app",
  "status": "publish",
  "categories": ["devocionais", "imigrante"],
  "featured_image_prompt": null
}
```

**Valores válidos para `status`:** `publish | draft | future`  
Se `status = "future"`, campo `scheduled_date` é obrigatório (ISO 8601).

### Lógica interna

```typescript
// 1. Auth
// 2. Buscar material e verificar ownership
const material = await getMaterial(material_id, user.id)
if (!material) return 403

// 3. Buscar credenciais do site WordPress do usuário
const site = await getUserSite(user.id, site_url)
// site: { wp_rest_url, wp_username, wp_app_password }
// Credenciais armazenadas criptografadas em user_editorial_profile.active_sites

// 4. Montar payload WordPress
const wpPayload = {
  title: material.article_title,
  content: material.output_blog,
  status: status,
  slug: material.seo_slug,
  categories: await resolveWPCategories(site, categories),
  meta: {
    _yoast_wpseo_metadesc: material.meta_description
  },
  date: scheduledDate ?? undefined
}

// 5. POST para WordPress REST API
const wpResponse = await fetch(`${site.wp_rest_url}/wp/v2/posts`, {
  method: "POST",
  headers: {
    "Authorization": `Basic ${btoa(`${site.wp_username}:${site.wp_app_password}`)}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(wpPayload)
})

const wpPost = await wpResponse.json()

// 6. Atualizar fila editorial
await supabase.from("editorial_queue").update({
  status: status === "future" ? "scheduled" : "published",
  published_at: status === "publish" ? new Date().toISOString() : null,
  scheduled_at: scheduledDate ?? null,
  published_url: wpPost.link,
  target_site_url: site_url
}).eq("material_id", material_id)

// 7. Atualizar material
await supabase.from("materials").update({
  is_published: status === "publish",
  published_url: wpPost.link
}).eq("id", material_id)

return { published_url: wpPost.link, wp_post_id: wpPost.id, status }
```

### Response
```json
{
  "published_url": "https://joao.livingword.app/sal-da-terra-como-ser-luz",
  "wp_post_id": 142,
  "status": "publish"
}
```

### Erros
| Código | Situação |
|---|---|
| 403 | Material não pertence ao usuário |
| 404 | Site WordPress não configurado |
| 422 | Credenciais WordPress inválidas |
| 502 | WordPress REST API inacessível |

---

## 4. `schedule-publication`

**Responsabilidade:** adicionar artigo à fila editorial com data e site de destino.

### Request
```http
POST /functions/v1/schedule-publication
Authorization: Bearer <user_jwt>
Content-Type: application/json
```

```json
{
  "material_id": "uuid",
  "site_url": "https://joao.livingword.app",
  "scheduled_at": "2026-04-07T08:00:00-04:00",
  "status": "scheduled"
}
```

### Lógica interna

```typescript
// 1. Auth + verificar ownership do material
// 2. Verificar que scheduled_at é no futuro
if (new Date(scheduled_at) <= new Date()) return 400

// 3. Upsert na fila editorial
await supabase.from("editorial_queue").upsert({
  user_id: user.id,
  material_id,
  status: "scheduled",
  scheduled_at,
  target_site_url: site_url
})

// 4. Registrar cron job via pg_cron (Supabase)
// pg_cron executa publish-to-wordpress no horário agendado
await supabase.rpc("schedule_publication_cron", {
  material_id, scheduled_at, site_url
})

return { scheduled: true, scheduled_at, site_url }
```

### Response
```json
{
  "scheduled": true,
  "scheduled_at": "2026-04-07T08:00:00-04:00",
  "site_url": "https://joao.livingword.app",
  "queue_id": "uuid"
}
```

---

## 5. `provision-user-blog`

**Responsabilidade:** provisionar subdomínio e publicar 2 artigos de boas-vindas ao criar conta. Disparado automaticamente pelo webhook de Auth do Supabase.

### Trigger
```
Supabase Auth Webhook → evento: user.created
```

### Lógica interna

```typescript
// 1. Receber evento do webhook
const { user_id, email, user_metadata } = event
const { name, language, doctrine_line } = user_metadata

// 2. Gerar handle único (slug do nome)
const handle = slugify(name) // "Pastor João Silva" → "pastor-joao-silva"
const blogUrl = `https://${handle}.livingword.app`

// 3. Provisionar subsite no WordPress Multisite
const wpSite = await createWordPressSubsite({
  siteurl: blogUrl,
  title: `${name} — Living Word`,
  admin_email: email,
  language: language ?? "pt_BR"
})

// 4. Salvar credenciais e blog_url no perfil do usuário
await supabase.from("users").update({
  blog_url: blogUrl,
  handle
}).eq("id", user_id)

await supabase.from("user_editorial_profile").insert({
  user_id,
  active_sites: [{
    url: blogUrl,
    name: `Blog de ${name}`,
    wp_rest_url: `${blogUrl}/wp-json`,
    wp_username: wpSite.admin_user,
    wp_app_password: wpSite.app_password, // armazenada criptografada
    language: language ?? "PT"
  }]
})

// 5. Gerar artigo 1: boas-vindas (João 1:1)
const article1 = await generateWelcomeArticle({
  user_id, name, language, doctrine_line,
  passage: "João 1:1-3",
  theme: "welcome_word",
  authorName: name
})

// 6. Gerar artigo 2: propósito e missão (Mateus 5:13-16)
const article2 = await generateWelcomeArticle({
  user_id, name, language, doctrine_line,
  passage: "Mateus 5:13-16",
  theme: "purpose_mission",
  authorName: name
})

// 7. Publicar os 2 artigos imediatamente
await publishToWordPress(blogUrl, article1, "publish")
await publishToWordPress(blogUrl, article2, "publish")

// 8. Salvar materiais na biblioteca do usuário
await saveMaterials(user_id, [article1, article2])

// 9. Notificação push/email ao usuário
await sendWelcomeNotification({
  email, name, blogUrl,
  message: `Seu blog está no ar: ${blogUrl}`
})

return { blog_url: blogUrl, articles_published: 2 }
```

### Custo por onboarding
- 2 artigos × ~$0,0018/geração = **~$0,004 por novo usuário**
- 1.000 cadastros/mês = ~$4 em custo de API de onboarding

### Erros e fallback
- Se WordPress Multisite falhar: usuário recebe email com status "seu blog está sendo preparado" e job retry em 5 min
- Se geração dos artigos falhar: blog é provisionado sem artigos, job retry em 10 min

---

## 6. `fetch-bible-verse`

**Responsabilidade:** buscar o texto bíblico oficial na API correta para a versão selecionada. Chamada interna das funções 1 e 2.

### Interface interna (não exposta publicamente)

```typescript
async function fetchBibleVerse(
  passage: string,       // "João 15:1-8"
  version: BibleVersion, // "ARA" | "NIV" | "RVR60" etc.
  language: "PT" | "EN" | "ES"
): Promise<{ text: string; source: string; version: string } | null>
```

### Roteamento por versão

```typescript
const BIBLE_API_ROUTER: Record<BibleVersion, () => Promise<string>> = {

  // PT — domínio público
  "ARA": () => fetchWldeh(passage, "pt_AA"),
  "ACF": () => fetchWldeh(passage, "pt_ACF"),
  "NVI-PT": () => fetchGPT4oMiniStyle(passage, "NVI-PT", "PT"),
  // NVI-PT: sem API pública legal — gpt-4o-mini reproduz o vocabulário
  // Citação marcada como [PARÁFRASE NVI-PT] no output

  // EN
  "NIV":  () => fetchApiBible(passage, "de4e12af7f28f599-01"), // NIV Bible ID
  "ESV":  () => fetchESVApi(passage),
  "NLT":  () => fetchApiBible(passage, "nlt-id"),
  "KJV":  () => fetchApiBible(passage, "de4e12af7f28f599-02"),

  // ES
  "RVR60":  () => fetchApiBiblia(passage, "rvr60"),
  "NVI-ES": () => fetchApiBiblia(passage, "nvi"),
  "DHH":    () => fetchApiBible(passage, "dhh-id"),
}

async function fetchBibleVerse(passage, version, language) {
  const fetcher = BIBLE_API_ROUTER[version]
  if (!fetcher) return null

  try {
    const text = await fetcher()
    return { text, source: version, version }
  } catch (e) {
    // Fallback: retorna null, modelo usa conhecimento de treinamento + marca como PARÁFRASE
    console.error(`Bible API failed for ${version}:`, e)
    return null
  }
}
```

### APIs externas utilizadas

| API | URL base | Versões | Auth |
|---|---|---|---|
| wldeh/bible-api | `https://cdn.jsdelivr.net/gh/wldeh/bible-api@main/bibles/` | ARA, ACF (PT) | Nenhuma |
| API.Bible | `https://api.scripture.api.bible/v1` | NIV, KJV, NLT, DHH | API key |
| ESV API | `https://api.esv.org/v3/passage/text` | ESV | API key |
| ApiBiblia | `https://api.apibiblia.com/v1/passage` | RVR60, NVI-ES | API key |

**Todas as API keys armazenadas em variáveis de ambiente Supabase — nunca no código.**

### Fallback chain
```
1. Tentar API primária para a versão
2. Se falhar (timeout/erro): tentar API secundária
3. Se ambas falharem: retornar null
   → Funções 1 e 2 marcam a citação como [PARÁFRASE] e usam o texto gerado pelo modelo
   → Nunca bloqueia a geração principal
```

---

## Variáveis de Ambiente (Supabase Secrets)

```bash
# IA
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...

# Bible APIs
APIBIBLE_KEY=...
ESV_API_KEY=...
APIBIBLIA_KEY=...

# WordPress Multisite
WP_MULTISITE_ADMIN_URL=https://admin.livingword.app/wp-json
WP_MULTISITE_ADMIN_USER=...
WP_MULTISITE_ADMIN_PASSWORD=...

# Supabase (service role — nunca exposto ao frontend)
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_URL=...

# Notificações
RESEND_API_KEY=... (ou SendGrid)
```

---

## Padrões de Código Comuns

### Detecção de tópico sensível
```typescript
const SENSITIVE_KEYWORDS = {
  PT: ["depressão", "trauma", "abuso", "violência", "documentos", "deportação", "suicídio", "luto", "separação"],
  EN: ["depression", "trauma", "abuse", "violence", "documents", "deportation", "suicide", "grief", "separation"],
  ES: ["depresión", "trauma", "abuso", "violencia", "documentos", "deportación", "suicidio", "duelo", "separación"]
}

function detectSensitiveTopics(text: string, language = "PT"): string[] {
  const lower = text.toLowerCase()
  return SENSITIVE_KEYWORDS[language].filter(k => lower.includes(k))
}
```

### Limites por plano
```typescript
const PLAN_LIMITS = {
  free: 5,
  pastoral: 40,
  church: 200,
  ministry: 500
} as const
```

### Slugify para handles
```typescript
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40) // máximo 40 chars
}
// "Pastor João Silva" → "pastor-joao-silva"
// "Iglesia Nueva Vida" → "iglesia-nueva-vida"
```

---

## Prompt Master v3 (referência completa)

```
You are a pastoral theological AI copilot. Your role is to help pastors and Christian leaders prepare faithful, clear, and applicable biblical material — and to create written Christian content for digital publication.

Respond in {language}. Generate content that sounds like a native pastoral voice — not a translation.

INVIOLABLE RULES:
1. Every generation begins: passage → literary context → historical context → interpretation → application
2. Always distinguish with tags: [TEXT] | [INTERPRETATION] | [APPLICATION]
3. NEVER invent Bible verses. If unsure, omit.
4. If application exceeds what the text supports: ⚠️ PASTORAL WARNING: this goes beyond what the text directly states.
5. All Bible quotes must use version: {bible_version}
6. Mark each citation: [DIRECT QUOTE] | [PARAPHRASE] | [ALLUSION]
7. Respect doctrinal line: {doctrine_line}
8. Respect pastoral voice: {pastoral_voice}
9. End every output with watermark (in the output language):
   PT: ⚠️ Rascunho gerado com IA. Revise, ore e pregue/publique com sua voz.
   EN: ⚠️ AI-generated draft. Review, pray, and preach/publish with your own voice.
   ES: ⚠️ Borrador generado con IA. Revisa, ora y predica/publica con tu propia voz.

{sensitive_mode_instructions}
[If sensitive topics detected: activate CAUTION MODE — welcoming tone, no prescriptions, add note recommending human pastoral support]

PASSAGE: {bible_passage}
VERSE TEXT ({bible_version}): {verse_text}
AUDIENCE: {audience}
PAIN / CONTEXT: {pain_point}
OUTPUT MODE: {mode}
CATEGORY (if blog): {category}

GENERATE the following sections clearly delimited:
=== SERMON ===
=== OUTLINE ===
=== DEVOTIONAL ===
=== REELS ===
=== BILINGUAL ===
=== CELL ===
```

---

## Ordem de Implementação Recomendada

```
Sprint 1 (semanas 1-3):
  ✅ fetch-bible-verse         — fundação, sem dependências externas além das Bible APIs
  ✅ generate-pastoral-material — core da Frente A, valida prompt master v3
  ✅ generate-blog-article      — core da Frente B, valida categorização e SEO

Sprint 2 (semanas 4-6):
  ✅ provision-user-blog        — requer WordPress Multisite configurado
  ✅ publish-to-wordpress       — requer provision-user-blog funcionando

Sprint 3 (semanas 7-9):
  ✅ schedule-publication       — requer publish-to-wordpress + pg_cron no Supabase
```

---

*Edge Functions Spec v1.0 — pronto para implementação no Antigravity*  
*Modelo: gpt-4o-mini · Próximo passo: criar as funções no Supabase e testar com 20 gerações*
