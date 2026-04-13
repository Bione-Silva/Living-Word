/**
 * extract_ebooks_pro.mjs
 * Pipeline de extração usando OpenAI (GPT-4o-mini) devido a bloqueio do Gemini.
 * 
 * Uso: export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"; node extract_ebooks.mjs [alvo]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_DIR = path.join(__dirname, 'base_biblica');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const MODEL = 'gpt-4o-mini';

const PDF_CONFIGS = {
  parabolas: {
    file: '40+Parábolas+de+JEsus.pdf',
    prompt: (text) => `Você é um analista de dados bíblico. Extraia TODAS as parábolas mencionadas de forma explícita NESTE TEXTO PARCIAL do livro de Parábolas de Jesus.
    Retorne um JSON EXATO contendo um objeto com a chave "items" (uma lista):
    {
      "items": [
        {
          "title": "Nome da Parábola",
          "reference": "Referência Bíblica",
          "historical_context": "Contexto",
          "theological_message": "Mensagem",
          "practical_application": "Aplicação",
          "summary": "Resumo"
        }
      ]
    }
    Texto Parcial:
    ${text}`
  },
  personagens: {
    file: '200+PERSONAGENS+BÍBLICOS.pdf',
    prompt: (text) => `Analise este texto parcial do livro "200 Personagens Bíblicos". Extraia todos os personagens novos descritos nele. 
    Retorne um JSON EXATO contendo um objeto com a chave "items" (uma lista):
    {
      "items": [
        {
          "title": "Nome",
          "reference": "Ref",
          "period": "Período",
          "historical_context": "Quem foi",
          "theological_message": "Lição",
          "summary": "Resumo"
        }
      ]
    }
    Texto:
    ${text}`
  },
  milagres: {
    file: '35+Milagres+de+Jesus.pdf',
    prompt: (text) => `Neste recorte de PDF de "35 Milagres", extraia apenas os milagres descritos. 
    Retorne um JSON EXATO contendo um objeto com a chave "items" (uma lista):
    {
      "items": [
        {
          "title": "Nome",
          "reference": "Livro e versículos",
          "summary": "Resumo"
        }
      ]
    }
    Texto:
    ${text}`
  },
  quiz: {
    file: '250+quiz+bíblico.pdf',
    prompt: (text) => `Nesta porção de Quizzes, extraia as perguntas e respostas disponíveis como JSON.
    Retorne um JSON EXATO contendo um objeto com a chave "items" (uma lista):
    {
      "items": [
        {
          "question": "Pergunta",
          "answer": "Resposta e justificativa",
          "difficulty": "fácil|médio|difícil"
        }
      ]
    }
    Texto:
    ${text}`
  },
  panorama: {
    file: 'Panorama+Bíblico.pdf',
    prompt: (text) => `Neste trecho do Panorama Bíblico, extraia as resenhas dos livros da Bíblia que aparecem.
    Retorne um JSON EXATO contendo um objeto com a chave "items":
    {
      "items": [
        {
          "title": "Livro",
          "author": "Autor",
          "theological_message": "Resumo",
          "summary": "Forte do que ele fala"
        }
      ]
    }
    Texto:
    ${text}`
  }
};

const CHUNK_SIZE = 25000; 
const OVERLAP = 3000;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function aiExtractChunk(prompt) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: MODEL,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      const text = data.choices[0].message.content;
      const parsed = JSON.parse(text);
      return parsed.items || [];
    } catch (e) {
      console.log('       [API Error Retry - attempt ' + (attempt+1) + ']: ' + e.message);
      if (attempt === 2) throw e;
      await sleep(3000);
    }
  }
}

async function processPdf(targetKey) {
  const config = PDF_CONFIGS[targetKey];
  if(!config) { console.error('Arquivo nao programado', targetKey); return; }
  
  const filePath = path.join(__dirname, config.file);
  console.log('\n🔵 Lendo Arquivo PDF fisicamente: ' + config.file + '...');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  
  let text = data.text;
  let allItems = [];
  
  const totalChunks = Math.ceil(text.length / (CHUNK_SIZE - OVERLAP));
  console.log('🚀 Iniciando Chunking em ' + totalChunks + ' fatias para extração integral cia OpenAI.');
  
  let chunkCount = 0;
  for (let i = 0; i < text.length; i += (CHUNK_SIZE - OVERLAP)) {
    chunkCount++;
    const chunk = text.slice(i, i + CHUNK_SIZE);
    console.log('  -> Processando Bloco ' + chunkCount + '/' + totalChunks + '... (' + chunk.length + ' chars)');
    
    const prompt = config.prompt(chunk);
    const result = await aiExtractChunk(prompt);
    
    if (result && Array.isArray(result) && result.length > 0) {
      allItems.push(...result);
      console.log('     ✔️ ' + result.length + ' itens extraídos por este bloco!');
    } else {
      console.log('     --- Sem itens processáveis neste bloco.');
    }
    
    // Evitar throttle da OpenAI
    await sleep(800); 
  }
  
  // Dedup - limpar duplicação por causa do OVERLAP
  const map = new Map();
  for (const item of allItems) {
    if (item.title && typeof item.title === 'string') {
        map.set(item.title.toLowerCase().trim(), item);
    } else if (item.question && typeof item.question === 'string') {
        map.set(item.question, item);
    }
  }
  
  const finalItems = Array.from(map.values());
  console.log('🏁 FINAL DE EXTRAÇÃO! Extraído e Desduplicado = TOTAIS REAIS: ' + finalItems.length + ' ITENS!');
  
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
  
  const finalJSON = {
    category: targetKey,
    source: config.file,
    total: finalItems.length,
    items: finalItems
  };
  
  const outpath = path.join(OUTPUT_DIR, targetKey + '.json');
  fs.writeFileSync(outpath, JSON.stringify(finalJSON, null, 2));
  console.log('💾 ARQUIVO SALVO E VALIDADO EM ' + outpath);
}

async function start() {
    const args = process.argv.slice(2);
    const target = args[0] || 'personagens';
    
    if (target === 'all') {
        for (const k of Object.keys(PDF_CONFIGS)) {
            await processPdf(k);
        }
    } else {
        await processPdf(target);
    }
}

start();
