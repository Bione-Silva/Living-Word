const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY')

/** Map version codes to their native language */
const VERSION_LANGUAGE: Record<string, string> = {
  ARA: 'PT', ara: 'PT', almeida: 'PT',
  KJV: 'EN', kjv: 'EN',
  WEB: 'EN', web: 'EN',
  ASV: 'EN', asv: 'EN',
  BBE: 'EN', bbe: 'EN',
  OEB: 'EN', oeb: 'EN',
}

/** Default version per language */
const DEFAULT_VERSION: Record<string, string> = {
  PT: 'ARA',
  EN: 'KJV',
  ES: 'ARA', // closest available
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { passage, version = 'ARA', language = 'PT' } = await req.json()

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

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Determine effective version: if version language doesn't match user language, use default for user language
    const versionLang = VERSION_LANGUAGE[version] || 'EN'
    const userLang = (language || 'PT').toUpperCase()
    let effectiveVersion = version.toUpperCase()
    let versionMismatch = false

    if (versionLang !== userLang) {
      effectiveVersion = DEFAULT_VERSION[userLang] || 'ARA'
      versionMismatch = true
    }

    const langLabel = userLang === 'EN' ? 'English' : userLang === 'ES' ? 'Spanish' : 'Portuguese'

    const systemPrompt = `You are a precise Bible reference tool. Your ONLY job is to return the exact text of a Bible verse.
Rules:
- Return ONLY valid JSON with these fields: "text" (the verse text), "book" (the canonical reference in ${langLabel})
- Use the ${effectiveVersion} version/translation
- The text MUST be in ${langLabel}
- If the passage spans multiple verses, concatenate them with spaces
- Do NOT add commentary, devotional thoughts, or explanations
- Do NOT hallucinate — if you are unsure of the exact wording, return your best known canonical text
- Return the verse text EXACTLY as it appears in the ${effectiveVersion} translation`

    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Return the exact text of: ${passage}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    })

    if (!aiResponse.ok) {
      const status = aiResponse.status
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, try again later' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Credits exhausted' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`AI API returned ${status}`)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    let parsed: { text: string; book: string }
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('Failed to parse AI response:', content)
      return new Response(
        JSON.stringify({ error: 'Failed to parse verse' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Pick a topic image
    const topics = ['nature', 'sky', 'light', 'peace', 'mountains', 'sunset', 'ocean']
    const topic = topics[Math.floor(Math.random() * topics.length)]
    const topicImage = `https://images.unsplash.com/featured/?${topic},nature&w=800&q=80&sig=${Date.now()}`

    return new Response(
      JSON.stringify({
        text: parsed.text,
        book: parsed.book,
        topic_image: topicImage,
        effective_version: effectiveVersion,
        version_mismatch: versionMismatch,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in fetch-bible-verse:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
