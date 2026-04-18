const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Try to identify the user (optional). Devotionals are public/read-only,
    // so we never block the request — we just use language preference if available.
    let language = 'PT'
    const authHeader = req.headers.get('Authorization')

    if (authHeader) {
      try {
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        })
        const { data: { user } } = await userClient.auth.getUser()
        if (user) {
          const { data: profile } = await userClient
            .from('profiles')
            .select('language')
            .eq('id', user.id)
            .single()
          if (profile?.language) language = profile.language
        }
      } catch (e) {
        console.warn('Auth lookup failed, continuing as anonymous:', e)
      }
    }

    // Allow language override via query/body
    const url = new URL(req.url)
    const langParam = url.searchParams.get('language')
    let dateParam = url.searchParams.get('date')
    if (!dateParam || !langParam) {
      try {
        const body = await req.json()
        if (body?.date) dateParam = body.date
        if (body?.language) language = body.language
      } catch { /* no body */ }
    }
    if (langParam) language = langParam

    const today = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toISOString().slice(0, 10)

    // Use service role for the read — devotionals are shared content
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: devotional, error: dbError } = await adminClient
      .from('devotionals')
      .select('*')
      .eq('scheduled_date', today)
      .eq('language', language)
      .limit(1)
      .maybeSingle()

    if (dbError) {
      console.error('DB error:', dbError)
      throw new Error('Database query failed')
    }

    if (!devotional) {
      return new Response(JSON.stringify({
        id: null,
        title: language === 'EN' ? "Today's devotional is being prepared"
          : language === 'ES' ? 'El devocional de hoy se está preparando'
          : 'O devocional de hoje está sendo preparado',
        category: '',
        anchor_verse: '',
        anchor_verse_text: '',
        body_text: language === 'EN' ? 'Come back soon — your daily word is on its way.'
          : language === 'ES' ? 'Vuelve pronto — tu palabra diaria está en camino.'
          : 'Volte em breve — sua palavra diária está a caminho.',
        daily_practice: '',
        reflection_question: '',
        closing_prayer: '',
        scheduled_date: today,
        cover_image_url: null,
        audio_url_nova: null,
        audio_url_alloy: null,
        audio_url_onyx: null,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      id: devotional.id,
      title: devotional.title,
      category: devotional.category,
      anchor_verse: devotional.anchor_verse,
      anchor_verse_text: devotional.anchor_verse_text,
      body_text: devotional.body_text,
      daily_practice: devotional.daily_practice || '',
      reflection_question: devotional.reflection_question || '',
      closing_prayer: devotional.closing_prayer || '',
      scheduled_date: devotional.scheduled_date,
      cover_image_url: devotional.cover_image_url,
      audio_url_nova: devotional.audio_url_nova || null,
      audio_url_alloy: devotional.audio_url_alloy || null,
      audio_url_onyx: devotional.audio_url_onyx || null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in get-devotional-today:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
