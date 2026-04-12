import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBrJEuwwcdnM50gMbeTBFgrvt8galq771U';
const MODEL = 'gemini-2.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com';
const OUTPUT_DIR = path.join(__dirname, 'base_biblica');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function uploadPDF(filePath) {
  console.log(`Fazendo upload de ${filePath}...`);
  const fileSize = fs.statSync(filePath).size;
  const initRes = await fetch(
    `${BASE_URL}/upload/v1beta/files?uploadType=resumable&key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': fileSize.toString(),
        'X-Goog-Upload-Header-Content-Type': 'application/pdf',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: path.basename(filePath) } })
    }
  );
  if(!initRes.ok) throw new Error("Upload init falhou");
  const uploadUrl = initRes.headers.get('location');
  const fileBuffer = fs.readFileSync(filePath);
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Command': 'upload, finalize',
      'X-Goog-Upload-Offset': '0',
      'Content-Type': 'application/pdf',
      'Content-Length': fileSize.toString(),
    },
    body: fileBuffer
  });
  const fileData = await uploadRes.json();
  await sleep(4000);
  return fileData.file;
}

async function askGemini(fileUri, prompt) {
  const res = await fetch(
    `${BASE_URL}/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ file_data: { mime_type: 'application/pdf', file_uri: fileUri } }, { text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
      })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.candidates[0].content.parts[0].text;
}

async function deleteFile(fileName) {
  try { await fetch(`${BASE_URL}/v1beta/${fileName}?key=${GEMINI_API_KEY}`, { method: 'DELETE' }); } catch {}
}

async function reprocessarPlanoLeitura() {
  console.log('\n🔵 Reprocessando PLANO DE LEITURA (3 Partes para garantir token limit)...');
  const filePath = path.join(__dirname, 'Plano de leitura da Bíblia.pdf');
  const allItems = [];
  
  const partes = [
    { inicio: 1, fim: 122, label: 'dias 1-122' },
    { inicio: 123, fim: 244, label: 'dias 123-244' },
    { inicio: 245, fim: 365, label: 'dias 245-365' }
  ];
  
  for (const parte of partes) {
    console.log(`\n📤 Upload para ${parte.label}...`);
    const uploadedFile = await uploadPDF(filePath);
    
    const prompt = `Você é um teólogo. Analise este PDF do Plano de Leitura da Bíblia.
Retorne APENAS e EXATAMENTE os dias de número ${parte.inicio} ao número ${parte.fim} em JSON VÁLIDO:

{
  "items": [
    {
      "day_number": ${parte.inicio},
      "passage": "Gênesis 1-2",
      "book": "Gênesis",
      "chapters": "1-2",
      "testament": "AT",
      "theme": "Tema se tiver"
    }
  ]
}
IMPORTANTE: Retorne APENAS um JSON contendo do número ${parte.inicio} ao ${parte.fim}.`;

    try {
      const raw = await askGemini(uploadedFile.uri, prompt);
      const cleaned = raw.trim().replace(/^```json?\s*/i,'').replace(/\s*```$/i,'');
      const parsed = JSON.parse(cleaned);
      allItems.push(...(parsed.items || []));
      console.log(`✅ ${parte.label}: ${parsed.items?.length || 0} dias`);
    } catch (e) {
      console.error(`❌ Falha: ${e.message}`);
    } finally {
      if(uploadedFile) await deleteFile(uploadedFile.name);
    }
  }
  
  const result = {
    category: 'plano_leitura',
    source: 'Plano de Leitura da Bíblia',
    total_days: allItems.length,
    items: allItems
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'plano_leitura.json'), JSON.stringify(result, null, 2));
  console.log(`✅ plano_leitura.json finalizado com ${allItems.length} dias!\n`);
}

async function reprocessarParabolas() {
  console.log('\n🔵 Reprocessando PARABOLAS...');
  const filePath = path.join(__dirname, '40+Parábolas+de+JEsus.pdf');
  const allItems = [];
  
  const partes = [
    { inicio: 1, fim: 20, label: 'parabolas 1-20' },
    { inicio: 21, fim: 40, label: 'parabolas 21-40' }
  ];
  
  for (const parte of partes) {
    console.log(`\n📤 Upload para ${parte.label}...`);
    const uploadedFile = await uploadPDF(filePath);
    
    const prompt = `Você é um teólogo. Analise este PDF sobre as 40 Parábolas de Jesus.
Como o PDF tem cerca de 40 parábolas, eu quero que você extraia as parábolas do índice/ordem de posição ${parte.inicio} até ${parte.fim}.
Retorne APENAS JSON VÁLIDO no seguinte formato:

{
  "items": [
    {
      "title": "Nome da Parábola",
      "reference": "Lucas 15:11-32",
      "book": "Lucas",
      "testament": "NT",
      "historical_context": "Contexto em 2 frases",
      "theological_message": "Mensagem em 2 frases",
      "practical_application": "Aplicação em 2 frases",
      "reflection_questions": ["P1?", "P2?"],
      "summary": "Resumo de 4 frases"
    }
  ]
}
IMPORTANTE: Extraia EXATAMENTE esse lote de parábolas (${parte.inicio} a ${parte.fim}) do PDF. Retorne apenas JSON com a propriedade "items".`;

    try {
      const raw = await askGemini(uploadedFile.uri, prompt);
      const cleaned = raw.trim().replace(/^```json?\s*/i,'').replace(/\s*```$/i,'');
      const parsed = JSON.parse(cleaned);
      allItems.push(...(parsed.items || []));
      console.log(`✅ ${parte.label}: ${parsed.items?.length || 0} parábolas`);
    } catch (e) {
      console.error(`❌ Falha: ${e.message}`);
    } finally {
      if(uploadedFile) await deleteFile(uploadedFile.name);
    }
  }
  
  const result = {
    category: 'parabolas',
    source: '40 Parábolas de Jesus',
    total: allItems.length,
    items: allItems
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'parabolas.json'), JSON.stringify(result, null, 2));
  console.log(`✅ parabolas.json finalizado com ${allItems.length} parábolas!\n`);
}

async function run() {
  await reprocessarPlanoLeitura();
  await reprocessarParabolas();
}
run();
