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
  detectSensitiveTopics,
  jsonResponse,
  errorResponse,
} from "../common/utils.ts"
import {
  checkAndDebitCredits,
  checkRateLimit,
  calculateTotalCost,
  selectAIModel,
  isGeminiModel,
  estimateApiCostUsd,
  PLAN_CREDITS,
} from "../common/credits.ts"
import { getMenteDNA } from "../common/mentes_dna.ts"
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
    ? `\n---------------------------------------\nCAUTION MODE (MANDATORY)\n---------------------------------------\nSENSITIVE CONTEXT DETECTED: ${params.sensitive_topics.join(", ")}\n- Use compassionate tone.\n- Avoid simplistic answers.\n- Avoid blaming the person.\n- Encourage pastoral/professional community support.\n`
    : ""

  const commentaryBlock = params.commentary_context
    ? `\nEXEGETICAL CONTEXT (from trusted commentaries):\n${params.commentary_context}\nUse this context to enrich your interpretation, but always prioritize the biblical text itself.\n`
    : ""

  const menteDNA = getMenteDNA(params.pastoral_voice)
  const voiceAuthBlock = menteDNA 
    ? `\n---------------------------------------\nVOICE AUTHENTICATION & DNA (CRITICAL)\n---------------------------------------\n${menteDNA}\n\n⚠️ INSTRUÇÃO OBRIGATÓRIA DA VOZ: Você DEVE INICIAR o documento com uma assinatura de identificação. Exemplo: '[Sermão elaborado sob as lentes e o DNA ministerial de ${params.pastoral_voice}]'. Além disso, moldee 100% da pregação ao VOCABULÁRIO e TEOLOGIA deste DNA! PORÉM, NUNCA ALTERE A ESTRUTURA E.X.P.O.S EXIGIDA ABAIXO. A ESTRUTURA É INEGOCIÁVEL.\n`
    : ""

}

function buildSystemPrompt(params: {
  language: string
  output_modes: string[]
  pastoral_voice: string
}): string {
  const modeInstructions: Record<string, string> = {
    sermon: `
### MODE: sermon
Start with: === SERMÃO / SERMON / SERMÓN ===
ESTA PREGAÇÃO DEVE TER O RIGOR DE UM ESTUDO BÍBLICO PROFUNDO.
⚠️ REGRA DE COMPRIMENTO EXTREMO: VOCÊ NÃO PODE RESUMIR. O texto deve ser LONGO, rico e exaustivo (equivalente a 3 a 5 páginas). Desenvolva cada ponto com profundidade teológica. NUNCA gere apenas 2 ou 3 parágrafos curtos.
Você DEVE OBRIGATORIAMENTE estruturar a saída com TODOS os 10 blocos visíveis nesta exata ordem, usando exatamente os nomes dos blocos. É EXPRESSAMENTE PROIBIDO USAR OUTRA ESTRUTURA (como Introdução genérica ou tópicos livres).
1. Âncora Espiritual: (Oração breve)
2. Passagem e Leitura: (Ref e texto)
3. Contexto: (Histórico-cultural, Literário e Canônico)
4. Observação do Texto: (Palavras originais, verbos chave)
5. Interpretação Isolada: (Apenas o que o texto significava na época)
6. Verdade Central (Big Idea)
7. Estrutura Expositiva: (Desenvolva amplamente 2-4 tópicos)
8. Conexão Cristológica: (Como aponta para a obra de Cristo)
9. Aplicação Específica: (Crer, Mudar e Agir)
10. Conclusão e Chamada Pastoral.`,
    outline: `
### MODE: outline
Start with: === ESBOÇO / OUTLINE / ESQUEMA ===
Isto DEVE ser um ESTUDO BÍBLICO ESTRUTURADO em formato de tópicos exegéticos.
Você DEVE OBRIGATORIAMENTE incluir nesta exata ordem:
1. Passagem
2. Contexto (Histórico-Cultural)
3. Observação (Estrutura e repetições)
4. Interpretação
5. Verdade Central
6. Pontos do Esboço (Subpontos explicativos)
7. Perguntas de Discussão Acadêmica/Bíblica
8. Aplicação: O Bisturi (Crer, Mudar, Agir)`,
    devotional: `
### MODE: devotional
Start with: === DEVOCIONAL ===
Você DEVE OBRIGATORIAMENTE incluir nesta exata ordem:
1. Passagem e Leitura
2. Contexto Resumo
3. Observação Real
4. Interpretação
5. Verdade Central
6. Conexão Cristológica
7. Aplicação Cirúrgica
8. Oração de Rendição.`,
    reels: `
### MODE: reels
Start with: === REELS ===
Include: Hook, Passagem, Exegese curta, Quebra de paradigma, Call to Action.`,
    bilingual: `
### MODE: bilingual
Start with: === VERSÃO BILÍNGUE ===
Summary in both languages highlighting key theology.`,
    cell: `
### MODE: cell
Start with: === CULTO / CÉLULA ===
ESTRUTURA CÉLULAS E.X.P.O.S.:
1. Quebra-Gelo
2. Contexto
3. Observação
4. Interpretação
5. Verdade Central
6. Perguntas de Confronto e Discussão Comunitária
7. Dinâmica de Oração.`,
  }

  const sectionsRequested = params.output_modes
    .map(m => modeInstructions[m] ?? "")
    .filter(Boolean)
    .join("\n")

  return `You are a high-level pastoral theological AI producing structured, faithful biblical content.
You must always combine Biblical Exegesis, Theological Interpretation, and Pastoral Application.
You are STRICTLY FORBIDDEN from generating generic sermons. YOU MUST OBEY THE REQUIRED EXACT STRUCTURE ABOVE ALL ELSE.
Never ignore the numbered steps in the requested formats. The structure MUST be exact.
Do not blend rules. Do not hallucinate different sermon structures (do not use "Introduction / Point 1", USE ONLY the numbered steps).

---------------------------------------
CONTENT MODES REQUIRED (GENERATE EACH INDEPENDENTLY)
---------------------------------------
Você deve gerar os seguintes formatos DE FORMA SEPARADA E INDEPENDENTE. Não misture. Cada formato deve conter EXACTAMENTE a estrutura abaixo:

${sectionsRequested}

Write everything in ${params.language}.`
}

function buildUserPrompt(params: {
  language: string
  doctrine_line: string
  pastoral_voice: string
  bible_version: string
  audience: string
  pain_point: string
  bible_passage: string
  verse_text: string
  sensitive_topics: string[]
  commentary_context: string
}): string {
  const menteDNA = getMenteDNA(params.pastoral_voice)
  const voiceAuthBlock = menteDNA 
    ? `\n---------------------------------------\nVOICE AUTHENTICATION & DNA\n---------------------------------------\n${menteDNA}\n⚠️ INSTRUÇÃO DA VOZ: Adapte TODAS as palavras, estilo e tom a esta Mente. EXCEÇÃO ABSOLUTA: A ESTRUTURA de 10 passos do modo 'sermão' (e demais modos) NUNCA deve ser alterada. O estilo muda, mas o ESQUELETO (pontos de 1 a 10) é imutável.\n`
    : ""

  const sensitiveBlock = params.sensitive_topics.length > 0
    ? `\nCAUTION SENSITIVE CONTEXT: ${params.sensitive_topics.join(", ")}\n`
    : ""

  return `Please generate the pastoral material requested following the strict structural rules from the system instructions.
  
PASSAGE: ${params.bible_passage}
VERSE TEXT: ${params.verse_text || "(buscar no próprio conhecimento)"}
AUDIENCE: ${params.audience}
PAIN / CONTEXT: ${params.pain_point}
VOICE: ${params.pastoral_voice}
${voiceAuthBlock}${sensitiveBlock}
EXEGETICAL CONTEXT:
${params.commentary_context || "None provided. Use your theological database."}`
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
  passage: string,
  pain_point: string,
  language: string
): Promise<string> {
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return "";

    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: `${pain_point} ${passage}` })
    }).then(r => r.json());

    const embeddingBytes = embeddingRes?.data?.[0]?.embedding;
    if (!embeddingBytes) return "";

    const { data: ragDocs } = await adminClient.rpc('match_commentaries', {
      query_embedding: embeddingBytes,
      match_threshold: 0.70,
      match_count: 2,
      target_language: language
    });

    if (!ragDocs || ragDocs.length === 0) return "";

    return ragDocs.map((d: any) => `[Teólogo Histórico: ${d.author} (${d.year})] ${d.content}`).join("\n\n");
  } catch (err) {
    console.error("Erro RAG pastoral:", err);
    return "";
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
    .select("plan, credits_balance, doctrine_preference, pastoral_voice, bible_version, language_preference")
    .eq("id", user.id)
    .single()

  if (!userData) return errorResponse("user_not_found", 404)

  // 4. Rate Limiting (anti-abuso)
  const rateLimitResult = await checkRateLimit(adminClient, user.id, userData.plan, "generate-pastoral-material")
  if (!rateLimitResult.allowed) {
    return errorResponse("rate_limit_exceeded", 429, {
      retry_after_seconds: rateLimitResult.retryAfterSeconds,
      detail: rateLimitResult.error,
    })
  }

  // 5. REGRAS DE CONVERSÃO (Conversion Strategy)
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

  // 6. Verificar e debitar créditos (ATÔMICO — anti race-condition)
  const totalCost = calculateTotalCost(resolvedModes)
  const creditResult = await checkAndDebitCredits(adminClient, user.id, "sermon", undefined, totalCost)
  if (!creditResult.success) {
    return errorResponse("insufficient_credits", 402, {
      credits_required: totalCost,
      credits_remaining: creditResult.remaining,
      plan: userData.plan,
      upgrade_hint: {
        message: `Você precisa de ${totalCost} créditos, mas tem apenas ${creditResult.remaining}.`,
        cta: "upgrade",
      },
    })
  }

  // 7. Detectar tópicos sensíveis
  const sensitiveTopics = detectSensitiveTopics(`${pain_point} ${audience}`, resolvedLanguage)

  // 8. Buscar versículo real
  const verseResult = await fetchBibleVerse(bible_passage, resolvedVersion as any, resolvedLanguage)
  const verseText = verseResult?.text ?? ""

  // 9. Buscar contexto exegético (RAG)
  const commentaryContext = await fetchCommentaryContext(adminClient, bible_passage, pain_point, resolvedLanguage)

  // 10. Montar e enviar prompt
  const systemPrompt = buildSystemPrompt({
    language: resolvedLanguage,
    output_modes: resolvedModes,
    pastoral_voice: resolvedVoice,
  })

  const userPrompt = buildUserPrompt({
    language: resolvedLanguage,
    doctrine_line: resolvedDoctrine,
    pastoral_voice: resolvedVoice,
    bible_version: resolvedVersion,
    audience,
    pain_point,
    bible_passage,
    verse_text: verseText,
    sensitive_topics: sensitiveTopics,
    commentary_context: commentaryContext,
  })

  const start = Date.now()
  const primaryMode = resolvedModes[0] ?? "sermon"
  const modelToUse = selectAIModel(userData.plan, primaryMode)
  let rawOutput = ""
  let inputTokens = 0
  let outputTokens = 0
  let outputs: Record<string, string> = {}
  let validationErrors: string[] = []

  const generateLLM = async () => {
    if (isGeminiModel(modelToUse)) {
      const geminiKey = Deno.env.get("GEMINI_API_KEY")!
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
        })
      })
      if (!geminiRes.ok) throw new Error(`${modelToUse} failed com status ${geminiRes.status}`)
      const data = await geminiRes.json()
      rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
      inputTokens = data.usageMetadata?.promptTokenCount ?? (systemPrompt.length + userPrompt.length) / 4
      outputTokens = data.usageMetadata?.candidatesTokenCount ?? rawOutput.length / 4
    } else {
      const llmResponse = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 8000,
        temperature: 0.7,
      })
      rawOutput = llmResponse.choices[0].message.content ?? ""
      inputTokens = llmResponse.usage?.prompt_tokens ?? 0
      outputTokens = llmResponse.usage?.completion_tokens ?? 0
    }
  }

  const MAX_RETRIES = 2
  let finalSuccess = false

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await generateLLM()
    } catch (e) {
      validationErrors.push(`Attempt ${attempt + 1}: Erro de rede/API - ${(e as Error).message}`)
      continue
    }

    outputs = parseOutputSections(rawOutput)
    
    // --- MÓDULO DE VALIDAÇÃO (Word Count Audit) ---
    let allValid = true
    for (const mode of resolvedModes) {
      const content = outputs[mode] ?? ""
      const wordCount = content.split(/\s+/).filter(Boolean).length
      
      const minRequired = mode === "sermon" ? 400 : 150
      
      if (wordCount < minRequired) {
        let errorMsg = `[FALHA DE VALIDAÇÃO] O modo '${mode}' gerou apenas ${wordCount} palavras. O mínimo exigido é ${minRequired}.`
        console.warn(errorMsg)
        validationErrors.push(`Attempt ${attempt + 1}: ${errorMsg}`)
        allValid = false
        break
      }
    }

    if (allValid) {
      finalSuccess = true
      break
    }
  }

  if (!finalSuccess) {
    // 10.5 Se falhar estritamente na validação, registramos um log de falha de estruturação teológica
    await adminClient.from("generation_logs").insert({
      user_id: user.id,
      language: resolvedLanguage,
      mode: "pastoral",
      llm_model: modelToUse,
      theology_guardrails_triggered: true,
      sensitive_topic_detected: "validation_failed",
      error_code: "insufficient_length",
    })
    
    return errorResponse("generation_quality_failed", 422, {
      message: "O modelo gerou um material muito curto após várias tentativas. Ele falhou em atender as 400 palavras mínimas exigidas pela metodologia E.X.P.O.S. Tente gerar um formato por vez.",
      details: validationErrors
    })
  }

  const generationMs = Date.now() - start

  // 11. Auditoria de citações
  const directQuotes = (rawOutput.match(/\[CITAÇÃO DIRETA\]|\[DIRECT QUOTE\]/gi) ?? []).length
  const paraphrases = (rawOutput.match(/\[PARÁFRASE\]|\[PARAPHRASE\]/gi) ?? []).length
  const allusions = (rawOutput.match(/\[ALUSÃO\]|\[ALLUSION\]/gi) ?? []).length
  const layersMarked = rawOutput.includes("[TEXT]") || rawOutput.includes("[TEXTO]")

  // 12. Calcular custo em USD (para analytics)
  const costUsd = estimateApiCostUsd(modelToUse, inputTokens, outputTokens)

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

  // 14. Log de billing com créditos consumidos (via admin)
  await adminClient.from("generation_logs").insert({
    user_id: user.id,
    material_id: material?.id,
    language: resolvedLanguage,
    mode: "pastoral",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    generation_time_ms: generationMs,
    llm_model: modelToUse,
    theology_guardrails_triggered: layersMarked,
    sensitive_topic_detected: sensitiveTopics.join(",") || null,
    cost_usd: costUsd,
    credits_consumed: totalCost,
  })

  // 15. Gatilho de conversão: créditos baixos (< 20% restante)
  const planMax = PLAN_CREDITS[userData.plan] ?? 500
  if (isFree && creditResult.remaining < planMax * 0.20) {
    await adminClient.from("conversion_events").insert({
      user_id: user.id,
      event_type: "upgrade_cta_shown",
      trigger_name: "generation_4of5",
      user_type: "pastor",
    })
  }

  // 16. Response
  return jsonResponse({
    material_id: material?.id,
    outputs,
    historical_sources_used: commentaryContext.length > 0 ? commentaryContext : null,
    blocked_formats: isFree ? blockedFormats : [],
    theology_layers_marked: layersMarked,
    citation_audit: { direct_quotes: directQuotes, paraphrases, allusions, bible_version_used: resolvedVersion },
    sensitive_topic_detected: sensitiveTopics.length > 0 ? sensitiveTopics : null,
    generation_time_ms: generationMs,
    credits_consumed: totalCost,
    credits_remaining: creditResult.remaining,
    model_used: modelToUse,
    generation_meta: {
      model: modelToUse,
      total_tokens: inputTokens + outputTokens,
      total_cost_usd: costUsd,
      elapsed_ms: generationMs,
      per_format: Object.fromEntries(
        resolvedModes.map(mode => [
          mode,
          {
            tokens: Math.round((inputTokens + outputTokens) / resolvedModes.length),
            words: (outputs[mode] ?? "").split(/\s+/).filter(Boolean).length,
            cost_usd: costUsd / resolvedModes.length,
            attempts: validationErrors.length + 1
          }
        ])
      )
    },
    upgrade_hint: isFree && creditResult.remaining < planMax * 0.20
      ? { message: `Restam apenas ${creditResult.remaining} créditos dos seus ${planMax} mensais.`, cta: "upgrade", trial_days: 7 }
      : null,
  })
})
