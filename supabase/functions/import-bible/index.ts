import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { url_json, translation, testament } = await req.json()
    // default NVI: https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_nvi.json

    if (!url_json || !translation) {
      throw new Error('Faltam parâmetros url_json e translation')
    }

    // Busca o arquivo JSON da Web
    const response = await fetch(url_json)
    if (!response.ok) throw new Error('Falha ao baixar o arquivo da Bíblia')
    const bibleData = await response.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let totalInserted = 0
    let versesBatch: any[] = []

    // Processamento de Ingestão
    for (const book of bibleData) {
      const bookName = book.name
      const bookAbbrev = book.abbrev

      // O testamento não vem no json, vamos deduzir grosseiramente ou usar parametro.
      // AT ou NT: Gênesis a Malaquias são os primeiros 39 livros. Mateus em diante NT.
      // Se mandar testament no payload ele fixa.
      const bookTestament = testament || 'AT' // Simplificacao para o batch

      for (let c = 0; c < book.chapters.length; c++) {
        const chapterNum = c + 1
        const chapterVerses = book.chapters[c]

        for (let v = 0; v < chapterVerses.length; v++) {
          const verseNum = v + 1
          const text = chapterVerses[v]

          versesBatch.push({
            book_name: bookName,
            book_abbreviation: bookAbbrev,
            chapter: chapterNum,
            verse: verseNum,
            text,
            translation,
            testament: bookTestament
          })

          // Insert in chunks of 500 to avoid hitting limits
          if (versesBatch.length >= 500) {
            const { error } = await supabaseAdmin.from('bible_verses').insert(versesBatch)
            if (error) throw error
            totalInserted += versesBatch.length
            versesBatch = []
          }
        }
      }
    }

    // Final batch
    if (versesBatch.length > 0) {
      const { error } = await supabaseAdmin.from('bible_verses').insert(versesBatch)
      if (error) throw error
      totalInserted += versesBatch.length
    }

    return new Response(JSON.stringify({ success: true, message: `Bíblia Inserida Completa! Versiculos importados: ${totalInserted}` }), { headers: corsHeaders })

  } catch (err) {
    console.error('Import Error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
