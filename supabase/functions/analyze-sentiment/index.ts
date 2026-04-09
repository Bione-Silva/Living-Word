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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a sentiment analysis assistant. Analyze the sentiment of the given text and respond ONLY with a JSON object: {"sentiment": "positive"|"negative"|"mixed", "score": 0.0-1.0}. No other text.' },
          { role: 'user', content: text.slice(0, 2000) },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'classify_sentiment',
            description: 'Classify text sentiment',
            parameters: {
              type: 'object',
              properties: {
                sentiment: { type: 'string', enum: ['positive', 'negative', 'mixed'] },
                score: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['sentiment', 'score'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'classify_sentiment' } },
      }),
    })

    if (!aiResp.ok) {
      const status = aiResp.status
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limited, try again later' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (status === 402) return new Response(JSON.stringify({ error: 'Credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ error: 'AI error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiData = await aiResp.json()
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments)
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ sentiment: 'mixed', score: 0.5 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
