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
  if(!initRes.ok) throw new Error("Upload init falhou " + await initRes.text());
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
  try {
    await fetch(`${BASE_URL}/v1beta/${fileName}?key=${GEMINI_API_KEY}`, { method: 'DELETE' });
  } catch {}
}

async function extractMissingCharacters() {
  console.log(">> Extracting missing characters: 20, 23, 47, 133, 177");
  const filePath = path.join(__dirname, '200+PERSONAGENS+BÍBLICOS.pdf');
  const uploadedFile = await uploadPDF(filePath);
  
  const prompt = `Você é um teólogo. Analise o PDF dos 200 Personagens Bíblicos.
Extraia APENAS e EXATAMENTE os personagens de número: 20, 23, 47, 133 e 177.

Retorne SOMENTE no formato JSON a seguir:
{
  "items": [
    {
      "num": numero_do_personagem,
      "title": "Nome",
      "reference": "Gênesis 1:1",
      "book": "Gênesis",
      "testament": "AT",
      "period": "Patriarcal",
      "historical_context": "Contexto.",
      "theological_message": "Lição.",
      "practical_application": "Aplicação.",
      "reflection_questions": ["P1?", "P2?"],
      "summary": "Resumo."
    }
  ]
}`;

  try {
    const raw = await askGemini(uploadedFile.uri, prompt);
    const cleaned = raw.trim().replace(/^```json?\s*/i,'').replace(/\s*```$/i,'');
    const parsed = JSON.parse(cleaned);
    
    const originalFile = path.join(OUTPUT_DIR, 'personagens.json');
    const originalData = JSON.parse(fs.readFileSync(originalFile, 'utf8'));
    originalData.items.push(...parsed.items);
    
    // Sort and filter possible duplicates if any
    const uniqueItems = Array.from(new Map(originalData.items.map(item => [item.num, item])).values());
    uniqueItems.sort((a,b) => a.num - b.num);
    originalData.items = uniqueItems;
    originalData.total = originalData.items.length;
    
    fs.writeFileSync(originalFile, JSON.stringify(originalData, null, 2));
    
    console.log("Characters patched! New total:", originalData.total);
  } catch(e) {
    console.error("Error characters:", e.message);
  } finally {
    if(uploadedFile) await deleteFile(uploadedFile.name);
  }
}

async function extractMissingQuiz() {
  console.log(">> Extracting last questions from Quiz to reach 250");
  const originalFile = path.join(OUTPUT_DIR, 'quiz.json');
  const originalData = JSON.parse(fs.readFileSync(originalFile, 'utf8'));
  const missingCount = 250 - originalData.items.length;
  
  if (missingCount <= 0) {
    console.log("Quiz already has 250 or more items.");
    return;
  }
  
  const filePath = path.join(__dirname, '250+quiz+bíblico.pdf');
  const uploadedFile = await uploadPDF(filePath);
  
  const prompt = `Você é um teólogo. Analise este PDF com o Quiz Bíblico de 250 perguntas.
Extraia APENAS as ÚLTIMAS ${missingCount} perguntas do final do livro.

Retorne em formato JSON:
{
  "items": [
    {
      "question": "texto da pergunta extraída?",
      "answer": "resposta exata",
      "reference": "referência bíblica",
      "difficulty": "facil|medio|dificil",
      "category": "NT|AT|geral"
    }
  ]
}`;

  try {
    const raw = await askGemini(uploadedFile.uri, prompt);
    const cleaned = raw.trim().replace(/^```json?\s*/i,'').replace(/\s*```$/i,'');
    const parsed = JSON.parse(cleaned);
    
    if (parsed.items) {
      originalData.items.push(...parsed.items);
      originalData.total = originalData.items.length;
      fs.writeFileSync(originalFile, JSON.stringify(originalData, null, 2));
      console.log("Quiz patched! New total:", originalData.total);
    }
  } catch(e) {
    console.error("Error quiz:", e.message);
  } finally {
    if(uploadedFile) await deleteFile(uploadedFile.name);
  }
}

async function run() {
  await extractMissingCharacters();
  await extractMissingQuiz();
}
run();
