// supabase/functions/generate-biblical-study/index.ts
// Living Word — Motor Teológico: Estudo Bíblico Estruturado
// Schema: 1.0 | Mode: biblical_study
// ─────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getMenteDNA } from '../common/mentes_dna.ts'
import {
  checkAndDebitCredits,
  checkRateLimit,
  selectAIModel,
  isGeminiModel,
  estimateApiCostUsd,
  getGenerationCost,
  PLAN_CREDITS,
} from '../common/credits.ts'

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
  metadata: {
    versao_template: '1.0'
    tipo_uso: string
    duracao_estimada_min?: number
    criado_em: string
  }
  ancora_espiritual: { oracao_abertura?: string }
  passagem: {
    referencia: string
    texto: string
    versao: string
    genero: 'narrativa' | 'epistola' | 'lei' | 'profecia' | 'sabedoria' | 'salmo' | 'apocalipse'
  }
  contexto: {
    historico: string
    literario: string
    canonico?: string
  }
  observacao: {
    perguntas_5wh: Array<{ pergunta: string; resposta: string }>
    palavras_chave: Array<{ palavra: string; explicacao: string }>
    elementos_notaveis?: string
  }
  interpretacao: {
    estudo_palavras?: Array<{ palavra: string; original?: string; significado: string }>
    cruzamento_escrituras?: string[]
    logica_interna?: string
    significado_original: string
  }
  verdade_central: {
    frase_central: string
    proposicao_expandida?: string
  }
  conexao_cristologica?: {
    como_aponta_para_cristo: string
    tipo_conexao: 'tipologia' | 'promessa_cumprimento' | 'reflexo_carater' | 'aplicacao_direta' | 'proclamacao_evangelho'
  }
  aplicacao: {
    crer: string
    mudar: string
    agir: string
    reflexao_pessoal?: string
  }
  perguntas_discussao: {
    observacao: string[]
    interpretacao: string[]
    aplicacao: string[]
    bonus?: string
  }
  encerramento: {
    oracao_sugerida: string
    instrucao_lider?: string
  }
  notas_lider?: {
    como_introduzir?: string
    pontos_atencao?: string[]
    erros_comuns?: string[]
    recursos_adicionais?: string[]
  }
  
  // Custom Living Word meta fields
  caution_mode?: boolean
  sensitive_topic_detected?: string | null
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
      model: 'gemini-2.5-flash',
    },
    intermediate: {
      exegesis_points: 4,
      interpretations: 2,
      connections: 4,
      applications: 3,
      questions: 5,
      rag_threshold: 0.75,
      has_linguistic_notes: true,
      model: 'gemini-2.5-flash',
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
  'metadata', 'passagem', 'contexto', 'observacao', 'interpretacao',
  'verdade_central', 'aplicacao', 'perguntas_discussao', 'encerramento'
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

  // Basic structure checks
  if (typeof obj.verdade_central !== 'object' || obj.verdade_central === null || typeof (obj.verdade_central as any).frase_central !== 'string') {
    return { valid: false, error: 'verdade_central.frase_central is missing' }
  }

  if (typeof obj.aplicacao !== 'object' || obj.aplicacao === null) {
    return { valid: false, error: 'aplicacao is missing' }
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
    ? `\n⚠️ CAUTION MODE ATIVADO — tópico sensível detectado: "${sensitiveTopicDetected}".\nRegras adicionais:\n- Use linguagem cuidadosa, acolhedora e nunca prescritiva.\n- Evite imperativo que possa soar como julgamento.\n- Saliente o cuidado pastoral e encaminhe para ajuda profissional quando cabível.\n- NUNCA minimize a dor ou trivialize o sofrimento humano.\n`
    : ''

  const ragInstruction = ragContext
    ? `\nContexto histórico e comentarístico (RAG — use para enriquecer, NUNCA para contradizer o texto):\n${ragContext}\n`
    : ''

  const menteDNA = getMenteDNA(input.pastoral_voice)
  const voiceAuthBlock = menteDNA 
    ? `\n---------------------------------------\nVOICE AUTHENTICATION & DNA (CRITICAL)\n---------------------------------------\n${menteDNA}\n\n⚠️ INSTRUÇÃO OBRIGATÓRIA: Como você está utilizando o DNA de uma Mente específica, você DEVE INICIAR a "verdade_central.frase_central" e o "encerramento.oracao_sugerida" identificando claramente que este estudo foi elaborado pelas lentes e o DNA teológico de ${input.pastoral_voice}. Molde de forma rígida todas as interpretações, vocabulários e reflexões ao estilo dessa Mente.\n`
    : ''

  // Language mapping
  let languageRule = ''
  if (input.language === 'EN') {
    languageRule = 'Use clear American English. Accessible to a small group leader without seminary training.'
  } else if (input.language === 'ES') {
    languageRule = 'Use español latinoamericano claro y accesible. Evite vocabulario teológico denso.'
  } else {
    languageRule = 'Use português brasileiro claro, direto e correto. Linguagem acessível ao líder de célula, não apenas ao pastor com seminário.'
  }

  return `Você é um teólogo evangélico com formação seminarista e experiência pastoral.
Sua tarefa é gerar um Estudo Bíblico Estruturado completo baseado no texto bíblico fornecido,
seguindo RIGOROSAMENTE o template EBS-EXPÓS v1.0.

PASSAGEM: ${input.bible_passage}
TEMA FOCO (se aplicável): ${input.theme ?? 'Nenhum específico. Foque no texto.'}
MODO DE USO: estudo_biblico_v1
VERSÃO BÍBLICA: ${input.bible_version}
IDIOMA / RESTRIÇÃO: ${input.language}. ${languageRule}

---

REGRAS OBRIGATÓRIAS:
1. NUNCA pule da leitura para a aplicação. A sequência é SEMPRE: Contexto → Observação → Interpretação → Verdade Central → Aplicação.
2. Identifique o gênero literário antes de qualquer análise. Gêneros diferentes exigem regras hermenêuticas diferentes.
3. O bloco de Interpretação deve responder: o que o AUTOR ORIGINAL quis comunicar ao leitor ORIGINAL? Não ao leitor de hoje ainda.
4. A Verdade Central (Big Idea) deve ser uma única frase de até 20 palavras, declarativa, que resuma o que Deus está comunicando neste texto.
5. A Aplicação deve ser específica, não genérica. "Ore mais" não é aplicação. "Separe 10 minutos esta semana para orar pela pessoa que você está evitando" É aplicação.
6. Cruzamentos de Escritura devem ser relevantes e não decorativos.
7. NUNCA imponha ao texto o que ele não diz (eisegese).
8. As perguntas de discussão devem seguir a ordem: observação → interpretação → aplicação. Nunca misture.
9. A Conexão Cristológica deve ser honesta com o gênero: nem forçada (alegoria artificial), nem omitida (texto no vácuo).
${cautionInstruction}
${ragInstruction}
${voiceAuthBlock}

FORMATO DE SAÍDA OBRIGATÓRIO (JSON PURO):
Retorne APENAS o JSON conforme o schema exato abaixo. Não use marcações Markdown envolvendo o JSON.
{
  "metadata": {
    "versao_template": "1.0",
    "tipo_uso": "geral",
    "duracao_estimada_min": 60,
    "criado_em": "${new Date().toISOString()}"
  },
  "ancora_espiritual": {
    "oracao_abertura": "Sugestão de oração de abertura..."
  },
  "passagem": {
    "referencia": "${input.bible_passage}",
    "texto": "Texto completo da passagem na versão pedida",
    "versao": "${input.bible_version}",
    "genero": "narrativa|epistola|lei|profecia|sabedoria|salmo|apocalipse"
  },
  "contexto": {
    "historico": "contexto histórico detalhado...",
    "literario": "contexto literário...",
    "canonico": "contexto canônico (opcional)"
  },
  "observacao": {
    "perguntas_5wh": [
      { "pergunta": "Quem?", "resposta": "..." },
      { "pergunta": "O quê?", "resposta": "..." }
    ],
    "palavras_chave": [
      { "palavra": "...", "explicacao": "..." }
    ],
    "elementos_notaveis": "Repetições, contrastes..."
  },
  "interpretacao": {
    "estudo_palavras": [
      { "palavra": "...", "original": "...", "significado": "..." }
    ],
    "cruzamento_escrituras": ["Passagem 1", "Passagem 2"],
    "logica_interna": "...",
    "significado_original": "Significado para o leitor original..."
  },
  "verdade_central": {
    "frase_central": "A grande, única ideia com menos de 20 palavras.",
    "proposicao_expandida": "Proposição em 2 a 4 frases..."
  },
  "conexao_cristologica": {
    "como_aponta_para_cristo": "...",
    "tipo_conexao": "tipologia|promessa_cumprimento|reflexo_carater|aplicacao_direta|proclamacao_evangelho"
  },
  "aplicacao": {
    "crer": "O que crer...",
    "mudar": "O que mudar...",
    "agir": "Ação específica...",
    "reflexao_pessoal": "Campo aberto opcional..."
  },
  "perguntas_discussao": {
    "observacao": ["Pergunta ob 1", "Pergunta ob 2"],
    "interpretacao": ["Pergunta int 1", "Pergunta int 2"],
    "aplicacao": ["Pergunta app 1", "Pergunta app 2"],
    "bonus": "Pergunta profunda bônus..."
  },
  "encerramento": {
    "oracao_sugerida": "Oração de encerramento...",
    "instrucao_lider": "Instrução..."
  },
  "notas_lider": {
    "como_introduzir": "...",
    "pontos_atencao": ["...", "..."],
    "erros_comuns": ["...", "..."],
    "recursos_adicionais": ["...", "..."]
  }
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

    // ── 3. Verificar plano e créditos ──
    const { data: userData } = await supabase
      .from('users')
      .select('plan, credits_balance')
      .eq('id', user.id)
      .single()

    // Rate Limiting
    const rateLimitResult = await checkRateLimit(supabaseService, user.id, userData?.plan ?? 'free', 'generate-biblical-study')
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: 'rate_limit_exceeded',
        retry_after_seconds: rateLimitResult.retryAfterSeconds,
        detail: rateLimitResult.error,
      }), { status: 429, headers: { 'Content-Type': 'application/json' } })
    }

    // Debitar créditos (30 créditos por estudo)
    const studyCost = getGenerationCost('study')
    const creditResult = await checkAndDebitCredits(supabaseService, user.id, 'study', undefined, studyCost)
    if (!creditResult.success) {
      return new Response(JSON.stringify({
        error: 'insufficient_credits',
        credits_required: studyCost,
        credits_remaining: creditResult.remaining,
        message: `Você precisa de ${studyCost} créditos para gerar um estudo. Restam ${creditResult.remaining}.`,
      }), { status: 402, headers: { 'Content-Type': 'application/json' } })
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
      let rawContent = ""
      const userPrompt = `Gere o estudo bíblico completo e estruturado para: "${input.bible_passage}"${input.theme ? ` com foco em: "${input.theme}"` : ''}. Retorne apenas o JSON conforme o schema definido.`

      if (depthConfig.model === 'gemini-2.5-flash') {
        const geminiKey = Deno.env.get("GEMINI_API_KEY")!
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { 
              responseMimeType: "application/json",
              temperature: 0.4
            }
          })
        })

        if (!aiRes.ok) {
          const err = await aiRes.json()
          throw new Error(`Gemini error: ${JSON.stringify(err)}`)
        }
        const aiData = await aiRes.json()
        rawContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
      } else {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: depthConfig.model,
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        })

        if (!aiRes.ok) {
          const err = await aiRes.json()
          throw new Error(`OpenAI error: ${JSON.stringify(err)}`)
        }
        const aiData = await aiRes.json()
        rawContent = aiData.choices[0]?.message?.content ?? ""
      }

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
      cost_usd: estimateApiCostUsd(depthConfig.model, 2000, 4000),
      credits_consumed: studyCost,
    })

    const calculatedCostUsd = estimateApiCostUsd(depthConfig.model, 2000, 4000)

    return new Response(JSON.stringify({
      success: true,
      material_id: material.id,
      caution_mode: cautionMode,
      sensitive_topic_detected: sensitiveTopicDetected,
      study: studyOutput,
      credits_consumed: studyCost,
      credits_remaining: creditResult.remaining,
      generation_meta: {
        model: depthConfig.model,
        total_tokens: 6000,
        total_cost_usd: calculatedCostUsd,
        elapsed_ms: generationTimeMs,
        per_format: {
          biblical_study: {
            tokens: 6000,
            words: JSON.stringify(studyOutput).split(/\s+/).filter(Boolean).length,
            cost_usd: calculatedCostUsd,
            attempts: schemaErrors.length + 1
          }
        }
      }
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
