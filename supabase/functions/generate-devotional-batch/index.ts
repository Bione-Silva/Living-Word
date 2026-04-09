import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LANGUAGES = ['PT', 'EN', 'ES'] as const
type Lang = typeof LANGUAGES[number]

const CATEGORIES: Record<Lang, string[]> = {
  PT: ['Fé', 'Esperança', 'Amor', 'Paz Interior', 'Gratidão', 'Perdão', 'Sabedoria', 'Coragem', 'Propósito', 'Restauração', 'Confiança', 'Perseverança', 'Humildade', 'Alegria', 'Provisão'],
  EN: ['Faith', 'Hope', 'Love', 'Inner Peace', 'Gratitude', 'Forgiveness', 'Wisdom', 'Courage', 'Purpose', 'Restoration', 'Trust', 'Perseverance', 'Humility', 'Joy', 'Provision'],
  ES: ['Fe', 'Esperanza', 'Amor', 'Paz Interior', 'Gratitud', 'Perdón', 'Sabiduría', 'Coraje', 'Propósito', 'Restauración', 'Confianza', 'Perseverancia', 'Humildad', 'Alegría', 'Provisión'],
}

const LANG_CODE_MAP: Record<Lang, string> = { PT: 'pt-BR', EN: 'en-US', ES: 'es-ES' }

const VOICE_MAP: Record<string, Record<Lang, string>> = {
  nova: { PT: 'pt-BR-Wavenet-A', EN: 'en-US-Wavenet-F', ES: 'es-ES-Wavenet-A' },
  alloy: { PT: 'pt-BR-Wavenet-B', EN: 'en-US-Wavenet-D', ES: 'es-ES-Wavenet-B' },
  onyx: { PT: 'pt-BR-Wavenet-D', EN: 'en-US-Wavenet-B', ES: 'es-ES-Wavenet-C' },
}

function getSystemPrompt(lang: Lang): string {
  const langName = lang === 'PT' ? 'Portuguese (Brazil)' : lang === 'EN' ? 'English' : 'Spanish'
  return `You are an expert Christian devotional writer. Write in ${langName}.
You produce warm, deep, practical daily devotionals rooted in Scripture.
Return ONLY valid JSON with this exact schema (no markdown fences):
{
  "title": "string (creative, poetic title)",
  "category": "string (one of the provided categories)",
  "anchor_verse": "string (book chapter:verse, e.g. Filipenses 4:6-7)",
  "anchor_verse_text": "string (full verse text in ${langName})",
  "body_text": "string (400-600 word devotional body with rich reflection)",
  "daily_practice": "string (one practical action for today)",
  "reflection_question": "string (one thought-provoking question)",
  "closing_prayer": "string (a heartfelt closing prayer, 3-5 sentences)"
}`
}

function getUserPrompt(lang: Lang, dateStr: string): string {
  const categories = CATEGORIES[lang]
  const category = categories[Math.floor(Math.random() * categories.length)]
  const langLabel = lang === 'PT' ? 'Português (Brasil)' : lang === 'EN' ? 'English' : 'Español'
  return `Write a devotional for ${dateStr} in ${langLabel}.
Theme/category: "${category}".
Choose a Bible verse that fits this theme. Write a rich, pastoral devotional body (400-600 words).
Include a daily practice, a reflection question, and a closing prayer.
Return ONLY the JSON object.`
}

async function generateDevotionalText(apiKey: string, lang: Lang, dateStr: string): Promise<Record<string, string>> {
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
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
    const prompt = `Create a beautiful, serene Christian devotional cover image. Theme: "${category}". Warm golden light, peaceful landscape, no text or letters. Painterly, ethereal, spiritual atmosphere. Wide format.`
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3.1-flash-image-preview',
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
    console.log('Image response type:', typeof msgContent, Array.isArray(msgContent) ? 'array' : '')
    
    // Try array format (multimodal response)
    if (Array.isArray(msgContent)) {
      for (const part of msgContent) {
        // Format 1: { type: 'image_url', image_url: { url: 'data:...' } }
        if (part.type === 'image_url' && part.image_url?.url) {
          const b64 = part.image_url.url.replace(/^data:image\/[^;]+;base64,/, '')
          return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        }
        // Format 2: { type: 'image', source: { data: '...' } }
        if (part.type === 'image' && part.source?.data) {
          return Uint8Array.from(atob(part.source.data), c => c.charCodeAt(0))
        }
        // Format 3: inline_data
        if (part.inline_data?.data) {
          return Uint8Array.from(atob(part.inline_data.data), c => c.charCodeAt(0))
        }
      }
      console.error('No image found in array parts. Keys:', JSON.stringify(msgContent.map((p: any) => ({ type: p.type, keys: Object.keys(p) }))))
    }
    
    // Try string format with base64
    if (typeof msgContent === 'string' && msgContent.startsWith('data:image')) {
      const b64 = msgContent.replace(/^data:image\/[^;]+;base64,/, '')
      return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    }
    
    console.error('No image in response. Content preview:', JSON.stringify(msgContent)?.slice(0, 300))
    return null
  } catch (e) {
    console.error('Image gen failed:', e)
    return null
  }
}

async function generateTTS(gcpApiKey: string, text: string, lang: Lang, voiceKey: string): Promise<Uint8Array | null> {
  try {
    const voiceName = VOICE_MAP[voiceKey][lang]
    const langCode = LANG_CODE_MAP[lang]
    // Truncate text for TTS (max ~5000 chars)
    const truncated = text.slice(0, 4800)
    
    const resp = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${gcpApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: truncated },
        voice: { languageCode: langCode, name: voiceName },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: 0 },
      }),
    })
    if (!resp.ok) {
      console.error(`TTS error (${voiceKey}/${lang}):`, resp.status, await resp.text())
      return null
    }
    const data = await resp.json()
    if (!data.audioContent) return null
    return Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
  } catch (e) {
    console.error(`TTS failed (${voiceKey}/${lang}):`, e)
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

function buildAudioScript(d: Record<string, string>): string {
  return `${d.title}.\n\n${d.anchor_verse_text}\n${d.anchor_verse}.\n\n${d.body_text}\n\n${d.daily_practice}\n\n${d.reflection_question}\n\n${d.closing_prayer}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableKey) throw new Error('LOVABLE_API_KEY not configured')
    const gcpKey = Deno.env.get('GOOGLE_CLOUD_API_KEY')
    if (!gcpKey) throw new Error('GOOGLE_CLOUD_API_KEY not configured')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let targetDate: string
    try {
      const body = await req.json()
      targetDate = body?.date || ''
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
    const missingLangs = LANGUAGES.filter(l => !existingLangs.has(l))

    if (missingLangs.length === 0) {
      return new Response(JSON.stringify({ message: 'Already generated', date: targetDate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: { lang: string; success: boolean; error?: string; has_image?: boolean; voices?: string[] }[] = []

    for (const lang of missingLangs) {
      try {
        console.log(`[${lang}] Generating text...`)
        const devotional = await generateDevotionalText(lovableKey, lang, targetDate)

        // Generate cover image
        console.log(`[${lang}] Generating cover image...`)
        const imgData = await generateCoverImage(lovableKey, devotional.title, devotional.category)
        let coverUrl: string | null = null
        if (imgData) {
          coverUrl = await uploadToStorage(supabaseAdmin, `covers/${targetDate}-${lang}.jpg`, imgData, 'image/jpeg')
          console.log(`[${lang}] Cover image: ${coverUrl ? 'OK' : 'FAILED'}`)
        }

        // Generate TTS for 3 voices in parallel
        const audioScript = buildAudioScript(devotional)
        console.log(`[${lang}] Generating TTS (3 voices)...`)
        const voiceKeys = ['nova', 'alloy', 'onyx'] as const
        const audioResults = await Promise.all(
          voiceKeys.map(async (vk) => {
            const audioData = await generateTTS(gcpKey, audioScript, lang, vk)
            if (!audioData) return null
            const url = await uploadToStorage(supabaseAdmin, `audio/${targetDate}-${lang}-${vk}.mp3`, audioData, 'audio/mpeg')
            return url ? { voice: vk, url } : null
          })
        )

        const audioUrls: Record<string, string | null> = { nova: null, alloy: null, onyx: null }
        const successVoices: string[] = []
        for (const r of audioResults) {
          if (r) {
            audioUrls[r.voice] = r.url
            successVoices.push(r.voice)
          }
        }
        console.log(`[${lang}] TTS voices ready: ${successVoices.join(', ') || 'none'}`)

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
          audio_url_nova: audioUrls.nova,
          audio_url_alloy: audioUrls.alloy,
          audio_url_onyx: audioUrls.onyx,
        })

        if (insertErr) {
          console.error(`Insert error for ${lang}:`, insertErr)
          results.push({ lang, success: false, error: insertErr.message })
        } else {
          console.log(`✅ ${lang} devotional inserted for ${targetDate}`)
          results.push({ lang, success: true, has_image: !!coverUrl, voices: successVoices })
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
