// supabase/functions/generate-admin-analytics/index.ts
// Living Word — CFO Analytics Master Agent
// Analisa margem de lucro e gera sugestões de corte de custos.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYSTEM_PROMPT = `Você é o Assessor CFO (IA Financeira) da plataforma SaaS "Living Word".
Você falará DIRETAMENTE com o dono/Master do projeto.
Seu objetivo é ler os logs de gastos e dados recentes em formato JSON, avaliá-los e dar UM INSIGHT claro (corte de gastos, mudança de modelo ou comemoração de métrica).
- Fale com tom profissional, focado em lucro, escalabilidade e cortes de desperdício.
- Não gere textos enormes. No máximo 2 parágrafos.
- Sempre sugira a troca de IAs lá no painel de 'Vault' se o gasto de texto de certa IA estiver muito alto.`

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Validar quem tá chamando
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await supabaseAnon.auth.getUser()
    
    // Dupla verificação de admin
    if (!user || user.email !== 'bionicaosilva@gmail.com') {
       throw new Error('Forbiden. Somente o Master pode invocar o CFO Advisor.')
    }

    // Coletar métricas recentes para que a IA avalie
    const { data: snapshot } = await supabaseService.from('admin_saas_metrics').select('*').limit(1).single()
    const { data: logs } = await supabaseService.from('generation_logs')
        .select('mode, llm_model, cost_usd')
        .order('created_at', { ascending: false })
        .limit(100)

    // Agregar um mini relatório
    const totalCost100 = logs?.reduce((acc, l) => acc + (l.cost_usd || 0), 0) || 0
    const mostUsedModel = logs?.length ? logs.map(l => l.llm_model).sort((a,b) =>
          logs.filter(v => v.llm_model===a).length - logs.filter(v => v.llm_model===b).length
    ).pop() : 'N/A'

    const metricsStr = `
- Total Users: ${snapshot?.total_users_registered || 0}
- Pastoral Plans: ${snapshot?.users_pastoral || 0}
- Estimated MRR: $${snapshot?.estimated_mrr_usd || 0} USD
- Custo das últimas 100 gerações (API): $${totalCost100.toFixed(4)} USD
- Modelo de Geração mais usado: ${mostUsedModel}
`

    // Pega as keys e configs
    const { data: config } = await supabaseService.from('global_settings').select('value').eq('key', 'cfo_analytics_model').single()
    const activeModel = config?.value || 'gpt-4o-mini'
    
    const { data: vaultOpenRouter } = await supabaseService.rpc('get_api_key_secure', { p_provider: 'openrouter' })
    const { data: vaultOpenAi } = await supabaseService.rpc('get_api_key_secure', { p_provider: 'openai' })
    const apiKey = vaultOpenRouter || vaultOpenAi || Deno.env.get('OPENAI_API_KEY')!
    
    if (!apiKey) throw new Error('API Key Vault vazia.')

    const endpoint = vaultOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'

    // Chama o LLM para atuar como CFO
    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Aqui estão as métricas mais fresquinhas do SaaS. Me dê o conselho CFO:\n${metricsStr}` }
        ],
        temperature: 0.5,
      }),
    })

    if (!aiRes.ok) throw new Error('Falha na resposta do LLM Analytics')
    const aiData = await aiRes.json()
    const cfoText = aiData.choices[0]?.message?.content || 'Métricas recebidas, mas não entendi os dados.'

    return new Response(JSON.stringify({ advice: cfoText, model_used: activeModel, snapshot }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
