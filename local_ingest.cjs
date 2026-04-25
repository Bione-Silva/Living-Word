const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = env['SUPABASE_URL'];
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];
const GEMINI_API_KEY = env['GEMINI_API_KEY'];

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const EMBED_BATCH_SIZE = 10;
const SIMILARITY_THRESHOLD = 0.70;
const MIND = 'cea';

const filesToUpload = [
  { file: 'parabolas.pdf', type: 'parabola', title: '40 Parábolas de Jesus' },
  { file: 'personagens.pdf', type: 'personagem', title: '200 Personagens Bíblicos' },
  { file: 'panorama.pdf', type: 'livro', title: 'Panorama Bíblico' },
  { file: 'quiz.pdf', type: 'quiz', title: '250 Quiz Bíblico' }
];

function createChunks(text) {
  const chunks = [];
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  let position = 0;
  let chunkIndex = 0;

  while (position < cleaned.length) {
    const end = Math.min(position + CHUNK_SIZE, cleaned.length);
    let chunkEnd = end;

    if (end < cleaned.length) {
      const paraBreak = cleaned.lastIndexOf('\n\n', end);
      if (paraBreak > position + CHUNK_SIZE * 0.6) {
        chunkEnd = paraBreak + 2;
      } else {
        const sentenceBreak = cleaned.lastIndexOf('. ', end);
        if (sentenceBreak > position + CHUNK_SIZE * 0.5) {
          chunkEnd = sentenceBreak + 2;
        }
      }
    }

    const content = cleaned.slice(position, chunkEnd).trim();

    if (content.length > 50) {
      chunks.push({
        content,
        chunk_index: chunkIndex,
        page_estimate: Math.floor(position / 3000) + 1,
        char_start: position,
        char_end: chunkEnd,
      });
      chunkIndex++;
    }

    position = chunkEnd - CHUNK_OVERLAP;
    if (position <= 0) position = chunkEnd;
  }
  return chunks;
}

async function generateEmbeddingsBatch(texts, geminiApiKey) {
  const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents';
  const requests = texts.map(text => ({
    model: 'models/text-embedding-004',
    content: {
      parts: [{ text: text.slice(0, 2048) }]
    },
    taskType: 'RETRIEVAL_DOCUMENT',
  }));

  const response = await fetch(`${GEMINI_EMBED_URL}?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API erro ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.embeddings.map(e => e.values);
}

async function embedAndInsertChunks(chunks, geminiApiKey, documentId, itemType, filePath) {
  const INSERT_BATCH = 10; // Batch size matching EMBED_BATCH_SIZE
  for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
    const batch = chunks.slice(i, i + INSERT_BATCH);
    console.log(` Embedding batch ${Math.floor(i / INSERT_BATCH) + 1}/${Math.ceil(chunks.length / INSERT_BATCH)}`);
    const embeddings = await generateEmbeddingsBatch(batch.map(c => c.content), geminiApiKey);
    
    const rows = batch.map((c, idx) => ({
      document_id: documentId,
      content: c.content,
      embedding: embeddings[idx],
      metadata: {
        mind: MIND,
        item_type: itemType,
        chunk_index: c.chunk_index,
        page_estimate: c.page_estimate,
        char_start: c.char_start,
        char_end: c.char_end,
        source_path: filePath,
        similarity_threshold: SIMILARITY_THRESHOLD,
      }
    }));
    
    const { error: insertError } = await supabase.schema('knowledge').from('chunks').insert(rows);
    if (insertError) {
      console.error(`Erro ao inserir lote:`, insertError);
    }
    
    // clear arrays for garbage collection
    rows.length = 0;
    embeddings.length = 0;
    
    if (i + INSERT_BATCH < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

async function processFile(item) {
  console.log(`\n--- Processando ${item.file} ---`);
  const filePath = path.join('pdf-decrypted', item.file);
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  console.log('Extraindo texto...');
  const data = await pdfParse(fileBuffer);
  const text = data.text;
  console.log(`Texto extraído: ${text.length} chars`);

  const chunks = createChunks(text);
  console.log(`Gerados ${chunks.length} chunks.`);

  // Deleta anterior
  const { data: existing } = await supabase.schema('knowledge').from('documents')
    .select('id').eq('metadata->>source_path', item.file).eq('metadata->>mind', MIND).maybeSingle();
  
  if (existing) {
    console.log(`Removendo ingestão anterior: ${existing.id}`);
    await supabase.schema('knowledge').from('chunks').delete().eq('document_id', existing.id);
    await supabase.schema('knowledge').from('documents').delete().eq('id', existing.id);
  }

  // Cria documento
  const { data: document, error: docError } = await supabase.schema('knowledge').from('documents')
    .insert({
      title: item.title,
      content: text.slice(0, 500),
      metadata: {
        mind: MIND,
        item_type: item.type,
        source_path: item.file,
        source_bucket: 'cea_knowledge_base',
        total_chunks: chunks.length,
        total_chars: text.length,
        chunk_size: CHUNK_SIZE,
        chunk_overlap: CHUNK_OVERLAP,
        embedding_model: 'text-embedding-004',
        embedding_dimensions: 768,
        ingested_at: new Date().toISOString(),
      }
    }).select('id').single();

  if (docError) {
    console.error('Erro ao criar doc:', docError);
    return;
  }

  console.log('Gerando e inserindo embeddings em batches (com GC)...');
  await embedAndInsertChunks(chunks, GEMINI_API_KEY, document.id, item.type, item.file);

  console.log(`Ingestão de ${item.file} concluída!`);
}

async function main() {
  for (const item of filesToUpload) {
    await processFile(item);
  }
}

main().catch(console.error);
