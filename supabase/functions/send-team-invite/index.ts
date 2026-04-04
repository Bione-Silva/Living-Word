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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user || user.email !== 'bionicaosilva@gmail.com') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, role } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const validRoles = ['viewer', 'editor', 'admin']
    const memberRole = validRoles.includes(role) ? role : 'viewer'

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if already invited
    const { data: existing } = await supabaseAdmin
      .from('team_members')
      .select('id, status')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ error: 'Este email já foi convidado', existing }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert team member
    const { data: member, error: insertError } = await supabaseAdmin
      .from('team_members')
      .insert({
        email,
        role: memberRole,
        invited_by: user.id,
        status: 'pending',
      })
      .select('id, invite_token')
      .single()

    if (insertError) throw insertError

    const inviteUrl = `${req.headers.get('origin') || 'https://living-word.lovable.app'}/invite/${member.invite_token}`

    return new Response(JSON.stringify({
      success: true,
      invite_url: inviteUrl,
      member_id: member.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-team-invite error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
