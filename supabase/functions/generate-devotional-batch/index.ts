import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LANGUAGES = ['PT', 'EN', 'ES'] as const
type Lang = typeof LANGUAGES[number]

const CATEGORIES: Record<Lang, string[]> = {
  PT: ['Fé', 'Esperança', 'Amor', 'Paz Interior', 'Gratidão', 'Perdão', 'Sabedoria', 'Coragem', 'Propósito', 'Restauração', 'Confiança', 'Perseverança', 'Humildade', 'Alegria', 'Provisão'],
  EN: ['Faith', 'Hope', 'Love', 'Inner Peace', 'Gratitude', 'Forgiveness', 'Wisdom', 'Courage', 'Purpose', 'Restoration', 'Trust', 'Perseverance', 'Humility', 'Joy', 'Provision'],
  ES: ['Fe', 'Esperanza', 'Amor', 'Paz Interior', 'Gratitud', 'Perdón', 'Sabiduría', 'Coraje', 'Propósito', 'Restauración', 'Confianza', 'Perseverancia', 'Humildad', 'Alegría', 'Provisión'],
}

function getSystemPrompt(lang: Lang): string {
  const langName = lang === 'PT' ? 'Portuguese (Brazil)' : lang === 'EN' ? 'English' : 'Spanish'
  return `You are an expert Christian devotional writer. Write in ${langName}.
You produce warm, deep, practical daily devotionals rooted in Scripture.
Return ONLY valid JSON with this exact schema (no markdown fences):
{
  "title": "string (creative, poetic title)",
  "category": "string (one of the provided categories)",
  "anchor_verse": "string (book chapter:verse, e.g. Filipenses 4:6-7)",
  "anchor_verse_text": "string (full verse text in ${langName})",
  "body_text": "string (400-600 word devotional body with rich reflection)",
  "daily_practice": "string (one practical action for today)",
  "reflection_question": "string (one thought-provoking question)",
  "closing_prayer": "string (a heartfelt closing prayer, 3-5 sentences)"
}`
}

function getUserPrompt(lang: Lang, dateStr: string): string {
  const categories = CATEGORIES[lang]
  const category = categories[Math.floor(Math.random() * categories.length)]
  const langLabel = lang === 'PT' ? 'Português (Brasil)' : lang === 'EN' ? 'English' : 'Español'
  return `Write a devotional for ${dateStr} in ${langLabel}.
Theme/category: "${category}".
Choose a Bible verse that fits this theme. Write a rich, pastoral devotional body (400-600 words).
Include a daily practice, a reflection question, and a closing prayer.
Return ONLY the JSON object.`
}

async function generateDevotional(apiKey: string, lang: Lang, dateStr: string): Promise<Record<string, string>> {
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: getSystemPrompt(lang) },
        { role: 'user', content: getUserPrompt(lang, dateStr) },
      ],
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    console.error(`AI error for ${lang}:`, resp.status, errText)
    throw new Error(`AI ${resp.status}: ${errText}`)
  }

  const data = await resp.json()
  let content = data.choices?.[0]?.message?.content || ''
  if (!content) throw new Error('Empty AI response')

  // Strip markdown fences if present
  content = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()

  return JSON.parse(content)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) throw new Error('LOVABLE_API_KEY not configured')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Generate for tomorrow by default, or accept a date param
    let targetDate: string
    try {
      const body = await req.json()
      targetDate = body?.date || ''
    } catch {
      targetDate = ''
    }

    if (!targetDate) {
      const tomorrow = new Date()
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      targetDate = tomorrow.toISOString().slice(0, 10)
    }

    console.log(`Generating devotionals for ${targetDate}...`)

    // Check which languages already exist for this date
    const { data: existing } = await supabaseAdmin
      .from('devotionals')
      .select('language')
      .eq('scheduled_date', targetDate)

    const existingLangs = new Set((existing || []).map((r: any) => r.language))
    const missingLangs = LANGUAGES.filter(l => !existingLangs.has(l))

    if (missingLangs.length === 0) {
      console.log(`All languages already exist for ${targetDate}`)
      return new Response(JSON.stringify({ message: 'Already generated', date: targetDate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: { lang: string; success: boolean; error?: string }[] = []

    for (const lang of missingLangs) {
      try {
        const devotional = await generateDevotional(apiKey, lang, targetDate)

        const { error: insertErr } = await supabaseAdmin.from('devotionals').insert({
          title: devotional.title,
          category: devotional.category,
          anchor_verse: devotional.anchor_verse,
          anchor_verse_text: devotional.anchor_verse_text,
          body_text: devotional.body_text,
          daily_practice: devotional.daily_practice || '',
          reflection_question: devotional.reflection_question || '',
          closing_prayer: devotional.closing_prayer || '',
          scheduled_date: targetDate,
          language: lang,
        })

        if (insertErr) {
          console.error(`Insert error for ${lang}:`, insertErr)
          results.push({ lang, success: false, error: insertErr.message })
        } else {
          console.log(`✅ ${lang} devotional inserted for ${targetDate}`)
          results.push({ lang, success: true })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`Error generating ${lang}:`, msg)
        results.push({ lang, success: false, error: msg })
      }
    }

    return new Response(JSON.stringify({ date: targetDate, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('generate-devotional-batch error:', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
