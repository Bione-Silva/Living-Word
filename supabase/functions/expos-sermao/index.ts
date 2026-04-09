import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um Mestre em Pregação Expositiva (estilo Haddon Robinson).

## E.X.P.O.S. (Formato Sermão)
0. Âncora de Preparo Espiritual 
1. Texto Base e Fronteiras
2. A "Big Idea" Dupla: IE (Ideia Exegética) e IH (Ideia Homilética: O princípio teológico universal em tempo presente).
3. Exegese Concisa (Contexto e Observação)
4. Introdução Estratégica: Gancho e Tensão (Fallen Condition Focus).
5. O Esboço Homilético em Declarações Plenas (Frases ativas e universais, sem substantivos mortos). Todo ponto deve derivar da tese.
6. Clímax Cristológico (Redemptive Focus)
7. Conclusão e Aplicação Homilética (Área de Crer + Área de Agir)
8. Encerramento e Apelo

Construa um esboço bala de rifle (um ponto principal, sustentado). Formato Markdown.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const startTime = Date.now();
    const { passagem, idioma = 'pt-BR' } = await req.json()
    if (!passagem) throw new Error("Parâmetro 'passagem' é obrigatório")

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no Supabase")

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Gere o sermão no framework E.X.P.O.S. Sermão para: ${passagem}. Idioma: ${idioma}` }]
      })
    })

    if (!response.ok) throw new Error(await response.text())

    const data = await response.json()

    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;
    const costUsd = (inputTokens * 0.000015) + (outputTokens * 0.000075);
    
    const meta = {
      model: "claude-3-opus-20240229",
      total_tokens: inputTokens + outputTokens,
      total_cost_usd: costUsd,
      elapsed_ms: Date.now() - startTime,
      per_format: {
        sermao: {
          tokens: outputTokens,
          words: data.content[0].text.split(/\s+/).filter(Boolean).length,
          cost_usd: costUsd,
          attempts: 1
        }
      }
    };

    return new Response(JSON.stringify({ markdown: data.content[0].text, type: 'sermao', generation_meta: meta }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 400 })
  }
})
