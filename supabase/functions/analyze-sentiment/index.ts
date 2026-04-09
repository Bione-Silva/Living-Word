const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getGeminiKey(): string | null {
  return Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY') || null
}

async function tryGeminiCall(apiKey: string, text: string): Promise<{ sentiment: string; score: number } | null> {
  // Try multiple model names in order
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro']
  const versions = ['v1beta', 'v1']

  for (const version of versions) {
    for (const model of models) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Analyze the sentiment of this text and respond ONLY with valid JSON: {"sentiment": "positive" or "negative" or "mixed", "score": number 0-1}\n\nText: "${text.slice(0, 1000)}"`
                }]
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
            }),
          }
        )
        if (resp.ok) {
          const data = await resp.json()
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          const jsonMatch = rawText.match(/\{[^}]+\}/)
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0])
            console.log(`Gemini success with ${version}/${model}`)
            return { sentiment: result.sentiment || 'mixed', score: result.score || 0.5 }
          }
          return { sentiment: 'mixed', score: 0.5 }
        }
        console.log(`Model ${version}/${model} returned ${resp.status}`)
      } catch (e) {
        console.log(`Model ${version}/${model} failed:`, e)
      }
    }
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { text } = await req.json()
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'text is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const apiKey = getGeminiKey()

    if (apiKey) {
      const result = await tryGeminiCall(apiKey, text)
      if (result) {
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      console.error('All Gemini models failed, using local fallback')
    }

    // Fallback local
    const lower = text.toLowerCase()
    const positiveWords = ['alegria', 'grato', 'paz', 'amor', 'esperança', 'bênção', 'graça', 'fé', 'fortaleceu', 'impactou', 'tocou', 'maravilha', 'joy', 'grateful', 'peace', 'love', 'hope', 'blessed', 'faith']
    const negativeWords = ['triste', 'difícil', 'sofrimento', 'dor', 'medo', 'angústia', 'perdido', 'duvido', 'desânimo', 'sad', 'fear', 'pain', 'doubt', 'lost']
    const posScore = positiveWords.filter(w => lower.includes(w)).length
    const negScore = negativeWords.filter(w => lower.includes(w)).length
    const sentiment = posScore > negScore ? 'positive' : negScore > posScore ? 'negative' : 'mixed'
    const score = Math.min(0.5 + Math.abs(posScore - negScore) * 0.1, 1.0)
    return new Response(JSON.stringify({ sentiment, score }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Error:', e)
    return new Response(JSON.stringify({ sentiment: 'mixed', score: 0.5 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
