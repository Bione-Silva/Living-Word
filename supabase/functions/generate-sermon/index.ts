import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um Gerador Avançado de Pregações e Sermões Evangélicos.
Seu objetivo é ajudar líderes, pastores e cristãos a criarem esboços profundos, teologicamente sólidos e perfeitamente estruturados.

REGRAS DE FORMATAÇÃO E MARCKDOWN (OBRIGATÓRIAS):
1. Use Headers (##) para os tópicos principais: Introdução, Pontos, Conclusão.
2. HYPERLINKS BÍBLICOS OBRIGATÓRIOS: Sempre que citar qualquer passagem bíblica, envolva-a em um link apontando para a Bíblia interna. 
   Formato: [NomeDoLivro Capítulo:Versículo](/biblia/nomedolivro-sem-acento/capitulo). 
   Exemplo: "Em [João 3:16](/biblia/joao/3), vemos que..."
3. Citações longas de versículos devem usar Blockquote (>).

O usuário passará os parâmetros do Sermão (Tema, Público-Alvo, Tom). Seja fiel às orientações dele.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Autenticacao
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { theme, targetAudience, tone, duration, additionalNotes } = await req.json()

    if (!theme) throw new Error('O tema da pregação é obrigatório')

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada')

    const userPrompt = `
Por favor, gere um esboço de sermão completo com base nos seguintes dados:
- Tema: ${theme}
- Público-Alvo: ${targetAudience || 'Congregação Geral'}
- Tom do sermão: ${tone || 'Inspiracional e Dinâmico'}
- Duração Alvo: ${duration || '30 minutos'}
- Notas Adicionais: ${additionalNotes || 'Nenhuma'}

Estrutura desejada:
1. Título do Sermão
2. Texto-base (com hiperlink)
3. Introdução (Contextualização)
4. Tópicos (2 ou 3 pontos chaves com aplicação prática)
5. Conclusão e Apelo`

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o', // Para sermões longos, o 4o é o melhor
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    })

    if (!aiResponse.ok) throw new Error(`OpenAI error: ${await aiResponse.text()}`)
    const aiData = await aiResponse.json()
    const sermonContent = aiData.choices[0].message.content

    // Salvar no Banco
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const titleMatch = sermonContent.match(/# (.*)/)
    const title = titleMatch ? titleMatch[1].trim() : theme

    const { data: savedSermon, error: saveError } = await supabaseAdmin
      .from('sermons')
      .insert({
        user_id: user.id,
        title: title,
        theme: theme,
        target_audience: targetAudience,
        tone: tone,
        duration: duration,
        content_markdown: sermonContent,
        prompt_used: userPrompt
      })
      .select()
      .single()

    if (saveError) {
      console.log('Erro ao salvar sermão no DB:', saveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: sermonContent,
        sermon_id: savedSermon?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders })
  }
})
