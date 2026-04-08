const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

interface DevotionalPayload {
  title: string
  category: string
  anchor_verse: string
  anchor_verse_text: string
  body_text: string
  daily_practice?: string
  reflection_question: string
  scheduled_date: string
}

async function generateCoverImage(
  devotional: DevotionalPayload,
  userId: string,
  supabaseUrl: string,
): Promise<string | null> {
  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const today = devotional.scheduled_date

    // Check if image already exists for today
    const fileName = `devotional-covers/${today}.png`
    const { data: existingUrl } = adminClient.storage
      .from('blog-images')
      .getPublicUrl(fileName)

    // Try to check if file exists
    const { data: existingFile } = await adminClient.storage
      .from('blog-images')
      .list('devotional-covers', { search: `${today}.png` })

    if (existingFile && existingFile.length > 0) {
      return existingUrl.publicUrl
    }

    const imagePrompt = `Generate a beautiful devotional cover image. Theme: "${devotional.title}". Category: ${devotional.category}. Bible verse: ${devotional.anchor_verse}. Style: atmospheric, ethereal, warm golden light, biblical landscape or symbolic imagery inspired by the verse. Painterly, artistic, museum-quality. Vertical 3:4 orientation. Do NOT include any text, letters, words, or typography in the image.`

    const imgResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.1-flash-image-preview',
        messages: [
          { role: 'user', content: imagePrompt },
        ],
      }),
    })

    if (!imgResponse.ok) {
      console.error('Image API error:', imgResponse.status, await imgResponse.text())
      return null
    }

    const imgData = await imgResponse.json()
    const msgContent = imgData.choices?.[0]?.message?.content

    // Extract base64 image data from various possible response formats
    let base64Data: string | null = null

    if (typeof msgContent === 'string') {
      // Format: "data:image/png;base64,..."
      const dataUrlMatch = msgContent.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/)
      if (dataUrlMatch) {
        base64Data = dataUrlMatch[1]
      }
    } else if (Array.isArray(msgContent)) {
      // Format: [{ type: "image_url", image_url: { url: "data:..." } }, ...]
      for (const part of msgContent) {
        const url = part?.image_url?.url || part?.image?.url || part?.url
        if (typeof url === 'string') {
          const match = url.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/)
          if (match) {
            base64Data = match[1]
            break
          }
        }
        // Direct base64 in content
        if (part?.type === 'image' && part?.source?.data) {
          base64Data = part.source.data
          break
        }
      }
    }

    if (!base64Data) {
      // Try parsing the whole response for any base64 image pattern
      const fullStr = JSON.stringify(imgData)
      const match = fullStr.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]{100,})/)
      if (match) {
        base64Data = match[1]
      }
    }

    if (!base64Data) {
      console.error('Could not extract image data from response. Keys:', Object.keys(imgData))
      console.error('Content type:', typeof msgContent, Array.isArray(msgContent) ? 'array' : '')
      return null
    }

    // Decode and upload
    const raw = atob(base64Data)
    const imageBytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) {
      imageBytes[i] = raw.charCodeAt(i)
    }

    const { error: uploadError } = await adminClient.storage
      .from('blog-images')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    const { data: urlData } = adminClient.storage
      .from('blog-images')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  } catch (err) {
    console.error('Image generation failed (non-critical):', err)
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('language')
      .eq('id', user.id)
      .single()

    const language = profile?.language || 'PT'

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const today = new Date().toISOString().slice(0, 10)
    const langLabel = language === 'EN' ? 'English' : language === 'ES' ? 'Spanish' : 'Portuguese'

    const systemPrompt = `You are a pastoral devotional writer. Return ONLY valid JSON, no markdown.
Generate a complete daily devotional for pastors and church leaders.
The devotional must be in ${langLabel}.
Use today's date seed: ${today}

Return JSON with exactly these fields:
- "title": a compelling devotional title (max 60 chars)
- "category": one category word in ${langLabel} (e.g. Fé, Esperança, Graça, Amor, Sabedoria, Coragem, Perseverança)
- "anchor_verse": the Bible reference (e.g. "Filipenses 4:13")
- "anchor_verse_text": the full verse text
- "body_text": a 3-4 paragraph devotional reflection (about 250 words total). Use \\n\\n between paragraphs. End with a short prayer.
- "daily_practice": a single concrete, actionable practice for the day (1-2 sentences). Start with a verb.
- "reflection_question": one thought-provoking question for personal reflection
- "scheduled_date": "${today}"

Choose from the FULL Bible — avoid overused verses like John 3:16, Psalm 23, Jeremiah 29:11.
The tone should be warm, pastoral, and encouraging.`

    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate today's devotional. Date: ${today}. Make it fresh and unique.` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('AI API error:', aiResponse.status, errText)
      throw new Error(`AI API returned ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    let parsed: DevotionalPayload

    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('Failed to parse AI response:', content)
      parsed = {
        title: language === 'EN' ? "God's Faithfulness" : language === 'ES' ? 'La Fidelidad de Dios' : 'A Fidelidade de Deus',
        category: language === 'EN' ? 'Faith' : language === 'ES' ? 'Fe' : 'Fé',
        anchor_verse: language === 'EN' ? 'Lamentations 3:22-23' : language === 'ES' ? 'Lamentaciones 3:22-23' : 'Lamentações 3:22-23',
        anchor_verse_text: language === 'EN'
          ? 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.'
          : language === 'ES'
          ? 'Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana; grande es tu fidelidad.'
          : 'As misericórdias do Senhor são a causa de não sermos consumidos; porque as suas misericórdias não têm fim. Novas são cada manhã; grande é a tua fidelidade.',
        body_text: language === 'EN'
          ? 'Each new morning is a reminder of God\'s unwavering faithfulness.\n\nNo matter what challenges yesterday brought, today His mercies are renewed.\n\nLet this truth anchor your heart as you serve His people today.'
          : language === 'ES'
          ? 'Cada nueva mañana es un recordatorio de la fidelidad inquebrantable de Dios.\n\nNo importa los desafíos de ayer, hoy Sus misericordias se renuevan.\n\nQue esta verdad ancle tu corazón mientras sirves a Su pueblo hoy.'
          : 'Cada nova manhã é um lembrete da fidelidade inabalável de Deus.\n\nNão importa os desafios de ontem, hoje Suas misericórdias se renovam.\n\nQue esta verdade ancore seu coração enquanto você serve ao Seu povo hoje.',
        daily_practice: language === 'EN'
          ? 'Take a moment today to write down three specific ways God has been faithful to you this week.'
          : language === 'ES'
          ? 'Tómate un momento hoy para escribir tres formas específicas en que Dios ha sido fiel contigo esta semana.'
          : 'Reserve um momento hoje para escrever três formas específicas em que Deus tem sido fiel a você esta semana.',
        reflection_question: language === 'EN'
          ? 'How have you experienced God\'s faithfulness recently in your ministry?'
          : language === 'ES'
          ? '¿Cómo has experimentado la fidelidad de Dios recientemente en tu ministerio?'
          : 'Como você tem experimentado a fidelidade de Deus recentemente no seu ministério?',
        scheduled_date: today,
      }
    }

    // Log generation
    const inputTokens = aiData.usage?.prompt_tokens || 0
    const outputTokens = aiData.usage?.completion_tokens || 0
    await supabase.from('generation_logs').insert({
      user_id: user.id,
      feature: 'devotional-today',
      model: 'google/gemini-2.5-flash',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      cost_usd: ((inputTokens * 0.075 + outputTokens * 0.3) / 1_000_000),
    })

    // Generate cover image (non-blocking for response — we still await but it's fault-tolerant)
    const coverImageUrl = await generateCoverImage(parsed, user.id, supabaseUrl)

    return new Response(JSON.stringify({
      id: `devotional-${today}`,
      title: parsed.title,
      category: parsed.category,
      anchor_verse: parsed.anchor_verse,
      anchor_verse_text: parsed.anchor_verse_text,
      body_text: parsed.body_text,
      daily_practice: parsed.daily_practice || '',
      reflection_question: parsed.reflection_question,
      scheduled_date: parsed.scheduled_date,
      cover_image_url: coverImageUrl,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in get-devotional-today:', error)
    const today = new Date().toISOString().slice(0, 10)
    return new Response(JSON.stringify({
      id: `devotional-${today}`,
      title: 'A Fidelidade de Deus',
      category: 'Fé',
      anchor_verse: 'Lamentações 3:22-23',
      anchor_verse_text: 'As misericórdias do Senhor são a causa de não sermos consumidos; porque as suas misericórdias não têm fim.',
      body_text: 'Cada nova manhã é um lembrete da fidelidade inabalável de Deus.\n\nNão importa os desafios de ontem, hoje Suas misericórdias se renovam.\n\nQue esta verdade ancore seu coração enquanto você serve ao Seu povo hoje.',
      daily_practice: 'Reserve um momento hoje para escrever três formas específicas em que Deus tem sido fiel a você esta semana.',
      reflection_question: 'Como você tem experimentado a fidelidade de Deus recentemente no seu ministério?',
      scheduled_date: today,
      cover_image_url: null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
