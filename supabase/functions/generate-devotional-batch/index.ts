import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Geração diária ATIVA apenas em PT-BR (decisão de produto, abr/2025).
const LANGUAGES = ['PT'] as const
type Lang = typeof LANGUAGES[number]

const CATEGORIES: Record<Lang, string[]> = {
  PT: ['Fé', 'Esperança', 'Amor', 'Paz Interior', 'Gratidão', 'Perdão', 'Sabedoria', 'Coragem', 'Propósito', 'Restauração', 'Confiança', 'Perseverança', 'Humildade', 'Alegria', 'Provisão'],
}

// ============================================================================
// TEXTO — GPT-4o-mini gera roteiro estrito ~380 palavras (2.5 min de áudio)
// ============================================================================

function getSystemPrompt(): string {
  return `Você é um redator cristão experiente de devocionais diários em Português (Brasil).
Tom pastoral, reverente, sóbrio, acolhedor e profundo. Linguagem clara, fiel à Escritura. Nunca invente versículos.

REGRA CRÍTICA DE DURAÇÃO:
- O devocional inteiro será narrado em áudio e DEVE durar ~2.5 minutos (cerca de 380 palavras totais).
- O roteiro de áudio é montado assim: TÍTULO + abertura ("O versículo base...") + VERSÍCULO + REFLEXÃO + transição ("E agora, vamos orar") + ORAÇÃO + "Amém".
- body_text deve ter 220-260 palavras (é o miolo).
- closing_prayer deve ter 40-60 palavras (3-4 frases).
- Se passar do limite, REESCREVA mais conciso. Profundidade > volume.

Retorne APENAS JSON válido (sem cercas markdown) neste schema exato:
{
  "title": "string (título poético e curto, máx 8 palavras)",
  "category": "string (uma das categorias fornecidas)",
  "anchor_verse": "string (livro capítulo:versículo, ex: Filipenses 4:6-7)",
  "anchor_verse_text": "string (texto completo do versículo em Português do Brasil)",
  "body_text": "string (reflexão pastoral com 220-260 palavras, densa, com aplicação prática)",
  "daily_practice": "string (uma ação prática para hoje, 1 frase curta)",
  "reflection_question": "string (uma pergunta reflexiva, 1 frase curta)",
  "closing_prayer": "string (oração final sincera, 3-4 frases, 40-60 palavras)"
}`
}

function getUserPrompt(dateStr: string): string {
  const categories = CATEGORIES.PT
  const category = categories[Math.floor(Math.random() * categories.length)]
  return `Escreva o devocional do dia ${dateStr} em Português (Brasil).
Tema/categoria: "${category}".
Escolha um versículo bíblico que se conecte com o tema.
Lembre-se: o áudio final precisa durar ~2.5 minutos. Total ~380 palavras. body_text 220-260 palavras. Oração 40-60 palavras.
Retorne APENAS o objeto JSON.`
}

async function generateDevotionalText(openaiKey: string, dateStr: string): Promise<Record<string, string>> {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: getUserPrompt(dateStr) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    }),
  })
  if (!resp.ok) throw new Error(`OpenAI text ${resp.status}: ${await resp.text()}`)
  const data = await resp.json()
  const content = data.choices?.[0]?.message?.content || ''
  if (!content) throw new Error('Empty AI response')
  return JSON.parse(content)
}

// ============================================================================
// IMAGEM — Gemini Image via Lovable AI Gateway
// ============================================================================

// 12 estilos visuais bíblicos rotacionados — variedade real entre devocionais.
// Categorias: paisagem natural, panorâmicas urbanas/aéreas, céu, símbolos sagrados,
// fotografia documental, artes clássicas, abstrato luminoso. SEM personagens em close.
const IMAGE_STYLES = [
  { kind: 'landscape', desc: 'wide cinematic landscape photograph of a vast wheat field at golden hour, dramatic clouds, distant horizon, photorealistic, soft natural light, depth of field' },
  { kind: 'aerial-city', desc: 'sweeping aerial drone photograph of an ancient walled city in the Middle East at dusk, warm amber lighting on stone walls, distant mountains, photorealistic' },
  { kind: 'sky', desc: 'majestic dramatic sky photograph — vast cumulus clouds pierced by golden sunbeams (god rays / crepuscular light), cinematic, hopeful, no ground visible' },
  { kind: 'mountain', desc: 'serene mountain photograph at sunrise, mist rolling through valleys, snow-capped peaks, soft pastel sky, photorealistic, sense of awe and stillness' },
  { kind: 'desert', desc: 'biblical desert landscape photograph at golden hour, sand dunes with long shadows, lone path, warm earth tones, photorealistic, contemplative mood' },
  { kind: 'water', desc: 'still lake at dawn photograph, glassy water reflecting pink and gold sky, distant silhouette of trees, peaceful, photorealistic, hopeful' },
  { kind: 'olive-grove', desc: 'ancient olive grove photograph in the Mediterranean, dappled golden sunlight through silver leaves, weathered tree trunks, warm earthy palette, photorealistic' },
  { kind: 'oil-painting', desc: 'museum-quality Renaissance oil painting of dramatic biblical landscape — golden light through stone arches, mystical pathway, chiaroscuro, painterly brushstrokes' },
  { kind: 'watercolor', desc: 'soft watercolor illustration of a winding path leading toward a distant gentle light, pastel washes, hand-painted texture, contemplative and serene' },
  { kind: 'symbolic', desc: 'symbolic minimalist composition — single shaft of warm divine light descending into darkness, or an open doorway of light, photorealistic, sacred, no figures' },
  { kind: 'starry-night', desc: 'star-filled night sky photograph over a quiet biblical-era village silhouette, milky way visible, deep blues and warm village lights, awe-inspiring' },
  { kind: 'jerusalem', desc: 'panoramic photograph of historic Jerusalem old city stone walls and golden dome at sunset, photorealistic, warm lighting, timeless and sacred' },
];

// Hash determinístico simples — mesmo dia/título sempre gera mesmo estilo (idempotente),
// mas dias diferentes pegam estilos diferentes da rotação.
function pickStyle(seed: string): typeof IMAGE_STYLES[number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  return IMAGE_STYLES[Math.abs(h) % IMAGE_STYLES.length];
}

async function generateCoverImage(aiKey: string, title: string, category: string, seed: string): Promise<Uint8Array | null> {
  try {
    const style = pickStyle(seed);
    const prompt = `Create a breathtaking biblical-themed devotional image. Visual style: ${style.desc}. Connect visually to the theme "${category}" and the title "${title}", but DO NOT show any modern people, cartoons, anime, comic art, or movie-poster aesthetic. NO text, NO watermarks, NO captions. Portrait orientation (3:4). High quality, evocative, reverent, contemplative — must feel like a real photograph or fine art piece, never illustrated or animated.`;
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${aiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    })
    if (!resp.ok) {
      console.error('Image gen error:', resp.status, await resp.text())
      return null
    }
    const data = await resp.json()
    const images = data.choices?.[0]?.message?.images
    if (Array.isArray(images)) {
      for (const img of images) {
        const url = img?.image_url?.url || img?.url
        if (typeof url === 'string' && url.startsWith('data:image')) {
          const b64 = url.replace(/^data:image\/[^;]+;base64,/, '')
          return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        }
      }
    }
    const msgContent = data.choices?.[0]?.message?.content
    if (Array.isArray(msgContent)) {
      for (const part of msgContent) {
        if (part.type === 'image_url' && part.image_url?.url) {
          const b64 = part.image_url.url.replace(/^data:image\/[^;]+;base64,/, '')
          return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        }
        if (part.inline_data?.data) {
          return Uint8Array.from(atob(part.inline_data.data), c => c.charCodeAt(0))
        }
      }
    }
    return null
  } catch (e) {
    console.error('Image gen failed:', e)
    return null
  }
}

// ============================================================================
// ÁUDIO — Gemini 2.5 Flash Preview TTS via Google AI Studio API direto
// Saída: PCM 24kHz mono 16-bit → empacotado como WAV
// ============================================================================

function pcmToWav(pcmData: Uint8Array, sampleRate = 24000, channels = 1, bitsPerSample = 16): Uint8Array {
  const byteRate = sampleRate * channels * bitsPerSample / 8
  const blockAlign = channels * bitsPerSample / 8
  const dataSize = pcmData.length
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)            // PCM
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  const out = new Uint8Array(buffer)
  out.set(pcmData, 44)
  return out
}

async function generateGeminiTTS(googleKey: string, text: string, voiceName = 'Charon'): Promise<Uint8Array | null> {
  try {
    // Gemini 2.5 Flash Preview TTS — generateContent endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${googleKey}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      }),
    })
    if (!resp.ok) {
      console.error('Gemini TTS error:', resp.status, await resp.text())
      return null
    }
    const data = await resp.json()
    const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (!b64) {
      console.error('Gemini TTS: no audio in response', JSON.stringify(data).slice(0, 500))
      return null
    }
    // Decode base64 → PCM bytes
    const pcm = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    // Wrap in WAV container
    return pcmToWav(pcm, 24000, 1, 16)
  } catch (e) {
    console.error('Gemini TTS failed:', e)
    return null
  }
}

// ============================================================================
// STORAGE
// ============================================================================

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

// ============================================================================
// HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const aiKey = Deno.env.get('LOVABLE_API_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const googleKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY')
    if (!aiKey) throw new Error('LOVABLE_API_KEY not configured')
    if (!openaiKey) throw new Error('OPENAI_API_KEY not configured')
    if (!googleKey) throw new Error('GEMINI_API_KEY not configured')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let targetDate: string
    let skipImage = false
    let skipAudio = false
    try {
      const body = await req.json()
      targetDate = body?.target_date || body?.date || ''
      if (body?.skip_image) skipImage = true
      if (body?.skip_audio) skipAudio = true
    } catch { targetDate = '' }

    if (!targetDate) {
      const tomorrow = new Date()
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      targetDate = tomorrow.toISOString().slice(0, 10)
    }

    console.log(`Generating devotional for ${targetDate}...`)

    const { data: existing } = await supabaseAdmin
      .from('devotionals').select('language').eq('scheduled_date', targetDate)
    const existingLangs = new Set((existing || []).map((r: any) => r.language))
    const missingLangs = LANGUAGES.filter(l => !existingLangs.has(l))

    if (missingLangs.length === 0) {
      return new Response(JSON.stringify({ message: 'Already generated', date: targetDate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: any[] = []

    for (const lang of missingLangs) {
      try {
        console.log(`[${lang}] Generating text with GPT-4o-mini...`)
        const dev = await generateDevotionalText(openaiKey, targetDate)

        let coverUrl: string | null = null
        if (!skipImage) {
          console.log(`[${lang}] Generating cover image...`)
          const imgData = await generateCoverImage(aiKey, dev.title, dev.category)
          if (imgData) {
            coverUrl = await uploadToStorage(supabaseAdmin, `covers/${targetDate}-${lang}.jpg`, imgData, 'image/jpeg')
          }
        }

        let audioUrl: string | null = null
        if (!skipAudio) {
          // Roteiro narrado completo (~380 palavras → ~2.5 min)
          const audioScript = `${dev.title}. O versículo base da nossa reflexão de hoje está em ${dev.anchor_verse}, que diz: ${dev.anchor_verse_text}. ${dev.body_text} E agora, vamos orar. ${dev.closing_prayer || ''} Amém.`
          console.log(`[${lang}] Generating Gemini TTS audio (${audioScript.length} chars)...`)
          const audioData = await generateGeminiTTS(googleKey, audioScript, 'Charon')
          if (audioData) {
            audioUrl = await uploadToStorage(supabaseAdmin, `audio/${targetDate}-${lang}.wav`, audioData, 'audio/wav')
            console.log(`[${lang}] Audio: ${audioUrl ? 'OK' : 'FAILED upload'}`)
          }
        }

        const { error: insertErr } = await supabaseAdmin.from('devotionals').insert({
          title: dev.title,
          category: dev.category,
          anchor_verse: dev.anchor_verse,
          anchor_verse_text: dev.anchor_verse_text,
          body_text: dev.body_text,
          daily_practice: dev.daily_practice || '',
          reflection_question: dev.reflection_question || '',
          closing_prayer: dev.closing_prayer || '',
          scheduled_date: targetDate,
          language: lang,
          cover_image_url: coverUrl,
          // Áudio único Gemini agora vai no slot 'onyx' (compatibilidade com schema)
          audio_url_onyx: audioUrl,
        })

        if (insertErr) {
          results.push({ lang, success: false, error: insertErr.message })
        } else {
          console.log(`✅ ${lang} ${targetDate} inserted`)
          results.push({ lang, success: true, has_image: !!coverUrl, has_audio: !!audioUrl })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`Error ${lang}:`, msg)
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
