import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente - aceita .env.local caso exista
dotenv.config({ path: path.join(__dirname, '.env.local') });
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

// Se ainda não achou, fallback para as outras variáveis (VITE_XXX se necessário)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ERRO: Faltando SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local/.env");
  console.error("Certifique-se de configurar a chave Service Role (para ignorar RLS) para o seeding de base.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Diretório dos dados
const BASE_DIR = path.join(__dirname, 'base_biblica');

async function getOrCreateLibrary(title, category) {
  // Procura se já existe a library
  let { data: lib, error: errGet } = await supabase
    .from('content_library')
    .select('id, title')
    .eq('title', title)
    .single();

  if (errGet && errGet.code !== 'PGRST116') { // PGRST116 = No rows found
    throw errGet;
  }

  if (!lib) {
    const { data: newLib, error: errInsert } = await supabase
      .from('content_library')
      .insert({
        title: title,
        category: category,
        license_type: 'licensed'
      })
      .select('id, title')
      .single();
    
    if (errInsert) throw errInsert;
    lib = newLib;
    console.log(`[Library] Criada: ${title}`);
  } else {
    console.log(`[Library] Já existente: ${title}`);
  }

  return lib.id;
}

async function processSections(fileName) {
  const filePath = path.join(BASE_DIR, fileName);
  if (!(await fs.stat(filePath).catch(() => false))) {
    console.warn(`Arquivo não encontrado: ${fileName}, pulando...`);
    return;
  }

  const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
  console.log(`\n⏳ Processando: ${data.source} (${data.items.length} itens)...`);

  const libraryId = await getOrCreateLibrary(data.source, data.category);

  // Fazer batch insert
  const BATCH_SIZE = 50;
  for (let i = 0; i < data.items.length; i += BATCH_SIZE) {
    const batch = data.items.slice(i, i + BATCH_SIZE).map(item => ({
      library_id: libraryId,
      title: item.title,
      category: data.category,
      reference: item.reference,
      book: item.book || null,
      testament: item.testament || null,
      historical_context: item.historical_context,
      theological_message: item.theological_message,
      practical_application: item.practical_application,
      reflection_questions: item.reflection_questions,
      summary: item.summary,
      metadata: item.metadata || null
    }));

    const { error } = await supabase.from('content_sections').insert(batch);
    if (error) {
      console.error(`❌ Erro inserindo lote no ${fileName}:`, error.message);
    } else {
      console.log(`   ✅ Inserido lote ${i/BATCH_SIZE + 1} (${batch.length} registros)`);
    }
  }
}

async function processQuiz(fileName) {
  const filePath = path.join(BASE_DIR, fileName);
  if (!(await fs.stat(filePath).catch(() => false))) {
    return;
  }

  const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
  console.log(`\n⏳ Processando Quiz: ${data.source} (${data.items.length} itens)...`);
  const libraryId = await getOrCreateLibrary(data.source, data.category);

  const BATCH_SIZE = 50;
  for (let i = 0; i < data.items.length; i += BATCH_SIZE) {
    const batch = data.items.slice(i, i + BATCH_SIZE).map(item => ({
      library_id: libraryId,
      question: item.question,
      answer: item.answer,
      reference: item.reference || null,
      difficulty: item.difficulty,
      category: item.category
    }));

    const { error } = await supabase.from('quiz_questions').insert(batch);
    if (error) {
      console.error(`❌ Erro inserindo lote Quiz:`, error.message);
    } else {
      console.log(`   ✅ Inserido lote ${i/BATCH_SIZE + 1} (${batch.length} questões)`);
    }
  }
}

async function processReadingPlan(fileName) {
  const filePath = path.join(BASE_DIR, fileName);
  if (!(await fs.stat(filePath).catch(() => false))) {
    return;
  }

  const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
  console.log(`\n⏳ Processando Plano de Leitura: ${data.source} (${data.items.length} dias na base)...`);
  const libraryId = await getOrCreateLibrary(data.source, data.category);

  // Criar Plano
  let { data: plan, error: errPlan } = await supabase
    .from('reading_plans')
    .select('id')
    .eq('library_id', libraryId)
    .single();

  if (errPlan && errPlan.code !== 'PGRST116') {
    throw errPlan;
  }

  if (!plan) {
    const { data: newPlan, error: errInsert } = await supabase
      .from('reading_plans')
      .insert({
        library_id: libraryId,
        title: 'Cronograma Anual',
        description: 'Plano completo lendo todos os dias',
        total_days: 365
      })
      .select('id').single();
    if(errInsert) throw errInsert;
    plan = newPlan;
    console.log(`   ✅ Plano inserido em reading_plans`);
  }

  const BATCH_SIZE = 50;
  for (let i = 0; i < data.items.length; i += BATCH_SIZE) {
    const batch = data.items.slice(i, i + BATCH_SIZE).map(item => ({
      plan_id: plan.id,
      day_number: item.day_number,
      passage: item.passage,
      book: item.book || null,
      chapters: item.chapters || null,
      testament: item.testament || null,
      theme: item.theme || null
    }));

    // Algumas linhas podem ser para o mesmo day_number mas livros diferentes.
    // O UNIQUE na tabela é em plan_id, day_number -- perigoso pois no seu JSON tem multiplos livros para o mesmo dia!
    // Se a restrição UNIQUE(plan_id, day_number) estiver no BD, precisaremos fazer UPSERT agrupando-os
    // ou remover a UNIQUE key ou agrupar os itens por dia antes do insert.
    // Vamos agrupar os dados localmente primeiro e fazer UPSERT.
    
    // Na verdade, o schema (016_) que defini no plano tem: UNIQUE(plan_id, day_number)
    // O JSON tem "passage: Gênesis 1, Salmos 1, Mateus 1" mas com livros variados por entrada.
    // Isso quer dizer que se inserirmos, o UNIQUE constraint em (plan_id, day_number) vai conflitar!
    // A melhor prática é apenas usar a passagem inteira e preencher os dados consolidados,
    // ou alterar a UNIQUE para (plan_id, day_number, book). 
    // Como a passagem já agrupa todos num unico string, vou ignorar inserções duplicadas do mesmo dia usando ON CONFLICT DO NOTHING.
    const { error } = await supabase.from('reading_plan_days').upsert(batch, { onConflict: 'plan_id, day_number', ignoreDuplicates: true });
    
    if (error) {
      console.error(`❌ Erro inserindo lote de dias do Plano:`, error.message);
    } else {
      console.log(`   ✅ Inserido lote dias ${i/BATCH_SIZE + 1} (${batch.length} entradas processadas)`);
    }
  }
}

async function run() {
  console.log("🚀 Iniciando Seeding da Knowledge Base...");
  try {
    await processSections('parabolas.json');
    await processSections('milagres.json');
    await processSections('personagens.json');
    await processSections('panorama.json');
    
    await processQuiz('quiz.json');
    
    await processReadingPlan('plano_leitura.json');

    console.log("\n🎉 Seeding finalizado com sucesso!");
  } catch (error) {
    console.error("\n❌ Falha catastrófica no processo de seeding:", error);
  }
}

run();
