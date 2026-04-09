import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um Teólogo e Pastor guiando uma ovelha em um ESTUDO BÍBLICO ESTRUTURADO pessoal e devocional.
Isto NÃO É UM SERMÃO para multidão. É leitura dirigida 1-a-1.

## MANDAMENTOS DO MÉTODO (Não-Negociáveis)
1. Nunca confunda Observação com Interpretação.
2. Nunca Inicie a Aplicação antes de ter explicado a Interpretação original.

## E.X.P.O.S. (A Arquitetura Exata Exigida - Siga esta ordem e titulação)
1. Âncora Espiritual (Oração breve de preparo do coração)
2. Passagem e Leitura (Texto texto bíblico)
3. Contexto (Forneça explicitamente o contexto Histórico-Cultural, Literário e Canônico)
4. Observação (Guie o leitor a ver: quem fala, para quem, palavras repetidas, contrastes)
5. Interpretação (O que significou na época. Sem apelos e emoção barata)
6. Verdade Central (Uma frase declarativa, destacada)
7. Conexão Cristológica (Como aponta para Jesus)
8. Aplicação (Prática e específica, dividida em: Crer, Mudar e Agir)
9. Perguntas de Reflexão (5 a 8 perguntas para o diário (journaling) do leitor)
10. Encerramento e Oração (Fechando o aprendizado diário)
11. Notas de Memorização (Versículo-chave e lembrete para meditar)

Formato Markdown. Siga e imprima os títulos dos 11 passos rigorosamente.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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
        messages: [{ role: "user", content: `Gere o estudo no framework E.X.P.O.S. Individual para: ${passagem}. Idioma: ${idioma}` }]
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
        individual: {
          tokens: outputTokens,
          words: data.content[0].text.split(/\s+/).filter(Boolean).length,
          cost_usd: costUsd,
          attempts: 1
        }
      }
    };

    return new Response(JSON.stringify({ markdown: data.content[0].text, type: 'individual', generation_meta: meta }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
