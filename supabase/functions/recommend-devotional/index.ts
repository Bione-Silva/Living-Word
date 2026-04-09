const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch last 30 engagements
    const { data: engagements } = await supabase
      .from('devotional_engagements')
      .select('action, duration_seconds, emotional_response, reflection_sentiment, theme, series_number, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    // Calculate theme scores
    const themeScores: Record<string, number> = {}
    for (const e of engagements || []) {
      if (!e.theme) continue
      const score = (themeScores[e.theme] || 0) +
        (e.action === 'like' ? 3 : e.action === 'share' ? 5 : e.action === 'complete_reflection' ? 4 : 1) +
        Math.min((e.duration_seconds || 0) / 60, 5)
      themeScores[e.theme] = score
    }

    const sortedThemes = Object.entries(themeScores).sort((a, b) => b[1] - a[1])
    const topThemes = sortedThemes.slice(0, 5).map(([t, s]) => ({ theme: t, score: Math.round(s * 10) / 10 }))
    const recentSentiments = (engagements || []).slice(0, 5).map(e => e.reflection_sentiment).filter(Boolean)

    // Ask Gemini directly for recommendation
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    let nextTheme = topThemes[0]?.theme || 'esperança'
    let reasoning = 'Baseado em seu histórico de leitura'

    if (GEMINI_API_KEY && topThemes.length > 0) {
      try {
        const geminiResp = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You recommend the next devotional theme based on user engagement.
User top themes: ${JSON.stringify(topThemes)}
Recent sentiments: ${JSON.stringify(recentSentiments)}

Respond ONLY with valid JSON: {"nextTheme": "theme name", "reasoning": "one sentence explanation in Portuguese"}`
                }]
              }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
            }),
          }
        )

        if (geminiResp.ok) {
          const geminiData = await geminiResp.json()
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
          const jsonMatch = rawText.match(/\{[^}]+\}/)
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0])
            nextTheme = result.nextTheme || nextTheme
            reasoning = result.reasoning || reasoning
          }
        }
      } catch (e) {
        console.error('Gemini recommendation error:', e)
      }
    }

    // Find a devotional with the recommended theme
    const { data: devotional } = await supabase
      .from('devotionals')
      .select('id, title, category, series_number, series_id, scheduled_date')
      .eq('category', nextTheme)
      .order('scheduled_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    return new Response(JSON.stringify({
      devotionalId: devotional?.id || null,
      theme: nextTheme,
      reasoning,
      seriesInfo: devotional ? { day: devotional.series_number || 1, totalDays: 7 } : null,
      topThemes,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
