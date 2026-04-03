import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Tratar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables")
    }

    // Criar cliente local para verificar JWT
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Obter payload
    const { tool, query, language = "PT" } = await req.json()
    if (!tool || !query) {
      return new Response(JSON.stringify({ error: 'Missing tool or query' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Verificar plano para tools premium
    const premiumTools = ['original_text', 'movies']
    if (premiumTools.includes(tool)) {
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single()
      
      if (!userData || userData.plan === 'free') {
        return new Response(JSON.stringify({ error: 'Tool requires Pastoral plan' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        })
      }
    }

    // Preparar Prompt para o Gemini 2.5 Flash
    let prompt = ""
    if (tool === 'topics') {
      prompt = `Aja como um teólogo experiente. O usuário está pesquisando o tópico: "${query}". \n\n Liste os sub-tópicos principais associados a isso, conceitos-chave, e a relevância cristã disto em formato de tópicos markdown concisos. Responda em ${language}.`
    } else if (tool === 'verses') {
      prompt = `Encontre as referências bíblicas mais importantes sobre: "${query}". \n\nListe até 7 versículos com a citação exata e uma breve explicação de 1 frase do contexto para cada. Responda em ${language}.`
    } else if (tool === 'context') {
      prompt = `Qual o contexto histórico e literário de: "${query}"? \n\nExplique de forma concisa quem escreveu, para quem, em que ano e o pano de fundo teológico. Responda em ${language}.`
    } else if (tool === 'quotes') {
      prompt = `Encontre citações de figuras cristãs históricas (reformadores, pais da igreja, teólogos modernos) sobre o tema: "${query}". \n\nTraga 4 citações marcantes. Responda em ${language}.`
    } else if (tool === 'movies') {
      prompt = `O pastor quer uma ilustração. Que cenas de bons filmes, séries ou histórias reais famosas representam o tema cristão de: "${query}"? \n\nDê 3 exemplos e explique rapidamente o paralelo. Responda em ${language}.`
    } else if (tool === 'songs') {
      prompt = `Liste 5 hinos cristãos clássicos ou músicas evangélicas conhecidas que reforcem a mensagem de: "${query}". \n\nDiga o nome, autor e um trecho chave. Responda em ${language}.`
    } else if (tool === 'original_text') {
      prompt = `O pastor está buscando a raiz original da palavra ou termo bíblico: "${query}". \n\nExplique o radical em Grego ou Hebraico, a concordância de Strong recomendada e os principais sentidos teológicos profundos dessa palavra original. Responda em ${language}.`
    } else {
      prompt = `Pesquise e responda sobre a dúvida cristã: ${query}. Responda em ${language}.`
    }

    // Chamar Gemini
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error("Missing GEMINI_API_KEY")
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
    
    // Fallback/log start
    const start = Date.now()
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
      })
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error("Gemini erro:", errorText)
      throw new Error("Falha na chamada do Gemini: " + geminiResponse.status)
    }

    const data = await geminiResponse.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text

    return new Response(JSON.stringify({ 
      result, 
      tool, 
      query,
      model: 'gemini-2.5-flash',
      time_ms: Date.now() - start
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('API Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
