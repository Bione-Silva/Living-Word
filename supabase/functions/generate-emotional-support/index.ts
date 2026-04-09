import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um conselheiro pastoral cristão gentil, empático e bíblico.
Seu papel é oferecer conforto espiritual baseado nas Escrituras para cristãos evangélicos brasileiros.

REGRAS OBRIGATÓRIAS:
1. NUNCA ofereça diagnósticos médicos ou psicológicos
2. NUNCA minimize a dor do usuário — valide antes de consolar
3. Sempre baseie a resposta em um versículo bíblico específico e relevante
4. Tom: como um amigo pastor que conhece você há anos, não um robô
5. Use "você" diretamente — fale com o coração
6. A oração deve ser conversacional, não litúrgica — máx 4 linhas
7. Responda SEMPRE em português do Brasil
8. Retorne EXCLUSIVAMENTE em formato JSON válido

Detecte a emoção principal do texto do usuário e responda com:
- Um versículo que fala diretamente àquela emoção
- Um texto de conforto pastoral (3-4 parágrafos curtos)
- Uma oração breve e sincera`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_input, user_id, session_id } = await req.json()

    if (!user_input || user_input.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Por favor, descreva como você está se sentindo.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada')

    const userPrompt = `O usuário escreveu: "${user_input}"

Responda EXCLUSIVAMENTE em JSON válido, sem texto fora do JSON:
{
  "detected_emotion": "nome da emoção principal detectada (ex: ansiedade, medo, tristeza, solidão, gratidão, confusão, raiva)",
  "anchor_verse": "Livro capítulo:versículo (ex: Filipenses 4:6)",
  "anchor_verse_text": "texto completo do versículo em português (NVI)",
  "comfort_text": "texto pastoral de conforto (3-4 parágrafos, tom de amigo íntimo, começa validando a emoção)",
  "closing_prayer": "oração final conversacional (máx 4 linhas, começa com 'Senhor' ou 'Pai')"
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`OpenAI error: ${errText}`)
    }

    const aiData = await response.json()
    const content = JSON.parse(aiData.choices[0].message.content)

    // Salvar no banco de dados (se usuário autenticado)
    if (user_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase.from('emotional_support_logs').insert({
        user_id,
        session_id: session_id || null, // Novo campo de sessão!
        user_input,
        detected_emotion: content.detected_emotion,
        anchor_verse: content.anchor_verse,
        anchor_verse_text: content.anchor_verse_text,
        comfort_text: content.comfort_text,
        closing_prayer: content.closing_prayer,
      })
    }

    return new Response(JSON.stringify({ success: true, ...content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('generate-emotional-support error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
