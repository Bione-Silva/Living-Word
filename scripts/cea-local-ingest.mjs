#!/usr/bin/env node
/**
 * cea-local-ingest.mjs
 * Ingestão RAG local — processa PDFs localmente e salva no Supabase
 * Não depende da Edge Function (evita WORKER_RESOURCE_LIMIT)
 * 
 * Uso: node scripts/cea-local-ingest.mjs [item_type]
 * Exemplo: node scripts/cea-local-ingest.mjs parabola
 * Sem argumentos: processa todos os 6 PDFs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Carregar variáveis do .env.local ─────────────────────────────────────────
function loadEnv() {
  const envPath = join(ROOT, '.env.local');
  if (!existsSync(envPath)) return {};
  const lines = readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}
const ENV = loadEnv();

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://priumwdestycikzfcysg.supabase.co';
const SERVICE_ROLE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI';
// GEMINI_API_KEY: lido do .env.local ou passa --api-key=xxx como argumento
const GEMINI_API_KEY_ARG = process.argv.find(a => a.startsWith('--api-key='))?.split('=')[1];
const GEMINI_API_KEY = GEMINI_API_KEY_ARG || ENV.GEMINI_API_KEY || ENV.VITE_GEMINI_API_KEY || 'AIzaSyDjOsDyfBOv_m40UdjA8jBfd4slO0xPcIo';
// gemini-embedding-001: embedContent individual (3072d) — model correto disponível
const GEMINI_MODEL = 'gemini-embedding-001';
const GEMINI_EMBED_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// PDFs descriptografados ficam em pdf-sources/
const PDF_DIR = 'pdf-sources';

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const EMBED_BATCH_SIZE = 10;    // chunks por request à API Gemini
const EMBED_RATE_LIMIT_MS = 600; // delay entre batches (evitar 429)
const MIND = 'cea';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── PDFs para processar ──────────────────────────────────────────────────────
const PDF_CONFIGS = [
  { file: 'parabolas.pdf',     item_type: 'parabola',   title: '40 Parábolas de Jesus' },
  { file: 'personagens.pdf',   item_type: 'personagem', title: '200 Personagens Bíblicos' },
  { file: 'panorama.pdf',      item_type: 'livro',      title: 'Panorama Bíblico (66 Livros)' },
  { file: 'quiz.pdf',          item_type: 'quiz',       title: '250 Quiz Bíblico' },
  { file: 'plano_leitura.pdf', item_type: 'devocional', title: 'Plano de Leitura da Bíblia' },
  { file: 'milagres.pdf',      item_type: 'milagre',    title: '35 Milagres de Jesus' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function extractTextFromPDF(filePath) {
  // Usa pdftotext com output em arquivo temporário para evitar buffer grande no Node
  const { execFileSync } = await import('child_process');
  const { mkdtempSync, readFileSync: readFS, unlinkSync, existsSync: existsFS } = await import('fs');
  const { tmpdir } = await import('os');
  const { join: joinPath } = await import('path');

  const tmpDir = mkdtempSync(joinPath(tmpdir(), 'cea-'));
  const outFile = joinPath(tmpDir, 'out.txt');

  try {
    execFileSync('pdftotext', ['-enc', 'UTF-8', filePath, outFile], {
      timeout: 180_000, // 3min
      stdio: ['ignore', 'ignore', 'ignore'],
    });
  } catch (err) {
    throw new Error(`pdftotext falhou: ${err.message}`);
  }

  if (!existsFS(outFile)) {
    throw new Error('pdftotext não gerou arquivo de saída');
  }

  const text = readFS(outFile, 'utf8');
  try { unlinkSync(outFile); } catch (_) {}
  const { rmSync } = await import('fs');
  try { rmSync(tmpDir, { recursive: true }); } catch (_) {}

  if (!text || text.trim().length < 100) {
    throw new Error(`PDF retornou texto insuficiente (${text.length} chars).`);
  }

  return text;
}

function createChunks(text) {
  const chunks = [];
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  // Limitar a 800k chars para arquivos muito grandes
  const limited = cleaned.length > 800_000 ? cleaned.slice(0, 800_000) : cleaned;

  let position = 0;
  let chunkIndex = 0;

  while (position < limited.length) {
    const end = Math.min(position + CHUNK_SIZE, limited.length);
    let chunkEnd = end;

    if (end < limited.length) {
      const paraBreak = limited.lastIndexOf('\n\n', end);
      if (paraBreak > position + CHUNK_SIZE * 0.6) {
        chunkEnd = paraBreak + 2;
      } else {
        const sentenceBreak = limited.lastIndexOf('. ', end);
        if (sentenceBreak > position + CHUNK_SIZE * 0.5) {
          chunkEnd = sentenceBreak + 2;
        }
      }
    }

    const content = limited.slice(position, chunkEnd).trim();
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

// gemini-embedding-001 usa endpoint embedContent individual
// outputDimensionality: 768 para manter compat com vector(768) e evitar payload gigante (38KB→6KB)
async function generateEmbeddingsBatch(texts) {
  const embeddings = [];
  for (const text of texts) {
    const response = await fetch(
      `${GEMINI_EMBED_BASE}/${GEMINI_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text: text.slice(0, 2048) }] },
          taskType: 'RETRIEVAL_DOCUMENT',
          outputDimensionality: 768,  // truncar para 768d (compat com vector(768))
        }),
      }
    );
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API ${response.status}: ${err.slice(0, 200)}`);
    }
    const result = await response.json();
    embeddings.push(result.embedding.values);
    // Pequeno delay para não ultrapassar rate limit
    await new Promise(r => setTimeout(r, 100));
  }
  return embeddings;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Ingestão principal ───────────────────────────────────────────────────────

async function ingestPDF(config, forceReingest = false) {
  const filePath = join(ROOT, PDF_DIR, config.file);

  if (!existsSync(filePath)) {
    console.error(`  ❌ Arquivo não encontrado: ${filePath}`);
    return false;
  }

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  📄 ${config.title}`);
  console.log(`     item_type: ${config.item_type} | arquivo: ${config.file}`);
  console.log(`${'─'.repeat(55)}`);

  // Verificar se já foi ingerido
  let existing = null;
  try {
    const { data } = await supabase
      .schema('knowledge')
      .from('documents')
      .select('id, title')
      .eq('mind', MIND)
      .filter('metadata->>item_type', 'eq', config.item_type)
      .maybeSingle();
    existing = data;
  } catch (_) { /* ignorar erro de verificação */ }

  if (existing && !forceReingest) {
    console.log(`  ⚠️  Já ingerido anteriormente (id: ${existing.id}). Use --force para re-processar.`);
    return true;
  }

  // 1. Extrair texto
  process.stdout.write('  📖 Extraindo texto do PDF...');
  let text;
  try {
    text = await extractTextFromPDF(filePath);
    console.log(` ${text.length.toLocaleString()} chars`);
  } catch (err) {
    console.error(`\n  ❌ Extração falhou: ${err.message}`);
    return false;
  }

  // 2. Chunking
  const chunks = createChunks(text);
  console.log(`  ✂️  Chunks criados: ${chunks.length} (tamanho ~${CHUNK_SIZE}c + ${CHUNK_OVERLAP}c overlap)`);

  // 3. Criar documento no Supabase via fetch (Content-Profile para schema não-público)
  const docPayload = {
    title: config.title,
    mind: MIND,
    item_type: config.item_type,
    source_path: config.file,
    metadata: {
      mind: MIND,
      item_type: config.item_type,
      source_path: config.file,
      total_chars: text.length,
      ingested_at: new Date().toISOString(),
    },
  };

  const docRes = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Content-Profile': 'knowledge',
      'Accept-Profile': 'knowledge',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(docPayload),
  });

  if (!docRes.ok) {
    const errText = await docRes.text();
    console.error(`  ❌ Erro ao criar documento: ${docRes.status} ${errText.slice(0, 200)}`);
    return false;
  }

  const [document] = await docRes.json();
  if (!document?.id) {
    console.error('  ❌ Documento criado mas sem ID retornado');
    return false;
  }

  console.log(`  🗂️  Documento criado: ${document.id}`);

  // 4. Gerar embeddings em batches e salvar chunks
  let chunksInserted = 0;
  const batches = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    batches.push(chunks.slice(i, i + EMBED_BATCH_SIZE));
  }

  console.log(`  🧠 Gerando embeddings: ${batches.length} batches de até ${EMBED_BATCH_SIZE}...`);

  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    const batch = batches[bIdx];
    const texts = batch.map(c => c.content);

    // Gerar embeddings
    let embeddings;
    try {
      embeddings = await generateEmbeddingsBatch(texts);
    } catch (err) {
      console.error(`  ❌ Embedding batch ${bIdx + 1} falhou: ${err.message}`);
      continue;
    }

    // Preparar rows para insert — inserir um chunk por vez para evitar payload grande
    for (let cIdx = 0; cIdx < batch.length; cIdx++) {
      const chunk = batch[cIdx];
      const embedding = embeddings[cIdx];
      
      const row = {
        document_id: document.id,
        content: chunk.content,
        embedding: `[${embedding.join(',')}]`,
        metadata: {
          mind: MIND,
          item_type: config.item_type,
          chunk_index: chunk.chunk_index,
          page_estimate: chunk.page_estimate,
          char_start: chunk.char_start,
          char_end: chunk.char_end,
        },
      };

      // Usar fetch com Content-Profile para schema knowledge
      const insertRes = await fetch(
        `${SUPABASE_URL}/rest/v1/chunks`,
        {
          method: 'POST',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Content-Profile': 'knowledge',
            'Accept-Profile': 'knowledge',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(row),
        }
      );

      if (insertRes.ok) {
        chunksInserted++;
      } else {
        const errText = await insertRes.text();
        // Log apenas se for erro inesperado (não duplicata)
        if (!errText.includes('duplicate')) {
          console.error(`\n  ⚠️  Chunk ${chunk.chunk_index} falhou: ${insertRes.status} ${errText.slice(0, 100)}`);
        }
      }
    }

    // Progress bar simples
    const progress = Math.round(((bIdx + 1) / batches.length) * 100);
    process.stdout.write(`\r  📊 Progresso: ${bIdx + 1}/${batches.length} batches (${progress}%) — ${chunksInserted} chunks salvos`);

    // Rate limit entre batches
    if (bIdx < batches.length - 1) {
      await sleep(EMBED_RATE_LIMIT_MS);
    }
  }

  console.log(`\n  ✅ Concluído: ${chunksInserted}/${chunks.length} chunks salvos`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const filterType = process.argv.find(a => !a.startsWith('--') && !a.startsWith('/') && process.argv.indexOf(a) >= 2 && a !== process.argv[1]);
  const forceReingest = process.argv.includes('--force');

  // Verificar chave Gemini
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY não encontrada!');
    console.error('   Opções:');
    console.error('   1. Adicione GEMINI_API_KEY=sua-chave no arquivo .env.local');
    console.error('   2. Execute: node scripts/cea-local-ingest.mjs --api-key=sua-chave');
    process.exit(1);
  }
  console.log(`  🔑 Gemini API Key: ${GEMINI_API_KEY.slice(0, 15)}...`);

  console.log('='.repeat(55));
  console.log('  CEA — Ingestão RAG Local (6 PDFs)');
  console.log('  Pipeline: PDF → Texto → Chunks → Gemini Embeddings → Supabase');
  if (forceReingest) console.log('  ⚠️  Modo FORCE: re-ingerindo mesmo documentos já existentes');
  console.log('='.repeat(55));

  const configs = filterType
    ? PDF_CONFIGS.filter(c => c.item_type === filterType)
    : PDF_CONFIGS;

  if (configs.length === 0) {
    console.error(`Nenhum PDF encontrado para item_type: ${filterType}`);
    console.log(`Tipos disponíveis: ${PDF_CONFIGS.map(c => c.item_type).join(', ')}`);
    process.exit(1);
  }

  const results = [];
  for (const config of configs) {
    const success = await ingestPDF(config, forceReingest);
    results.push({ ...config, success });
  }

  // Resumo final
  console.log('\n' + '='.repeat(55));
  console.log('  RESUMO FINAL');
  console.log('='.repeat(55));
  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    console.log(`  ${icon}  ${r.item_type.padEnd(12)} ${r.title}`);
  }

  const ok = results.filter(r => r.success).length;
  console.log(`\n  ${ok}/${results.length} PDFs processados com sucesso`);

  if (ok === results.length) {
    console.log('\n🎉 CEA Knowledge Base completa!');
    console.log('\nVerificação — execute no Supabase SQL Editor:');
    console.log(`https://supabase.com/dashboard/project/priumwdestycikzfcysg/editor`);
    console.log(`
SELECT metadata->>'item_type' AS item_type, COUNT(*) AS chunks
FROM knowledge.chunks
WHERE metadata->>'mind' = 'cea'
GROUP BY metadata->>'item_type'
ORDER BY item_type;`);
  }
}

main().catch(err => {
  console.error('\nErro fatal:', err.message);
  process.exit(1);
});
