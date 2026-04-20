const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { normalizePlan, PLAN_PRICE_USD } from '../_shared/plan.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('LOVABLE_API_KEY');

    // Verify caller is admin
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader || '' } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'bionicaosilva@gmail.com') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get metrics using service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profiles } = await adminClient.from('profiles').select('plan, generations_used');

    const totalUsers = profiles?.length || 0;
    // Normalize legacy plan slugs (pastoral→starter, church→pro, ministry→igreja)
    const counts = { free: 0, starter: 0, pro: 0, igreja: 0 };
    for (const p of profiles ?? []) {
      counts[normalizePlan(p.plan)]++;
    }
    const totalGenerations = profiles?.reduce((sum, p) => sum + (p.generations_used || 0), 0) || 0;
    const mrr =
      counts.starter * PLAN_PRICE_USD.starter +
      counts.pro * PLAN_PRICE_USD.pro +
      counts.igreja * PLAN_PRICE_USD.igreja;

    if (!apiKey) {
      return new Response(JSON.stringify({
        insight: `📊 **Resumo Rápido**\n\n- ${totalUsers} usuários registrados\n- ${counts.free} free, ${counts.starter} starter, ${counts.pro} pro, ${counts.igreja} igreja\n- MRR estimado: US$ ${mrr.toFixed(2)}\n- ${totalGenerations} gerações utilizadas\n\n*Configure o Lovable AI para análises mais profundas com IA.*`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Analise estes dados do SaaS Living Word e dê recomendações financeiras como um CFO:
- Total de usuários: ${totalUsers}
- Free: ${counts.free}, Starter ($${PLAN_PRICE_USD.starter}): ${counts.starter}, Pro ($${PLAN_PRICE_USD.pro}): ${counts.pro}, Igreja ($${PLAN_PRICE_USD.igreja}): ${counts.igreja}
- MRR atual: US$ ${mrr.toFixed(2)}
- Total de gerações de IA utilizadas: ${totalGenerations}

Dê insights sobre:
1. Saúde financeira atual
2. Taxa de conversão free→pago
3. Recomendações para reduzir custos de IA
4. Estratégias para aumentar MRR

Seja direto, use números e percentuais. Responda em português.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um CFO analítico de SaaS. Dê conselhos financeiros baseados em dados reais.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || 'Não foi possível gerar a análise.';

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
