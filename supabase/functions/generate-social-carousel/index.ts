import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4"
import {
  handleCors,
  createScopedClient,
  createAdminClient,
  getAuthUser,
  jsonResponse,
  errorResponse,
} from "../common/utils.ts"
import {
  checkAndDebitCredits,
  checkRateLimit,
  isGeminiModel,
  isClaudeModel,
  estimateApiCostUsd,
} from "../common/credits.ts"
import { getMenteDNA } from "../common/mentes_dna.ts"

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! })

const SYSTEM_PROMPT = `You are an elite Christian Social Media Manager & Pastoral Theologian.
Your objective is to generate an Instagram Carousel script based on a biblical text or theological topic.
You MUST return the response EXACTLY as a raw, valid JSON object with a single root key called "slides".
DO NOT include markdown fences (like \`\`\`json), DO NOT include prefixes like "Here is the JSON" or anything outside the JSON.

The structure of the JSON MUST strictly be:
{
  "slides": [
    { "slide": 1, "type": "cover", "title": "Strong Hook Title (Max 6 words)", "subtitle": "Curiosity builder (Max 10 words)" },
    { "slide": 2, "type": "hook", "title": "The specific pain or bold claim", "content": "1-2 short sentences" },
    { "slide": 3, "type": "problem", "title": "Validation of the pain", "content": "Explain why this hurts or how common it is" },
    { "slide": 4, "type": "aggravation", "title": "The false solution", "content": "What people usually do wrong" },
    { "slide": 5, "type": "solution", "title": "The Biblical Insight", "content": "The theological or biblical truth (quote a verse if relevant)" },
    { "slide": 6, "type": "action", "title": "Practical Step", "content": "What to do right now, practically" },
    { "slide": 7, "type": "cta", "title": "Call to Action", "content": "E.g., Save this for later, or Share with someone who needs this" }
  ]
}

Ensure the tone is culturally relevant, visually adaptable, and deeply theological.`

function buildUserPrompt(params: {
  topic: string
  verse: string
  pastoral_voice: string
}): string {
  const menteDNA = getMenteDNA(params.pastoral_voice)
  const voiceAuthBlock = menteDNA 
    ? `\n---------------------------------------\nVOICE AUTHENTICATION & DNA\n---------------------------------------\n${menteDNA}\n⚠️ INSTRUÇÃO DA VOZ: Adapte TODAS as palavras, estilo e tom a esta Mente na hora de preencher os slides.\n`
    : ""

  return `Generate the 7-slide carousel script following the JSON object structure { "slides": [...] }.
  
TOPIC / PAIN: ${params.topic}
VERSE TEXT: ${params.verse || "(No specific verse, focus on the topic)"}
VOICE / TONE: ${params.pastoral_voice}
${voiceAuthBlock}
`
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== "POST") return errorResponse("method_not_allowed", 405)

  // 1. Autenticação
  const { user, authHeader, error: authError } = await getAuthUser(req)
  if (authError || !user || !authHeader) return errorResponse("unauthorized", 401)

  const adminClient = createAdminClient()

  // 2. Parse body
  const body = await req.json()
  const {
    topic, verse = "", pastoral_voice = "welcoming", llm_provider = "claude"
  } = body

  if (!topic && !verse) return errorResponse("topic or verse is required", 400)

  // 3. Buscar dados do usuário
  const { data: userData } = await adminClient
    .from("profiles")
    .select("plan, credits_remaining, pastoral_voice")
    .eq("id", user.id)
    .single()

  if (!userData) return errorResponse("user_not_found", 404)

  // 4. Rate Limiting
  const rateLimitResult = await checkRateLimit(adminClient, user.id, userData.plan, "generate-social-carousel")
  if (!rateLimitResult.allowed) {
    return errorResponse("rate_limit_exceeded", 429, {
      retry_after_seconds: rateLimitResult.retryAfterSeconds,
      detail: rateLimitResult.error,
    })
  }

  // 5. Verificar e debitar créditos (Vamos definir o custo como 10 créditos para ser similar ao Reels/Devotional)
  const totalCost = 10
  const creditResult = await checkAndDebitCredits(adminClient, user.id, "post", undefined, totalCost)
  if (!creditResult.success) {
    return errorResponse("insufficient_credits", 402, {
      credits_required: totalCost,
      credits_remaining: creditResult.remaining,
      plan: userData.plan,
    })
  }

  // 6. Configurar LLM
  let modelToUse = "claude-3-5-sonnet-20241022" // Padrão se não enviado
  if (llm_provider === "claude") modelToUse = "claude-3-5-sonnet-20241022"
  if (llm_provider === "openai") modelToUse = "gpt-4o-mini"
  if (llm_provider === "gemini") modelToUse = "gemini-2.5-flash"

  const userPrompt = buildUserPrompt({
    topic: topic || verse,
    verse: verse,
    pastoral_voice: pastoral_voice ?? userData.pastoral_voice ?? "welcoming",
  })

  const start = Date.now()
  let rawOutput = ""
  let inputTokens = 0
  let outputTokens = 0

  try {
    if (isClaudeModel(modelToUse)) {
      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!
      if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY is missing")

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 2000,
          temperature: 0.7,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }]
        })
      })
      if (!res.ok) throw new Error(`Anthropic failed: ${res.status} ${await res.text()}`)
      const data = await res.json()
      rawOutput = data.content?.[0]?.text ?? ""
      inputTokens = data.usage?.input_tokens ?? 0
      outputTokens = data.usage?.output_tokens ?? 0

    } else if (isGeminiModel(modelToUse)) {
      const geminiKey = Deno.env.get("GEMINI_API_KEY")!
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.7, responseMimeType: "application/json" }
        })
      })
      if (!res.ok) throw new Error(`Gemini failed: ${res.status} ${await res.text()}`)
      const data = await res.json()
      rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
      inputTokens = data.usageMetadata?.promptTokenCount ?? 0
      outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0

    } else {
      // OpenAI
      const llmResponse = await openai.chat.completions.create({
        model: modelToUse,
        response_format: { type: "json_object" }, // To encourage JSON but we expect an array. So we'll let it be normal or prompt json.
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      })
      rawOutput = llmResponse.choices[0].message.content ?? ""
      inputTokens = llmResponse.usage?.prompt_tokens ?? 0
      outputTokens = llmResponse.usage?.completion_tokens ?? 0
    }
  } catch (e) {
    console.error("LLM Generation Error:", e)
    return errorResponse("generation_failed", 500, { detail: (e as Error).message })
  }

  const generationMs = Date.now() - start

  // Try to parse JSON output
  let parsedSlides = []
  try {
    // LLMs might still wrap in markdown
    const cleanJson = rawOutput.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim()
    parsedSlides = JSON.parse(cleanJson)
    // If wrapped in an object like { "slides": [...] }
    if (!Array.isArray(parsedSlides) && Array.isArray(parsedSlides.slides)) {
      parsedSlides = parsedSlides.slides
    }
  } catch (e) {
    console.error("Failed to parse JSON", rawOutput)
    return errorResponse("generation_quality_failed", 422, { message: "O LLM não retornou um JSON válido." })
  }

  const costUsd = estimateApiCostUsd(modelToUse, inputTokens, outputTokens)

  // 7. Log de billing
  await adminClient.from("generation_logs").insert({
    user_id: user.id,
    language: "PT",
    mode: "social_carousel",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    generation_time_ms: generationMs,
    llm_model: modelToUse,
    cost_usd: costUsd,
    credits_consumed: totalCost,
  })

  // 8. Payload de Resposta
  return jsonResponse({
    slides: parsedSlides,
    generation_time_ms: generationMs,
    credits_consumed: totalCost,
    credits_remaining: creditResult.remaining,
    model_used: modelToUse,
    generation_meta: {
      model: modelToUse,
      total_tokens: inputTokens + outputTokens,
      total_cost_usd: costUsd,
      elapsed_ms: generationMs,
    }
  })
})
