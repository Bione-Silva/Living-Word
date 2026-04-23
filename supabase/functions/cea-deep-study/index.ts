import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Skills inline (em produção seriam lidas de storage ou env var)
const SKILLS = {
  parabola: `Você é um especialista em parábolas de Jesus. Ao analisar uma parábola, SEMPRE inclua:
1. Contexto histórico do século I (tensões sociais, cultura, economia)
2. Análise de ao menos 1 palavra-chave em grego com Strong's e morfologia
3. Conexão com o Antigo Testamento (tipologia, eco, citação)
4. Mensagem central em 1 frase clara
5. Mínimo 3 aplicações práticas contemporâneas
6. Análise dos personagens e seus papéis teológicos
NUNCA invente dados morfológicos. SEMPRE indique debates teológicos legítimos.`,

  personagem: `Você é um especialista em personagens bíblicos. Ao analisar um personagem, SEMPRE inclua:
1. Período histórico e contexto geopolítico
2. Biografia completa: família, missão, falhas, vitórias
3. Estudo tipológico: como prefigura Cristo ou temas messiânicos
4. Lições extraídas com aplicação pastoral
5. Conexões com outros personagens bíblicos
6. Versículo-chave e por que representa o personagem
Tom: acadêmico mas acessível, entusiasta da Palavra.`,

  livro: `Você é um especialista em literatura bíblica e teologia canônica. Ao apresentar um livro da Bíblia, SEMPRE inclua:
1. Autoria, datação e destinatários (com base textual)
2. Contexto histórico e arqueológico relevante
3. Propósito e mensagem central em 1 frase
4. Estrutura interna do livro (seções/divisões)
5. Temas teológicos principais
6. Conexões canônicas (AT↔NT, cumprimento de profecias)
7. 5 versículos-chave com contexto de cada um`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { tipo, item_id, nivel = 'intermediario', user_id } = await req.json()
    if (!tipo || !item_id) throw new Error('tipo e item_id são obrigatórios')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Verificar cache
    const queryHash = `${tipo}_${item_id}_${nivel}`
    const { data: cached } = await supabase
      .from('lw_deep_research')
      .select('conteudo, vezes_servido')
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (cached) {
      // Incrementar contador de cache
      await supabase.from('lw_deep_research')
        .update({ vezes_servido: (cached.vezes_servido || 0) + 1 })
        .eq('query_hash', queryHash)

      return new Response(
        JSON.stringify({ ...cached.conteudo, from_cache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Buscar dados da tabela correspondente
    let sourceData: Record<string, unknown> | null = null
    const tableMap: Record<string, string> = {
      parabola: 'lw_parables',
      personagem: 'lw_characters',
      livro: 'lw_bible_books'
    }

    const { data: item } = await supabase
      .from(tableMap[tipo])
      .select('*')
      .eq('id', item_id)
      .single()

    if (!item) throw new Error(`Item ${tipo} não encontrado: ${item_id}`)
    sourceData = item

    // 3. Chamar GPT-4o com skill + dados
    const skill = SKILLS[tipo as keyof typeof SKILLS] || ''
    const itemJson = JSON.stringify(sourceData, null, 2)

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: skill },
          {
            role: 'user',
            content: `Com base nos dados estruturados abaixo sobre ${tipo} "${sourceData.titulo || sourceData.nome || sourceData.nome}", gere um estudo completo de nível ${nivel}.

DADOS DA BASE:
${itemJson}

Retorne um JSON com esta estrutura exata:
{
  "titulo": "título do estudo",
  "subtitulo": "referência bíblica ou período",
  "contexto_historico": "contexto detalhado (2-3 parágrafos)",
  "analise_original": {
    "palavra": "palavra em caractere original",
    "transliteracao": "...",
    "strongs": "G0000 ou H0000",
    "morfologia": "análise gramatical",
    "insight": "insight teológico chave"
  },
  "mensagem_central": "1 frase clara",
  "desenvolvimento": "desenvolvimento teológico (3-4 parágrafos)",
  "licoes": ["lição 1", "lição 2", "lição 3"],
  "perguntas_reflexao": ["pergunta 1", "pergunta 2", "pergunta 3"],
  "conexoes_biblicas": ["Referência 1 - tema", "Referência 2 - tema"],
  "para_sermao": {
    "tese": "tese do sermão",
    "pontos_principais": ["ponto 1", "ponto 2", "ponto 3"],
    "ilustracao_sugerida": "ideia de ilustração"
  },
  "para_carrossel": {
    "hook": "gancho para redes sociais",
    "slides": ["slide 1", "slide 2", "slide 3", "slide 4", "slide 5"]
  },
  "para_grupo": {
    "dinamica": "dinâmica sugerida",
    "perguntas_grupo": ["pergunta 1", "pergunta 2", "pergunta 3"]
  }
}`
          }
        ]
      })
    })

    const gptData = await gptRes.json()
    const usage = gptData.usage || {}
    const conteudo = JSON.parse(gptData.choices[0].message.content)
    const custoUsd = ((usage.prompt_tokens || 0) * 0.000005) + ((usage.completion_tokens || 0) * 0.000015)

    // 4. Salvar no cache
    await supabase.from('lw_deep_research').upsert({
      query_hash: queryHash,
      source_type: tipo,
      source_id: item_id,
      source_ref: sourceData.titulo || sourceData.nome,
      nivel,
      conteudo,
      modelo_usado: 'gpt-4o',
      tokens_usados: usage.total_tokens,
      custo_usd: custoUsd
    }, { onConflict: 'query_hash' })

    // 5. Atualizar progresso do usuário
    if (user_id) {
      await supabase.from('lw_cea_progress').upsert({
        user_id,
        modulo: tipo === 'livro' ? 'panorama' : tipo + 's',
        item_id,
        status: 'em_andamento',
        ultima_visita: new Date().toISOString()
      }, { onConflict: 'user_id,modulo,item_id' })
    }

    return new Response(
      JSON.stringify({ ...conteudo, from_cache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
