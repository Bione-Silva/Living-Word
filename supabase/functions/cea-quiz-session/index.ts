import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, session_id, user_id, params } = await req.json()
    if (!action || !user_id) throw new Error('action e user_id são obrigatórios')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (action === 'start') {
      const { categoria, nivel = 'basico', quantidade = 10, testamento } = params || {}

      // Buscar perguntas já respondidas
      const { data: respondidas } = await supabase
        .from('lw_quiz_sessions')
        .select('perguntas_ids')
        .eq('user_id', user_id)
        .eq('completado', true)

      const idsRespondidos = (respondidas || []).flatMap(s => s.perguntas_ids || [])

      // Buscar perguntas novas com filtros
      let queryBuilder = supabase.from('lw_quiz').select('id, pergunta, opcoes, nivel_dificuldade, categoria, testamento')
      if (categoria) queryBuilder = queryBuilder.eq('categoria', categoria)
      if (nivel) queryBuilder = queryBuilder.eq('nivel_dificuldade', nivel)
      if (testamento) queryBuilder = queryBuilder.eq('testamento', testamento)
      if (idsRespondidos.length > 0) queryBuilder = queryBuilder.not('id', 'in', `(${idsRespondidos.join(',')})`)

      const { data: perguntas } = await queryBuilder.limit(quantidade * 2)
      if (!perguntas || perguntas.length === 0) throw new Error('Nenhuma pergunta disponível com esses filtros')

      // Embaralhar e selecionar
      const embaralhadas = perguntas.sort(() => Math.random() - 0.5).slice(0, quantidade)
      const perguntas_ids = embaralhadas.map(p => p.id)

      // Criar sessão
      const { data: sessao } = await supabase.from('lw_quiz_sessions').insert({
        user_id,
        categoria,
        nivel,
        testamento,
        perguntas_ids,
        total_perguntas: embaralhadas.length
      }).select().single()

      return new Response(
        JSON.stringify({
          session_id: sessao?.id,
          total: embaralhadas.length,
          primeira_pergunta: {
            ...embaralhadas[0],
            numero: 1,
            total: embaralhadas.length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'answer') {
      const { pergunta_id, resposta_dada, tempo_ms } = params || {}
      if (!session_id || !pergunta_id || !resposta_dada) throw new Error('session_id, pergunta_id e resposta_dada são obrigatórios')

      // Buscar pergunta para verificar
      const { data: pergunta } = await supabase
        .from('lw_quiz')
        .select('resposta_correta, explicacao, referencia_biblica, opcoes')
        .eq('id', pergunta_id)
        .single()

      if (!pergunta) throw new Error('Pergunta não encontrada')
      const correta = resposta_dada === pergunta.resposta_correta

      // Atualizar sessão
      const { data: sessao } = await supabase
        .from('lw_quiz_sessions')
        .select('respostas, pontuacao, perguntas_ids')
        .eq('id', session_id)
        .single()

      const novasRespostas = {
        ...(sessao?.respostas || {}),
        [pergunta_id]: { resposta_dada, correta, tempo_ms }
      }

      const indiceAtual = (sessao?.perguntas_ids || []).indexOf(pergunta_id)
      const proximaId = sessao?.perguntas_ids?.[indiceAtual + 1]

      let proximaPergunta = null
      if (proximaId) {
        const { data: prox } = await supabase
          .from('lw_quiz')
          .select('id, pergunta, opcoes, nivel_dificuldade, categoria')
          .eq('id', proximaId)
          .single()

        if (prox) proximaPergunta = {
          ...prox,
          numero: indiceAtual + 2,
          total: sessao?.perguntas_ids?.length
        }
      }

      await supabase.from('lw_quiz_sessions').update({
        respostas: novasRespostas,
        pontuacao: (sessao?.pontuacao || 0) + (correta ? 1 : 0)
      }).eq('id', session_id)

      // Atualizar stats da pergunta
      await supabase.from('lw_quiz').update({
        vezes_respondida: supabase.rpc('increment', { row_id: pergunta_id, field: 'vezes_respondida' }),
        ...(correta ? { vezes_acertada: supabase.rpc('increment', { row_id: pergunta_id, field: 'vezes_acertada' }) } : {})
      })

      return new Response(
        JSON.stringify({
          correta,
          resposta_correta: pergunta.resposta_correta,
          texto_correto: (pergunta.opcoes as Record<string, string>)[pergunta.resposta_correta],
          explicacao: pergunta.explicacao,
          referencia: pergunta.referencia_biblica,
          proxima_pergunta: proximaPergunta,
          fim: !proximaPergunta
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'finish') {
      if (!session_id) throw new Error('session_id é obrigatório')

      const { data: sessao } = await supabase
        .from('lw_quiz_sessions')
        .select('*')
        .eq('id', session_id)
        .single()

      if (!sessao) throw new Error('Sessão não encontrada')
      const respostas = sessao.respostas || {}
      const total = sessao.total_perguntas || 0
      const acertos = sessao.pontuacao || 0
      const percentual = total > 0 ? (acertos / total) * 100 : 0

      await supabase.from('lw_quiz_sessions').update({
        completado: true,
        percentual_acerto: percentual,
        completed_at: new Date().toISOString()
      }).eq('id', session_id)

      // Checar conquistas
      const conquistas = []
      if (percentual === 100) conquistas.push({ key: 'quiz_perfeito', name: 'Perfeição!', pontos: 100 })
      if (percentual >= 80) conquistas.push({ key: 'quiz_mestre', name: 'Mestre do Quiz', pontos: 50 })
      if (acertos >= 1) conquistas.push({ key: 'first_quiz', name: 'Primeiro Quiz!', pontos: 10 })

      for (const c of conquistas) {
        await supabase.from('lw_achievements').upsert({
          user_id,
          achievement_key: c.key,
          achievement_name: c.name,
          pontos: c.pontos
        }, { onConflict: 'user_id,achievement_key', ignoreDuplicates: true })
      }

      return new Response(
        JSON.stringify({ acertos, total, percentual, conquistas_desbloqueadas: conquistas }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error(`Ação desconhecida: ${action}`)

  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
