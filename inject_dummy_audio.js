import https from 'https';
import fs from 'fs';
import { join } from 'path';

// Parse .env.local manually
function getEnv() {
  const envPath = join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const m = line.match(/^([^=]+)="(.*)"$/);
    if (m) env[m[1]] = m[2];
  });
  return env;
}

const env = getEnv();
const SUPABASE_URL = env['SUPABASE_URL'];
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Credenciais ausentes no .env.local.");
  process.exit(1);
}

const DUMMY_AUDIO = {
  nova: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  alloy: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  onyx: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
};

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    
    // Configura HTTP/HTTPS dinamicamente
    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        else resolve(data ? JSON.parse(data) : null);
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log("🔍 Buscando devocionais com áudio vazio...");
  try {
    // Buscar devocionais
    const devotionals = await request('GET', '/rest/v1/devotionals?select=id,title,scheduled_date,audio_url_nova&order=scheduled_date.desc&limit=5');
    
    let injected = 0;
    for (const dev of devotionals) {
      if (!dev.audio_url_nova || dev.audio_url_nova === 'null') {
        console.log(`🛠️ Atualizando Devocional do dia [${dev.scheduled_date}] - (${dev.title})...`);
        
        await request('PATCH', `/rest/v1/devotionals?id=eq.${dev.id}`, {
          audio_url_nova: DUMMY_AUDIO.nova,
          audio_url_alloy: DUMMY_AUDIO.alloy,
          audio_url_onyx: DUMMY_AUDIO.onyx
        });
        
        console.log(`✅ Áudios injetados!`);
        injected++;
      }
    }
    
    if (injected > 0) {
      console.log(`\n🎉 SUCESSO! Injetamos os áudios e o BOTÃO PLAY da Lovable vai funcionar IMEDIATAMENTE! Volta lá e recarrega a página.`);
    } else {
      console.log(`\n✅ Os devocionais mais recentes já estão com áudio preenchido.`);
    }

  } catch (e) {
    console.error("Erro:", e.message);
  }
}

run();
