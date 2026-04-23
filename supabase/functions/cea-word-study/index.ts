import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { word, reference, language = 'grego' } = await req.json()
    if (!word) throw new Error('word é obrigatório')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Verificar cache
    const { data: cached } = await supabase
      .from('lw_word_studies')
      .select('*')
      .eq('palavra', word)
      .eq('idioma', language)
      .maybeSingle()

    if (cached) return new Response(
      JSON.stringify({ ...cached, from_cache: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

    // 2. Chamar GPT-4o com skill bíblica
    const langLabel = language === 'grego' ? 'Grego (NT)' : language === 'hebraico' ? 'Hebraico (AT)' : 'Aramaico'

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1200,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em idiomas bíblicos originais (${langLabel}), léxicos BDAG/BDB/HALOT e Concordância de Strong.
REGRAS ABSOLUTAS:
- NUNCA invente números Strong's ou formas morfológicas
- SEMPRE baseie em léxicos reconhecidos (BDAG para grego, BDB para hebraico)
- Indique explicitamente se há debate teológico sobre o significado
- Use transliteração padrão acadêmica (SBL Guidelines)`
          },
          {
            role: 'user',
            content: `Analise a palavra "${word}" em ${langLabel}${reference ? ` no contexto de ${reference}` : ''}.

Retorne um JSON com esta estrutura:
{
  "palavra": "forma original em caractere original (ex: ἀγάπη ou שָׁלוֹם)",
  "transliteracao": "transliteração fonética (ex: agápē ou shalom)",
  "idioma": "${language}",
  "strongs_number": "G0000 ou H0000",
  "definicao_basica": "significado básico em 1 frase",
  "morfologia": {
    "classe": "substantivo/verbo/adjetivo/etc",
    "genero": "masculino/feminino/neutro (se aplicável)",
    "numero": "singular/plural (se aplicável)",
    "tempo": "presente/aoristo/etc (se verbo)",
    "modo": "indicativo/subjuntivo/etc (se verbo)",
    "voz": "ativa/passiva/média (se verbo)",
    "caso": "nominativo/acusativo/etc (se substantivo grego)"
  },
  "significado_literal": "significado mais literal com nuances",
  "insight_teologico": "por que isso importa teologicamente (2-3 parágrafos)",
  "usos_no_nt_at": "como é usada em outros textos bíblicos relevantes",
  "versoes_comparadas": [
    {"versao": "NVI", "traducao": "..."},
    {"versao": "ARA", "traducao": "..."},
    {"versao": "NAA", "traducao": "..."},
    {"versao": "KJV", "traducao": "..."}
  ],
  "frequencia": {"at": 0, "nt": 0},
  "debate_teologico": "se há debate legítimo sobre o significado, descreva brevemente",
  "referencia_lexicon": "ex: BDAG p. 6-7; BDB p. 945"
}`
          }
        ]
      })
    })

    const gptData = await gptRes.json()
    const resultado = JSON.parse(gptData.choices[0].message.content)

    // 3. Salvar no cache
    const { data: saved } = await supabase.from('lw_word_studies').upsert({
      palavra: word,
      transliteracao: resultado.transliteracao,
      idioma: language,
      strongs_number: resultado.strongs_number,
      referencia_exemplo: reference,
      morfologia: resultado.morfologia,
      significado_literal: resultado.significado_literal,
      insight_teologico: resultado.insight_teologico,
      versoes_comparadas: resultado.versoes_comparadas,
      frequencia_at: resultado.frequencia?.at || 0,
      frequencia_nt: resultado.frequencia?.nt || 0
    }, { onConflict: 'palavra,idioma' }).select().single()

    return new Response(
      JSON.stringify({ ...resultado, id: saved?.id, from_cache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
