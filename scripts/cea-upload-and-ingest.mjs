#!/usr/bin/env node
// cea-upload-and-ingest.mjs
// Faz upload dos PDFs descriptografados no bucket Supabase
// e dispara a ingestão RAG via Edge Function

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SUPABASE_URL = 'https://priumwdestycikzfcysg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI';
const BUCKET = 'cea_knowledge_base';
const INGEST_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/cea-ingest-pdf`;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PDF_CONFIGS = [
  { file: 'parabolas.pdf',    item_type: 'parabola',   title: '40 Parábolas de Jesus' },
  { file: 'personagens.pdf',  item_type: 'personagem', title: '200 Personagens Bíblicos' },
  { file: 'panorama.pdf',     item_type: 'livro',      title: 'Panorama Bíblico (66 Livros)' },
  { file: 'quiz.pdf',         item_type: 'quiz',       title: '250 Quiz Bíblico' },
  { file: 'plano_leitura.pdf',item_type: 'devocional', title: 'Plano de Leitura da Bíblia' },
  { file: 'milagres.pdf',     item_type: 'milagre',    title: '35 Milagres de Jesus' },
];

async function ensureBucket() {
  console.log(`\n📦 Verificando bucket '${BUCKET}'...`);
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.id === BUCKET);
  
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['application/pdf'],
    });
    if (error) throw new Error(`Falha ao criar bucket: ${error.message}`);
    console.log(`✅ Bucket '${BUCKET}' criado (privado)`);
  } else {
    console.log(`✅ Bucket '${BUCKET}' já existe`);
  }
}

async function uploadPDF(config) {
  const filePath = join(ROOT, 'pdf-decrypted', config.file);
  
  if (!existsSync(filePath)) {
    console.log(`  ⚠️  Arquivo não encontrado: ${filePath}`);
    return false;
  }

  const fileBuffer = readFileSync(filePath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(config.file, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.log(`  ❌ Upload falhou [${config.file}]: ${error.message}`);
    return false;
  }
  
  console.log(`  ✅ Upload OK: ${config.file} (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB)`);
  return true;
}

async function ingestPDF(config) {
  console.log(`  🔄 Ingerindo: ${config.title}...`);
  
  const response = await fetch(INGEST_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_path: config.file,
      item_type: config.item_type,
      title: config.title,
      mind: 'cea',
      force_reingest: false,
    }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.log(`  ❌ Ingestão falhou [${config.file}]: ${JSON.stringify(result)}`);
    return false;
  }

  console.log(`  ✅ Ingestão OK: ${result.chunks_created || '?'} chunks criados`);
  return true;
}

async function main() {
  console.log('='.repeat(55));
  console.log('  CEA — Upload & Ingestão RAG (6 PDFs)');
  console.log('='.repeat(55));

  // Passo 1: Garantir bucket existe
  await ensureBucket();

  // Passo 2: Upload de cada PDF
  console.log('\n📤 Fazendo upload dos PDFs...');
  for (const config of PDF_CONFIGS) {
    await uploadPDF(config);
  }

  // Passo 3: Ingestão RAG (um por um para não sobrecarregar)
  console.log('\n🧠 Iniciando ingestão RAG (pode demorar ~5-10 min total)...');
  const results = [];
  for (const config of PDF_CONFIGS) {
    const success = await ingestPDF(config);
    results.push({ ...config, success });
    // Aguardar 2s entre cada ingestão para não sobrecarregar a API Gemini
    if (success) await new Promise(r => setTimeout(r, 2000));
  }

  // Resumo
  console.log('\n' + '='.repeat(55));
  console.log('  RESUMO FINAL');
  console.log('='.repeat(55));
  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    console.log(`  ${icon}  ${r.item_type.padEnd(12)} ${r.title}`);
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n  ${successCount}/${results.length} PDFs ingeridos com sucesso`);
  
  if (successCount === results.length) {
    console.log('\n🎉 CEA Knowledge Base está pronto!');
    console.log('\nPróximo passo — execute no Supabase SQL Editor:');
    console.log(`
SELECT metadata->>'item_type' AS item_type, COUNT(*) AS chunks
FROM knowledge.chunks
WHERE metadata->>'mind' = 'cea'
GROUP BY metadata->>'item_type'
ORDER BY item_type;`);
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
