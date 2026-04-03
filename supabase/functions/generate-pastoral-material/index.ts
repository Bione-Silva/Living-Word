/**
 * Living Word — generate-pastoral-material
 *
 * Core da Frente A: Estúdio Pastoral
 * Gera até 6 formatos (sermão, esboço, devocional, reels, bilíngue, célula)
 *
 * SEGURANÇA: Usa Scoped Client para leitura (RLS ativo).
 *            Admin Client apenas para logs de billing e incremento de contador.
 *
 * CONVERSÃO: Aplica regras da Conversion Strategy:
 *   - Free: apenas sermon + outline + devotional
 *   - Free: apenas voz "welcoming"
 *   - Free: apenas ARA/KJV/RVR60
 *   - Gatilho 1: aviso na geração 4/5
 *   - Gatilho 2: formatos bloqueados visíveis mas não entregues
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

// ============================================================
// Formatos permitidos por plano (Conversion Strategy)
// ============================================================
const FREE_FORMATS = ["sermon", "outline", "devotional"]
const FREE_VOICES = ["welcoming"]
const FREE_VERSIONS: Record<string, string> = { PT: "ARA", EN: "KJV", ES: "RVR60" }

// ============================================================
// Prompt Master v3
// ============================================================
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
  commentary_context: string  // RAG bíblico
}): string {
  const sensitiveBlock = params.sensitive_topics.length > 0
    ? `\nSENSITIVE CONTEXT DETECTED: ${params.sensitive_topics.join(", ")}\nActivate CAUTION MODE: use welcoming tone only, never prescriptive, never give legal/clinical advice, add note recommending qualified pastoral or professional support.\n`
    : ""

  const commentaryBlock = params.commentary_context
    ? `\nEXEGETICAL CONTEXT (from trusted commentaries):\n${params.commentary_context}\nUse this context to enrich your interpretation, but always prioritize the biblical text itself.\n`
    : ""

  const labels: Record<string, string> = {
    sermon: "=== SERMÃO / SERMON / SERMÓN ===",
    outline: "=== ESBOÇO / OUTLINE / ESQUEMA ===",
    devotional: "=== DEVOCIONAL ===",
    reels: "=== REELS (5 frases) ===",
    bilingual: "=== VERSÃO BILÍNGUE ===",
    cell: "=== CULTO / CÉLULA ===",
  }

  const sectionsRequested = params.output_modes
    .map(m => labels[m] ?? "")
    .filter(Boolean)
    .join("\n")

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
${sensitiveBlock}${commentaryBlock}
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

// ============================================================
// Parser de seções da resposta
// ============================================================
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
    const nextDelim = delimiters
      .slice(i + 1)
      .map(d => raw.search(d.pattern))
      .find(n => n > match) ?? raw.length
    sections[delimiters[i].key] = raw.slice(start, nextDelim).trim()
  }

  return sections
}

// ============================================================
// RAG: buscar comentários bíblicos via pgvector
// ============================================================
async function fetchCommentaryContext(
  adminClient: ReturnType<typeof createAdminClient>,
  passage: string
): Promise<string> {
  try {
    // Extrair livro e capítulo da passagem
    const parsed = passage.match(/^(.+?)\s+(\d+)/i)
    if (!parsed) return ""

    // Para o MVP, buscar por texto direto (sem embedding) até termos dados vetoriais
    const { data } = await adminClient
      .from("bible_commentary_embeddings")
      .select("source, commentary_text")
      .ilike("book", `%${parsed[1]}%`)
      .eq("chapter", parseInt(parsed[2]))
      .limit(3)

    if (!data || data.length === 0) return ""

    return data
      .map((c: { source: string; commentary_text: string }) => `[${c.source}]: ${c.commentary_text}`)
      .join("\n\n")
  } catch {
    return "" // Nunca bloqueia a geração
  }
}

// ============================================================
// Handler Principal
// ============================================================
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== "POST") return errorResponse("method_not_allowed", 405)

  // 1. Autenticação
  const { user, authHeader, error: authError } = await getAuthUser(req)
  if (authError || !user || !authHeader) return errorResponse("unauthorized", 401)

  // Criar clients
  const scopedClient = createScopedClient(authHeader)
  const adminClient = createAdminClient()

  // 2. Parse body
  const body = await req.json()
  const {
    bible_passage, audience = "", pain_point = "",
    doctrine_line, language = "PT", pastoral_voice,
    bible_version, output_modes = ["sermon", "outline", "devotional", "reels", "bilingual", "cell"]
  } = body

  if (!bible_passage) return errorResponse("bible_passage is required", 400)

  // 3. Buscar dados do usuário (via scoped client — RLS ativo)
  const { data: userData } = await scopedClient
    .from("users")
    .select("plan, generation_count_month, generation_reset_date, doctrine_preference, pastoral_voice, bible_version, language_preference")
    .eq("id", user.id)
    .single()

  if (!userData) return errorResponse("user_not_found", 404)

  // 4. Reset mensal se necessário (via admin — cross-row update)
  const today = new Date()
  const resetDate = new Date(userData.generation_reset_date)
  if (today.getMonth() !== resetDate.getMonth() || today.getFullYear() !== resetDate.getFullYear()) {
    await adminClient.from("users").update({
      generation_count_month: 0,
      generation_reset_date: today.toISOString().slice(0, 10)
    }).eq("id", user.id)
    userData.generation_count_month = 0
  }

  // 5. Verificar limite do plano
  const limit = PLAN_LIMITS[userData.plan] ?? 5
  if (userData.generation_count_month >= limit) {
    return errorResponse("generation_limit_reached", 429, { limit, plan: userData.plan })
  }

  // 6. REGRAS DE CONVERSÃO (Conversion Strategy)
  const isFree = userData.plan === "free"
  let resolvedModes = output_modes as string[]
  let resolvedVoice = pastoral_voice ?? userData.pastoral_voice ?? "welcoming"
  let resolvedVersion = bible_version ?? userData.bible_version ?? "ARA"
  const resolvedLanguage = language ?? userData.language_preference ?? "PT"
  const resolvedDoctrine = doctrine_line ?? userData.doctrine_preference ?? "evangelical_general"

  // Formatos bloqueados pra Free
  const blockedFormats: string[] = []
  if (isFree) {
    blockedFormats.push(...resolvedModes.filter(m => !FREE_FORMATS.includes(m)))
    resolvedModes = resolvedModes.filter(m => FREE_FORMATS.includes(m))
    if (resolvedModes.length === 0) resolvedModes = ["sermon", "outline", "devotional"]
  }

  // Voz bloqueada pra Free
  if (isFree && !FREE_VOICES.includes(resolvedVoice)) {
    resolvedVoice = "welcoming"
  }

  // Versão bíblica bloqueada pra Free
  if (isFree) {
    const allowedVersion = FREE_VERSIONS[resolvedLanguage] ?? "ARA"
    if (resolvedVersion !== allowedVersion) {
      resolvedVersion = allowedVersion
    }
  }

  // 7. Detectar tópicos sensíveis
  const sensitiveTopics = detectSensitiveTopics(`${pain_point} ${audience}`, resolvedLanguage)

  // 8. Buscar versículo real
  const verseResult = await fetchBibleVerse(bible_passage, resolvedVersion as any, resolvedLanguage)
  const verseText = verseResult?.text ?? ""

  // 9. Buscar contexto exegético (RAG)
  const commentaryContext = await fetchCommentaryContext(adminClient, bible_passage)

  // 10. Montar e enviar prompt
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
    output_modes: resolvedModes,
    commentary_context: commentaryContext,
  })

  const start = Date.now()
  let llmResponse

  try {
    llmResponse = await openai.chat.completions.create({
      model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    })
  } catch {
    // Retry 1x em timeout
    try {
      llmResponse = await openai.chat.completions.create({
        model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      })
    } catch {
      return errorResponse("llm_timeout", 503)
    }
  }

  const generationMs = Date.now() - start
  const rawOutput = llmResponse.choices[0].message.content ?? ""
  const outputs = parseOutputSections(rawOutput)

  // 11. Auditoria de citações
  const directQuotes = (rawOutput.match(/\[CITAÇÃO DIRETA\]|\[DIRECT QUOTE\]/gi) ?? []).length
  const paraphrases = (rawOutput.match(/\[PARÁFRASE\]|\[PARAPHRASE\]/gi) ?? []).length
  const allusions = (rawOutput.match(/\[ALUSÃO\]|\[ALLUSION\]/gi) ?? []).length
  const layersMarked = rawOutput.includes("[TEXT]") || rawOutput.includes("[TEXTO]")

  // 12. Calcular custo
  const inputTokens = llmResponse.usage?.prompt_tokens ?? 0
  const outputTokens = llmResponse.usage?.completion_tokens ?? 0
  const costUsd = (inputTokens * 0.00000015) + (outputTokens * 0.0000006)

  // 13. Salvar material (via scoped client — RLS garante ownership)
  const { data: material } = await scopedClient.from("materials").insert({
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
    generation_time_ms: generationMs,
  }).select().single()

  // 14. Incrementar contador (via admin — precisa superar RLS pra update numerico)
  await adminClient.from("users")
    .update({ generation_count_month: userData.generation_count_month + 1 })
    .eq("id", user.id)

  // 15. Log de billing (via admin)
  await adminClient.from("generation_logs").insert({
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
    cost_usd: costUsd,
  })

  // 16. Gatilho de conversão: registrar se geração 4/5 (Gatilho 1)
  const newCount = userData.generation_count_month + 1
  if (isFree && newCount === 4) {
    await adminClient.from("conversion_events").insert({
      user_id: user.id,
      event_type: "upgrade_cta_shown",
      trigger_name: "generation_4of5",
      user_type: "pastor",
    })
  }

  // 17. Response
  return jsonResponse({
    material_id: material?.id,
    outputs,
    blocked_formats: isFree ? blockedFormats : [],
    theology_layers_marked: layersMarked,
    citation_audit: { direct_quotes: directQuotes, paraphrases, allusions, bible_version_used: resolvedVersion },
    sensitive_topic_detected: sensitiveTopics.length > 0 ? sensitiveTopics : null,
    generation_time_ms: generationMs,
    generations_remaining: limit - newCount,
    upgrade_hint: isFree && newCount >= 4
      ? { message: `Você usou ${newCount} das suas ${limit} gerações este mês.`, cta: "pastoral", trial_days: 7 }
      : null,
  })
})
