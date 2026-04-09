import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um Teólogo e Mentor elaborando um ESTUDO BÍBLICO ESTRUTURADO rigoroso para Célula/Pequeno Grupo.
Isto NÃO É UM SERMÃO. Nunca escreva como se estivesse pregando num púlpito.

## MANDAMENTOS DO MÉTODO (Não-Negociáveis)
1. Nunca confunda Observação com Interpretação.
2. Nunca Inicie a Aplicação antes de ter explicado a Interpretação original.

## E.X.P.O.S. (A Arquitetura Exata Exigida - Siga esta ordem e titulação)
1. Âncora Espiritual (Oração breve de abertura para a célula)
2. Passagem e Leitura (Texto principal e instrução de como ler no grupo)
3. Contexto (Forneça explicitamente o contexto Histórico-Cultural, Literário e Canônico)
4. Observação (Destaque: quem fala, para quem, palavras repetidas, contrastes, verbos e estrutura)
5. Interpretação (O que significou na época. Não misture com apelos pastorais aqui)
6. Verdade Central (Uma frase declarativa, destacada)
7. Conexão Cristológica (Como aponta para Jesus)
8. Aplicação (Prática e específica, dividida em: Crer, Mudar e Agir)
9. Perguntas de Discussão (5 a 8 perguntas instigantes para o líder fazer ao grupo)
10. Encerramento e Oração (Focado no que foi aprendido)
11. Notas do Líder (Instruções de como abrir, tempo estimado, erros e interpretações perigosas a evitar)

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
        messages: [{ role: "user", content: `Gere o estudo no framework E.X.P.O.S. Célula para: ${passagem}. Idioma: ${idioma}` }]
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
        celula: {
          tokens: outputTokens,
          words: data.content[0].text.split(/\s+/).filter(Boolean).length,
          cost_usd: costUsd,
          attempts: 1
        }
      }
    };

    return new Response(JSON.stringify({ markdown: data.content[0].text, type: 'celula', generation_meta: meta }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 400 })
  }
})
