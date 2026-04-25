// supabase/functions/cea-search/index.ts
// Living Word — CEA Semantic Search (RAG)
// Busca semântica unificada nos chunks do CEA
// BX4 Technology Solutions | Antigravity Layer

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SearchRequest {
  query: string
  item_type?: 'parabola' | 'personagem' | 'livro' | 'quiz' | 'geral'
  top_k?: number               // padrão: 6
  similarity_threshold?: number // padrão: 0.70
}

interface SearchResult {
  chunk_id: string
  content: string
  similarity: number
  item_type: string
  source_path: string
  page_estimate: number
  document_title: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      }
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { query, item_type, top_k = 6, similarity_threshold = 0.70 }: SearchRequest = await req.json()

  if (!query || query.trim().length < 3) {
    return new Response(
      JSON.stringify({ error: 'Query deve ter ao menos 3 caracteres' }),
      { status: 400 }
    )
  }

  // 1. Gerar embedding da query com taskType RETRIEVAL_QUERY
  const embedRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: query.slice(0, 2048) }] },
        taskType: 'RETRIEVAL_QUERY', // diferente do documento — otimizado para queries
      })
    }
  )

  if (!embedRes.ok) {
    const err = await embedRes.text()
    return new Response(
      JSON.stringify({ error: `Gemini embed falhou: ${err}` }),
      { status: 500 }
    )
  }

  const embedData = await embedRes.json()
  const queryEmbedding = embedData.embedding.values

  // 2. Busca semântica via RPC — filtrando por mind='cea' e item_type opcional
  const rpcParams: Record<string, unknown> = {
    query_embedding: queryEmbedding,
    match_threshold: similarity_threshold,
    match_count: top_k,
    filter_mind: 'cea',
  }

  if (item_type) {
    rpcParams.filter_item_type = item_type
  }

  const { data: chunks, error: searchError } = await supabase
    .schema('knowledge')
    .rpc('match_cea_chunks', rpcParams)

  if (searchError) {
    return new Response(
      JSON.stringify({ error: `Busca semântica falhou: ${searchError.message}` }),
      { status: 500 }
    )
  }

  const results: SearchResult[] = (chunks || []).map((c: Record<string, unknown>) => ({
    chunk_id: c.id as string,
    content: c.content as string,
    similarity: Math.round((c.similarity as number) * 1000) / 1000,
    item_type: (c.metadata as Record<string, unknown>)?.item_type as string,
    source_path: (c.metadata as Record<string, unknown>)?.source_path as string,
    page_estimate: (c.metadata as Record<string, unknown>)?.page_estimate as number,
    document_title: c.document_title as string,
  }))

  return new Response(
    JSON.stringify({
      query,
      total_results: results.length,
      results,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
