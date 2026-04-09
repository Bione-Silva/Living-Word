const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { text } = await req.json()
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'text is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      // Fallback local simples
      const lower = text.toLowerCase()
      const positiveWords = ['alegria', 'grato', 'paz', 'amor', 'esperança', 'bênção', 'graça', 'fé', 'fortaleceu', 'impactou', 'tocou', 'maravilha', 'joy', 'grateful', 'peace', 'love', 'hope', 'blessed', 'faith']
      const negativeWords = ['triste', 'difícil', 'sofrimento', 'dor', 'medo', 'angústia', 'perdido', 'duvido', 'desânimo', 'sad', 'fear', 'pain', 'doubt', 'lost']
      const posScore = positiveWords.filter(w => lower.includes(w)).length
      const negScore = negativeWords.filter(w => lower.includes(w)).length
      const sentiment = posScore > negScore ? 'positive' : negScore > posScore ? 'negative' : 'mixed'
      const score = Math.min(0.5 + Math.abs(posScore - negScore) * 0.1, 1.0)
      return new Response(JSON.stringify({ sentiment, score }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Chamar Gemini diretamente
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze the sentiment of this text and respond ONLY with valid JSON in this exact format: {"sentiment": "positive" or "negative" or "mixed", "score": number between 0 and 1}\n\nText: "${text.slice(0, 1000)}"`
            }]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
        }),
      }
    )

    if (!geminiResp.ok) {
      console.error('Gemini error:', geminiResp.status)
      throw new Error(`Gemini error: ${geminiResp.status}`)
    }

    const geminiData = await geminiResp.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const jsonMatch = rawText.match(/\{[^}]+\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return new Response(
        JSON.stringify({ sentiment: result.sentiment || 'mixed', score: result.score || 0.5 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ sentiment: 'mixed', score: 0.5 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Error:', e)
    return new Response(JSON.stringify({ sentiment: 'mixed', score: 0.5 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
