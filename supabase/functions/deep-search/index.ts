const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, bibleVersion = 'ARA', language = 'PT' } = await req.json()

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "query" field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const langLabel = language === 'EN' ? 'English' : language === 'ES' ? 'Spanish' : 'Portuguese'

    const systemPrompt = `You are an expert biblical scholar and exegete. The user will ask a question or mention a biblical topic.
Your job is to return a DEEP, RICH biblical analysis as a JSON object.

Rules:
- Return ONLY valid JSON with these exact fields:
  - "reference": the main Bible reference (e.g. "João 4:1-42" or "John 4:1-42")
  - "passage": the key verse text from that passage, using the ${bibleVersion} translation in ${langLabel}. Include the verse reference at the end.
  - "summary": a clear 2-3 sentence overview of what is happening in this passage (in ${langLabel})
  - "context": historical, cultural, and geographical context that illuminates the passage (in ${langLabel}, 3-5 sentences)
  - "insights": an array of 3-5 deep theological insights about this passage (in ${langLabel}, each 1-2 sentences)
- Use the ${bibleVersion} Bible version for all verse quotations
- Write everything in ${langLabel}
- Be scholarly but accessible — a pastor should find this useful for sermon preparation
- Do NOT add markdown formatting, only plain text`

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
          { role: 'user', content: query },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    })

    if (!aiResponse.ok) {
      const status = aiResponse.status
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, try again later' }), {
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

    let parsed: { reference: string; passage: string; summary: string; context: string; insights: string[] }
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('Failed to parse AI response:', content)
      return new Response(
        JSON.stringify({ error: 'Failed to parse search results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in deep-search:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
