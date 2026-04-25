import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load variables manually since we are not using dotenv module
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = env['SUPABASE_URL'];
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']; // Using service role key to bypass RLS for uploads

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const bucketName = 'cea_knowledge_base';

const filesToUpload = [
  { file: 'parabolas.pdf', type: 'parabola' },
  { file: 'personagens.pdf', type: 'personagem' },
  { file: 'panorama.pdf', type: 'livro' },
  { file: 'quiz.pdf', type: 'quiz' }
];

async function main() {
  console.log('--- Iniciando Upload e Ingestão do CEA ---');

  // Check if bucket exists, if not, try to create it
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  if (bucketsErr) {
    console.error('Error listing buckets:', bucketsErr);
  } else {
    const bucketExists = buckets.some(b => b.name === bucketName);
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} não encontrado. Criando...`);
      const { error: createErr } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf']
      });
      if (createErr) {
        console.error('Error creating bucket:', createErr);
      } else {
        console.log(`Bucket ${bucketName} criado com sucesso.`);
      }
    } else {
      console.log(`Bucket ${bucketName} já existe.`);
    }
  }

  // Upload files and trigger ingestion
  for (const item of filesToUpload) {
    const filePath = path.join('pdf-decrypted', item.file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    console.log(`\nFazendo upload de ${item.file}...`);
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(bucketName)
      .upload(item.file, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadErr) {
      console.error(`Erro ao fazer upload de ${item.file}:`, uploadErr);
      continue;
    }
    
    console.log(`Upload de ${item.file} concluído. Disparando Edge Function de ingestão...`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/cea-ingest-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env['SUPABASE_ANON_KEY']}`, // Using anon key for function invocation (or service role if needed)
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_path: item.file,
          item_type: item.type,
          force_reingest: true
        })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.error(`Erro na ingestão de ${item.file} (Status ${response.status}):`, errText);
      } else {
        const json = await response.json();
        console.log(`Ingestão de ${item.file} concluída com sucesso:`, json);
      }
    } catch (e) {
      console.error(`Erro ao chamar a Edge Function para ${item.file}:`, e);
    }
  }

  console.log('\n--- Processo finalizado ---');
}

main();
