const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

/** Map version codes to their native language */
const VERSION_LANGUAGE: Record<string, string> = {
  ARA: 'PT', ACF: 'PT', ARC: 'PT', NVI: 'PT', NVT: 'PT', NAA: 'PT', NTLH: 'PT', almeida: 'PT',
  KJV: 'EN', ESV: 'EN', NIV: 'EN', NASB: 'EN', NLT: 'EN', NKJV: 'EN', WEB: 'EN', ASV: 'EN', BBE: 'EN', OEB: 'EN',
  RVR60: 'ES', RVC: 'ES', NTV: 'ES', 'NVI-ES': 'ES', DHH: 'ES',
  ORIG: 'ORIG',
}

/** Default version per language */
const DEFAULT_VERSION: Record<string, string> = {
  PT: 'ARA',
  EN: 'KJV',
  ES: 'RVR60',
}

interface VerseResult {
  version: string
  text: string
  book: string
  version_mismatch: boolean
}

async function fetchOneVersion(passage: string, requestedVersion: string, userLang: string): Promise<VerseResult> {
  const versionLang = VERSION_LANGUAGE[requestedVersion] || VERSION_LANGUAGE[requestedVersion.toUpperCase()] || 'EN'
  let effectiveVersion = requestedVersion
  let versionMismatch = false

  // If the user explicitly requested a version, respect its native language regardless of UI lang.
  // This is critical for the compare modal (preacher wants to see ESV in English even if UI is PT).
  const langForAi = versionLang
  const langLabel = langForAi === 'EN' ? 'English' : langForAi === 'ES' ? 'Spanish' : 'Portuguese'

  const isOriginal = effectiveVersion.toUpperCase() === 'ORIG'
  let systemPrompt = ''

  if (isOriginal) {
    systemPrompt = `You are a precise Biblical scholar. Your ONLY job is to return the exact text of a Bible verse in its ORIGINAL ancient language.
Rules:
- If the passage is from the Old Testament, the text MUST be exclusively in Biblical Hebrew (or Aramaic where applicable).
- If the passage is from the New Testament, the text MUST be exclusively in Koine Greek.
- Return ONLY valid JSON with these fields: "text" (the verse text in the original language), "book" (the canonical reference in English)
- If the passage spans multiple verses, concatenate them with single spaces.
- Do NOT add commentary, translations, or explanations in the "text" field. Return pure, canonical text.
- Do NOT hallucinate.`
  } else {
    systemPrompt = `You are a precise Bible reference tool. Your ONLY job is to return the exact text of a Bible verse.
Rules:
- Return ONLY valid JSON with these fields: "text" (the verse text), "book" (the canonical reference in ${langLabel})
- Use the ${effectiveVersion} version/translation
- The text MUST be in ${langLabel}
- If the passage spans multiple verses, concatenate them with single spaces, prefixing each verse number in bold-like markers (e.g. "10 ... 11 ...")
- Do NOT add commentary, devotional thoughts, or explanations
- Do NOT hallucinate — if you are unsure of the exact wording, return your best known canonical text
- Return the verse text EXACTLY as it appears in the ${effectiveVersion} translation`
  }

  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Return the exact text of: ${passage}` },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!aiResponse.ok) {
    const status = aiResponse.status
    const errText = await aiResponse.text()
    console.error('AI gateway error for', requestedVersion, status, errText)
    throw new Error(`AI_${status}`)
  }

  const aiData = await aiResponse.json()
  const content = aiData.choices?.[0]?.message?.content
  let parsed: { text: string; book: string }
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('PARSE')
  }

  return {
    version: effectiveVersion,
    text: parsed.text,
    book: parsed.book,
    version_mismatch: versionMismatch,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { passage, version = 'ARA', language = 'PT', versions } = body as {
      passage: string
      version?: string
      language?: string
      versions?: string[]
    }

    if (!passage || typeof passage !== 'string' || passage.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "passage" field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userLang = (language || 'PT').toUpperCase()

    // Multi-version mode: requested by Pulpit Compare modal.
    if (Array.isArray(versions) && versions.length > 0) {
      // De-dupe while keeping order, cap at 3 for cost control.
      const unique = Array.from(new Set(versions.map((v) => v.toString()))).slice(0, 3)

      const settled = await Promise.allSettled(
        unique.map((v) => fetchOneVersion(passage, v, userLang))
      )

      const results: VerseResult[] = []
      let firstError: string | null = null
      for (let i = 0; i < settled.length; i++) {
        const s = settled[i]
        if (s.status === 'fulfilled') {
          results.push(s.value)
        } else {
          if (!firstError) firstError = String((s.reason as Error)?.message || s.reason)
          // Push a soft-fail placeholder so UI keeps the column slot.
          results.push({
            version: unique[i],
            text: '',
            book: '',
            version_mismatch: false,
          })
        }
      }

      return new Response(
        JSON.stringify({ results, error: results.every((r) => !r.text) ? firstError : null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Legacy single-version mode (kept for backwards compatibility with existing callers).
    const versionLang = VERSION_LANGUAGE[version] || 'EN'
    let effectiveVersion = version.toUpperCase()
    let versionMismatch = false
    if (versionLang !== userLang) {
      effectiveVersion = DEFAULT_VERSION[userLang] || 'ARA'
      versionMismatch = true
    }
    try {
      const r = await fetchOneVersion(passage, effectiveVersion, userLang)
      // Pick a topic image (legacy field)
      const topics = ['nature', 'sky', 'light', 'peace', 'mountains', 'sunset', 'ocean']
      const topic = topics[Math.floor(Math.random() * topics.length)]
      const topicImage = `https://images.unsplash.com/featured/?${topic},nature&w=800&q=80&sig=${Date.now()}`
      return new Response(
        JSON.stringify({
          text: r.text,
          book: r.book,
          topic_image: topicImage,
          effective_version: r.version,
          version_mismatch: versionMismatch,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (e) {
      const msg = (e as Error).message || ''
      if (msg.startsWith('AI_429')) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, try again later' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (msg.startsWith('AI_402')) {
        return new Response(JSON.stringify({ error: 'Credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw e
    }
  } catch (error) {
    console.error('Error in fetch-bible-verse:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
