import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
    // Este é um Cron Job (Sem CORS necessário)
    try {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Limpa logs maiores que 90 dias
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const dateLimit = ninetyDaysAgo.toISOString()

        const { data, error, count } = await supabaseAdmin
            .from('emotional_support_logs')
            .delete()
            .lt('created_at', dateLimit)
            .select()

        if (error) throw error

        console.log(`✅ Job Executado. ${data?.length || 0} confissões antigas deletadas pelas regras da LGPD (Segurança +90 dias).`)
        return new Response(JSON.stringify({ success: true, deleted_count: data?.length || 0 }), { status: 200 })

    } catch (err) {
        console.error('Job error', err)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
