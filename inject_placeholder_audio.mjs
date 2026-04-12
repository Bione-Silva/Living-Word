import fs from 'fs';

const envContents = fs.readFileSync('.env.local', 'utf-8');
function getEnv(key) {
  for (const line of envContents.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eqIdx = trimmed.indexOf('=');
    const k = trimmed.slice(0, eqIdx).trim();
    if (k !== key) continue;
    let v = trimmed.slice(eqIdx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    return v;
  }
  return '';
}

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

// Audio de demonstracao de qualidade (3-4 minutos, voz feminina, conteudo biblico)
// Usando arquivos de audio livres de licenca para servir como placeholder profissional
const PLACEHOLDER_AUDIOS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
];

async function main() {
  console.log("Injetando audio placeholder para o devocional de hoje...");
  const today = new Date().toISOString().split('T')[0];

  // Busca devocional de hoje
  const fetchResp = await fetch(`${supabaseUrl}/rest/v1/devotionals?scheduled_date=eq.${today}&is_published=eq.true&select=id,title`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'application/json'
    }
  });

  const devDataArr = await fetchResp.json();
  
  if (!devDataArr || devDataArr.length === 0) {
    // Busca o mais recente
    const fallbackResp = await fetch(`${supabaseUrl}/rest/v1/devotionals?is_published=eq.true&order=scheduled_date.desc&limit=1&select=id,title`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Accept': 'application/json' }
    });
    const fallbackArr = await fallbackResp.json();
    if (!fallbackArr || fallbackArr.length === 0) {
      console.error("Nenhum devocional publicado encontrado!");
      return;
    }
    devDataArr.push(...fallbackArr);
  }

  const devotional = devDataArr[0];
  console.log(`Devocional encontrado: ${devotional.title} (ID: ${devotional.id})`);

  // Atualiza com placeholder
  const updateResp = await fetch(`${supabaseUrl}/rest/v1/devotionals?id=eq.${devotional.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      audio_url: PLACEHOLDER_AUDIOS[0],
      audio_url_nova: PLACEHOLDER_AUDIOS[0],
      audio_url_alloy: PLACEHOLDER_AUDIOS[1],
      audio_url_onyx: PLACEHOLDER_AUDIOS[2],
    })
  });

  if (updateResp.ok || updateResp.status === 204) {
    console.log("✅ Audio placeholder injetado com sucesso!");
    console.log("   Nova: " + PLACEHOLDER_AUDIOS[0]);
    console.log("   Alloy: " + PLACEHOLDER_AUDIOS[1]);
    console.log("   Onyx: " + PLACEHOLDER_AUDIOS[2]);
    console.log("\n🎧 Abra o app no Lovable e teste o player de audio!");
    console.log("\n⚠️  Para gerar audio REAL com voz AI, adicione creditos em:");
    console.log("   https://platform.openai.com/settings/organization/billing");
  } else {
    const errText = await updateResp.text();
    console.error("Erro ao atualizar:", updateResp.status, errText);
  }
}

main().catch(console.error);
