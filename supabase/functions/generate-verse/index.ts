const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY')

const UNSPLASH_TOPICS = [
  'nature', 'sky', 'landscape', 'mountains', 'ocean', 'sunset',
  'sunrise', 'forest', 'field', 'light', 'peace', 'worship',
]

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&q=80',
  'https://images.unsplash.com/photo-1533000759938-aa0ba70beceb?w=800&q=80',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
  'https://images.unsplash.com/photo-1476610182048-b716b8515aaa?w=800&q=80',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&q=80',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { language = 'PT' } = await req.json().catch(() => ({}))

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

    // Use AI to generate a verse recommendation
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = `You are a biblical verse curator. Return ONLY valid JSON, no markdown.
Generate a random inspiring Bible verse for social media.
Return JSON with exactly these fields:
- "text": the verse text in ${language === 'EN' ? 'English' : language === 'ES' ? 'Spanish' : 'Portuguese'}
- "book": the book reference (e.g. "João 3:16" in PT, "John 3:16" in EN)
- "topic": a single english word describing the verse theme (nature, hope, love, peace, light, faith, grace, strength)
Do NOT repeat common verses like John 3:16 or Psalm 23 frequently. Choose from the full Bible.`

    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate one inspiring verse. Today's date: ${new Date().toISOString().slice(0, 10)}. Surprise me!` },
        ],
        response_format: { type: 'json_object' },
        temperature: 1.2,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('AI API error:', aiResponse.status, errText)
      throw new Error(`AI API returned ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    let parsed: { text: string; book: string; topic?: string }
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('Failed to parse AI response:', content)
      // Fallback
      parsed = {
        text: language === 'EN'
          ? 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you.'
          : language === 'ES'
          ? 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová.'
          : 'Porque eu bem sei os pensamentos que penso de vós, diz o Senhor.',
        book: language === 'EN' ? 'Jeremiah 29:11' : language === 'ES' ? 'Jeremías 29:11' : 'Jeremias 29:11',
        topic: 'hope',
      }
    }

    // Pick a relevant background image
    const topic = parsed.topic || UNSPLASH_TOPICS[Math.floor(Math.random() * UNSPLASH_TOPICS.length)]
    const topicImage = `https://images.unsplash.com/featured/?${topic},nature&w=800&q=80&sig=${Date.now()}`

    // Log generation
    const inputTokens = aiData.usage?.prompt_tokens || 0
    const outputTokens = aiData.usage?.completion_tokens || 0
    await supabase.from('generation_logs').insert({
      user_id: user.id,
      feature: 'verse-of-day',
      model: 'gemini-2.5-flash',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      cost_usd: ((inputTokens * 0.075 + outputTokens * 0.3) / 1_000_000),
    })

    // Increment generations_used
    await supabase.rpc('is_admin').then(() => {
      // Just use a simple update
    })
    await supabase
      .from('profiles')
      .update({ generations_used: (await supabase.from('profiles').select('generations_used').eq('id', user.id).single()).data?.generations_used + 1 || 1 })
      .eq('id', user.id)

    return new Response(
      JSON.stringify({
        text: parsed.text,
        book: parsed.book,
        topic_image: topicImage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in generate-verse:', error)
    // Return a fallback verse on error
    const fallbackImage = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]
    return new Response(
      JSON.stringify({
        text: 'O Senhor é o meu pastor; nada me faltará.',
        book: 'Salmos 23:1',
        topic_image: fallbackImage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
