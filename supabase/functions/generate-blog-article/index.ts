/**
 * Living Word — generate-blog-article
 *
 * Core da Frente B: Motor de Conteúdo
 * Gera artigos de blog cristão por categoria, com SEO otimizado.
 *
 * CONVERSÃO: Free = 1 artigo/mês. Pastoral = 20/mês.
 * Gatilho 4: ao gerar 2º artigo free, banner exibido.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4"
import {
  handleCors,
  createScopedClient,
  createAdminClient,
  getAuthUser,
  PLAN_LIMITS,
  detectSensitiveTopics,
  jsonResponse,
  errorResponse,
} from "../common/utils.ts"
import { fetchBibleVerse } from "../fetch-bible-verse/index.ts"

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! })

// Limites de artigos de blog por plano
const BLOG_LIMITS: Record<string, number> = {
  free: 1,
  pastoral: 20,
  church: 100,
  ministry: 999,
}

const TARGET_LENGTH: Record<string, { min: number; max: number }> = {
  short:  { min: 300, max: 500 },
  medium: { min: 600, max: 900 },
  long:   { min: 1000, max: 1500 },
}

function buildBlogPrompt(params: {
  language: string; doctrine_line: string; pastoral_voice: string
  bible_version: string; audience: string; pain_point: string
  bible_passage: string; verse_text: string; category: string
  target_length: string; article_goal: string
  sensitive_topics: string[]; author_name: string
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
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  if (req.method !== "POST") return errorResponse("method_not_allowed", 405)

  // 1. Auth
  const { user, authHeader, error: authError } = await getAuthUser(req)
  if (authError || !user || !authHeader) return errorResponse("unauthorized", 401)

  const scopedClient = createScopedClient(authHeader)
  const adminClient = createAdminClient()

  // 2. Parse body
  const {
    bible_passage, audience = "", pain_point = "",
    doctrine_line, language = "PT", pastoral_voice,
    bible_version, category = "devotional",
    target_length = "medium", article_goal = "encourage"
  } = await req.json()

  if (!bible_passage || !category) {
    return errorResponse("bible_passage and category required", 400)
  }

  // 3. Dados do usuário (RLS via scoped client)
  const { data: userData } = await scopedClient
    .from("users")
    .select("plan, generation_count_month, doctrine_preference, pastoral_voice, bible_version, language_preference, full_name")
    .eq("id", user.id)
    .single()

  if (!userData) return errorResponse("user_not_found", 404)

  // 4. Contar artigos de blog gerados este mês
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: blogCount } = await scopedClient
    .from("materials")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("mode", "blog")
    .gte("created_at", startOfMonth.toISOString())

  const blogLimit = BLOG_LIMITS[userData.plan] ?? 1
  const currentBlogCount = blogCount ?? 0

  // Verificar limite geral de gerações
  const limit = PLAN_LIMITS[userData.plan] ?? 5
  if (userData.generation_count_month >= limit) {
    return errorResponse("generation_limit_reached", 429, { limit, plan: userData.plan })
  }

  // 5. Resolver preferências
  const resolvedLanguage = language ?? userData.language_preference ?? "PT"
  const resolvedVersion = bible_version ?? userData.bible_version ?? "ARA"
  const resolvedDoctrine = doctrine_line ?? userData.doctrine_preference ?? "evangelical_general"
  const resolvedVoice = pastoral_voice ?? userData.pastoral_voice ?? "welcoming"
  const authorName = userData.full_name ?? "Autor"

  // 6. Detectar tópicos sensíveis
  const sensitiveTopics = detectSensitiveTopics(`${pain_point} ${audience}`, resolvedLanguage)

  // 7. Buscar versículo real
  const verseResult = await fetchBibleVerse(bible_passage, resolvedVersion as any, resolvedLanguage)
  const verseText = verseResult?.text ?? ""

  // 8. Gerar artigo
  const prompt = buildBlogPrompt({
    language: resolvedLanguage,
    doctrine_line: resolvedDoctrine,
    pastoral_voice: resolvedVoice,
    bible_version: resolvedVersion,
    audience, pain_point, bible_passage,
    verse_text: verseText,
    category, target_length, article_goal,
    sensitive_topics: sensitiveTopics,
    author_name: authorName,
  })

  const start = Date.now()
  const llmResponse = await openai.chat.completions.create({
    model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
    temperature: 0.75,
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

  // 9. Salvar material (scoped client)
  const { data: material } = await scopedClient.from("materials").insert({
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
    generation_time_ms: generationMs,
  }).select().single()

  // 10. Criar rascunho editorial
  await scopedClient.from("editorial_queue").insert({
    user_id: user.id,
    material_id: material?.id,
    status: "draft",
  })

  // 11. Incrementar contador (admin client)
  await adminClient.from("users")
    .update({ generation_count_month: userData.generation_count_month + 1 })
    .eq("id", user.id)

  // 12. Log de billing
  await adminClient.from("generation_logs").insert({
    user_id: user.id,
    material_id: material?.id,
    language: resolvedLanguage,
    mode: "blog",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    generation_time_ms: generationMs,
    llm_model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
    cost_usd: costUsd,
  })

  // 13. Gatilho 4 — blog_limit (Conversion Strategy)
  const isFree = userData.plan === "free"
  const newBlogCount = currentBlogCount + 1
  const blogLimitReached = isFree && newBlogCount > blogLimit

  if (blogLimitReached) {
    await adminClient.from("conversion_events").insert({
      user_id: user.id,
      event_type: "upgrade_cta_shown",
      trigger_name: "blog_limit",
      user_type: "influencer",
    })
  }

  return jsonResponse({
    material_id: material?.id,
    editorial_queue_id: material?.id, // same ref for now
    article,
    generation_time_ms: generationMs,
    generations_remaining: limit - (userData.generation_count_month + 1),
    blog_limit_hint: blogLimitReached
      ? {
          message: "Seu artigo foi gerado e salvo como rascunho. Para publicar e gerar os próximos 19, o Pastoral libera 20 artigos/mês com agendamento.",
          cta: "pastoral",
          trial_days: 7,
        }
      : null,
  })
})
