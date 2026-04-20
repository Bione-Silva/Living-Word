// Schedule drip sequence (Day 1, 3, 7) for a user — called once at signup confirmation
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const token = authHeader.replace('Bearer ', '')
  const { data: claims, error: authErr } = await userClient.auth.getClaims(token)
  if (authErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userId = claims.claims.sub as string
  const email = claims.claims.email as string
  if (!email) {
    return new Response(JSON.stringify({ error: 'Email not found' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // Fetch user name + language from profile (language captured at schedule time
  // so the drip respects the user's preferred language even if they change it later).
  const { data: profile } = await admin
    .from('profiles').select('full_name, language').eq('id', userId).maybeSingle()
  const name = profile?.full_name?.split(' ')[0] || null
  // Note: drip-scheduler reads language fresh from profile at send time —
  // we don't store it on drip_schedule rows.

  const now = Date.now()
  const days = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000).toISOString()

  const rows = [
    { template_name: 'drip-day-1', send_at: days(1) },
    { template_name: 'drip-day-3', send_at: days(3) },
    { template_name: 'drip-day-7', send_at: days(7) },
  ].map(r => ({
    user_id: userId,
    recipient_email: email,
    recipient_name: name,
    template_name: r.template_name,
    send_at: r.send_at,
    status: 'pending',
  }))

  // Upsert idempotently (one row per user+template)
  const { error } = await admin
    .from('drip_schedule')
    .upsert(rows, { onConflict: 'user_id,template_name', ignoreDuplicates: true })

  if (error) {
    console.error('schedule-drip insert failed', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ scheduled: rows.length }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
