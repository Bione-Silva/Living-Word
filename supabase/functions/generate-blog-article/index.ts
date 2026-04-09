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
  detectSensitiveTopics,
  jsonResponse,
  errorResponse,
} from "../common/utils.ts"
import {
  checkAndDebitCredits,
  checkRateLimit,
  getGenerationCost,
  estimateApiCostUsd,
  PLAN_CREDITS,
} from "../common/credits.ts"
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
  sensitive_topics: string[]; author_name: string; historical_context: string
  is_onboarding?: boolean;
  is_conversion?: boolean;
  source_document?: string;
}): string {
  const sensitiveBlock = params.sensitive_topics.length > 0
    ? `\nSENSITIVE CONTEXT: ${params.sensitive_topics.join(", ")} — use welcoming, non-prescriptive tone only.\n`
    : ""

  const imageRule = params.is_onboarding
    ? `2. **HERO IMAGE ONLY (1):** You MUST strategically insert EXACTLY ONE (1) image placeholder at the very top of the body (after the introduction) to serve as a Hero Image. DO NOT add any other placeholders.\nFormat for the placeholder: [IMAGE_PROMPT: <Provide a highly detailed, descriptive English prompt for Gemini Imagen 3, realistic, cinematic aesthetic. No text>]`
    : `2. **DYNAMIC IMAGES (RULES):** You MUST strategically insert image placeholders. If your final text is between 400-500 words, insert EXACTLY 3 placeholders. If your final text is over 500 words, insert EXACTLY 5 placeholders. Split dense blocks of text organically. Never place placeholders back-to-back.\nFormat for the placeholder: [IMAGE_PROMPT: <Provide a highly detailed, descriptive English prompt for Gemini Imagen 3, realistic, cinematic aesthetic. No text>]`

  const conversionMandate = params.is_conversion && params.source_document
    ? `1. **CONVERSION MANDATE:** You are given a SOURCE DOCUMENT. Do not rewrite it completely from scratch to lose its meaning. Your job is to format it as a high-end blog article, expanding it if it's too short (aim for ${params.target_length}), and injecting the IMAGE_PROMPTs organically throughout the text.
SOURCE DOCUMENT TO CONVERT:
${params.source_document}`
    : `1. **EXPANSION MANDATE:** The input may be just a theme, a short note, or raw text. DO NOT just copy or summarize it. You must EXPAND it into a comprehensive, rich narrative.`

  return `You are an expert pastoral blog writer and editor for the Living Word platform. Your task is to TRANSFORM and EXPAND the input into a deeply engaging, narrative-driven ${params.category} article in ${params.language}.

RULES FOR CONTENT (CRITICAL):
${conversionMandate}
2. **WORD COUNT MANDATE:** The generated article MUST contain between 400 and 800 words natively. Extend your thoughts and develop each paragraph extensively to ensure a rich, immersive reading experience. Target Length setting: ${params.target_length}.
3. Use ${params.bible_version} for all Bible quotes. Mark: [DIRECT QUOTE] | [PARAPHRASE] | [ALLUSION]
4. Doctrinal line: ${params.doctrine_line} | Pastoral voice: ${params.pastoral_voice}
5. **LANGUAGE MANDATE (CRITICAL):** The entire output (excluding purely JSON structural keys) MUST be written in ${params.language}. Mixing languages or violating this constraint is strictly forbidden.
6. Article goal: ${params.article_goal} | Author: ${params.author_name}
${sensitiveBlock}
PASSAGE: ${params.bible_passage}
VERSE TEXT: ${params.verse_text || "(use training knowledge, mark as PARAPHRASE)"}
HISTORICAL CONTEXT (RAG): ${params.historical_context}
AUDIENCE: ${params.audience}
CONTEXT/PAIN/INPUT: ${params.pain_point}

RULES FOR STRUCTURING & IMAGES (MANDATORY OMNISEEN SEO):
1. **OMNISEEN EDITORIAL STRUCTURE:** The 'body' must adhere to a premium editorial framework.
   - **USE MARKDOWN STRICTLY:** You MUST use "##" for H2 themes and "###" for H3 sub-points. DO NOT replace headers with simple bold text! DO NOT include H1.
   - Use rich formatting: bullet points, bold text for key insights, and blockquotes (> ) for biblical or historical emphasis.
   - **MANDATORY FAQ:** The article MUST end with a "## Perguntas Frequentes" section containing at least 3 relevant questions and answers about the topic for Semantic SEO.
${imageRule}

Return ONLY valid JSON (no markdown block wrappers around the JSON itself):
{
  "title": "...",
  "meta_description": "... (max 160 chars)",
  "seo_slug": "...",
  "body": "... (full expanded article with IMAGE_PROMPT markers, H2 logic, and FAQ at the end)",
  "tags": ["...", "..."],
  "word_count": 0,
  "watermark": "..."
}`
}

serve(async (req: Request) => {
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
    target_length = "medium", article_goal = "encourage",
    is_onboarding = false, is_conversion = false, source_document = ""
  } = await req.json()

  if (!bible_passage || !category) {
    return errorResponse("bible_passage and category required", 400)
  }

  // 3. Dados do usuário (RLS via scoped client)
  const { data: userData } = await scopedClient
    .from("users")
    .select("plan, credits_balance, doctrine_preference, pastoral_voice, bible_version, language_preference, full_name")
    .eq("id", user.id)
    .single()

  if (!userData) return errorResponse("user_not_found", 404)

  // 4. Rate Limiting
  const rateLimitResult = await checkRateLimit(adminClient, user.id, userData.plan, "generate-blog-article")
  if (!rateLimitResult.allowed) {
    return errorResponse("rate_limit_exceeded", 429, {
      retry_after_seconds: rateLimitResult.retryAfterSeconds,
      detail: rateLimitResult.error,
    })
  }

  // 5. Verificar e debitar créditos (5 créditos por post)
  const postCost = getGenerationCost('post')
  const creditResult = await checkAndDebitCredits(adminClient, user.id, 'post', undefined, postCost)
  if (!creditResult.success) {
    return errorResponse("insufficient_credits", 402, {
      credits_required: postCost,
      credits_remaining: creditResult.remaining,
      plan: userData.plan,
      upgrade_hint: {
        message: `Você precisa de ${postCost} créditos para gerar um artigo. Restam ${creditResult.remaining}.`,
        cta: "upgrade",
      },
    })
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

  // 7.5 Buscar Comentários Históricos (Vector RAG)
  let historicalContext = ""
  try {
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
      body: JSON.stringify({ input: `${bible_passage} ${verseText}`, model: "text-embedding-3-small" }),
    })
    
    if (embeddingResponse.ok) {
      const embeddingJson = await embeddingResponse.json()
      const queryEmbedding = embeddingJson.data[0].embedding
      
      const { data: commentaries } = await adminClient.rpc("match_commentaries", {
        query_embedding: queryEmbedding,
        match_threshold: 0.70,
        match_count: 3
      })
      
      if (commentaries && commentaries.length > 0) {
        historicalContext = "\nObrigatoriamente mencione e referencie estas visões clássicas no corpo do texto ('Conforme o historiador X...'):\n"
        commentaries.forEach((c: any) => {
          historicalContext += `- Segundo ${c.author_name} (Sobre ${c.book_name}): "${c.commentary_text}"\n`
        })
      }
    }
  } catch (e) {
    console.error("RAG Error:", e)
  }

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
    historical_context: historicalContext,
    is_onboarding: is_onboarding,
    is_conversion: is_conversion,
    source_document: source_document,
  })

  const start = Date.now()
  const useProModel = userData.plan !== "free"
  const modelToUse = Deno.env.get("LLM_MODEL") ?? (useProModel ? "gpt-4o" : "gpt-4o-mini")

  const llmResponse = await openai.chat.completions.create({
    model: modelToUse,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 3000, // increased tokens to ensure it can output 800 words + 4 image prompts
    temperature: 0.75,
  })

  const generationMs = Date.now() - start
  const rawOutput = llmResponse.choices[0].message.content ?? "{}"
  const inputTokens = llmResponse.usage?.prompt_tokens ?? 0
  const outputTokens = llmResponse.usage?.completion_tokens ?? 0
  const costUsd = useProModel 
    ? (inputTokens * 0.0000025) + (outputTokens * 0.00001) // GPT-4o pricing approx
    : (inputTokens * 0.00000015) + (outputTokens * 0.0000006) // mini pricing

  let article: any
  try {
    article = JSON.parse(rawOutput.replace(/```json|```/g, "").trim())
  } catch {
    article = { title: "Artigo gerado", body: rawOutput, meta_description: "", seo_slug: "", tags: [], word_count: 0 }
  }

  // NOVA LÓGICA: Extrair [IMAGE_PROMPT: ...] e gerar via Gemini Imagen 3
  const imagePromptRegex = /\[IMAGE_PROMPT:\s*(.+?)\]/g;
  let match;
  const imagePromises: Promise<{ placeholder: string, url: string }>[] = [];

  const maxImages = is_onboarding ? 1 : 10; // Deixa o prompt LLM decidir de acordo com as palavras (3 ou 5)
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  // Helper para base64 -> Uint8Array
  const decodeBase64 = (b64: string) => {
    const binString = atob(b64);
    const size = binString.length;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
  };

  while ((match = imagePromptRegex.exec(article.body)) !== null) {
    const fullTag = match[0];
    const imageDesc = match[1];

    if (imagePromises.length < maxImages && geminiKey) {
      const p = fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: `An editorial blog illustration, photorealistic, cinematic lighting, highly detailed: ${imageDesc}` }],
          parameters: { sampleCount: 1, aspectRatio: "16:9", outputOptions: { mimeType: "image/jpeg" } }
        })
      })
      .then(async (res) => {
        if (!res.ok) throw new Error("Gemini Imagen API error: " + await res.text());
        const data = await res.json();
        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        if (!b64) throw new Error("No image data returned from Gemini");
        
        // Upload to Supabase Storage
        const fileName = `${crypto.randomUUID()}.jpg`;
        const filePath = `generated/${fileName}`;
        const { error: uploadErr } = await adminClient.storage
           .from("images")
           .upload(filePath, decodeBase64(b64), { contentType: "image/jpeg" });
           
        if (uploadErr) throw uploadErr;
        
        const { data: publicUrlData } = adminClient.storage.from("images").getPublicUrl(filePath);
        return { placeholder: fullTag, url: publicUrlData.publicUrl };
      })
      .catch((err) => {
        console.error("Gemini Imagen Error:", err);
        return { placeholder: fullTag, url: "https://via.placeholder.com/1024x576?text=Image+Generation+Failed" };
      });
      imagePromises.push(p);
    }
  }

  const generatedImages = await Promise.all(imagePromises);

  // Substituir na string do corpo final
  generatedImages.forEach(({ placeholder, url }) => {
    // Usamos um alt generico ou apagamos, o importante é substituir o placeholder
    article.body = article.body.replace(placeholder, `\n\n![Ilustração editorial](${url})\n\n`);
  });

  // Limpar qualquer sobressalente se gerou mais de 4
  article.body = article.body.replace(/\[IMAGE_PROMPT:.*?\]/g, "");

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

  // 11. Log de billing com créditos
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
    credits_consumed: postCost,
  })

  // 12. Gatilho de conversão: créditos baixos
  const isFree = userData.plan === "free"
  const planMax = PLAN_CREDITS[userData.plan] ?? 500

  if (isFree && creditResult.remaining < planMax * 0.20) {
    await adminClient.from("conversion_events").insert({
      user_id: user.id,
      event_type: "upgrade_cta_shown",
      trigger_name: "blog_limit",
      user_type: "influencer",
    })
  }

  return jsonResponse({
    material_id: material?.id,
    editorial_queue_id: material?.id,
    article,
    generation_time_ms: generationMs,
    credits_consumed: postCost,
    credits_remaining: creditResult.remaining,
    upgrade_hint: isFree && creditResult.remaining < planMax * 0.20
      ? {
          message: `Restam apenas ${creditResult.remaining} créditos dos seus ${planMax} mensais. Upgrade para continuar gerando.`,
          cta: "upgrade",
          trial_days: 7,
        }
      : null,
  })
})
