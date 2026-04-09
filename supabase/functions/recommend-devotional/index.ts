const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getGeminiKey(): string | null {
  return Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY') || null
}

async function callGemini(apiKey: string, prompt: string): Promise<string | null> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro']
  const versions = ['v1beta', 'v1']

  for (const version of versions) {
    for (const model of models) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
            }),
          }
        )
        if (resp.ok) {
          const data = await resp.json()
          console.log(`Gemini success with ${version}/${model}`)
          return data.candidates?.[0]?.content?.parts?.[0]?.text || null
        }
      } catch (_) { /* try next */ }
    }
  }
  return null
}

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

    const { data: engagements } = await supabase
      .from('devotional_engagements')
      .select('action, duration_seconds, emotional_response, reflection_sentiment, theme, series_number, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

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

    const apiKey = getGeminiKey()
    let nextTheme = topThemes[0]?.theme || 'esperança'
    let reasoning = 'Baseado em seu histórico de leitura'

    if (apiKey && topThemes.length > 0) {
      const prompt = `You recommend the next devotional theme based on user engagement.
User top themes: ${JSON.stringify(topThemes)}
Recent sentiments: ${JSON.stringify(recentSentiments)}

Respond ONLY with valid JSON: {"nextTheme": "theme name", "reasoning": "one sentence explanation in Portuguese"}`

      const rawText = await callGemini(apiKey, prompt)
      if (rawText) {
        const jsonMatch = rawText.match(/\{[^}]+\}/)
        if (jsonMatch) {
          try {
            const result = JSON.parse(jsonMatch[0])
            nextTheme = result.nextTheme || nextTheme
            reasoning = result.reasoning || reasoning
          } catch (_) { /* use defaults */ }
        }
      }
    }

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
