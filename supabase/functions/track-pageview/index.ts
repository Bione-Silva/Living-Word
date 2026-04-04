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
    const { path, referrer, device, browser, user_agent, session_id, user_id } = await req.json()

    if (!path || typeof path !== 'string') {
      return new Response(JSON.stringify({ error: 'path is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Basic geo detection from headers (Cloudflare/Supabase provides these)
    const country = req.headers.get('cf-ipcountry') || req.headers.get('x-country') || null
    const city = req.headers.get('cf-ipcity') || req.headers.get('x-city') || null

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabaseAdmin.from('page_views').insert({
      path,
      referrer: referrer || null,
      country: country || 'Unknown',
      city: city || 'Unknown',
      device: device || 'Unknown',
      browser: browser || 'Unknown',
      user_agent: user_agent || null,
      session_id: session_id || null,
      user_id: user_id || null,
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
