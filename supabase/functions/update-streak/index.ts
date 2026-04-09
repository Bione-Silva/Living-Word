import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Apenas usuarios autenticados chamam a api deles proprios
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Autenticação Obrigatória')

    // Pega o payload da açao que o usuario fez (ex: action = 'read_devotional')
    const { action_type } = await req.json()

    // Service role para atualizar o BD do User no Profile (ignora RLS se necessario)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscamos o Profile para ver os pontos e o LDATE (Ultima data de streak)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('score, streak_days, last_streak_date')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Perfil não encontrado')

    const todayStr = new Date().toISOString().split('T')[0]
    const lastDate = profile.last_streak_date

    let newStreak = profile.streak_days || 0
    let pointsToAdd = 0

    // Gamificação base
    if (action_type === 'read_devotional') pointsToAdd = 10
    if (action_type === 'quiz_completed') pointsToAdd = 20
    if (action_type === 'bible_chapter') pointsToAdd = 5

    // Lógica de Retenção Diária (Se for hoje, nao adiciona streak de novo)
    if (lastDate !== todayStr) {
      newStreak += 1
      pointsToAdd += 5 // Bônus por voltar
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        score: (profile.score || 0) + pointsToAdd,
        streak_days: newStreak,
        last_streak_date: todayStr
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) throw updateError

    return new Response(JSON.stringify({ 
      success: true, 
      new_score: updatedProfile.score, 
      streak: updatedProfile.streak_days 
    }), { headers: corsHeaders })

  } catch (err) {
    console.error('Streak update Error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
