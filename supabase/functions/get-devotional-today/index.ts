import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Support date override from request body
    let targetDate: string
    try {
      const body = await req.json()
      targetDate = body?.date || new Date().toISOString().split('T')[0]
    } catch {
      targetDate = new Date().toISOString().split('T')[0]
    }

    const { data: devotional, error } = await supabase
      .from('devotionals')
      .select('*')
      .eq('scheduled_date', targetDate)
      .eq('is_published', true)
      .single()

    if (error || !devotional) {
      // Fallback: retorna o devocional mais recente publicado
      const { data: latest, error: latestError } = await supabase
        .from('devotionals')
        .select('*')
        .eq('is_published', true)
        .order('scheduled_date', { ascending: false })
        .limit(1)
        .single()

      if (latestError || !latest) {
        return new Response(
          JSON.stringify({ error: 'Nenhum devocional disponível hoje.', code: 'NO_DEVOTIONAL' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(JSON.stringify(latest), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    return new Response(JSON.stringify(devotional), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
