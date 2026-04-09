#!/usr/bin/env node
// run_migration_014.js — Executa migration 014 via Supabase Management API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'priumwdestycikzfcysg';
const ACCESS_TOKEN = 'sbp_731e6b92e13d0842c91aca79821b39489a176e93';
const SQL_FILE = path.join(__dirname, 'supabase/migrations/014_livingword_v2_fase1.sql');

const sql = fs.readFileSync(SQL_FILE, 'utf-8');

console.log('🗄️  Executando Migration 014 — Living Word v2 Fase 1...\n');

const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  }
);

const body = await response.text();

if (response.ok) {
  console.log('✅ Migration 014 executada com sucesso!');
  console.log('\nTabelas criadas / atualizadas:');
  console.log('  ✓ devotionals');
  console.log('  ✓ user_devotional_progress');
  console.log('  ✓ bible_streaks');
  console.log('  ✓ bible_texts');
  console.log('  ✓ emotional_support_logs');
  console.log('  ✓ profiles.quiz_score (coluna add)');
  console.log('\nRLS ativado em todas as tabelas.');
  console.log('RPC get_user_daily_usage criado.\n');
} else {
  console.error(`❌ Erro HTTP ${response.status}`);
  console.error(body);
  console.log('\n👉 Alternativa: cole o SQL manualmente no Supabase SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
}
