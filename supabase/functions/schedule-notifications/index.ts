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

    // Get user's devotional profile
    const { data: profile } = await supabase
      .from('devotional_user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const consecutiveDays = profile?.consecutive_days_engaged || 0
    const lastTheme = profile?.last_devotional_theme || 'devocional'

    const notifications: Array<{
      user_id: string
      message: string
      type: string
      scheduled_for: string
    }> = []

    const now = new Date()

    // Schedule daily devotional reminders for next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      date.setHours(7, 0, 0, 0)

      notifications.push({
        user_id: user.id,
        message: `Seu devocional do dia está pronto! Continue sua série sobre ${lastTheme}.`,
        type: 'new_devotional',
        scheduled_for: date.toISOString(),
      })
    }

    // Series milestones
    const milestoneDays = [7, 14, 21, 30]
    for (const milestone of milestoneDays) {
      if (consecutiveDays < milestone) {
        const daysUntil = milestone - consecutiveDays
        if (daysUntil <= 30) {
          const date = new Date(now)
          date.setDate(date.getDate() + daysUntil)
          date.setHours(9, 0, 0, 0)
          notifications.push({
            user_id: user.id,
            message: `Parabéns! Você completará ${milestone} dias consecutivos! 🎉`,
            type: 'series_milestone',
            scheduled_for: date.toISOString(),
          })
        }
        break
      }
    }

    // Engagement reminder if inactive for 2+ days
    const reminderDate = new Date(now)
    reminderDate.setDate(reminderDate.getDate() + 2)
    reminderDate.setHours(18, 0, 0, 0)
    notifications.push({
      user_id: user.id,
      message: 'Sentimos sua falta! Volte para continuar sua jornada devocional. 🙏',
      type: 'engagement_reminder',
      scheduled_for: reminderDate.toISOString(),
    })

    // Delete existing future notifications for this user
    await supabase
      .from('notification_queue')
      .delete()
      .eq('user_id', user.id)
      .eq('sent', false)
      .gte('scheduled_for', now.toISOString())

    // Insert new notifications
    const { error } = await supabase
      .from('notification_queue')
      .insert(notifications)

    if (error) {
      console.error('Insert error:', error)
      return new Response(JSON.stringify({ error: 'Failed to schedule' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ scheduled: notifications.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
