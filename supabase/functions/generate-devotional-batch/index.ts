import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// IMPORTANT: Geração diária ATIVA apenas em PT-BR (decisão de produto, abr/2025).
// EN e ES permanecem suportados pelo schema, mas não são gerados pelo cron.
const LANGUAGES = ['PT'] as const
type Lang = typeof LANGUAGES[number]

const CATEGORIES: Record<Lang, string[]> = {
  PT: ['Fé', 'Esperança', 'Amor', 'Paz Interior', 'Gratidão', 'Perdão', 'Sabedoria', 'Coragem', 'Propósito', 'Restauração', 'Confiança', 'Perseverança', 'Humildade', 'Alegria', 'Provisão'],
}

function getSystemPrompt(_lang: Lang): string {
  // Restrição de produto: o devocional inteiro (título + versículo + corpo + oração)
  // deve durar entre 1min30s e 2min em leitura em voz alta natural (~150 palavras/min).
  // Isso significa um TOTAL de ~225–300 palavras somando TODOS os campos lidos no áudio.
  // Por isso o body_text é curto (140–190 palavras) e a oração final é enxuta (2–3 frases).
  return `Você é um redator cristão experiente de devocionais diários em Português (Brasil).
Escreva sempre em Português do Brasil, com tom pastoral, reverente, sóbrio, acolhedor e profundo.
Linguagem clara, sem jargão, fiel à Escritura. Nunca invente versículos.

RESTRIÇÃO DE DURAÇÃO (OBRIGATÓRIA):
- O devocional será lido em voz alta como podcast curto.
- Duração total do áudio: entre 1 minuto e 30 segundos e, no máximo, 2 minutos.
- Considerando ritmo natural de ~150 palavras por minuto, o TOTAL somado de
  título + versículo âncora + corpo + oração final deve ficar entre 225 e 300 palavras.
- Nunca ultrapasse 300 palavras no total. Prefira concisão a prolixidade.

Retorne APENAS JSON válido (sem cercas markdown) neste schema exato:
{
  "title": "string (título poético e curto, máx 8 palavras)",
  "category": "string (uma das categorias fornecidas)",
  "anchor_verse": "string (livro capítulo:versículo, ex: Filipenses 4:6-7)",
  "anchor_verse_text": "string (texto completo do versículo em Português do Brasil)",
  "body_text": "string (corpo do devocional em 140-190 palavras, denso e pastoral)",
  "daily_practice": "string (uma ação prática para hoje, 1 frase)",
  "reflection_question": "string (uma pergunta reflexiva, 1 frase)",
  "closing_prayer": "string (oração final breve e sincera, 2-3 frases, máx 50 palavras)"
}`
}

function getUserPrompt(lang: Lang, dateStr: string): string {
  const categories = CATEGORIES[lang]
  const category = categories[Math.floor(Math.random() * categories.length)]
  return `Escreva o devocional do dia ${dateStr} em Português (Brasil).
Tema/categoria: "${category}".
Escolha um versículo bíblico que se conecte com o tema.
Lembre-se: a soma total de título + versículo + corpo + oração precisa caber em 1m30s a 2min de áudio (225–300 palavras no total). Seja conciso, pastoral e profundo.
Retorne APENAS o objeto JSON.`
}

async function generateDevotionalText(apiKey: string, lang: Lang, dateStr: string): Promise<Record<string, string>> {
  const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: getSystemPrompt(lang) },
        { role: 'user', content: getUserPrompt(lang, dateStr) },
      ],
    }),
  })
  if (!resp.ok) throw new Error(`AI ${resp.status}: ${await resp.text()}`)
  const data = await resp.json()
  let content = data.choices?.[0]?.message?.content || ''
  if (!content) throw new Error('Empty AI response')
  content = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(content)
}

async function generateCoverImage(apiKey: string, title: string, category: string): Promise<Uint8Array | null> {
  try {
    const prompt = `Create a breathtaking, museum-quality devotional artwork in a painterly Renaissance-meets-Romantic style. Theme: "${category}", inspired by "${title}". The scene should evoke deep spiritual emotion — golden ethereal light pouring through ancient stone architecture, mystical pathways, serene water reflections, dramatic skies. Use a warm palette of amber, gold, sepia, and deep earth tones. Oil painting texture, impasto brushstrokes, chiaroscuro lighting. Absolutely NO text, NO letters, NO words, NO typography anywhere in the image. Portrait orientation (3:4 ratio). The image should feel like a masterpiece from a sacred art gallery.`
    const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    })
    if (!resp.ok) {
      console.error('Image gen error:', resp.status, await resp.text())
      return null
    }
    const data = await resp.json()
    const msgContent = data.choices?.[0]?.message?.content

    if (Array.isArray(msgContent)) {
      for (const part of msgContent) {
        if (part.type === 'image_url' && part.image_url?.url) {
          const b64 = part.image_url.url.replace(/^data:image\/[^;]+;base64,/, '')
          return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        }
        if (part.type === 'image' && part.source?.data) {
          return Uint8Array.from(atob(part.source.data), c => c.charCodeAt(0))
        }
        if (part.inline_data?.data) {
          return Uint8Array.from(atob(part.inline_data.data), c => c.charCodeAt(0))
        }
      }
    }

    if (typeof msgContent === 'string' && msgContent.startsWith('data:image')) {
      const b64 = msgContent.replace(/^data:image\/[^;]+;base64,/, '')
      return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    }

    console.error('No image in response')
    return null
  } catch (e) {
    console.error('Image gen failed:', e)
    return null
  }
}

async function generateAudio(openaiKey: string, text: string, voice: 'nova' | 'alloy' | 'onyx'): Promise<Uint8Array | null> {
  try {
    // Trim text for TTS (max ~4000 chars)
    const ttsText = text.length > 4000 ? text.slice(0, 4000) + '...' : text
    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: ttsText,
        voice,
        response_format: 'mp3',
        speed: 0.95,
      }),
    })
    if (!resp.ok) {
      console.error(`TTS error (${voice}):`, resp.status, await resp.text())
      return null
    }
    const buf = await resp.arrayBuffer()
    return new Uint8Array(buf)
  } catch (e) {
    console.error(`TTS failed (${voice}):`, e)
    return null
  }
}

async function uploadToStorage(supabase: any, path: string, data: Uint8Array, contentType: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from('devotional-assets')
    .upload(path, data, { contentType, upsert: true })
  if (error) {
    console.error(`Upload error (${path}):`, error)
    return null
  }
  const { data: urlData } = supabase.storage.from('devotional-assets').getPublicUrl(path)
  return urlData?.publicUrl || null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured')
    const openaiKey = Deno.env.get('OPENAI_API_KEY') || ''

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let targetDate: string
    let requestedLangs: Lang[] | null = null
    let skipImage = false
    try {
      const body = await req.json()
      targetDate = body?.date || ''
      if (body?.languages && Array.isArray(body.languages)) {
        requestedLangs = body.languages.filter((l: string) => LANGUAGES.includes(l as Lang)) as Lang[]
      }
      if (body?.skip_image) skipImage = true
    } catch { targetDate = '' }

    if (!targetDate) {
      const tomorrow = new Date()
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      targetDate = tomorrow.toISOString().slice(0, 10)
    }

    console.log(`Generating devotionals for ${targetDate}...`)

    const { data: existing } = await supabaseAdmin
      .from('devotionals').select('language').eq('scheduled_date', targetDate)
    const existingLangs = new Set((existing || []).map((r: any) => r.language))
    const langsToCheck = requestedLangs || LANGUAGES.slice()
    const missingLangs = langsToCheck.filter(l => !existingLangs.has(l))

    if (missingLangs.length === 0) {
      return new Response(JSON.stringify({ message: 'Already generated', date: targetDate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: { lang: string; success: boolean; error?: string; has_image?: boolean }[] = []

    for (const lang of missingLangs) {
      try {
        console.log(`[${lang}] Generating text...`)
        const devotional = await generateDevotionalText(geminiKey, lang, targetDate)

        // Generate cover image (skip if requested for speed)
        let coverUrl: string | null = null
        if (!skipImage) {
          console.log(`[${lang}] Generating cover image...`)
          const imgData = await generateCoverImage(geminiKey, devotional.title, devotional.category)
          if (imgData) {
            coverUrl = await uploadToStorage(supabaseAdmin, `covers/${targetDate}-${lang}.jpg`, imgData, 'image/jpeg')
            console.log(`[${lang}] Cover image: ${coverUrl ? 'OK' : 'FAILED'}`)
          }
        }

        // Generate TTS audio (3 voices in parallel)
        let audioOnyxUrl: string | null = null

        if (openaiKey) {
          const fullText = `${devotional.title}.\n\n${devotional.anchor_verse_text}\n\n${devotional.body_text}\n\n${devotional.closing_prayer || ''}`
          console.log(`[${lang}] Generating TTS audio (onyx)...`)
          const onyxData = await generateAudio(openaiKey, fullText, 'onyx')
          if (onyxData) {
            audioOnyxUrl = await uploadToStorage(supabaseAdmin, `audio/${targetDate}-${lang}-onyx.mp3`, onyxData, 'audio/mpeg')
            console.log(`[${lang}] Audio onyx: ${audioOnyxUrl ? 'OK' : 'FAILED'}`)
          }
        } else {
          console.log(`[${lang}] Skipping TTS — OPENAI_API_KEY not set`)
        }

        const { error: insertErr } = await supabaseAdmin.from('devotionals').insert({
          title: devotional.title,
          category: devotional.category,
          anchor_verse: devotional.anchor_verse,
          anchor_verse_text: devotional.anchor_verse_text,
          body_text: devotional.body_text,
          daily_practice: devotional.daily_practice || '',
          reflection_question: devotional.reflection_question || '',
          closing_prayer: devotional.closing_prayer || '',
          scheduled_date: targetDate,
          language: lang,
          cover_image_url: coverUrl,
          audio_url_onyx: audioOnyxUrl,
        })

        if (insertErr) {
          console.error(`Insert error for ${lang}:`, insertErr)
          results.push({ lang, success: false, error: insertErr.message })
        } else {
          console.log(`✅ ${lang} devotional inserted for ${targetDate}`)
          results.push({ lang, success: true, has_image: !!coverUrl })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`Error generating ${lang}:`, msg)
        results.push({ lang, success: false, error: msg })
      }
    }

    return new Response(JSON.stringify({ date: targetDate, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('generate-devotional-batch error:', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
