/**
 * ============================================
 * ETAPA 3 — Upsert Personagens Ricos no Supabase
 * Palavra Viva | CEA — Centro de Estudos Avançados
 * ============================================
 *
 * Lê: scripts/output/characters_canonical.json
 * Escreve: tabela lw_characters (upsert on conflict 'numero')
 *
 * Uso: node scripts/upsert-characters-etapa3.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// --- Configuração ---
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas.');
  console.error('   Necessário: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  console.error('   (em .env.local ou .env)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Carregar JSON canônico ---
const JSON_PATH = path.resolve(__dirname, 'output', 'characters_canonical.json');

if (!fs.existsSync(JSON_PATH)) {
  console.error('❌ Arquivo não encontrado:', JSON_PATH);
  console.error('   Execute primeiro: node scripts/close-list-etapa2.mjs');
  process.exit(1);
}

const canonical = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const personagens = canonical.personagens;

console.log(`\n📖 Carregados ${personagens.length} personagens de characters_canonical.json\n`);

// --- Mapear JSON → Schema do Supabase ---
function mapToSupabaseRow(p) {
  return {
    numero: p.numero,
    nome: p.nome,
    nome_alternativo: null,
    testamento: p.testamento || 'AT',
    livros_principais: [],
    periodo_historico: p.periodo_historico || null,
    tribo_origem: null,
    cargo_funcao: p.cargo_funcao || 'Personagem Bíblico',
    biografia: p.biografia || p.resumo || 'Conteúdo em desenvolvimento.',
    principais_acoes: [],
    licoes: [],
    conexoes_personagens: [],
    temas: Array.isArray(p.temas) ? p.temas : [],
    versiculo_chave: null,
    // embedding: null — não sobrescrever se já existir
    updated_at: new Date().toISOString(),
  };
}

// --- Upsert em batches ---
const BATCH_SIZE = 20;

async function upsertBatch(batch, batchNum, totalBatches) {
  const rows = batch.map(mapToSupabaseRow);

  const { data, error } = await supabase
    .from('lw_characters')
    .upsert(rows, {
      onConflict: 'numero',
      ignoreDuplicates: false, // atualizar os existentes
    });

  if (error) {
    console.error(`  ❌ Batch ${batchNum}/${totalBatches} FALHOU:`, error.message);
    // Log quais personagens falharam
    const nomes = batch.map(p => p.nome).join(', ');
    console.error(`     Personagens: ${nomes}`);
    return { success: false, count: 0, error: error.message };
  }

  const nomes = batch.map(p => p.nome);
  const primeiro = nomes[0];
  const ultimo = nomes[nomes.length - 1];
  console.log(`  ✅ Batch ${batchNum}/${totalBatches}: ${primeiro} → ${ultimo} (${batch.length} registros)`);
  return { success: true, count: batch.length, error: null };
}

async function main() {
  console.log('='.repeat(55));
  console.log('  ETAPA 3 — Upsert Personagens Ricos no Supabase');
  console.log('='.repeat(55));
  console.log(`  Supabase: ${supabaseUrl.substring(0, 40)}...`);
  console.log(`  Tabela: lw_characters`);
  console.log(`  Registros: ${personagens.length}`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log('='.repeat(55));
  console.log('');

  const totalBatches = Math.ceil(personagens.length / BATCH_SIZE);
  let totalSuccess = 0;
  let totalFailed = 0;
  const errors = [];

  for (let i = 0; i < personagens.length; i += BATCH_SIZE) {
    const batch = personagens.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    const result = await upsertBatch(batch, batchNum, totalBatches);

    if (result.success) {
      totalSuccess += result.count;
    } else {
      totalFailed += batch.length;
      errors.push(result.error);
    }

    // Pausa entre batches para não estrangular a API
    if (i + BATCH_SIZE < personagens.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // --- Relatório final ---
  console.log('');
  console.log('='.repeat(55));
  console.log('  ETAPA 3 — RELATÓRIO FINAL');
  console.log('='.repeat(55));
  console.log(`  ✅ Sucesso: ${totalSuccess} personagens`);
  if (totalFailed > 0) {
    console.log(`  ❌ Falhas: ${totalFailed} personagens`);
    errors.forEach(e => console.log(`     → ${e}`));
  }
  console.log('='.repeat(55));

  // --- Validação pós-upsert ---
  console.log('\n🔍 Validação pós-upsert...');

  const { count, error: countErr } = await supabase
    .from('lw_characters')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('  ❌ Erro ao contar registros:', countErr.message);
  } else {
    console.log(`  📊 Total de registros na tabela lw_characters: ${count}`);
  }

  // Verificar amostra de biografias
  const { data: sample, error: sampleErr } = await supabase
    .from('lw_characters')
    .select('numero, nome, testamento, cargo_funcao, biografia, temas')
    .order('numero', { ascending: true })
    .limit(5);

  if (!sampleErr && sample) {
    console.log('\n  📋 Amostra (5 primeiros):');
    sample.forEach(s => {
      const bioLen = s.biografia ? s.biografia.length : 0;
      const temasStr = s.temas ? s.temas.join(', ') : 'nenhum';
      console.log(`     #${s.numero} ${s.nome} — bio: ${bioLen} chars — temas: [${temasStr}]`);
    });
  }

  // Verificar se algum ficou com biografia genérica
  const { data: generics, error: genErr } = await supabase
    .from('lw_characters')
    .select('nome')
    .or('biografia.is.null,biografia.eq.Conteúdo em desenvolvimento.')
    .limit(10);

  if (!genErr && generics && generics.length > 0) {
    console.log(`\n  ⚠️  ${generics.length} personagens ainda sem biografia rica:`);
    generics.forEach(g => console.log(`     → ${g.nome}`));
  } else {
    console.log('\n  🎉 Todos os personagens possuem biografia rica!');
  }

  console.log('\n✅ ETAPA 3 CONCLUÍDA\n');
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
