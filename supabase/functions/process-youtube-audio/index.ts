/**
 * Living Word — process-youtube-audio
 *
 * Transcreve vídeos do YouTube (usando CC) e gera um artigo de blog 
 * seguindo a matriz do Living Word.
 *
 * Custo: 3 gerações (por conta do maior uso de LLM tokens).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4"
import { YoutubeTranscript } from "https://esm.sh/youtube-transcript@1.2.1"
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

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! })

const TARGET_LENGTH: Record<string, { min: number; max: number }> = {
  short:  { min: 300, max: 500 },
  medium: { min: 600, max: 900 },
  long:   { min: 1000, max: 1500 },
}

function buildYoutubePrompt(params: {
  language: string; doctrine_line: string; pastoral_voice: string
  audience: string; target_length: string
  sensitive_topics: string[]; author_name: string; rawTranscript: string
}): string {
  const lengths = TARGET_LENGTH[params.target_length] ?? TARGET_LENGTH.medium
  const sensitiveBlock = params.sensitive_topics.length > 0
    ? `\nSENSITIVE CONTEXT: ${params.sensitive_topics.join(", ")} — use welcoming, non-prescriptive tone only.\n`
    : ""

  return `You are a pastoral blog writer for Living Word platform.
Your task is to take a messy, raw YouTube video transcript (which is a Christian sermon or message), clean it up, and write a cohesive blog article based on its content in ${params.language}.

RULES:
1. Write ${lengths.min}–${lengths.max} words
2. Extract the core message and scriptural references mentioned in the transcript.
3. Doctrinal line: ${params.doctrine_line}
4. Pastoral voice: ${params.pastoral_voice}
5. Author: ${params.author_name} (use first person or objective pastoral voice appropriately)
${sensitiveBlock}
AUDIENCE: ${params.audience}

RAW YOUTUBE TRANSCRIPT:
${params.rawTranscript.substring(0, 8000)} // Limite de caracteres para context window

Return ONLY valid JSON (no markdown, no backticks):
{
  "title": "...",
  "meta_description": "... (max 160 chars)",
  "seo_slug": "...",
  "body": "... (full article formatted in Markdown in ${params.language})",
  "tags": ["...", "..."],
  "word_count": 0,
  "watermark": "O conteúdo foi extraído e gerado via IA a partir de seu vídeo. Revise antes de publicar."
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
    youtube_url, audience = "", doctrine_line, language = "PT", 
    pastoral_voice, target_length = "medium"
  } = await req.json()

  if (!youtube_url) {
    return errorResponse("youtube_url required", 400)
  }

  // 3. User data
  const { data: userData } = await scopedClient
    .from("users")
    .select("plan, generation_count_month, doctrine_preference, pastoral_voice, language_preference, full_name")
    .eq("id", user.id)
    .single()

  if (!userData) return errorResponse("user_not_found", 404)

  // 4. Rate limits (Youtube costs 3 tokens/generations instead of 1)
  const COST_GENERATIONS = 3
  const limit = PLAN_LIMITS[userData.plan] ?? 5
  if (userData.generation_count_month + COST_GENERATIONS > limit) {
    return errorResponse("generation_limit_reached", 429, { limit, plan: userData.plan })
  }

  // 5. Preferências
  const resolvedLanguage = language ?? userData.language_preference ?? "PT"
  const resolvedDoctrine = doctrine_line ?? userData.doctrine_preference ?? "evangelical_general"
  const resolvedVoice = pastoral_voice ?? userData.pastoral_voice ?? "welcoming"
  const authorName = userData.full_name ?? "Autor"

  // 6. Extrair Transcrição
  let transcriptText = ""
  try {
    const transcriptArray = await YoutubeTranscript.fetchTranscript(youtube_url)
    transcriptText = transcriptArray.map(t => t.text).join(" ")
  } catch (error) {
    console.error("YoutubeTranscript Error:", error)
    return errorResponse("Não foi possível extrair legendas automáticas deste vídeo. Certifique-se de que o vídeo possui CC ou idioma aberto.", 400)
  }

  const sensitiveTopics = detectSensitiveTopics(audience, resolvedLanguage)

  // 7. Chamar LLM
  const prompt = buildYoutubePrompt({
    language: resolvedLanguage,
    doctrine_line: resolvedDoctrine,
    pastoral_voice: resolvedVoice,
    audience, target_length,
    sensitive_topics: sensitiveTopics,
    author_name: authorName,
    rawTranscript: transcriptText
  })

  const start = Date.now()
  const modelToUse = (userData.plan === 'free') ? "gpt-4o-mini" : "gpt-4o"
  const llmResponse = await openai.chat.completions.create({
    model: modelToUse,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 3000,
    temperature: 0.7,
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
    article = { title: "Artigo extraído", body: rawOutput, meta_description: "", seo_slug: "", tags: [], word_count: 0 }
  }

  // 8. Salvar Material
  const { data: material } = await scopedClient.from("materials").insert({
    user_id: user.id,
    mode: "blog",
    language: resolvedLanguage,
    audience,
    doctrine_line: resolvedDoctrine,
    pastoral_voice: resolvedVoice,
    category: "sermon_article",
    output_blog: article.body,
    article_title: article.title,
    meta_description: article.meta_description,
    seo_slug: article.seo_slug,
    tags: article.tags ?? [],
    word_count: article.word_count ?? 0,
    sensitive_topic_detected: sensitiveTopics.length > 0 ? "detected" : null,
    generation_time_ms: generationMs,
  }).select().single()

  // 9. Rascunho na Queue
  await scopedClient.from("editorial_queue").insert({
    user_id: user.id,
    material_id: material?.id,
    status: "draft",
  })

  // 10. Computar uso no billing
  await adminClient.from("users")
    .update({ generation_count_month: userData.generation_count_month + COST_GENERATIONS })
    .eq("id", user.id)

  await adminClient.from("generation_logs").insert({
    user_id: user.id,
    material_id: material?.id,
    language: resolvedLanguage,
    mode: "blog_from_youtube",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    generation_time_ms: generationMs,
    llm_model: modelToUse,
    cost_usd: costUsd,
  })

  return jsonResponse({
    material_id: material?.id,
    editorial_queue_id: material?.id,
    article,
    generation_time_ms: generationMs,
    generations_remaining: limit - (userData.generation_count_month + COST_GENERATIONS),
    extracted_transcript_length: transcriptText.length
  })
})
