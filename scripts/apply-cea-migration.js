#!/usr/bin/env node
// apply-cea-migration.js
// Aplica as migrations CEA via Supabase Management API

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'priumwdestycikzfcysg';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI';

// Migrations a aplicar em ordem
const MIGRATIONS = [
  path.join(__dirname, '../files (2)/lw_bible_content_migration.sql'),
  path.join(__dirname, '../supabase/migrations/20260422_cea_rag_complement.sql'),
];

function execSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Usa pg diretamente via connection string se disponível
async function runMigrations() {
  console.log('=== Aplicando Migrations CEA ===\n');
  
  // Verificar via pg
  let { Client } = {};
  try {
    ({ Client } = require('pg'));
  } catch (e) {
    console.log('⚠️  pg não instalado, instalando...');
    require('child_process').execSync('npm install pg --no-save', { stdio: 'inherit' });
    ({ Client } = require('pg'));
  }

  // Connection string usando service_role key como senha não funciona — usar URL de conexão direta
  // O Supabase permite conexão direta via pooler
  const DB_URL = `postgresql://postgres.${PROJECT_REF}:${process.env.DB_PASSWORD || 'REPLACEME'}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  
  console.log('Nota: Para aplicar migrations diretamente, use o Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/priumwdestycikzfcysg/editor\n');
  
  for (const migrationFile of MIGRATIONS) {
    if (!fs.existsSync(migrationFile)) {
      console.log(`⚠️  Arquivo não encontrado: ${migrationFile}`);
      continue;
    }
    const sql = fs.readFileSync(migrationFile, 'utf8');
    const fileName = path.basename(migrationFile);
    console.log(`📄 ${fileName}`);
    console.log('--- INÍCIO SQL ---');
    console.log(sql.substring(0, 200) + '...');
    console.log('--- Para aplicar, cole o conteúdo completo no SQL Editor ---\n');
  }
  
  console.log('\n=== Links diretos para aplicar ===');
  console.log('SQL Editor: https://supabase.com/dashboard/project/priumwdestycikzfcysg/editor');
  console.log('Functions:  https://supabase.com/dashboard/project/priumwdestycikzfcysg/functions');
  console.log('Storage:    https://supabase.com/dashboard/project/priumwdestycikzfcysg/storage');
}

runMigrations().catch(console.error);
