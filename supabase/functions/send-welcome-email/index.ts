// Send welcome email — called once when user confirms email or finishes blog onboarding
// emailType: 'welcome-confirmed' | 'altar-digital-ready'
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

  let body: { emailType?: string; blogUrl?: string } = {}
  try { body = await req.json() } catch {}
  const emailType = body.emailType
  if (emailType !== 'welcome-confirmed' && emailType !== 'altar-digital-ready') {
    return new Response(JSON.stringify({ error: 'Invalid emailType' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userId = claims.claims.sub as string
  const email = claims.claims.email as string
  const admin = createClient(supabaseUrl, serviceKey)

  // Idempotency: skip if already sent
  const { data: existing } = await admin
    .from('welcome_email_log')
    .select('id').eq('user_id', userId).eq('email_type', emailType).maybeSingle()
  if (existing) {
    return new Response(JSON.stringify({ skipped: true, reason: 'already_sent' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: profile } = await admin
    .from('profiles').select('full_name, blog_handle, language').eq('id', userId).maybeSingle()
  const name = profile?.full_name?.split(' ')[0] || null
  const lang = (profile?.language || 'PT').toString().toUpperCase()
  const blogUrl = body.blogUrl || (profile?.blog_handle
    ? `https://livingwordgo.com/blog/${profile.blog_handle}`
    : 'https://livingwordgo.com')

  const templateName = emailType
  const templateData: Record<string, unknown> = { name, lang }
  if (emailType === 'altar-digital-ready') templateData.blogUrl = blogUrl

  const { error: invokeError } = await admin.functions.invoke('send-transactional-email', {
    body: {
      templateName,
      recipientEmail: email,
      idempotencyKey: `${emailType}-${userId}`,
      templateData,
    },
    headers: {
      Authorization: authHeader,
    },
  })

  if (invokeError) {
    console.error('send-welcome-email invoke failed', invokeError)
    return new Response(JSON.stringify({
      sent: false,
      fallback: true,
      error: 'email_dispatch_failed',
      message: invokeError.message,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  await admin.from('welcome_email_log').insert({ user_id: userId, email_type: emailType })

  return new Response(JSON.stringify({ sent: true, emailType }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
