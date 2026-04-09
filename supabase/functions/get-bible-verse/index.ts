import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Apenas pra ler, pode ser um usuario anon ou logado
    const { url } = req
    const urlObj = new URL(url)
    const book = urlObj.searchParams.get('book_abbrev')
    const chapter = urlObj.searchParams.get('chapter')
    const verse = urlObj.searchParams.get('verse')

    if (!book || !chapter) throw new Error('Parâmetros book_abbrev e chapter obrigatórios')

    // Se verse vem vazio pega capitulo inteiro
    let query = supabase.from('bible_verses').select('*').eq('book_abbreviation', book).eq('chapter', chapter)

    if (verse) {
       // pode ser um range tipo 8-9 (Éxodo 25:8-9) que o nosso Lovable gerou
       if (verse.includes('-')) {
           const [start, end] = verse.split('-')
           query = query.gte('verse', start).lte('verse', end)
       } else {
           query = query.eq('verse', verse)
       }
    }

    const { data: verses, error } = await query.order('verse', { ascending: true })
    if (error) throw error

    return new Response(JSON.stringify({ success: true, verses }), { headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders })
  }
})
