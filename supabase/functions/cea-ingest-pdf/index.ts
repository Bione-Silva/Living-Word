// supabase/functions/cea-ingest-pdf/index.ts
// Living Word — CEA PDF Ingestion Pipeline
// Stack: Deno + Supabase + Gemini text-embedding-004 (768d)
// BX4 Technology Solutions | Antigravity Layer

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface IngestRequest {
  file_path: string       // path no bucket: ex "parabolas/40_parabolas.pdf"
  item_type: ItemType     // classifica o conteúdo para filtros de busca
  title?: string          // título amigável do documento
  force_reingest?: boolean // re-ingerir mesmo se documento já existir
}

type ItemType = 'parabola' | 'personagem' | 'livro' | 'quiz' | 'geral'

interface Chunk {
  content: string
  chunk_index: number
  page_estimate: number
  char_start: number
  char_end: number
}

interface IngestResult {
  success: boolean
  document_id?: string
  chunks_created: number
  total_chars: number
  message: string
  errors?: string[]
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CHUNK_SIZE = 1000       // chars de conteúdo por chunk
const CHUNK_OVERLAP = 150     // chars de sobreposição entre chunks
const EMBED_BATCH_SIZE = 20   // chunks por batch na API Gemini (rate limit)
const SIMILARITY_THRESHOLD = 0.70
const MIND = 'cea'            // identificador no schema knowledge

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrai texto de um PDF buffer.
 * Estratégia dupla: tenta pdf-parse nativo, fallback para extração manual.
 * ATENÇÃO: PDFs com copy:no (RC4) podem retornar texto vazio.
 * Pré-requisito: remover proteção localmente com:
 *   qpdf --decrypt input.pdf output.pdf
 */
async function extractTextFromPDF(buffer: Uint8Array): Promise<string> {
  try {
    // Tentativa 1: pdf-parse (funciona em PDFs não protegidos)
    const { default: pdfParse } = await import('npm:pdf-parse@1.1.1')
    const data = await pdfParse(buffer)

    if (!data.text || data.text.trim().length < 100) {
      throw new Error('pdf-parse retornou texto insuficiente — PDF pode estar criptografado')
    }

    console.log(`[cea-ingest] Texto extraído: ${data.text.length} chars, ${data.numpages} páginas`)
    return data.text

  } catch (err) {
    console.error('[cea-ingest] pdf-parse falhou:', err.message)

    // Fallback: extração básica de strings do buffer (PDFs simples)
    const raw = new TextDecoder('latin1').decode(buffer)
    const strings: string[] = []
    const regex = /\(([^)]{10,})\)/g
    let match
    while ((match = regex.exec(raw)) !== null) {
      const s = match[1].replace(/\\n/g, '\n').replace(/\\r/g, '').trim()
      if (s.length > 10) strings.push(s)
    }

    const fallbackText = strings.join(' ')
    if (fallbackText.length < 200) {
      throw new Error(
        'Extração falhou. PDF provavelmente criptografado. ' +
        'Execute: qpdf --decrypt input.pdf output.pdf antes do upload.'
      )
    }

    console.warn(`[cea-ingest] Fallback ativado: ${fallbackText.length} chars extraídos`)
    return fallbackText
  }
}

/**
 * Divide texto em chunks com overlap.
 * Respeita quebras de parágrafo quando possível para manter coerência semântica.
 */
function createChunks(text: string): Chunk[] {
  const chunks: Chunk[] = []

  // Limpar texto: remover múltiplos espaços, normalizar quebras
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  let position = 0
  let chunkIndex = 0

  while (position < cleaned.length) {
    const end = Math.min(position + CHUNK_SIZE, cleaned.length)
    let chunkEnd = end

    // Tentar quebrar em parágrafo ou sentença para não cortar no meio de uma ideia
    if (end < cleaned.length) {
      // Preferir quebra em \n\n (parágrafo)
      const paraBreak = cleaned.lastIndexOf('\n\n', end)
      if (paraBreak > position + CHUNK_SIZE * 0.6) {
        chunkEnd = paraBreak + 2
      } else {
        // Fallback: quebrar em ponto final
        const sentenceBreak = cleaned.lastIndexOf('. ', end)
        if (sentenceBreak > position + CHUNK_SIZE * 0.5) {
          chunkEnd = sentenceBreak + 2
        }
      }
    }

    const content = cleaned.slice(position, chunkEnd).trim()

    if (content.length > 50) { // ignorar chunks muito pequenos (rodapés, etc.)
      chunks.push({
        content,
        chunk_index: chunkIndex,
        // Estimativa de página: ~3000 chars por página A4
        page_estimate: Math.floor(position / 3000) + 1,
        char_start: position,
        char_end: chunkEnd,
      })
      chunkIndex++
    }

    // Avançar com overlap: voltar CHUNK_OVERLAP chars para próximo chunk
    position = chunkEnd - CHUNK_OVERLAP
    if (position <= 0) position = chunkEnd // segurança
  }

  console.log(`[cea-ingest] ${chunks.length} chunks criados (${CHUNK_SIZE}c + ${CHUNK_OVERLAP}c overlap)`)
  return chunks
}

/**
 * Gera embeddings via Gemini text-embedding-004 (768 dimensões).
 * Processa em batches para respeitar rate limits da API.
 */
async function generateEmbeddingsBatch(
  texts: string[],
  geminiApiKey: string
): Promise<number[][]> {
  const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents'

  const requests = texts.map(text => ({
    model: 'models/text-embedding-004',
    content: {
      parts: [{ text: text.slice(0, 2048) }] // limite da API Gemini
    },
    taskType: 'RETRIEVAL_DOCUMENT', // otimizado para documentos indexados
  }))

  const response = await fetch(`${GEMINI_EMBED_URL}?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API erro ${response.status}: ${error}`)
  }

  const data = await response.json()

  if (!data.embeddings || data.embeddings.length !== texts.length) {
    throw new Error(`Gemini retornou ${data.embeddings?.length} embeddings para ${texts.length} textos`)
  }

  return data.embeddings.map((e: { values: number[] }) => e.values)
}

/**
 * Processa todos os chunks em batches para evitar timeout e rate limit.
 */
async function embedAllChunks(
  chunks: Chunk[],
  geminiApiKey: string
): Promise<Array<Chunk & { embedding: number[] }>> {
  const result: Array<Chunk & { embedding: number[] }> = []
  const errors: string[] = []

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE)
    const batchNum = Math.floor(i / EMBED_BATCH_SIZE) + 1
    const totalBatches = Math.ceil(chunks.length / EMBED_BATCH_SIZE)

    console.log(`[cea-ingest] Embedding batch ${batchNum}/${totalBatches} (${batch.length} chunks)`)

    try {
      const embeddings = await generateEmbeddingsBatch(
        batch.map(c => c.content),
        geminiApiKey
      )

      batch.forEach((chunk, idx) => {
        result.push({ ...chunk, embedding: embeddings[idx] })
      })

    } catch (err) {
      console.error(`[cea-ingest] Erro no batch ${batchNum}:`, err.message)
      errors.push(`Batch ${batchNum}: ${err.message}`)
      // Continuar com próximos batches mesmo com erro
    }

    // Rate limit: aguardar 500ms entre batches
    if (i + EMBED_BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  if (errors.length > 0) {
    console.warn(`[cea-ingest] ${errors.length} batches com erro:`, errors)
  }

  return result
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // CORS para chamadas do frontend
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 })
  }

  // ── Validar env vars ────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

  if (!supabaseUrl || !serviceRoleKey || !geminiApiKey) {
    return new Response(
      JSON.stringify({ error: 'Variáveis de ambiente faltando: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY' }),
      { status: 500 }
    )
  }

  // ── Parse do body ───────────────────────────────────────────────────────────
  let body: IngestRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON inválido' }), { status: 400 })
  }

  const { file_path, item_type, title, force_reingest = false } = body

  if (!file_path || !item_type) {
    return new Response(
      JSON.stringify({ error: 'Campos obrigatórios: file_path, item_type' }),
      { status: 400 }
    )
  }

  const validTypes: ItemType[] = ['parabola', 'personagem', 'livro', 'quiz', 'geral']
  if (!validTypes.includes(item_type)) {
    return new Response(
      JSON.stringify({ error: `item_type inválido. Use: ${validTypes.join(', ')}` }),
      { status: 400 }
    )
  }

  // ── Inicializar Supabase (service_role para storage + insert) ───────────────
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const result: IngestResult = {
    success: false,
    chunks_created: 0,
    total_chars: 0,
    message: '',
  }

  try {
    // ── 1. Verificar se já foi ingerido ───────────────────────────────────────
    const documentTitle = title || file_path.split('/').pop() || file_path

    const { data: existing } = await supabase
      .schema('knowledge')
      .from('documents')
      .select('id, title')
      .eq('metadata->>source_path', file_path)
      .eq('metadata->>mind', MIND)
      .maybeSingle()

    if (existing && !force_reingest) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Documento já ingerido: "${existing.title}" (id: ${existing.id}). Use force_reingest: true para re-processar.`,
          document_id: existing.id,
          chunks_created: 0,
          total_chars: 0,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Baixar PDF do Storage ──────────────────────────────────────────────
    console.log(`[cea-ingest] Baixando ${file_path} do bucket cea_knowledge_base`)

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('cea_knowledge_base')
      .download(file_path)

    if (downloadError || !fileData) {
      throw new Error(`Storage download falhou: ${downloadError?.message || 'arquivo não encontrado'}`)
    }

    const buffer = new Uint8Array(await fileData.arrayBuffer())
    console.log(`[cea-ingest] PDF baixado: ${buffer.length} bytes`)

    // ── 3. Extrair texto ──────────────────────────────────────────────────────
    const text = await extractTextFromPDF(buffer)
    result.total_chars = text.length

    // ── 4. Chunking com overlap ───────────────────────────────────────────────
    const chunks = createChunks(text)

    if (chunks.length === 0) {
      throw new Error('Nenhum chunk gerado. Verifique se o PDF tem texto extraível.')
    }

    // ── 5. Deletar ingestão anterior (se force_reingest) ──────────────────────
    if (existing && force_reingest) {
      console.log(`[cea-ingest] Removendo ingestão anterior: ${existing.id}`)

      await supabase
        .schema('knowledge')
        .from('chunks')
        .delete()
        .eq('document_id', existing.id)

      await supabase
        .schema('knowledge')
        .from('documents')
        .delete()
        .eq('id', existing.id)
    }

    // ── 6. Criar documento no schema knowledge ────────────────────────────────
    const { data: document, error: docError } = await supabase
      .schema('knowledge')
      .from('documents')
      .insert({
        title: documentTitle,
        content: text.slice(0, 500), // preview do conteúdo
        metadata: {
          mind: MIND,
          item_type,
          source_path: file_path,
          source_bucket: 'cea_knowledge_base',
          total_chunks: chunks.length,
          total_chars: text.length,
          chunk_size: CHUNK_SIZE,
          chunk_overlap: CHUNK_OVERLAP,
          embedding_model: 'text-embedding-004',
          embedding_dimensions: 768,
          ingested_at: new Date().toISOString(),
        }
      })
      .select('id')
      .single()

    if (docError || !document) {
      throw new Error(`Falha ao criar documento: ${docError?.message}`)
    }

    console.log(`[cea-ingest] Documento criado: ${document.id}`)
    result.document_id = document.id

    // ── 7. Gerar embeddings em batches ────────────────────────────────────────
    const chunksWithEmbeddings = await embedAllChunks(chunks, geminiApiKey)

    if (chunksWithEmbeddings.length === 0) {
      throw new Error('Nenhum embedding gerado. Verifique a GEMINI_API_KEY.')
    }

    // ── 8. Inserir chunks no Supabase ─────────────────────────────────────────
    console.log(`[cea-ingest] Inserindo ${chunksWithEmbeddings.length} chunks no Supabase`)

    const INSERT_BATCH = 50 // inserir em lotes para não estourar payload

    for (let i = 0; i < chunksWithEmbeddings.length; i += INSERT_BATCH) {
      const batch = chunksWithEmbeddings.slice(i, i + INSERT_BATCH)

      const rows = batch.map(chunk => ({
        document_id: document.id,
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: {
          mind: MIND,
          item_type,
          chunk_index: chunk.chunk_index,
          page_estimate: chunk.page_estimate,
          char_start: chunk.char_start,
          char_end: chunk.char_end,
          source_path: file_path,
          similarity_threshold: SIMILARITY_THRESHOLD,
        }
      }))

      const { error: insertError } = await supabase
        .schema('knowledge')
        .from('chunks')
        .insert(rows)

      if (insertError) {
        console.error(`[cea-ingest] Erro ao inserir batch ${i}-${i + INSERT_BATCH}:`, insertError.message)
        // Não abortar — continuar inserindo o restante
      }
    }

    // ── 9. Verificar contagem final ───────────────────────────────────────────
    const { count } = await supabase
      .schema('knowledge')
      .from('chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', document.id)

    result.chunks_created = count || chunksWithEmbeddings.length
    result.success = true
    result.message = `Ingestão concluída: ${result.chunks_created} chunks de "${documentTitle}" indexados com sucesso.`

    console.log(`[cea-ingest] CONCLUIDO: ${result.chunks_created} chunks | doc: ${document.id}`)

  } catch (err) {
    console.error('[cea-ingest] ERRO FATAL:', err)
    result.success = false
    result.message = err instanceof Error ? err.message : 'Erro desconhecido'
    result.errors = [result.message]

    return new Response(
      JSON.stringify(result),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(
    JSON.stringify(result),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
})
