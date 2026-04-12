/**
 * extract_ebooks.mjs
 * Pipeline de extração de conhecimento bíblico dos PDFs licenciados.
 * Usa Gemini 1.5 Flash com File API para processar PDFs inteiros.
 * Salva JSON estruturados em /base_biblica/
 *
 * Uso: node extract_ebooks.mjs [nome_do_pdf_sem_extensao]
 * Ex:  node extract_ebooks.mjs parabolas
 *      node extract_ebooks.mjs all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Configuração ───────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBrJEuwwcdnM50gMbeTBFgrvt8galq771U';
const MODEL = 'gemini-2.5-flash';
const OUTPUT_DIR = path.join(__dirname, 'base_biblica');
const BASE_URL = 'https://generativelanguage.googleapis.com';

// ─── Mapeamento dos PDFs ─────────────────────────────────────────────────────
const PDF_CONFIGS = {
  parabolas: {
    file: '40+Parábolas+de+JEsus.pdf',
    category: 'parabolas',
    prompt: `Você é um teólogo e analista de conteúdo bíblico.
Analise este PDF sobre as Parábolas de Jesus e extraia TODAS as parábolas encontradas.
Para cada parábola, retorne um JSON válido com o seguinte formato EXATO:

{
  "category": "parabolas",
  "source": "40 Parábolas de Jesus",
  "total": <número total de parábolas>,
  "items": [
    {
      "title": "Nome da Parábola",
      "reference": "Lucas 15:11-32",
      "book": "Lucas",
      "testament": "NT",
      "historical_context": "Contexto histórico e cultural em 2-3 frases",
      "theological_message": "Mensagem teológica central em 2-3 frases",
      "practical_application": "Aplicação prática para hoje em 2-3 frases",
      "reflection_questions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"],
      "summary": "Resumo de 4-6 frases da parábola completa"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto antes ou depois, sem markdown, sem \`\`\`json.
Extraia TODAS as parábolas do documento, não apenas algumas.`
  },

  milagres: {
    file: '35+Milagres+de+Jesus.pdf',
    category: 'milagres',
    prompt: `Você é um teólogo e analista de conteúdo bíblico.
Analise este PDF sobre os Milagres de Jesus e extraia TODOS os milagres encontrados.
Para cada milagre, retorne um JSON válido com o seguinte formato EXATO:

{
  "category": "milagres",
  "source": "35 Milagres de Jesus",
  "total": <número total de milagres>,
  "items": [
    {
      "title": "Nome do Milagre",
      "reference": "João 2:1-11",
      "book": "João",
      "testament": "NT",
      "miracle_type": "cura|natureza|ressurreicao|expulsao_demonio|outro",
      "historical_context": "Contexto histórico e cultural em 2-3 frases",
      "theological_message": "Significado teológico do milagre em 2-3 frases",
      "practical_application": "Aplicação prática para a fé hoje em 2-3 frases",
      "reflection_questions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"],
      "summary": "Resumo de 4-6 frases do milagre completo"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto antes ou depois, sem markdown, sem \`\`\`json.
Extraia TODOS os milagres do documento.`
  },

  personagens: {
    file: '200+PERSONAGENS+BÍBLICOS.pdf',
    category: 'personagens',
    prompt: `Você é um teólogo e analista de conteúdo bíblico.
Analise este PDF sobre os 200 Personagens Bíblicos e extraia TODOS os personagens encontrados.
Para cada personagem, retorne um JSON válido com o seguinte formato EXATO:

{
  "category": "personagens",
  "source": "200 Personagens Bíblicos",
  "total": <número total de personagens>,
  "items": [
    {
      "title": "Nome do Personagem",
      "reference": "Gênesis 1:1",
      "book": "Gênesis",
      "testament": "AT",
      "period": "Patriarcal|Êxodo|Juízes|Reino Unido|Reino Dividido|Exílio|Retorno|Intertestamentário|NT",
      "historical_context": "Quem foi, época e contexto em 2-3 frases",
      "theological_message": "Papel e lição teológica em 2-3 frases",
      "practical_application": "O que aprendemos com este personagem em 2-3 frases",
      "reflection_questions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"],
      "summary": "Resumo de 4-6 frases sobre a vida e legado do personagem"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto antes ou depois, sem markdown, sem \`\`\`json.
Extraia TODOS os personagens do documento.`
  },

  panorama: {
    file: 'Panorama+Bíblico.pdf',
    category: 'panorama',
    prompt: `Você é um teólogo e analista de conteúdo bíblico.
Analise este PDF do Panorama Bíblico e extraia o panorama de TODOS os livros da Bíblia.
Para cada livro, retorne um JSON válido com o seguinte formato EXATO:

{
  "category": "panorama",
  "source": "Panorama Bíblico",
  "total": 66,
  "items": [
    {
      "title": "Gênesis",
      "reference": "Gênesis",
      "book": "Gênesis",
      "testament": "AT",
      "author": "Moisés",
      "period": "Período histórico aproximado",
      "chapters": 50,
      "genre": "narrativa|lei|poesia|profecia|epistola|apocalipse|evangelho|historia",
      "historical_context": "Contexto histórico do livro em 2-3 frases",
      "theological_message": "Tema e mensagem central do livro em 2-3 frases",
      "practical_application": "Relevância e aplicação para hoje em 2-3 frases",
      "key_verses": ["Gênesis 1:1", "Gênesis 3:15"],
      "reflection_questions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"],
      "summary": "Resumo de 5-7 frases sobre o livro completo"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto antes ou depois, sem markdown, sem \`\`\`json.
Inclua TODOS os 66 livros da Bíblia.`
  },

  quiz: {
    file: '250+quiz+bíblico.pdf',
    category: 'quiz',
    prompt: `Você é um teólogo e analista de conteúdo bíblico.
Analise este PDF com o Quiz Bíblico e extraia TODAS as perguntas e respostas.
Para cada item, retorne um JSON válido com o seguinte formato EXATO:

{
  "category": "quiz",
  "source": "250 Quiz Bíblico",
  "total": <número total de perguntas>,
  "items": [
    {
      "question": "Qual foi o primeiro milagre de Jesus?",
      "answer": "A transformação da água em vinho nas bodas de Caná (João 2:1-11)",
      "reference": "João 2:1-11",
      "difficulty": "facil|medio|dificil",
      "category": "NT|AT|geral|personagens|milagres|parabolas|profecia"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto antes ou depois, sem markdown, sem \`\`\`json.
Extraia TODAS as perguntas do documento.`
  },

  plano_leitura: {
    file: 'Plano de leitura da Bíblia.pdf',
    category: 'plano_leitura',
    prompt: `Você é um teólogo e analista de conteúdo bíblico.
Analise este PDF do Plano de Leitura da Bíblia e extraia todos os dias de leitura.
Para cada dia, retorne um JSON válido com o seguinte formato EXATO:

{
  "category": "plano_leitura",
  "source": "Plano de Leitura da Bíblia",
  "total_days": <total de dias do plano>,
  "plan_title": "Nome do Plano",
  "items": [
    {
      "day_number": 1,
      "passage": "Gênesis 1-2",
      "book": "Gênesis",
      "chapters": "1-2",
      "testament": "AT",
      "theme": "Tema do dia se disponível"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto antes ou depois, sem markdown, sem \`\`\`json.
Extraia TODOS os dias do plano.`
  }
};

// ─── Utilitários ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function log(msg, emoji = '•') {
  console.log(`${emoji} ${msg}`);
}

function logSuccess(msg) { log(msg, '✅'); }
function logError(msg) { log(msg, '❌'); }
function logInfo(msg) { log(msg, '🔵'); }
function logWarn(msg) { log(msg, '⚠️ '); }

// ─── Gemini File API: Upload do PDF ──────────────────────────────────────────
async function uploadPDF(filePath) {
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  
  logInfo(`Fazendo upload do arquivo: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)} MB)...`);

  // Passo 1: Iniciar upload resumable
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
      body: JSON.stringify({
        file: { display_name: fileName }
      })
    }
  );

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`Falha ao iniciar upload: ${err}`);
  }

  // A Gemini File API retorna a URL no header 'location'
  const uploadUrl = initRes.headers.get('location') || initRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('URL de upload não recebida');

  // Passo 2: Fazer upload do arquivo
  const fileBuffer = fs.readFileSync(filePath);
  
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Command': 'upload, finalize',
      'X-Goog-Upload-Offset': '0',
      'Content-Type': 'application/pdf',
      'Content-Length': fileSize,
    },
    body: fileBuffer
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Falha no upload do arquivo: ${err}`);
  }

  const fileData = await uploadRes.json();
  logSuccess(`Upload concluído: ${fileData.file?.name}`);
  
  // Aguardar processamento
  log('Aguardando processamento do PDF pelo Gemini...', '⏳');
  await sleep(5000);
  
  return fileData.file;
}

// ─── Gemini: Geração de conteúdo com PDF ─────────────────────────────────────
async function generateContent(fileUri, mimeType, prompt) {
  logInfo(`Enviando PDF para análise com Gemini ${MODEL}...`);
  
  const res = await fetch(
    `${BASE_URL}/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              file_data: {
                mime_type: mimeType || 'application/pdf',
                file_uri: fileUri
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 65536,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Falha na geração: ${err}`);
  }

  const data = await res.json();
  
  if (data.error) {
    throw new Error(`Erro da API: ${JSON.stringify(data.error)}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Resposta vazia do modelo. Resposta completa: ${JSON.stringify(data).slice(0, 500)}`);
  }

  return text;
}

// ─── Limpar e parsear JSON da resposta ───────────────────────────────────────
function parseJSONResponse(text) {
  // Remover possíveis marcadores de código
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  
  return JSON.parse(cleaned);
}

// ─── Deletar arquivo do Gemini após uso ──────────────────────────────────────
async function deleteFile(fileName) {
  try {
    await fetch(
      `${BASE_URL}/v1beta/${fileName}?key=${GEMINI_API_KEY}`,
      { method: 'DELETE' }
    );
    log(`Arquivo removido dos servidores Gemini: ${fileName}`, '🗑️ ');
  } catch (e) {
    logWarn(`Não foi possível remover o arquivo: ${e.message}`);
  }
}

// ─── Processar um único PDF ───────────────────────────────────────────────────
async function processPDF(key) {
  const config = PDF_CONFIGS[key];
  if (!config) {
    logError(`Configuração não encontrada para: ${key}`);
    logError(`Opções válidas: ${Object.keys(PDF_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  const filePath = path.join(__dirname, config.file);
  
  if (!fs.existsSync(filePath)) {
    logError(`Arquivo não encontrado: ${config.file}`);
    logError(`Caminho tentado: ${filePath}`);
    process.exit(1);
  }

  const outputPath = path.join(OUTPUT_DIR, `${key}.json`);
  
  // Verificar se já foi processado
  if (fs.existsSync(outputPath)) {
    const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    logWarn(`Arquivo ${key}.json já existe com ${existing.total || existing.total_days || '?'} itens.`);
    logWarn(`Delete o arquivo manualmente se quiser reprocessar.`);
    return { skipped: true, key, items: existing.items?.length || 0 };
  }

  console.log('\n' + '═'.repeat(60));
  log(`PROCESSANDO: ${key.toUpperCase()}`, '🚀');
  log(`Arquivo: ${config.file}`);
  console.log('═'.repeat(60));

  let uploadedFile = null;
  
  try {
    // 1. Upload do PDF
    uploadedFile = await uploadPDF(filePath);
    
    // 2. Gerar conteúdo estruturado
    const rawText = await generateContent(
      uploadedFile.uri,
      uploadedFile.mimeType || 'application/pdf',
      config.prompt
    );
    
    logSuccess(`Resposta recebida (${rawText.length} chars). Parseando JSON...`);
    
    // 3. Parsear e validar JSON
    let parsedData;
    try {
      parsedData = parseJSONResponse(rawText);
    } catch (parseErr) {
      logError(`Falha ao parsear JSON: ${parseErr.message}`);
      // Salvar resposta bruta para debug
      const rawPath = path.join(OUTPUT_DIR, `${key}_RAW.txt`);
      fs.writeFileSync(rawPath, rawText, 'utf-8');
      logWarn(`Resposta bruta salva em: ${key}_RAW.txt para inspeção manual`);
      throw parseErr;
    }
    
    // 4. Adicionar metadata de processamento
    parsedData._metadata = {
      processed_at: new Date().toISOString(),
      source_file: config.file,
      model_used: MODEL,
      items_extracted: parsedData.items?.length || parsedData.total_days || 0
    };
    
    // 5. Salvar JSON
    fs.writeFileSync(outputPath, JSON.stringify(parsedData, null, 2), 'utf-8');
    
    const itemCount = parsedData.items?.length || parsedData.total_days || 'N/A';
    logSuccess(`JSON salvo em: base_biblica/${key}.json`);
    logSuccess(`Total de itens extraídos: ${itemCount}`);
    
    return { success: true, key, items: itemCount };
    
  } finally {
    // Sempre limpar o arquivo dos servidores Gemini
    if (uploadedFile?.name) {
      await deleteFile(uploadedFile.name);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Criar diretório de saída
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    logSuccess(`Diretório criado: base_biblica/`);
  }

  const args = process.argv.slice(2);
  const target = args[0] || 'parabolas';

  const startTime = Date.now();
  
  if (target === 'all') {
    log('Modo: EXTRAIR TODOS OS PDFs', '🎯');
    log('Isso pode levar 10-20 minutos. Vá tomar um café ☕');
    console.log('');
    
    const keys = Object.keys(PDF_CONFIGS);
    const results = [];
    
    for (const key of keys) {
      try {
        const result = await processPDF(key);
        results.push(result);
        // Pausa entre PDFs para não sobrecarregar a API
        if (keys.indexOf(key) < keys.length - 1) {
          log('Aguardando 3s antes do próximo PDF...', '⏳');
          await sleep(3000);
        }
      } catch (err) {
        logError(`Falha ao processar ${key}: ${err.message}`);
        results.push({ error: true, key, message: err.message });
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    log('RESUMO FINAL', '📊');
    console.log('═'.repeat(60));
    for (const r of results) {
      if (r.skipped) log(`${r.key}: PULADO (já existe)`, '⏭️ ');
      else if (r.error) logError(`${r.key}: FALHOU - ${r.message}`);
      else logSuccess(`${r.key}: ${r.items} itens extraídos`);
    }
    
  } else {
    // Processar um único PDF
    if (!PDF_CONFIGS[target]) {
      logError(`PDF desconhecido: "${target}"`);
      log(`Opções disponíveis: ${Object.keys(PDF_CONFIGS).join(' | ')}`);
      log('Para processar todos: node extract_ebooks.mjs all');
      process.exit(1);
    }
    
    await processPDF(target);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  logSuccess(`Concluído em ${elapsed}s. Arquivos disponíveis em: base_biblica/`);
}

main().catch(err => {
  logError(`Erro fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});
