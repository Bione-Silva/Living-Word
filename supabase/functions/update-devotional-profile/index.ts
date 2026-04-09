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

    const { theme, timeSpent, sentiment, devotionalId } = await req.json()

    // Get or create profile
    const { data: existing } = await supabase
      .from('devotional_user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const favoriteThemes: string[] = existing?.favorite_themes || []
    if (theme && !favoriteThemes.includes(theme)) {
      favoriteThemes.push(theme)
      if (favoriteThemes.length > 20) favoriteThemes.shift()
    }

    const avgTime = existing
      ? Math.round(((existing.average_time_spent || 0) + (timeSpent || 0)) / 2)
      : (timeSpent || 0)

    const profileData = {
      user_id: user.id,
      favorite_themes: favoriteThemes,
      last_devotional_id: devotionalId || existing?.last_devotional_id || null,
      last_devotional_theme: theme || existing?.last_devotional_theme || null,
      consecutive_days_engaged: (existing?.consecutive_days_engaged || 0) + 1,
      average_time_spent: avgTime,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('devotional_user_profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Upsert error:', error)
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ profile: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
