import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function generateAudio(googleKey: string, text: string, voice: 'nova' | 'alloy' | 'onyx'): Promise<Uint8Array | null> {
  // Mapeamento de vozes OpenAI → Google Cloud TTS
  const voiceMap: Record<string, { name: string; gender: string }> = {
    nova:  { name: 'pt-BR-Wavenet-A', gender: 'FEMALE' },
    alloy: { name: 'pt-BR-Wavenet-B', gender: 'MALE' },
    onyx:  { name: 'pt-BR-Wavenet-C', gender: 'MALE' },
  };
  const gVoice = voiceMap[voice] || voiceMap.nova;
  const ttsText = text.length > 4800 ? text.slice(0, 4800) + '...' : text;

  try {
    const resp = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: ttsText },
          voice: { languageCode: 'pt-BR', name: gVoice.name, ssmlGender: gVoice.gender },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
        }),
      }
    );
    if (!resp.ok) {
      console.error(`Google TTS error (${voice}):`, resp.status, await resp.text());
      return null;
    }
    const json = await resp.json();
    const b64 = json.audioContent;
    if (!b64) return null;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch (e) {
    console.error(`Google TTS failed (${voice}):`, e);
    return null;
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
    const googleKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_TTS_KEY')
    if (!googleKey) throw new Error('GEMINI_API_KEY not configured')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Accept optional voice parameter (default: generate only 'nova' to avoid timeout)
    let voice: 'nova' | 'alloy' | 'onyx' = 'nova'
    let targetId: string | null = null
    try {
      const body = await req.json()
      if (body.voice) voice = body.voice
      if (body.id) targetId = body.id
    } catch { /* no body */ }

    // Build query for devotionals missing the requested voice
    const voiceCol = `audio_url_${voice}` as const
    let query = supabaseAdmin
      .from('devotionals')
      .select('id, title, body_text, anchor_verse_text, closing_prayer, scheduled_date, language')

    if (targetId) {
      query = query.eq('id', targetId)
    } else {
      query = query.is(voiceCol, null)
    }

    const { data: devs } = await query
      .order('scheduled_date', { ascending: false })
      .limit(1)

    if (!devs || devs.length === 0) {
      return new Response(JSON.stringify({ message: `All devotionals have ${voice} audio` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const dev = devs[0]
    const fullText = `${dev.title}.\n\n${dev.anchor_verse_text}\n\n${dev.body_text}\n\n${dev.closing_prayer || ''}`
    console.log(`Generating ${voice} audio for ${dev.language} ${dev.scheduled_date}: ${dev.title}`)

    const audioData = await generateAudio(googleKey, fullText, voice)
    if (!audioData) {
      return new Response(JSON.stringify({ error: `Failed to generate ${voice} audio` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prefix = `audio/${dev.scheduled_date}-${dev.language}`
    const audioUrl = await uploadToStorage(supabaseAdmin, `${prefix}-${voice}.mp3`, audioData, 'audio/mpeg')

    await supabaseAdmin.from('devotionals').update({
      [`audio_url_${voice}`]: audioUrl,
    }).eq('id', dev.id)

    console.log(`✅ ${voice} audio generated for ${dev.language} ${dev.scheduled_date}`)

    return new Response(JSON.stringify({
      id: dev.id,
      title: dev.title,
      language: dev.language,
      date: dev.scheduled_date,
      voice,
      url: audioUrl,
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
