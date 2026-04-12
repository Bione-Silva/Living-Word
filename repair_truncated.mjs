/**
 * repair_truncated.mjs
 * Repara JSONs truncados: tenta extrair tudo que foi gerado
 * e salva como JSON válido. Depois reprocessa em partes se necessário.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBrJEuwwcdnM50gMbeTBFgrvt8galq771U';
const MODEL = 'gemini-2.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com';
const OUTPUT_DIR = path.join(__dirname, 'base_biblica');

// ─── Tentar extrair JSON parcial de um texto truncado ─────────────────────────
function extractPartialJSON(rawText) {
  let text = rawText.trim();
  
  // Remover markdown
  text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  text = text.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  
  // Tentar parsear direto primeiro
  try {
    return JSON.parse(text);
  } catch (e) {
    // Tudo bem, vamos tentar corrigir
  }

  // Achar o início do array de items
  const itemsStart = text.indexOf('"items"');
  if (itemsStart === -1) {
    throw new Error('Não encontrei o array "items" no texto');
  }

  // Achar o início do array [
  const arrayStart = text.indexOf('[', itemsStart);
  if (arrayStart === -1) {
    throw new Error('Não encontrei o início do array');
  }

  // Coletar objetos completos do array
  const items = [];
  let pos = arrayStart + 1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let objStart = -1;

  while (pos < text.length) {
    const ch = text[pos];
    
    if (escaped) {
      escaped = false;
    } else if (ch === '\\' && inString) {
      escaped = true;
    } else if (ch === '"') {
      inString = !inString;
    } else if (!inString) {
      if (ch === '{') {
        if (depth === 0) objStart = pos;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          // Objeto completo encontrado
          const objStr = text.slice(objStart, pos + 1);
          try {
            const obj = JSON.parse(objStr);
            items.push(obj);
          } catch (e) {
            // Objeto malformado, ignorar
          }
          objStart = -1;
        }
      }
    }
    pos++;
  }

  // Reconstruir o objeto principal
  const headerMatch = text.match(/"category"\s*:\s*"([^"]+)"/);
  const sourceMatch = text.match(/"source"\s*:\s*"([^"]+)"/);
  
  return {
    category: headerMatch?.[1] || 'unknown',
    source: sourceMatch?.[1] || 'unknown',
    total: items.length,
    items: items,
    _repaired: true,
    _repair_note: `Objeto JSON truncado reparado. ${items.length} itens extraídos do texto bruto.`
  };
}

// ─── Upload e análise com Gemini (para reprocessar em partes) ─────────────────
async function uploadPDF(filePath) {
  const fileSize = fs.statSync(filePath).size;
  
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
      body: JSON.stringify({ file: { display_name: path.basename(filePath) } })
    }
  );

  const uploadUrl = initRes.headers.get('location') || initRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('URL de upload não recebida');

  const fileBuffer = fs.readFileSync(filePath);
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
  await new Promise(r => setTimeout(r, 5000));
  return fileData.file;
}

async function askGemini(fileUri, mimeType, prompt) {
  const res = await fetch(
    `${BASE_URL}/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { file_data: { mime_type: mimeType, file_uri: fileUri } },
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function deleteFile(fileName) {
  try {
    await fetch(`${BASE_URL}/v1beta/${fileName}?key=${GEMINI_API_KEY}`, { method: 'DELETE' });
  } catch {}
}

// ─── Reprocessar Personagens em partes ───────────────────────────────────────
async function reprocessarPersonagens() {
  console.log('\n🔵 Reprocessando PERSONAGENS em 2 partes...');
  
  const filePath = path.join(__dirname, '200+PERSONAGENS+BÍBLICOS.pdf');
  const allItems = [];
  
  const partes = [
    { inicio: 1, fim: 100, label: 'parte 1 (1-100)' },
    { inicio: 101, fim: 200, label: 'parte 2 (101-200)' }
  ];
  
  for (const parte of partes) {
    console.log(`\n📤 Upload para ${parte.label}...`);
    const uploadedFile = await uploadPDF(filePath);
    
    const prompt = `Você é um teólogo. Analise este PDF sobre os 200 Personagens Bíblicos.
Retorne APENAS os personagens do número ${parte.inicio} ao ${parte.fim} em JSON VÁLIDO:

{
  "items": [
    {
      "title": "Nome do Personagem",
      "reference": "Gênesis 1:1",
      "book": "Gênesis",
      "testament": "AT",
      "period": "Patriarcal",
      "historical_context": "Quem foi, época e contexto em 2-3 frases",
      "theological_message": "Papel e lição teológica em 2-3 frases",
      "practical_application": "O que aprendemos com este personagem em 2-3 frases",
      "reflection_questions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"],
      "summary": "Resumo de 4-6 frases sobre a vida e legado do personagem"
    }
  ]
}

IMPORTANTE: Retorne APENAS JSON válido, sem markdown, sem texto extra.
Inclua exatamente os personagens de ${parte.inicio} a ${parte.fim}.`;

    try {
      const raw = await askGemini(uploadedFile.uri, 'application/pdf', prompt);
      const parsed = JSON.parse(raw.trim().replace(/^```json?\s*/i,'').replace(/\s*```$/,''));
      allItems.push(...(parsed.items || []));
      console.log(`✅ ${parte.label}: ${parsed.items?.length || 0} personagens`);
    } catch (e) {
      console.error(`❌ Falha na ${parte.label}: ${e.message}`);
      // Tentar repair
      try {
        const repaired = extractPartialJSON(raw);
        allItems.push(...(repaired.items || []));
        console.log(`⚠️  Reparado: ${repaired.items?.length || 0} personagens`);
      } catch {}
    } finally {
      await deleteFile(uploadedFile.name);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  const result = {
    category: 'personagens',
    source: '200 Personagens Bíblicos',
    total: allItems.length,
    items: allItems,
    _metadata: { processed_at: new Date().toISOString(), strategy: 'dois_uploads' }
  };
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'personagens.json'), JSON.stringify(result, null, 2));
  console.log(`\n✅ personagens.json salvo com ${allItems.length} personagens!`);
  return result;
}

// ─── Reprocessar Panorama em partes (AT e NT) ─────────────────────────────────
async function reprocessarPanorama() {
  console.log('\n🔵 Reprocessando PANORAMA em 2 partes (AT + NT)...');
  
  const filePath = path.join(__dirname, 'Panorama+Bíblico.pdf');
  const allItems = [];
  
  const partes = [
    { testamento: 'AT', label: 'Antigo Testamento (39 livros)', livros: 'do Gênesis ao Malaquias (todos os 39 livros do Antigo Testamento)' },
    { testamento: 'NT', label: 'Novo Testamento (27 livros)', livros: 'de Mateus ao Apocalipse (todos os 27 livros do Novo Testamento)' }
  ];
  
  for (const parte of partes) {
    console.log(`\n📤 Upload para ${parte.label}...`);
    const uploadedFile = await uploadPDF(filePath);
    
    const prompt = `Você é um teólogo. Analise este PDF do Panorama Bíblico.
Retorne APENAS os livros ${parte.livros} em JSON VÁLIDO:

{
  "items": [
    {
      "title": "Gênesis",
      "reference": "Gênesis",
      "book": "Gênesis",
      "testament": "${parte.testamento}",
      "author": "Moisés",
      "period": "~1450-1410 a.C.",
      "chapters": 50,
      "genre": "narrativa",
      "historical_context": "Contexto histórico do livro em 2-3 frases",
      "theological_message": "Tema e mensagem central em 2-3 frases",
      "practical_application": "Relevância para hoje em 2-3 frases",
      "key_verses": ["Gênesis 1:1", "Gênesis 3:15"],
      "reflection_questions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"],
      "summary": "Resumo de 5-7 frases sobre o livro completo"
    }
  ]
}

IMPORTANTE: Retorne APENAS JSON válido. Inclua TODOS os livros do ${parte.testamento}.`;

    try {
      const raw = await askGemini(uploadedFile.uri, 'application/pdf', prompt);
      const cleaned = raw.trim().replace(/^```json?\s*/i,'').replace(/\s*```$/,'');
      const parsed = JSON.parse(cleaned);
      allItems.push(...(parsed.items || []));
      console.log(`✅ ${parte.label}: ${parsed.items?.length || 0} livros`);
    } catch (e) {
      console.error(`❌ Falha: ${e.message}`);
      // Tentar repair do truncado
      const rawPath = path.join(OUTPUT_DIR, 'panorama_RAW.txt');
      if (parte.testamento === 'AT' && fs.existsSync(rawPath)) {
        try {
          const rawContent = fs.readFileSync(rawPath, 'utf-8');
          const repaired = extractPartialJSON(rawContent);
          allItems.push(...(repaired.items || []));
          console.log(`⚠️  Usando RAW reparado: ${repaired.items?.length || 0} livros`);
        } catch {}
      }
    } finally {
      await deleteFile(uploadedFile.name);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  const result = {
    category: 'panorama',
    source: 'Panorama Bíblico',
    total: allItems.length,
    items: allItems,
    _metadata: { processed_at: new Date().toISOString(), strategy: 'dois_uploads_AT_NT' }
  };
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'panorama.json'), JSON.stringify(result, null, 2));
  console.log(`\n✅ panorama.json salvo com ${allItems.length} livros!`);
  return result;
}

// ─── Reparar do arquivo RAW ───────────────────────────────────────────────────
function repararDoRaw(chave) {
  const rawPath = path.join(OUTPUT_DIR, `${chave}_RAW.txt`);
  if (!fs.existsSync(rawPath)) {
    console.error(`❌ Arquivo ${chave}_RAW.txt não encontrado`);
    return null;
  }
  
  console.log(`\n🔧 Tentando reparar ${chave} do arquivo RAW...`);
  const rawContent = fs.readFileSync(rawPath, 'utf-8');
  console.log(`📄 Tamanho do RAW: ${rawContent.length} chars`);
  
  try {
    const repaired = extractPartialJSON(rawContent);
    const outputPath = path.join(OUTPUT_DIR, `${chave}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(repaired, null, 2));
    console.log(`✅ Reparado! ${repaired.items?.length || repaired.total_days || 0} itens extraídos`);
    return repaired;
  } catch (e) {
    console.error(`❌ Não foi possível reparar: ${e.message}`);
    return null;
  }
}

// ─── Reparar Plano de Leitura ─────────────────────────────────────────────────
async function reprocessarPlanoLeitura() {
  console.log('\n🔵 Reprocessando PLANO DE LEITURA...');
  
  const filePath = path.join(__dirname, 'Plano de leitura da Bíblia.pdf');
  
  // Tentar primeiro reparar do RAW
  const rawPath = path.join(OUTPUT_DIR, 'plano_leitura_RAW.txt');
  if (fs.existsSync(rawPath)) {
    const repaired = repararDoRaw('plano_leitura');
    if (repaired && repaired.items?.length > 100) {
      console.log(`✅ Reparo do RAW funcionou! ${repaired.items.length} dias extraídos`);
      return repaired;
    }
  }
  
  // Se não funcionou, reprocessar em 2 partes (1-183 e 184-365)
  const allItems = [];
  const partes = [
    { inicio: 1, fim: 182, label: 'dias 1-182' },
    { inicio: 183, fim: 365, label: 'dias 183-365' }
  ];
  
  for (const parte of partes) {
    console.log(`\n📤 Upload para ${parte.label}...`);
    const uploadedFile = await uploadPDF(filePath);
    
    const prompt = `Você é um teólogo. Analise este PDF do Plano de Leitura da Bíblia.
Retorne APENAS os dias ${parte.inicio} ao ${parte.fim} em JSON VÁLIDO:

{
  "items": [
    {
      "day_number": ${parte.inicio},
      "passage": "Gênesis 1-2",
      "book": "Gênesis",
      "chapters": "1-2",
      "testament": "AT",
      "theme": "Tema do dia se disponível"
    }
  ]
}

IMPORTANTE: Retorne APENAS JSON válido. Inclua os dias ${parte.inicio} a ${parte.fim}.`;

    try {
      const raw = await askGemini(uploadedFile.uri, 'application/pdf', prompt);
      const cleaned = raw.trim().replace(/^```json?\s*/i,'').replace(/\s*```$/,'');
      const parsed = JSON.parse(cleaned);
      allItems.push(...(parsed.items || []));
      console.log(`✅ ${parte.label}: ${parsed.items?.length || 0} dias`);
    } catch (e) {
      console.error(`❌ Falha: ${e.message}`);
    } finally {
      await deleteFile(uploadedFile.name);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  const result = {
    category: 'plano_leitura',
    source: 'Plano de Leitura da Bíblia',
    total_days: allItems.length,
    items: allItems,
    _metadata: { processed_at: new Date().toISOString(), strategy: 'dois_uploads' }
  };
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'plano_leitura.json'), JSON.stringify(result, null, 2));
  console.log(`\n✅ plano_leitura.json salvo com ${allItems.length} dias!`);
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔧 REPARANDO EXTRAÇÕES TRUNCADAS\n');
  console.log('═'.repeat(60));
  
  const results = [];
  
  // 1. Tentar reparar Plano de Leitura do RAW primeiro (simples)
  const planoRaw = repararDoRaw('plano_leitura');
  if (planoRaw && planoRaw.items?.length > 50) {
    results.push({ key: 'plano_leitura', items: planoRaw.items.length, method: 'raw_repair' });
  } else {
    // Reprocessar em partes
    const plano = await reprocessarPlanoLeitura();
    results.push({ key: 'plano_leitura', items: plano?.items?.length || 0, method: 'reprocess' });
  }
  
  // 2. Reprocessar Personagens em 2 partes
  const personagens = await reprocessarPersonagens();
  results.push({ key: 'personagens', items: personagens?.items?.length || 0, method: 'reprocess_2parts' });
  
  // 3. Reprocessar Panorama em 2 partes (AT + NT)
  const panorama = await reprocessarPanorama();
  results.push({ key: 'panorama', items: panorama?.items?.length || 0, method: 'reprocess_AT_NT' });
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTADO FINAL DO REPARO');
  console.log('═'.repeat(60));
  for (const r of results) {
    console.log(`✅ ${r.key}: ${r.items} itens (${r.method})`);
  }
  
  // Resumo geral de tudo
  console.log('\n📚 RESUMO COMPLETO DA BASE BÍBLICA:');
  const files = ['parabolas', 'milagres', 'quiz', 'plano_leitura', 'personagens', 'panorama'];
  for (const f of files) {
    const p = path.join(OUTPUT_DIR, `${f}.json`);
    if (fs.existsSync(p)) {
      const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
      const count = d.items?.length || d.total_days || d.total || 0;
      console.log(`  ✅ ${f}.json: ${count} itens`);
    } else {
      console.log(`  ❌ ${f}.json: NÃO EXISTE`);
    }
  }
}

main().catch(err => {
  console.error(`\n❌ Erro fatal: ${err.message}`);
  process.exit(1);
});
