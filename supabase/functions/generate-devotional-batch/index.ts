import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEVOTIONAL_TOPICS_BY_DAY = [
  'Escreva um devocional sobre o significado de adorar em comunidade, descanso sabático e renovação espiritual.',
  'Escreva um devocional sobre recomeço e propósito para uma segunda-feira — nova semana, nova chance.',
  'Escreva um devocional sobre perseverança quando o caminho é longo e os resultados demoram a aparecer.',
  'Escreva um devocional sobre fé quando os resultados ainda não apareceram — o ponto de virada invisível.',
  'Escreva um devocional sobre amor, relacionamentos e família à luz do Evangelho.',
  'Escreva um devocional sobre gratidão, o valor do descanso e encerrar bem a semana.',
  'Escreva um devocional sobre presença — estar de verdade com quem amamos, sem distrações.',
]

const SYSTEM_PROMPT = `Você é um escritor pastoral cristão com 20 anos de experiência em devocionais diários para o público evangélico brasileiro.

Seu estilo é próximo, humano e profundo — como uma conversa íntima entre pai e filho.
REGRAS OBRIGATÓRIAS:
1. Nunca use linguagem arcaica. Fale COM o leitor.
2. A abertura deve criar empatia imediata (cenas cotidianas).
3. O versículo âncora entra no MEIO do texto, formatado como link markdown para a bíblia: "[Livro Cap:Versiculo](/biblia/livro/capitulo)".
4. A reflexão final é UMA pergunta aberta e pessoal.
5. A oração é uma conversa, máximo 4 linhas.
6. COMPRIMENTO: 250 a 350 palavras no body_text.
Responda EXCLUSIVAMENTE em JSON válido.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada')

    // Data de amanha
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const scheduledDate = tomorrow.toISOString().split('T')[0]

    // Check se ja existe
    const { data: existing } = await supabase
      .from('devotionals')
      .select('id')
      .eq('scheduled_date', scheduledDate)
      .single()
    if (existing) {
      return new Response(JSON.stringify({ success: true, message: 'Já existe' }), { headers: corsHeaders })
    }

    const topic = DEVOTIONAL_TOPICS_BY_DAY[tomorrow.getDay()]
    const userPrompt = `${topic}
Retorne EXCLUSIVAMENTE em JSON:
{
  "title": "titulo curto",
  "category": "Fé | Graça | Familia etc",
  "anchor_verse": "Livro capitulo:versiculo",
  "anchor_verse_text": "texto versiculo",
  "body_text": "texto 300 palavras",
  "reflection_question": "pergunta pessoal",
  "closing_prayer": "oracao curta",
  "image_prompt": "prompt em ingles para DALL-E 3 representando o tema do devocional, estilo fotografia cinematica e contemplativa, sem texto na imagem"
}`

    // 1. CHAMA O LLM TEXTO
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt }],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      }),
    })
    if (!aiResponse.ok) throw new Error(`OpenAI Text erro: ${await aiResponse.text()}`)
    
    const aiData = await aiResponse.json()
    const devotional = JSON.parse(aiData.choices[0].message.content)

    // 2. MONTA TEXTO DO AUDIO TTS
    const scriptParaAudio = `
      Bem-vindo ao seu momento Devocional. Hoje a nossa reflexão é: ${devotional.title}.
      A palavra diz em ${devotional.anchor_verse}: ${devotional.anchor_verse_text}.
      
      ${devotional.body_text}
      
      Para sua reflexão hoje: ${devotional.reflection_question}
      
      Vamos orar: ${devotional.closing_prayer}
    `.trim()

    // 3 e 4. GERA OS ÁUDIOS VIA TTS-1 E UPA PARA STORAGE
    const voices = ['nova', 'alloy', 'onyx']
    const audioUrls: Record<string, string> = {}

    for (const voice of voices) {
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'tts-1',
          input: scriptParaAudio,
          voice: voice,
          response_format: 'mp3'
        })
      })
      
      if (!ttsResponse.ok) throw new Error(`OpenAI TTS erro (${voice}): ${await ttsResponse.text()}`)
      const audioBuffer = await ttsResponse.arrayBuffer()

      const fileName = `devocional_${scheduledDate}_${voice}.mp3`
      const { error: uploadError } = await supabase.storage
        .from('devotionals-audio')
        .upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        })
      if (uploadError) throw new Error(`Erro Storage (${voice}): ${uploadError.message}`)

      const { data: publicUrlData } = supabase.storage.from('devotionals-audio').getPublicUrl(fileName)
      audioUrls[voice] = publicUrlData.publicUrl
    }

    // 5. GERA IMAGEM DE CAPA VIA DALL-E 3
    let coverImageUrl = null
    try {
      const imagePrompt = devotional.image_prompt ||
        `Cinematic devotional scene representing: ${devotional.title}. Contemplative, warm light, spiritual atmosphere, no text.`

      const imgResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: imagePrompt,
          n: 1,
          size: '1792x1024',  // landscape cinematico
          quality: 'standard',
        }),
      })

      if (imgResponse.ok) {
        const imgData = await imgResponse.json()
        const imgUrl = imgData.data[0]?.url

        // Download e re-upload no nosso Storage (DALL-E URLs expiram)
        const imgDownload = await fetch(imgUrl)
        const imgBuffer = await imgDownload.arrayBuffer()
        const imgFileName = `devocional_${scheduledDate}.png`

        const { error: imgUploadError } = await supabase.storage
          .from('devotionals-images')
          .upload(imgFileName, imgBuffer, { contentType: 'image/png', upsert: true })

        if (!imgUploadError) {
          const { data: imgPublicUrl } = supabase.storage.from('devotionals-images').getPublicUrl(imgFileName)
          coverImageUrl = imgPublicUrl.publicUrl
        }
      }
    } catch (imgErr: unknown) {
      const msg = imgErr instanceof Error ? imgErr.message : String(imgErr)
      console.warn('⚠️ Imagem de capa falhou (não crítico):', msg)
    }

    // 6. SALVA NO DB TUDO PRONTO
    const { data: inserted, error: insertError } = await supabase
      .from('devotionals')
      .insert({
        title: devotional.title,
        category: devotional.category,
        scheduled_date: scheduledDate,
        anchor_verse: devotional.anchor_verse,
        anchor_verse_text: devotional.anchor_verse_text,
        body_text: devotional.body_text,
        reflection_question: devotional.reflection_question,
        closing_prayer: devotional.closing_prayer,
        tts_voice: 'nova',
        audio_url: audioUrls['nova'],
        audio_url_nova: audioUrls['nova'],
        audio_url_alloy: audioUrls['alloy'],
        audio_url_onyx: audioUrls['onyx'],
        cover_image_url: coverImageUrl,
        is_published: true,
      })
      .select()
      .single()

    if (insertError) throw insertError

    console.log(`✅ Devocional completo para ${scheduledDate}: Texto + 3 Áudios + Imagem`)
    return new Response(JSON.stringify({
      success: true,
      audio_nova: audioUrls['nova'],
      audio_alloy: audioUrls['alloy'],
      audio_onyx: audioUrls['onyx'],
      cover_image: coverImageUrl,
      title: devotional.title
    }), { headers: corsHeaders })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('generate-devotional-batch error:', msg)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders })
  }
})
