import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type MaterialType = 'estudo_grupo' | 'plano_leitura' | 'devocional' | 'word_study_pdf' | 'resumo_pregacao'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const {
      tipo,
      source_table,
      source_id,
      user_id,
      contexto_estudo,
      formato = 'markdown'
    }: {
      tipo: MaterialType
      source_table: string
      source_id: string
      user_id: string
      contexto_estudo?: Record<string, unknown>
      formato?: string
    } = await req.json()

    if (!tipo || !user_id) throw new Error('tipo e user_id são obrigatórios')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Buscar contexto do estudo se não fornecido
    let contexto = contexto_estudo
    if (!contexto && source_table && source_id) {
      const { data } = await supabase.from(source_table).select('*').eq('id', source_id).single()
      if (data) contexto = data
    }

    // Templates por tipo de material
    const prompts: Record<MaterialType, string> = {
      estudo_grupo: `Crie um material de estudo para grupo pequeno (célula/escola dominical) com base no contexto fornecido.
Inclua: objetivo do encontro, icebreaker, contexto bíblico (5 min), estudo principal (20 min), 
5 perguntas de discussão progressivas, aplicação prática, e oração final.
Formato: estruturado e fácil de facilitar, para líder sem formação teológica formal.`,

      plano_leitura: `Crie um plano de leitura bíblica personalizado com base no tema/livro fornecido.
Inclua: objetivo do plano, duração sugerida, leituras diárias com versículos específicos,
perguntas de reflexão por dia, e como aplicar o que foi lido.`,

      devocional: `Crie um devocional pessoal de 5 minutos com base no conteúdo fornecido.
Estrutura: versículo do dia, contexto breve (2-3 frases), reflexão pessoal, aplicação prática do dia,
e oração sugerida. Tom: íntimo, pastoral, encorajador.`,

      word_study_pdf: `Crie um resumo acadêmico completo do estudo da palavra para exportação.
Inclua: palavra em caractere original, transliteração, morfologia completa em tabela,
história da palavra no cânon, versões comparadas, insight teológico, e referências bibliográficas.`,

      resumo_pregacao: `Crie um resumo executivo de 1 página para o pregador levar ao púlpito.
Inclua: texto base, tese do sermão em 1 frase, 3 pontos principais com versículos de suporte,
1 ilustração sugerida, aplicação final, e chamada à decisão.`
    }

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: prompts[tipo] + '\n\nResponda em Português do Brasil. Seja prático e aplicável.' },
          {
            role: 'user',
            content: `CONTEXTO DO ESTUDO:
${JSON.stringify(contexto, null, 2)}

Formato de saída: ${formato}`
          }
        ]
      })
    })

    const gptData = await gptRes.json()
    const conteudo_gerado = gptData.choices[0].message.content
    const titulo = (contexto as Record<string, string>)?.titulo || (contexto as Record<string, string>)?.nome || 'Estudo Bíblico'

    // Salvar material gerado
    const { data: material } = await supabase.from('lw_cea_materials').insert({
      user_id,
      tipo,
      titulo: `${tipo.replace(/_/g, ' ')} — ${titulo}`,
      source_table,
      source_id,
      conteudo: {
        texto: conteudo_gerado,
        formato,
        gerado_em: new Date().toISOString(),
        modelo: 'gpt-4o-mini'
      }
    }).select().single()

    return new Response(
      JSON.stringify({ conteudo: conteudo_gerado, material_id: material?.id, titulo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
