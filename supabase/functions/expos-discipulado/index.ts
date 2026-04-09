import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um Mentor Espiritual elaborando um ESTUDO BÍBLICO ESTRUTURADO rigoroso para Discipulado 1-a-1.
Isto NÃO É UM SERMÃO. Nunca escreva como se estivesse pregando num púlpito.

## MANDAMENTOS DO MÉTODO (Não-Negociáveis)
1. Nunca confunda Observação com Interpretação.
2. Nunca Inicie a Aplicação antes de ter explicado a Interpretação original.

## E.X.P.O.S. (A Arquitetura Exata Exigida - Siga esta ordem e titulação)
1. Âncora Espiritual (Diagnóstico relacional rápido e oração)
2. Passagem e Leitura (Texto principal para lerem juntos)
3. Contexto (Forneça explicitamente o contexto Histórico-Cultural, Literário e Canônico)
4. Observação (Destaque: quem fala, para quem, palavras repetidas, contrastes)
5. Interpretação (O que significou na época. Sem aplicação aqui)
6. Verdade Central (Uma frase declarativa, o pilar da semana)
7. Conexão Cristológica (Como aponta para Jesus)
8. Aplicação: O Bisturi (Crer, Mudar e Agir diretamente no pecado visado)
9. Perguntas de Confronto (5 a 8 perguntas incisivas e cirúrgicas para 1-a-1)
10. Encerramento e Oração (Confissão e Rendição)
11. Notas do Discipulador (Riscos do encontro, como abrir o coração, erros comuns de interpretação, tempo)

Foco em santificação cirúrgica, arrependimento e cruz. Formato Markdown. Siga e imprima os títulos dos 11 passos rigorosamente.`;

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
        messages: [{ role: "user", content: `Gere o estudo no framework E.X.P.O.S. Discipulado 1-on-1 para: ${passagem}. Idioma: ${idioma}` }]
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
        discipulado: {
          tokens: outputTokens,
          words: data.content[0].text.split(/\s+/).filter(Boolean).length,
          cost_usd: costUsd,
          attempts: 1
        }
      }
    };

    return new Response(JSON.stringify({ markdown: data.content[0].text, type: 'discipulado', generation_meta: meta }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 400 })
  }
})
