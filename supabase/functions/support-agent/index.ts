// supabase/functions/support-agent/index.ts
// Living Word — Agente de Suporte e Treinamento ao Usuário
// Inteligência recomendada: Gemini 2.5 Flash / Ou Llama pela velocidade.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─────────────────────────────────────────────────────────────
// PROMPT: A base de conhecimento da IA
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é o Agente de Suporte Oficial da Living Word (A Maior Plataforma Teológica de IA do Brasil).
Sua missão é ajudar os pastores e alunos a usarem a plataforma.
O usuário está no plano atual da plataforma e tem dúvidas.

CONHECIMENTOS DA PLATAFORMA QUE VOCÊ DEVE TER:
1. "Estudo Bíblico" (biblical_study): Gera um material profundo de exegese, context lit, e estruturação (Forte no RAG/Comentários).
2. "Sermões e Devocionais" (pastoral): Gera roteiros pastorais para pregações com opção de Vozes Pastorais (Spurgeon, Billy Graham, Calvino).
3. "Articles (Blog)": A plataforma puxa textos ricos para postar automaticamente em blogs.
4. "Caution Mode": Se o usuário tentar falar sobre Depressão, Suicídio ou Abuso, a plataforma tem um alerta pastoral super severo ligado e exige cuidado.

INSTRUÇÕES DE TOM:
- Responda OBRIGATORIAMENTE em Português do Brasil.
- Seja cortês, claro, rápido e amigável. Não enrole.
- Use emojis moderadamente.`

// ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Conectar ao Supabase como service_role para ler configurações
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Validar quem tá chamando
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await supabaseAnon.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Parse do Body (a mensagem do chat)
    const { message } = await req.json()
    if (!message) throw new Error('Message is required')

    // ── MAGIA DOS BASTIDORES: Buscar IA ativa no Cofre Master ──
    const { data: config } = await supabaseService
      .from('global_settings')
      .select('value')
      .eq('key', 'support_agent_model')
      .single()

    const activeModel = config?.value || 'gemini-2.5-flash' // Fallback
    
    // Tenta buscar a Chave do OpenRouter ou OpenAI no Vault
    const { data: vaultOpenRouter } = await supabaseService.rpc('get_api_key_secure', { p_provider: 'openrouter' })
    const { data: vaultOpenAi } = await supabaseService.rpc('get_api_key_secure', { p_provider: 'openai' })
    
    // Usa qual tiver (Dando preferência pro OpenRouter que abraça todos, depois a ENV original da OpenAI como safety fallback)
    const apiKey = vaultOpenRouter || vaultOpenAi || Deno.env.get('OPENAI_API_KEY')!
    
    if (!apiKey) {
      throw new Error('Nenhuma API Key (OpenRouter ou OpenAI) configurada no Vault.')
    }

    // Identificar formato do serviço (Se tem URL do OpenRouter usa OpenRouter)
    const isOpenRouter = !!vaultOpenRouter
    const endpoint = isOpenRouter 
      ? 'https://openrouter.ai/api/v1/chat/completions' 
      : 'https://api.openai.com/v1/chat/completions'

    // Formato Universal OpenAI/OpenRouter (Inclusive para Gemini e Claude plugados via OpenRouter)
    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.json()
      throw new Error(`AI Gateway Error: ${JSON.stringify(err)}`)
    }

    const aiData = await aiRes.json()
    const replyText = aiData.choices[0]?.message?.content || 'Não consegui processar.'

    return new Response(JSON.stringify({ text: replyText, used_model: activeModel }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
