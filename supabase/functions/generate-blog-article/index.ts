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
  sensitive_topics: string[]; author_name: string; historical_context: string
}): string {
  const sensitiveBlock = params.sensitive_topics.length > 0
    ? `\nSENSITIVE CONTEXT: ${params.sensitive_topics.join(", ")} — use welcoming, non-prescriptive tone only.\n`
    : ""

  return `You are an expert pastoral blog writer and editor for the Living Word platform. Your task is to TRANSFORM and EXPAND the input into a deeply engaging, narrative-driven ${params.category} article in ${params.language}.

RULES FOR CONTENT (CRITICAL):
1. **EXPANSION MANDATE:** The input may be just a theme, a short note, or raw text. DO NOT just copy or summarize it. You must EXPAND it into a comprehensive, rich narrative.
2. **MINIMUM LENGTH MANDATE:** The generated article MUST contain at least 400 words (approx. 2500+ characters). It is severely strictly forbidden to return short articles. Expand on historical, theological, and practical applications to ensure depth and length. Target Length setting: ${params.target_length}.
3. Use ${params.bible_version} for all Bible quotes. Mark: [DIRECT QUOTE] | [PARAPHRASE] | [ALLUSION]
4. Doctrinal line: ${params.doctrine_line} | Pastoral voice: ${params.pastoral_voice}
5. Article goal: ${params.article_goal} | Author: ${params.author_name}
${sensitiveBlock}
PASSAGE: ${params.bible_passage}
VERSE TEXT: ${params.verse_text || "(use training knowledge, mark as PARAPHRASE)"}
HISTORICAL CONTEXT (RAG): ${params.historical_context}
AUDIENCE: ${params.audience}
CONTEXT/PAIN/INPUT: ${params.pain_point}

RULES FOR STRUCTURING & IMAGES (MANDATORY):
1. The 'body' must be fully structured using professional Markdown.
2. Use H2 (##) and H3 (###) to separate logical sections. DO NOT include H1 (the front-end will render the title as H1).
3. Use bullet points and well-developed paragraphs for readability.
4. **EXACTLY 4 IMAGES REQUIRED:** You MUST strategically insert EXACTLY 4 image placeholders within the text to split dense blocks of text organically (e.g. after major sections). 
Format for the placeholder: [IMAGE_PROMPT: <Provide a highly detailed, descriptive, and historically accurate English prompt to generate an image for this specific section, ensuring high-quality, realistic, and cinematic aesthetic. Do NOT contain text or words in the image>].
Example usage inside body: 
...text paragraph...
## Finding hope
[IMAGE_PROMPT: A cinematic, warm-lit photograph of a shepherd holding a staff looking over a green valley at sunrise]
...text paragraph...

Return ONLY valid JSON (no markdown block wrappers around the JSON itself):
{
  "title": "...",
  "meta_description": "... (max 160 chars)",
  "seo_slug": "...",
  "body": "... (full expanded article with EXACTLY 4 IMAGE_PROMPT markers and deep narrative)",
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

  // NOVA LÓGICA: Extrair [IMAGE_PROMPT: ...] e gerar DALL-E 3
  const imagePromptRegex = /\[IMAGE_PROMPT:\s*(.+?)\]/g;
  let match;
  const imagePromises: Promise<{ placeholder: string, url: string }>[] = [];

  while ((match = imagePromptRegex.exec(article.body)) !== null) {
    const fullTag = match[0];
    const imageDesc = match[1];

    // Limitar a max 4 para evitar estourar budget/timeout se a IA alucinar mais
    if (imagePromises.length < 4) {
      const p = openai.images.generate({
        model: "dall-e-3",
        prompt: `An editorial blog illustration: ${imageDesc}`,
        n: 1,
        size: "1024x1024",
      })
      .then(imgRes => ({
        placeholder: fullTag,
        url: imgRes.data[0].url ?? "https://via.placeholder.com/1024x576?text=Image+Generation+Failed",
      }))
      .catch((err) => {
        console.error("DALL-E 3 Error:", err);
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
