// supabase/functions/generate-biblical-study/index.ts
// Living Word — Motor Teológico: Estudo Bíblico Estruturado
// Schema: 1.0 | Mode: biblical_study
// ─────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─────────────────────────────────────────────────────────────
// Tipos (espelhados do shared/types/biblicalStudy.ts)
// ─────────────────────────────────────────────────────────────

type DepthLevel = 'basic' | 'intermediate' | 'advanced'
type SourceConfidence = 'high' | 'medium' | 'low'

interface BiblicalStudyInput {
  bible_passage: string
  theme?: string
  language: 'PT' | 'EN' | 'ES'
  bible_version: string
  doctrine_line: string
  pastoral_voice: string
  depth_level: DepthLevel
}

interface BiblicalStudyOutput {
  schema_version: '1.0'
  title: string
  bible_passage: string
  central_idea: string
  depth_level: DepthLevel
  doctrine_line: string
  language: string
  caution_mode: boolean
  sensitive_topic_detected?: string
  summary: string
  historical_context: { text: string; source_confidence: SourceConfidence }
  literary_context: { genre: string; position_in_book: string; source_confidence: SourceConfidence }
  text_structure: Array<{ section: string; verses: string; description: string }>
  bible_text: Array<{ reference: string; text: string; version: string }>
  exegesis: Array<{
    focus: string
    linguistic_note: string
    theological_insight: string
    source_confidence: SourceConfidence
  }>
  theological_interpretation: Array<{
    perspective: string
    interpretation: string
    is_debated: boolean
    sources?: string[]
    source_confidence: SourceConfidence
  }>
  biblical_connections: Array<{
    reference: string
    relationship: string
    note: string
  }>
  application: Array<{
    context: string
    application: string
    practical_action: string
  }>
  reflection_questions: Array<{ question: string; target_audience?: string }>
  conclusion: string
  pastoral_warning: string
  generated_at: string
  rag_sources_used?: string[]
}

// ─────────────────────────────────────────────────────────────
// Tópicos sensíveis — disparam Caution Mode
// ─────────────────────────────────────────────────────────────

const SENSITIVE_TOPICS = [
  'suicide', 'suicídio', 'depressão', 'depression', 'luto', 'grief',
  'trauma', 'abuso', 'abuse', 'morte', 'death', 'divórcio', 'divorce',
  'violência', 'violence', 'vício', 'addiction',
]

function detectSensitiveTopic(text: string): string | null {
  const lowerText = text.toLowerCase()
  return SENSITIVE_TOPICS.find((topic) => lowerText.includes(topic)) ?? null
}

// ─────────────────────────────────────────────────────────────
// Configurações por depth_level (impacto real na geração)
// ─────────────────────────────────────────────────────────────

function getDepthConfig(depth: DepthLevel) {
  return {
    basic: {
      exegesis_points: 2,
      interpretations: 1,
      connections: 2,
      applications: 2,
      questions: 3,
      rag_threshold: 0.8,
      has_linguistic_notes: false,
      model: 'gpt-4o-mini',
    },
    intermediate: {
      exegesis_points: 4,
      interpretations: 2,
      connections: 4,
      applications: 3,
      questions: 5,
      rag_threshold: 0.75,
      has_linguistic_notes: true,
      model: 'gpt-4o-mini',
    },
    advanced: {
      exegesis_points: 6,
      interpretations: 3,
      connections: 6,
      applications: 4,
      questions: 7,
      rag_threshold: 0.7,
      has_linguistic_notes: true,
      model: 'gpt-4o',
    },
  }[depth]
}

// ─────────────────────────────────────────────────────────────
// Busca de comentários via RAG (pgvector)
// ─────────────────────────────────────────────────────────────

async function fetchCommentaryContext(
  supabase: ReturnType<typeof createClient>,
  passage: string,
  threshold: number,
  openaiKey: string,
): Promise<{ text: string; sources: string[] }> {
  try {
    // Embed a passagem para busca vetorial
    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: `Biblical commentary on ${passage}`,
      }),
    })

    if (!embedRes.ok) throw new Error('Embedding failed')

    const embedData = await embedRes.json()
    const embedding = embedData.data[0].embedding

    const { data: commentaries, error } = await supabase.rpc('match_commentary', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: 5,
    })

    if (error || !commentaries?.length) {
      return { text: '', sources: [] }
    }

    const sources = [...new Set(commentaries.map((c: { source: string }) => c.source as string))]
    const text = commentaries
      .map((c: { source: string; book: string; chapter: number; verse_start: number; commentary_text: string }) =>
        `[${c.source} on ${c.book} ${c.chapter}:${c.verse_start}]: ${c.commentary_text}`)
      .join('\n\n')

    return { text, sources }
  } catch {
    // Falha silenciosa — RAG é enriquecimento, não bloqueante
    return { text: '', sources: [] }
  }
}

// ─────────────────────────────────────────────────────────────
// Validação do JSON de output do LLM
// ─────────────────────────────────────────────────────────────

const REQUIRED_KEYS = [
  'schema_version', 'title', 'bible_passage', 'central_idea',
  'historical_context', 'literary_context', 'text_structure',
  'exegesis', 'theological_interpretation', 'biblical_connections',
  'application', 'reflection_questions', 'conclusion',
  'pastoral_warning', 'caution_mode',
] as const

function validateOutput(data: unknown): { valid: boolean; error?: string } {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Output is not an object' }
  }
  const obj = data as Record<string, unknown>

  for (const key of REQUIRED_KEYS) {
    if (obj[key] === undefined || obj[key] === null) {
      return { valid: false, error: `Missing required key: ${key}` }
    }
  }

  if (!Array.isArray(obj.exegesis) || (obj.exegesis as unknown[]).length < 1) {
    return { valid: false, error: 'exegesis must be a non-empty array' }
  }

  if (!Array.isArray(obj.reflection_questions) || (obj.reflection_questions as unknown[]).length < 3) {
    return { valid: false, error: 'reflection_questions must have at least 3 items' }
  }

  if (typeof obj.title !== 'string' || obj.title.trim() === '') {
    return { valid: false, error: 'title must be a non-empty string' }
  }

  if (typeof obj.central_idea !== 'string' || obj.central_idea.trim() === '') {
    return { valid: false, error: 'central_idea must be a non-empty string' }
  }

  return { valid: true }
}

// ─────────────────────────────────────────────────────────────
// System Prompt teológico principal
// ─────────────────────────────────────────────────────────────

function buildSystemPrompt(
  input: BiblicalStudyInput,
  ragContext: string,
  cautionMode: boolean,
  sensitiveTopicDetected: string | null,
  depthConfig: ReturnType<typeof getDepthConfig>,
): string {
  const cautionInstruction = cautionMode
    ? `
⚠️ CAUTION MODE ATIVADO — tópico sensível detectado: "${sensitiveTopicDetected}".
Regras adicionais:
- Use linguagem cuidadosa, acolhedora e nunca prescritiva.
- Evite imperativo que possa soar como julgamento.
- Saliente o cuidado pastoral e encaminhe para ajuda profissional quando cabível.
- NUNCA minimize a dor ou trivialize o sofrimento humano.
`
    : ''

  const ragInstruction = ragContext
    ? `\nContexto histórico e comentarístico (RAG — use para enriquecer, NUNCA para contradizer o texto):\n${ragContext}\n`
    : ''

  const linguisticNote = depthConfig.has_linguistic_notes
    ? '- Em cada ponto de exegese, inclua notas linguísticas (hebraico, grego ou aramaico quando aplicável).'
    : '- Neste nível básico, omita notas linguísticas avançadas.'

  return `Você é um copiloto pastoral teológico de alto nível, treinado para gerar estudos bíblicos completos, fiéis e pastoralmente responsáveis.

PRINCÍPIOS INEGOCIÁVEIS:
1. Sempre parta do texto bíblico e seu contexto. O texto manda.
2. NUNCA invente versículos ou referências. Se não souber, diga "passagem não localizada".
3. Separe claramente: OBSERVAÇÃO (o que diz), INTERPRETAÇÃO (o que significava), APLICAÇÃO (o que exige hoje).
4. Se uma interpretação for debatida entre scholars: diga explicitamente "Existem diferentes interpretações...".
5. Não misture exegese com aplicação. A exegese precisa vir antes.
6. A aplicação deve fluir da exegese, não do achismo.
7. Sempre inclua o aviso pastoral: "Este material foi gerado por IA e deve ser revisado por um pastor ou teólogo."

CONTEXTO DO USUÁRIO:
- Passagem: ${input.bible_passage}
- Tema (opcional): ${input.theme ?? 'não especificado'}
- Idioma: ${input.language}
- Versão bíblica: ${input.bible_version}
- Doutrina: ${input.doctrine_line}
- Tom pastoral: ${input.pastoral_voice}
- Profundidade: ${input.depth_level}

CONFIGURAÇÃO DA PROFUNDIDADE (${input.depth_level}):
- Pontos de exegese: mínimo ${depthConfig.exegesis_points}
- Interpretações teológicas: mínimo ${depthConfig.interpretations}
- Conexões bíblicas: mínimo ${depthConfig.connections}
- Pontos de aplicação: mínimo ${depthConfig.applications}
- Perguntas de reflexão: mínimo ${depthConfig.questions}
${linguisticNote}
${cautionInstruction}
${ragInstruction}

FORMATO DE SAÍDA OBRIGATÓRIO — JSON PURO com schema_version "1.0":
Retorne APENAS o JSON. Nenhum texto antes ou depois. Siga exatamente a estrutura abaixo:

{
  "schema_version": "1.0",
  "title": "título do estudo",
  "bible_passage": "passagem exata",
  "central_idea": "ideia central em 1-2 frases",
  "depth_level": "${input.depth_level}",
  "doctrine_line": "${input.doctrine_line}",
  "language": "${input.language}",
  "caution_mode": ${cautionMode},
  "sensitive_topic_detected": ${sensitiveTopicDetected ? `"${sensitiveTopicDetected}"` : 'null'},
  "summary": "resumo executivo do estudo",
  "historical_context": {
    "text": "contexto histórico detalhado",
    "source_confidence": "high|medium|low"
  },
  "literary_context": {
    "genre": "gênero literário",
    "position_in_book": "posição no livro/cânon",
    "source_confidence": "high|medium|low"
  },
  "text_structure": [
    { "section": "nome da seção", "verses": "v.X-Y", "description": "descrição" }
  ],
  "bible_text": [
    { "reference": "Passagem X:Y", "text": "texto completo do versículo", "version": "${input.bible_version}" }
  ],
  "exegesis": [
    {
      "focus": "versículo ou frase",
      "linguistic_note": "análise linguística (hebraico/grego)",
      "theological_insight": "contribuição teológica",
      "source_confidence": "high|medium|low"
    }
  ],
  "theological_interpretation": [
    {
      "perspective": "nome da perspectiva",
      "interpretation": "interpretação detalhada",
      "is_debated": false,
      "sources": ["comentarista A"],
      "source_confidence": "high|medium|low"
    }
  ],
  "biblical_connections": [
    {
      "reference": "passagem relacionada",
      "relationship": "typology|fulfillment|parallel|contrast|echo",
      "note": "explicação da conexão"
    }
  ],
  "application": [
    {
      "context": "vida pessoal|liderança|família|missão",
      "application": "como se aplica",
      "practical_action": "ação prática concreta"
    }
  ],
  "reflection_questions": [
    { "question": "pergunta reflexiva", "target_audience": "congregante|pastor|líder" }
  ],
  "conclusion": "conclusão pastoral do estudo",
  "pastoral_warning": "Este material foi gerado por inteligência artificial com fins de estudo e apoio pastoral. Ele não substitui a orientação de um pastor, teólogo ou conselheiro cristão qualificado. Verifique sempre com as Escrituras e com lideranças maduras antes de ensinar ou aplicar este conteúdo.",
  "generated_at": "${new Date().toISOString()}",
  "rag_sources_used": []
}`
}

// ─────────────────────────────────────────────────────────────
// Handler principal
// ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const startTime = Date.now()

  try {
    // ── 1. Autenticação ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── 2. Validação do Input ──
    const body = await req.json() as BiblicalStudyInput

    if (!body.bible_passage?.trim()) {
      return new Response(JSON.stringify({ error: 'bible_passage is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!['basic', 'intermediate', 'advanced'].includes(body.depth_level)) {
      return new Response(JSON.stringify({ error: 'depth_level must be basic | intermediate | advanced' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const input: BiblicalStudyInput = {
      bible_passage: body.bible_passage.trim(),
      theme: body.theme?.trim(),
      language: body.language ?? 'PT',
      bible_version: body.bible_version ?? 'ARA',
      doctrine_line: body.doctrine_line ?? 'evangelical_general',
      pastoral_voice: body.pastoral_voice ?? 'welcoming',
      depth_level: body.depth_level ?? 'intermediate',
    }

    // ── 3. Verificar limite do plano ──
    const { data: userData } = await supabase
      .from('users')
      .select('plan, generation_count_month, generation_reset_date')
      .eq('id', user.id)
      .single()

    const planLimits: Record<string, number> = {
      free: 3, pastoral: 30, church: 100, ministry: 999,
    }
    const limit = planLimits[userData?.plan ?? 'free'] ?? 3

    if ((userData?.generation_count_month ?? 0) >= limit) {
      return new Response(JSON.stringify({
        error: 'generation_limit_reached',
        message: 'Você atingiu o limite de estudos do seu plano. Faça upgrade para continuar.',
      }), { status: 429, headers: { 'Content-Type': 'application/json' } })
    }

    // ── 4. Detectar tópico sensível → Caution Mode ──
    const topicText = `${input.bible_passage} ${input.theme ?? ''}`
    const sensitiveTopicDetected = detectSensitiveTopic(topicText)
    const cautionMode = sensitiveTopicDetected !== null

    const depthConfig = getDepthConfig(input.depth_level)

    // ── 5. Buscar contexto RAG ──
    const { text: ragContext, sources: ragSources } = await fetchCommentaryContext(
      supabase,
      input.bible_passage,
      depthConfig.rag_threshold,
      openaiKey,
    )

    // ── 6. Construir system prompt ──
    const systemPrompt = buildSystemPrompt(
      input,
      ragContext,
      cautionMode,
      sensitiveTopicDetected,
      depthConfig,
    )

    // ── 7. Chamar OpenAI com response_format json_object ──
    let studyOutput: BiblicalStudyOutput | null = null
    let schemaErrors: string[] = []
    const MAX_RETRIES = 2

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: depthConfig.model,
          temperature: 0.4,  // baixo para consistência teológica
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Gere o estudo bíblico completo e estruturado para: "${input.bible_passage}"${input.theme ? ` com foco em: "${input.theme}"` : ''}. Retorne apenas o JSON conforme o schema definido.`,
            },
          ],
        }),
      })

      if (!aiRes.ok) {
        const err = await aiRes.json()
        throw new Error(`OpenAI error: ${JSON.stringify(err)}`)
      }

      const aiData = await aiRes.json()
      const rawContent = aiData.choices[0]?.message?.content

      let parsed: unknown
      try {
        parsed = JSON.parse(rawContent)
      } catch {
        schemaErrors.push(`Attempt ${attempt + 1}: JSON.parse failed`)
        continue
      }

      const validation = validateOutput(parsed)
      if (!validation.valid) {
        schemaErrors.push(`Attempt ${attempt + 1}: ${validation.error}`)
        continue
      }

      // Output válido
      studyOutput = parsed as BiblicalStudyOutput
      studyOutput.generated_at = new Date().toISOString()
      studyOutput.rag_sources_used = ragSources
      break
    }

    // ── 8. Persistir resultado (ou falha) ──
    const generationTimeMs = Date.now() - startTime

    if (!studyOutput) {
      // Falha irrecuperável
      await supabaseService.from('generation_logs').insert({
        user_id: user.id,
        mode: 'biblical_study',
        language: input.language,
        llm_model: depthConfig.model,
        generation_time_ms: generationTimeMs,
        theology_guardrails_triggered: cautionMode,
        sensitive_topic_detected: sensitiveTopicDetected,
        error_code: 'schema_validation_failed',
      })

      return new Response(JSON.stringify({
        error: 'schema_validation_failed',
        details: schemaErrors,
        message: 'A IA não conseguiu gerar um estudo bíblico válido. Tente novamente ou ajuste a passagem.',
      }), { status: 422, headers: { 'Content-Type': 'application/json' } })
    }

    // Persiste o material
    const { data: material, error: insertError } = await supabaseService
      .from('materials')
      .insert({
        user_id: user.id,
        mode: 'biblical_study',
        language: input.language,
        bible_passage: input.bible_passage,
        theme: input.theme ?? null,
        depth_level: input.depth_level,
        doctrine_line: input.doctrine_line,
        pastoral_voice: input.pastoral_voice,
        bible_version: input.bible_version,
        output_biblical_study: studyOutput,
        render_ready: true,
        generation_status: 'saved',
        sensitive_topic_detected: sensitiveTopicDetected,
        theology_layer_marked: true,
        generation_time_ms: generationTimeMs,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    // Registrar custo e log
    await supabaseService.from('generation_logs').insert({
      user_id: user.id,
      material_id: material.id,
      mode: 'biblical_study',
      language: input.language,
      llm_model: depthConfig.model,
      generation_time_ms: generationTimeMs,
      theology_guardrails_triggered: cautionMode,
      sensitive_topic_detected: sensitiveTopicDetected,
      // custo estimado: input ~2k tokens + output ~4k tokens
      cost_usd: depthConfig.model === 'gpt-4o' ? 0.000060 : 0.000012,
    })

    // Incrementar contador de uso do usuário
    await supabaseService
      .from('users')
      .update({ generation_count_month: (userData?.generation_count_month ?? 0) + 1 })
      .eq('id', user.id)

    // ── 9. Retornar JSON limpo ──
    return new Response(JSON.stringify({
      success: true,
      material_id: material.id,
      caution_mode: cautionMode,
      sensitive_topic_detected: sensitiveTopicDetected,
      study: studyOutput,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (err) {
    console.error('[generate-biblical-study] Error:', err)
    return new Response(JSON.stringify({
      error: 'internal_error',
      message: 'Erro interno na geração do estudo bíblico.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
