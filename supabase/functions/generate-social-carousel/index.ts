const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { verse, topic, language = 'PT' } = await req.json()

    if (!verse || typeof verse !== 'string' || verse.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "verse" field' }),
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

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const langLabel = language === 'EN' ? 'English' : language === 'ES' ? 'Spanish' : 'Portuguese'

    const systemPrompt = `You are a Christian social media content strategist. Your job is to create engaging Instagram carousel content from a Bible verse.

Rules:
- Return ONLY valid JSON: an object with a "slides" array containing exactly 7 objects
- Each slide object has: "slide" (number 1-7), "type" (string), "title" (short headline, max 8 words), "content" (body text, max 180 chars)
- Write in ${langLabel}
- Slide structure:
  1. type:"verse" — The Bible verse itself as title, reference as content
  2. type:"hook" — A provocative question or statement to grab attention
  3. type:"context" — Historical or theological context of the verse
  4. type:"insight" — A deep spiritual insight or reflection
  5. type:"application" — Practical application for daily life
  6. type:"prayer" — A short prayer inspired by the verse
  7. type:"cta" — Call to action (save, share, follow)
- Tone: pastoral, warm, engaging for social media
- Do NOT use markdown formatting in the content
- Keep content concise and impactful — designed for visual slides`

    const userPrompt = topic
      ? `Create a 7-slide carousel for: "${verse}" with focus on the topic: "${topic}"`
      : `Create a 7-slide carousel for: "${verse}"`

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    })

    if (!aiResponse.ok) {
      const status = aiResponse.status
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`AI API returned ${status}`)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    let parsed: { slides: Array<{ slide: number; type: string; title: string; content: string }> }
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('Failed to parse AI response:', content)
      return new Response(
        JSON.stringify({ error: 'Failed to parse carousel data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!parsed.slides || !Array.isArray(parsed.slides)) {
      return new Response(
        JSON.stringify({ error: 'Invalid carousel structure' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log generation
    const inputTokens = aiData.usage?.prompt_tokens || 0
    const outputTokens = aiData.usage?.completion_tokens || 0
    const totalTokens = inputTokens + outputTokens
    const costUsd = (inputTokens * 0.00000015 + outputTokens * 0.0000006)

    await supabase.from('generation_logs').insert({
      user_id: user.id,
      feature: 'social-carousel',
      model: 'google/gemini-2.5-flash',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      cost_usd: costUsd,
    })

    return new Response(
      JSON.stringify({ slides: parsed.slides }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-social-carousel:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
