/**
 * extract_personagens.mjs
 * Extrai personagens em lotes de 25, totalizando 8 uploads para cobrir todos os 200.
 * Estratégia: pedir apenas título + referência + resumo curto para caber no output.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBrJEuwwcdnM50gMbeTBFgrvt8galq771U';
const MODEL = 'gemini-2.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com';
const OUTPUT_DIR = path.join(__dirname, 'base_biblica');
const FILE_PATH = path.join(__dirname, '200+PERSONAGENS+BÍBLICOS.pdf');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function uploadPDF() {
  const fileSize = fs.statSync(FILE_PATH).size;
  
  const initRes = await fetch(
    `${BASE_URL}/upload/v1beta/files?uploadType=resumable&key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': fileSize,
        'X-Goog-Upload-Header-Content-Type': 'application/pdf',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: '200_personagens.pdf' } })
    }
  );

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) throw new Error('URL de upload não recebida');

  const fileBuffer = fs.readFileSync(FILE_PATH);
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Command': 'upload, finalize',
      'X-Goog-Upload-Offset': '0',
      'Content-Type': 'application/pdf',
    },
    body: fileBuffer
  });

  const fileData = await uploadRes.json();
  await sleep(5000);
  return fileData.file;
}

async function deleteFile(fileName) {
  try {
    await fetch(`${BASE_URL}/v1beta/${fileName}?key=${GEMINI_API_KEY}`, { method: 'DELETE' });
  } catch {}
}

async function askGemini(fileUri, prompt) {
  const res = await fetch(
    `${BASE_URL}/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { file_data: { mime_type: 'application/pdf', file_uri: fileUri } },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 65536,
          responseMimeType: 'application/json'
        }
      })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function extractBatch(inicio, fim) {
  console.log(`\n📦 Extraindo personagens ${inicio} a ${fim}...`);
  
  let uploadedFile = null;
  try {
    process.stdout.write('  📤 Uploading... ');
    uploadedFile = await uploadPDF();
    console.log('✓');
    
    const prompt = `Você é um teólogo especialista. Analise este PDF sobre os 200 Personagens Bíblicos.

Extraia SOMENTE os personagens de número ${inicio} a ${fim} do livro.
Para cada personagem, retorne um JSON compacto:

{
  "items": [
    {
      "num": ${inicio},
      "title": "Nome do Personagem",
      "reference": "Livro Capítulo:Versículo",
      "book": "NomeLivro",
      "testament": "AT",
      "period": "Patriarcal",
      "historical_context": "Contexto histórico em 2 frases.",
      "theological_message": "Lição teológica em 2 frases.",
      "practical_application": "Aplicação prática em 2 frases.",
      "reflection_questions": ["Pergunta 1?", "Pergunta 2?"],
      "summary": "Resumo de 3 frases sobre a vida e legado."
    }
  ]
}

CRÍTICO: Retorne APENAS JSON válido e completo. Inclua exatamente os personagens ${inicio} a ${fim}.`;

    process.stdout.write('  🤖 Analisando... ');
    const raw = await askGemini(uploadedFile.uri, prompt);
    console.log(`✓ (${raw.length} chars)`);
    
    const cleaned = raw.trim().replace(/^```json?\s*/i,'').replace(/\s*```$/i,'');
    const parsed = JSON.parse(cleaned);
    console.log(`  ✅ ${parsed.items?.length || 0} personagens extraídos`);
    return parsed.items || [];
    
  } finally {
    if (uploadedFile?.name) await deleteFile(uploadedFile.name);
    await sleep(2000);
  }
}

async function main() {
  console.log('👤 EXTRAÇÃO DE PERSONAGENS BÍBLICOS (lotes de 25)\n');
  console.log('═'.repeat(60));
  
  // Verificar se arquivo existe
  if (!fs.existsSync(FILE_PATH)) {
    console.error('❌ Arquivo não encontrado:', FILE_PATH);
    process.exit(1);
  }

  const BATCH_SIZE = 25;
  const TOTAL = 200;
  const allItems = [];
  const errors = [];

  for (let inicio = 1; inicio <= TOTAL; inicio += BATCH_SIZE) {
    const fim = Math.min(inicio + BATCH_SIZE - 1, TOTAL);
    
    try {
      const items = await extractBatch(inicio, fim);
      allItems.push(...items);
    } catch (err) {
      console.error(`  ❌ Falha no lote ${inicio}-${fim}: ${err.message}`);
      errors.push({ inicio, fim, error: err.message });
    }
    
    // Pausa entre lotes para não sobrecarregar a API
    if (inicio + BATCH_SIZE <= TOTAL) {
      process.stdout.write('  ⏳ Aguardando 5s... ');
      await sleep(5000);
      console.log('✓');
    }
  }

  // Salvar resultado
  const result = {
    category: 'personagens',
    source: '200 Personagens Bíblicos',
    total: allItems.length,
    items: allItems,
    _metadata: {
      processed_at: new Date().toISOString(),
      strategy: `lotes_de_${BATCH_SIZE}`,
      errors: errors.length > 0 ? errors : undefined
    }
  };

  const outputPath = path.join(OUTPUT_DIR, 'personagens.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTADO FINAL');
  console.log('═'.repeat(60));
  console.log(`✅ Total extraído: ${allItems.length} personagens`);
  console.log(`✅ Arquivo salvo: base_biblica/personagens.json`);
  if (errors.length > 0) {
    console.log(`⚠️  Lotes com falha: ${errors.length}`);
    errors.forEach(e => console.log(`   • Personagens ${e.inicio}-${e.fim}: ${e.error}`));
  }
}

main().catch(err => {
  console.error(`\n❌ Erro fatal: ${err.message}`);
  process.exit(1);
});
