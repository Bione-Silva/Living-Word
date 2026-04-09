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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: engagements } = await supabase
      .from('devotional_engagements')
      .select('theme, reflection_sentiment, action, duration_seconds')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo)

    // Analyze sentiments
    const sentimentCounts = { positive: 0, negative: 0, mixed: 0 }
    const themeCounts: Record<string, number> = {}

    for (const e of engagements || []) {
      if (e.reflection_sentiment) {
        sentimentCounts[e.reflection_sentiment as keyof typeof sentimentCounts]++
      }
      if (e.theme) {
        themeCounts[e.theme] = (themeCounts[e.theme] || 0) + 1
      }
    }

    const totalSentiments = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.mixed
    const negativeRatio = totalSentiments > 0 ? sentimentCounts.negative / totalSentiments : 0

    let topics: string[] = []
    let reason = ''

    if (negativeRatio > 0.4) {
      topics = ['esperança', 'força', 'consolo']
      reason = 'Detectamos sentimentos difíceis recentemente. Temas de esperança podem ajudar.'
    } else {
      const sorted = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])
      topics = sorted.slice(0, 3).map(([t]) => t)
      reason = topics.length > 0
        ? 'Seus temas mais engajados esta semana.'
        : 'Comece sua jornada devocional para receber recomendações personalizadas.'
    }

    return new Response(JSON.stringify({ topics, reason, sentimentCounts, totalEngagements: (engagements || []).length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
