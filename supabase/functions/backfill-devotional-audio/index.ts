import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function generateAudio(openaiKey: string, text: string, voice: 'nova' | 'alloy' | 'onyx'): Promise<Uint8Array | null> {
  try {
    const ttsText = text.length > 4000 ? text.slice(0, 4000) + '...' : text
    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: ttsText,
        voice,
        response_format: 'mp3',
        speed: 0.95,
      }),
    })
    if (!resp.ok) {
      console.error(`TTS error (${voice}):`, resp.status, await resp.text())
      return null
    }
    return new Uint8Array(await resp.arrayBuffer())
  } catch (e) {
    console.error(`TTS failed (${voice}):`, e)
    return null
  }
}

async function uploadToStorage(supabase: any, path: string, data: Uint8Array, contentType: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from('devotional-assets')
    .upload(path, data, { contentType, upsert: true })
  if (error) {
    console.error(`Upload error (${path}):`, error)
    return null
  }
  const { data: urlData } = supabase.storage.from('devotional-assets').getPublicUrl(path)
  return urlData?.publicUrl || null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY not configured')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Find devotionals without audio (limit to 1 at a time to avoid timeout)
    const { data: devs } = await supabaseAdmin
      .from('devotionals')
      .select('id, title, body_text, anchor_verse_text, closing_prayer, scheduled_date, language')
      .is('audio_url_nova', null)
      .order('scheduled_date', { ascending: false })
      .limit(1)

    if (!devs || devs.length === 0) {
      return new Response(JSON.stringify({ message: 'All devotionals have audio' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const dev = devs[0]
    const fullText = `${dev.title}.\n\n${dev.anchor_verse_text}\n\n${dev.body_text}\n\n${dev.closing_prayer || ''}`
    console.log(`Generating audio for ${dev.language} ${dev.scheduled_date}: ${dev.title}`)

    const [novaData, alloyData, onyxData] = await Promise.all([
      generateAudio(openaiKey, fullText, 'nova'),
      generateAudio(openaiKey, fullText, 'alloy'),
      generateAudio(openaiKey, fullText, 'onyx'),
    ])

    const prefix = `audio/${dev.scheduled_date}-${dev.language}`
    const novaUrl = novaData ? await uploadToStorage(supabaseAdmin, `${prefix}-nova.mp3`, novaData, 'audio/mpeg') : null
    const alloyUrl = alloyData ? await uploadToStorage(supabaseAdmin, `${prefix}-alloy.mp3`, alloyData, 'audio/mpeg') : null
    const onyxUrl = onyxData ? await uploadToStorage(supabaseAdmin, `${prefix}-onyx.mp3`, onyxData, 'audio/mpeg') : null

    await supabaseAdmin.from('devotionals').update({
      audio_url_nova: novaUrl,
      audio_url_alloy: alloyUrl,
      audio_url_onyx: onyxUrl,
    }).eq('id', dev.id)

    console.log(`✅ Audio generated for ${dev.language} ${dev.scheduled_date}`)

    return new Response(JSON.stringify({
      id: dev.id,
      title: dev.title,
      language: dev.language,
      date: dev.scheduled_date,
      has_nova: !!novaUrl,
      has_alloy: !!alloyUrl,
      has_onyx: !!onyxUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('backfill error:', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})