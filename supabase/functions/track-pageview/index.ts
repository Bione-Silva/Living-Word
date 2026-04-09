const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const path = sanitizeText(body?.path, 500)

    if (!path) {
      return new Response(JSON.stringify({ error: 'path is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let authenticatedUserId: string | null = null
    if (authHeader) {
      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user } } = await supabaseUser.auth.getUser()
      authenticatedUserId = user?.id ?? null
    }

    const country = sanitizeText(req.headers.get('cf-ipcountry') || req.headers.get('x-country'), 100)
    const city = sanitizeText(req.headers.get('cf-ipcity') || req.headers.get('x-city'), 100)

    const { error } = await supabaseAdmin.from('page_views').insert({
      path,
      referrer: sanitizeText(body?.referrer, 500),
      country: country || 'Unknown',
      city: city || 'Unknown',
      device: sanitizeText(body?.device, 50) || 'Unknown',
      browser: sanitizeText(body?.browser, 50) || 'Unknown',
      user_agent: sanitizeText(body?.user_agent, 500),
      session_id: sanitizeText(body?.session_id, 100),
      user_id: authenticatedUserId,
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('track-pageview error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
