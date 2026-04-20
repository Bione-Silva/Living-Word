// Drip scheduler — runs every 5 minutes via pg_cron
// Reads drip_schedule for due rows and invokes send-transactional-email
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Pull up to 50 due rows
  const { data: due, error } = await supabase
    .from('drip_schedule')
    .select('*')
    .eq('status', 'pending')
    .lte('send_at', new Date().toISOString())
    .limit(50)

  if (error) {
    console.error('drip-scheduler: fetch failed', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!due || due.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let failed = 0

  for (const row of due) {
    try {
      // Resolve language fresh from the user's profile so the drip respects
      // the most recent language preference at send time.
      let lang = 'PT'
      if (row.user_id) {
        const { data: profile } = await supabase
          .from('profiles').select('language').eq('id', row.user_id).maybeSingle()
        if (profile?.language) lang = String(profile.language).toUpperCase()
      }

      const { error: invokeError } = await supabase.functions.invoke(
        'send-transactional-email',
        {
          body: {
            templateName: row.template_name,
            recipientEmail: row.recipient_email,
            idempotencyKey: `drip-${row.id}`,
            templateData: { name: row.recipient_name, lang },
          },
        },
      )

      if (invokeError) {
        await supabase
          .from('drip_schedule')
          .update({ status: 'failed', error_message: invokeError.message })
          .eq('id', row.id)
        failed++
      } else {
        await supabase
          .from('drip_schedule')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', row.id)
        sent++
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await supabase
        .from('drip_schedule')
        .update({ status: 'failed', error_message: msg })
        .eq('id', row.id)
      failed++
    }
  }

  return new Response(JSON.stringify({ processed: due.length, sent, failed }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
