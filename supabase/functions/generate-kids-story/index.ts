import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Os 20 personagens do Kids (fonte: zeal-pro-mapeamento-completo.md)
const BIBLICAL_CHARACTERS = [
  'Davi', 'Moisés', 'Daniel', 'Ester', 'José', 'Rute', 'Samuel', 'Jonas',
  'Sansão', 'Josué', 'Gideão', 'Jesus', 'Noé', 'Adão e Eva', 'Salomão',
  'Zaqueu', 'Apóstolo Pedro', 'Balaão', 'Abraão', 'Jacó'
]

const SYSTEM_PROMPT = `Você é um contador de histórias bíblicas para crianças de 4 a 10 anos.
Suas histórias devem ser:
- Curtas: exatamente 3 parágrafos
- Linguagem simples e divertida (como se você estivesse contando pessoalmente para uma criança)
- Fiéis ao texto bíblico, mas com linguagem acessível
- Cada história termina com uma "Lição" de 1 frase clara e empolgante

FORMATO DE RESPOSTA (JSON puro, sem markdown):
{
  "titulo": "Nome do Personagem",
  "historia": "Parágrafo 1\\n\\nParágrafo 2\\n\\nParágrafo 3",
  "licao": "Deus nos torna corajosos quando confiamos Nele.",
  "image_prompt": "Um prompt em inglês para gerar uma imagem desta história no estilo ilustração infantil colorida"
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Autenticação Obrigatória')

    const { character, generate_image = false } = await req.json()
    if (!character) throw new Error('Parâmetro "character" obrigatório')
    if (!BIBLICAL_CHARACTERS.includes(character)) {
      throw new Error(`Personagem inválido. Escolha um de: ${BIBLICAL_CHARACTERS.join(', ')}`)
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada')

    // 1. Gerar a história com GPT-4o-mini (barato e rápido para histórias curtas)
    const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Conte a história de ${character} para crianças.` },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      }),
    })

    if (!textResponse.ok) throw new Error(`OpenAI text error: ${await textResponse.text()}`)
    const textData = await textResponse.json()
    const story = JSON.parse(textData.choices[0].message.content)

    let imageUrl = null

    // 2. Gerar imagem com DALL-E 3 (somente se solicitado — consome créditos)
    if (generate_image && story.image_prompt) {
      const imgResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `${story.image_prompt}, colorful children's book illustration, warm colors, friendly, biblical story`,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      })

      if (imgResponse.ok) {
        const imgData = await imgResponse.json()
        imageUrl = imgData.data[0]?.url
      }
    }

    // 3. Salvar no banco para histórico e cache
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: saved } = await supabaseAdmin
      .from('kids_stories')
      .insert({
        user_id: user.id,
        character_name: character,
        title: story.titulo,
        story_text: story.historia,
        lesson: story.licao,
        image_url: imageUrl,
      })
      .select('id')
      .single()

    return new Response(JSON.stringify({
      success: true,
      story: {
        id: saved?.id,
        titulo: story.titulo,
        historia: story.historia,
        licao: story.licao,
        image_url: imageUrl,
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('Kids story error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders })
  }
})
