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

    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY')

    if (apiKey) {
      try {
        const aiResp = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a sentiment analysis assistant. Analyze the sentiment of the given text and respond ONLY with a JSON object: {"sentiment": "positive"|"negative"|"mixed", "score": 0.0-1.0}. No other text.' },
              { role: 'user', content: text.slice(0, 2000) },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 100,
          }),
        })

        if (aiResp.ok) {
          const aiData = await aiResp.json()
          const content = aiData.choices?.[0]?.message?.content || ''
          try {
            const result = JSON.parse(content)
            console.log('Gemini sentiment success')
            return new Response(JSON.stringify({ sentiment: result.sentiment || 'mixed', score: result.score || 0.5 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          } catch {
            console.error('Failed to parse Gemini response:', content)
          }
        } else {
          console.error('Gemini error:', aiResp.status, await aiResp.text().catch(() => ''))
        }
      } catch (e) {
        console.error('Gemini call failed:', e)
      }
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
