#!/usr/bin/env node
/**
 * Living Word — PDF Content Ingestion Script
 * BX4 Technology Solutions | Antigravity Layer
 * 
 * Uso: node ingest-bible-content.js [parables|characters|panorama|quiz|all]
 * 
 * Pré-requisitos:
 *   npm install @supabase/supabase-js openai pdf-parse
 *   export SUPABASE_URL=...
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   export OPENAI_API_KEY=...
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================
// EMBEDDING HELPER
// ============================================
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // limite seguro
  });
  return response.data[0].embedding;
}

// ============================================
// PARSER: 40 PARÁBOLAS
// ============================================
async function ingestParables(pdfText) {
  console.log('📖 Iniciando ingestão das 40 Parábolas...');
  
  // Índice das 40 parábolas (extraído do PDF)
  const parablesList = [
    { numero: 1, titulo: "O bom samaritano", referencia: "Lucas 10:30-37", evangelho: "Lucas" },
    { numero: 2, titulo: "A ovelha perdida", referencia: "Lucas 15:4-7", evangelho: "Lucas" },
    { numero: 3, titulo: "A moeda perdida", referencia: "Lucas 15:8-10", evangelho: "Lucas" },
    { numero: 4, titulo: "O filho pródigo", referencia: "Lucas 15:11-32", evangelho: "Lucas" },
    { numero: 5, titulo: "O administrador desonesto", referencia: "Lucas 16:1-8", evangelho: "Lucas" },
    { numero: 6, titulo: "O homem rico e Lázaro", referencia: "Lucas 16:19-31", evangelho: "Lucas" },
    { numero: 7, titulo: "Os servos", referencia: "Lucas 17:7-10", evangelho: "Lucas" },
    { numero: 8, titulo: "A viúva e o juiz", referencia: "Lucas 18:2-5", evangelho: "Lucas" },
    { numero: 9, titulo: "Os talentos", referencia: "Lucas 19:12-27", evangelho: "Lucas" },
    { numero: 10, titulo: "Os lavradores maus", referencia: "Lucas 20:9-16", evangelho: "Lucas" },
    { numero: 11, titulo: "A roupa nova", referencia: "Lucas 5:36", evangelho: "Lucas" },
    { numero: 12, titulo: "O vinho novo", referencia: "Lucas 5:37-38", evangelho: "Lucas" },
    { numero: 13, titulo: "Os dois alicerces", referencia: "Lucas 6:47-49", evangelho: "Lucas" },
    { numero: 14, titulo: "Os dois devedores", referencia: "Lucas 7:41-43", evangelho: "Lucas" },
    { numero: 15, titulo: "O semeador", referencia: "Lucas 8:5-8", evangelho: "Lucas" },
    { numero: 16, titulo: "A lamparina", referencia: "Lucas 8:16-18", evangelho: "Lucas" },
    { numero: 17, titulo: "Os empregados alertas", referencia: "Lucas 12:35-40", evangelho: "Lucas" },
    { numero: 18, titulo: "O amigo persistente", referencia: "Lucas 11:5-8", evangelho: "Lucas" },
    { numero: 19, titulo: "O rico sem juízo", referencia: "Lucas 12:16-21", evangelho: "Lucas" },
    { numero: 20, titulo: "O empregado fiel", referencia: "Lucas 12:42-48", evangelho: "Lucas" },
    { numero: 21, titulo: "A figueira sem figos", referencia: "Lucas 13:6-9", evangelho: "Lucas" },
    { numero: 22, titulo: "A figueira sem folhas", referencia: "Lucas 21:29-31", evangelho: "Lucas" },
    { numero: 23, titulo: "A semente de mostarda", referencia: "Lucas 13:18-19", evangelho: "Lucas" },
    { numero: 24, titulo: "O fermento", referencia: "Lucas 13:20-21", evangelho: "Lucas" },
    { numero: 25, titulo: "Os convidados para festa de casamento", referencia: "Lucas 14:7-14", evangelho: "Lucas" },
    { numero: 26, titulo: "A grande festa", referencia: "Lucas 14:15-24", evangelho: "Lucas" },
    { numero: 27, titulo: "A construção de uma torre", referencia: "Lucas 14:28-33", evangelho: "Lucas" },
    { numero: 28, titulo: "O fariseu e o cobrador de impostos", referencia: "Lucas 18:10-14", evangelho: "Lucas" },
    { numero: 29, titulo: "O retorno do proprietário", referencia: "Marcos 12:1-9", evangelho: "Marcos" },
    { numero: 30, titulo: "A semente que cresce", referencia: "Marcos 4:26-29", evangelho: "Marcos" },
    { numero: 31, titulo: "O joio", referencia: "Mateus 13:24-30", evangelho: "Mateus" },
    { numero: 32, titulo: "O tesouro escondido", referencia: "Mateus 13:44", evangelho: "Mateus" },
    { numero: 33, titulo: "A pérola", referencia: "Mateus 13:45-46", evangelho: "Mateus" },
    { numero: 34, titulo: "A rede", referencia: "Mateus 13:47-48", evangelho: "Mateus" },
    { numero: 35, titulo: "O empregado mau", referencia: "Mateus 18:23-24", evangelho: "Mateus" },
    { numero: 36, titulo: "Os trabalhadores no vinhedo", referencia: "Mateus 20:1-16", evangelho: "Mateus" },
    { numero: 37, titulo: "Os dois filhos", referencia: "Mateus 21:28-31", evangelho: "Mateus" },
    { numero: 38, titulo: "A festa de casamento", referencia: "Mateus 22:2-14", evangelho: "Mateus" },
    { numero: 39, titulo: "As dez virgens", referencia: "Mateus 25:1-13", evangelho: "Mateus" },
    { numero: 40, titulo: "As ovelhas e as cabras", referencia: "Mateus 25:31-36", evangelho: "Mateus" },
  ];

  // Mapeamento de temas por parábola
  const temasMap = {
    1: ["misericordia", "amor_ao_proximo", "preconceito", "ajuda_ao_necessitado"],
    2: ["graca", "busca_de_deus", "alegria_celestial", "arrependimento"],
    3: ["graca", "busca_de_deus", "alegria_celestial"],
    4: ["perdao", "graca", "pai_amoroso", "arrependimento", "restauracao"],
    5: ["mordomia", "astúcia", "riquezas", "fidelidade"],
    6: ["riquezas", "pobreza", "eternidade", "consequencias", "compaixao"],
    7: ["servico", "humildade", "dever"],
    8: ["oracao", "perseveranca", "justica"],
    9: ["mordomia", "talentos", "responsabilidade", "fidelidade"],
    10: ["lideranca", "rejeicao", "heranca", "julgamento"],
    31: ["reino_de_deus", "joao", "bom_e_mau", "julgamento_final"],
    39: ["prontidao", "escatologia", "sabedoria", "virgens"],
    40: ["julgamento", "escatologia", "servico_ao_proximo", "ovelhas_cabras"],
  };

  let inserted = 0;
  let errors = 0;

  for (const parable of parablesList) {
    try {
      // Extrair conteúdo do PDF para esta parábola específica
      // (Em produção, parsear o PDF e extrair o texto de cada parábola)
      const temas = temasMap[parable.numero] || ["estudo_biblico"];
      
      // Texto para gerar embedding
      const embeddingText = `${parable.titulo} ${parable.referencia} ${temas.join(' ')} parabola de Jesus`;
      const embedding = await generateEmbedding(embeddingText);

      const { error } = await supabase.from('lw_parables').upsert({
        numero: parable.numero,
        titulo: parable.titulo,
        referencia: parable.referencia,
        evangelho: parable.evangelho,
        temas,
        embedding,
        // contexto_epoca, mensagem_central, licoes serão populados 
        // pelo enrich-content.js em segundo passo
        mensagem_central: `Estudo da parábola: ${parable.titulo}`,
      }, { onConflict: 'numero' });

      if (error) throw error;
      inserted++;
      console.log(`  ✅ ${parable.numero}. ${parable.titulo}`);
      
      // Rate limit para embeddings
      await sleep(100);
    } catch (err) {
      errors++;
      console.error(`  ❌ Erro em ${parable.titulo}:`, err.message);
    }
  }

  console.log(`\n📊 Parábolas: ${inserted} inseridas, ${errors} erros`);
}

// ============================================
// PARSER: 250 QUIZ
// ============================================
async function ingestQuiz() {
  console.log('\n🎯 Iniciando ingestão do Quiz Bíblico...');

  // Perguntas extraídas do PDF (amostra — script completo teria todas 250)
  const quizData = [
    {
      numero: 1,
      pergunta: "Qual o nome da pessoa com mais idade já mencionada na Bíblia?",
      opcoes: { A: "Noé (Viveu 990 anos)", B: "Enos (Viveu 905 anos)", C: "Matusalém (Viveu 969 anos)", D: "Sem (Viveu 823 anos)" },
      resposta_correta: "C",
      referencia_biblica: "Gênesis 5:27",
      nivel_dificuldade: "basico",
      categoria: "personagens",
      testamento: "AT",
      temas: ["patriarcas", "longevidade"],
    },
    {
      numero: 6,
      pergunta: "Qual o nome da ilha que o Apóstolo João escreveu o livro de Apocalipse?",
      opcoes: { A: "Ilha de Malta", B: "Ilha de Creta", C: "Ilha de Pátmos", D: "Ilha de Pérgamo" },
      resposta_correta: "C",
      referencia_biblica: "Apocalipse 1:9",
      nivel_dificuldade: "intermediario",
      categoria: "geografia",
      testamento: "NT",
      temas: ["apostolo_joao", "apocalipse", "exilio"],
    },
    {
      numero: 11,
      pergunta: "Judas traiu a Jesus por qual valor?",
      opcoes: { A: "10 moedas de ouro", B: "20 moedas de prata", C: "30 moedas de ouro", D: "30 moedas de prata" },
      resposta_correta: "D",
      referencia_biblica: "Mateus 26:15",
      nivel_dificuldade: "basico",
      categoria: "eventos",
      testamento: "NT",
      temas: ["traicao", "judas", "paixao_de_cristo"],
    },
    {
      numero: 15,
      pergunta: "Quantos livros tem a Bíblia protestante?",
      opcoes: { A: "72 Livros", B: "66 Livros", C: "88 Livros", D: "91 Livros" },
      resposta_correta: "B",
      referencia_biblica: "Cânon Bíblico Protestante",
      nivel_dificuldade: "basico",
      categoria: "livros",
      testamento: "geral",
      temas: ["canon_biblico", "introducao_biblica"],
    },
    // ... todas as 250 perguntas seguiriam o mesmo padrão
  ];

  let inserted = 0;

  for (const quiz of quizData) {
    try {
      // Gerar explicação via GPT-4o-mini
      const explicacao = await generateQuizExplanation(quiz);
      
      const { error } = await supabase.from('lw_quiz').upsert({
        ...quiz,
        explicacao,
        fonte: 'pdf_250_quiz',
      }, { onConflict: 'numero' });

      if (error) throw error;
      inserted++;
      await sleep(200);
    } catch (err) {
      console.error(`  ❌ Erro na pergunta ${quiz.numero}:`, err.message);
    }
  }

  console.log(`📊 Quiz: ${inserted} perguntas inseridas`);
}

// ============================================
// GERAR EXPLICAÇÃO COM GPT-4o-mini
// ============================================
async function generateQuizExplanation(quiz) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Explique em 2-3 frases por que a resposta correta para esta pergunta bíblica é "${quiz.opcoes[quiz.resposta_correta]}".
        
Pergunta: ${quiz.pergunta}
Referência: ${quiz.referencia_biblica}

Responda em português, de forma clara e educativa. Inclua contexto bíblico relevante.`
      }]
    });
    return response.choices[0].message.content;
  } catch {
    return `A resposta correta é ${quiz.opcoes[quiz.resposta_correta]}. Referência: ${quiz.referencia_biblica}`;
  }
}

// ============================================
// ENRICH: Adicionar conteúdo do PDF às parábolas
// ============================================
async function enrichParablesFromPDF(pdfText) {
  console.log('\n✨ Enriquecendo parábolas com conteúdo do PDF...');
  
  // Parsear seções do PDF por parábola
  // O PDF segue o padrão: "O bom samaritano\nPARÁBOLAS DE JESUS\nLucas X:X\n..."
  const sections = pdfText.split(/(?=\n[A-ZÁÉÍÓÚ][a-záéíóúãõâêôç ]+\n\nPARÁBOLAS DE JESUS)/);
  
  for (const section of sections) {
    if (!section.includes('PARÁBOLAS DE JESUS')) continue;
    
    // Extrair título da seção
    const titleMatch = section.match(/^([A-ZÁÉÍÓÚ][^\n]+)\n\nPARÁBOLAS DE JESUS/);
    if (!titleMatch) continue;
    
    const titulo = titleMatch[1].trim();
    
    // Usar GPT para extrair campos estruturados
    const structured = await extractStructuredFromSection(titulo, section);
    
    if (structured) {
      await supabase.from('lw_parables')
        .update(structured)
        .eq('titulo', titulo);
    }
  }
}

async function extractStructuredFromSection(titulo, text) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'system',
      content: 'Extraia informações estruturadas do texto de estudo bíblico. Retorne JSON válido.'
    }, {
      role: 'user',
      content: `Texto sobre a parábola "${titulo}":

${text.slice(0, 3000)}

Extraia e retorne um JSON com:
{
  "contexto_epoca": "resumo do contexto histórico em 2-3 frases",
  "conexao_at": "como se conecta ao AT em 1-2 frases",
  "mensagem_central": "mensagem central em 1 frase clara",
  "licoes": ["lição 1", "lição 2", "lição 3"],
  "temas": ["tema1", "tema2", "tema3"]
}`
    }]
  });
  
  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return null;
  }
}

// ============================================
// UTILITIES
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// MAIN
// ============================================
async function main() {
  const target = process.argv[2] || 'all';
  
  console.log('🚀 Living Word — Bible Content Ingestion');
  console.log('=========================================\n');

  if (target === 'quiz' || target === 'all') {
    await ingestQuiz();
  }

  if (target === 'parables' || target === 'all') {
    await ingestParables();
  }

  console.log('\n✅ Ingestão concluída!');
  console.log('\nVerifique no Supabase:');
  console.log('  SELECT COUNT(*) FROM lw_parables;');
  console.log('  SELECT COUNT(*) FROM lw_quiz;');
  console.log('  SELECT COUNT(*) FROM lw_characters;');
  console.log('  SELECT COUNT(*) FROM lw_bible_books;');
}

main().catch(console.error);
