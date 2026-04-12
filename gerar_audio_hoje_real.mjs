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
const openaiKey = getEnv('OPENAI_API_KEY');

async function main() {
  console.log("Iniciando geracao de audio real para o devocional de hoje...");
  const today = new Date().toISOString().split('T')[0];
  
  console.log("SUPABASE_URL:", supabaseUrl ? supabaseUrl.slice(0, 40) + '...' : 'VAZIO!');
  console.log("SERVICE_ROLE_KEY:", supabaseKey ? '[OK - encontrada]' : 'VAZIO!');
  console.log("OPENAI_API_KEY:", openaiKey ? '[OK - encontrada]' : 'VAZIO!');
  
  // 1. Busca devocional de hoje
  console.log(`\nBuscando devocional de hoje (${today})...`);
  const fetchResp = await fetch(`${supabaseUrl}/rest/v1/devotionals?scheduled_date=eq.${today}&is_published=eq.true&select=*`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'application/json'
    }
  });
  
  const rawText = await fetchResp.text();
  console.log("Status Supabase:", fetchResp.status);
  console.log("Resposta bruta:", rawText.slice(0, 400));
  
  let devDataArr;
  try {
    devDataArr = JSON.parse(rawText);
  } catch {
    console.error("Erro ao parsear resposta. Saindo.");
    return;
  }
  
  if (!devDataArr || devDataArr.length === 0) {
    // Tenta sem filtro de data, pega o mais recente
    console.log("Sem devocional hoje. Buscando o mais recente publicado...");
    const fallbackResp = await fetch(`${supabaseUrl}/rest/v1/devotionals?is_published=eq.true&order=scheduled_date.desc&limit=1&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      }
    });
    const fallbackText = await fallbackResp.text();
    console.log("Fallback:", fallbackText.slice(0, 300));
    devDataArr = JSON.parse(fallbackText);
    if (!devDataArr || devDataArr.length === 0) {
      console.error("Nenhum devocional publicado encontrado no banco!");
      return;
    }
    console.log("Usando devocional mais recente como fallback...");
  }
  
  const devotional = devDataArr[0];
  console.log(`Devocional encontrado: ${devotional.title}`);
  
  const scriptParaAudio = `
    Bem-vindo ao seu momento Devocional. Hoje a nossa reflexão é: ${devotional.title}.
    A palavra diz em ${devotional.anchor_verse}: ${devotional.anchor_verse_text}.
    
    ${devotional.body_text}
    
    Para sua reflexão hoje: ${devotional.reflection_question}
    
    Vamos orar: ${devotional.closing_prayer}
  `.trim();

  // 2. TTS OpenAI
  console.log("Gerando TTS na OpenAI usando a voz 'nova'...");
  const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'tts-1',
      input: scriptParaAudio,
      voice: 'nova',
      response_format: 'mp3'
    })
  });
  
  if (!ttsResponse.ok) {
    console.error("OpenAI Error:", await ttsResponse.text());
    return;
  }
  const audioBuffer = await ttsResponse.arrayBuffer();
  
  // 3. Upload Supabase Storage
  const fileName = `devocional_${today}_nova_real.mp3`;
  console.log(`Fazendo upload do audio ${fileName}...`);
  
  const uploadResp = await fetch(`${supabaseUrl}/storage/v1/object/devotionals-audio/${fileName}`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'audio/mpeg'
    },
    body: Buffer.from(audioBuffer)
  });
  
  if (!uploadResp.ok) {
    // try PUT (upsert)
    const putResp = await fetch(`${supabaseUrl}/storage/v1/object/devotionals-audio/${fileName}`, {
      method: 'PUT',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'audio/mpeg'
      },
      body: Buffer.from(audioBuffer)
    });
    if (!putResp.ok) {
      console.error("Upload error:", await putResp.text());
      return;
    }
  }

  const audioUrl = `${supabaseUrl}/storage/v1/object/public/devotionals-audio/${fileName}`;
  console.log("Upload completo. URL:", audioUrl);
  
  // 4. Update Devotional
  console.log("Atualizando o banco de dados...");
  const updateResp = await fetch(`${supabaseUrl}/rest/v1/devotionals?id=eq.${devotional.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ 
      audio_url: audioUrl,
      audio_url_nova: audioUrl,
      audio_url_alloy: audioUrl,
      audio_url_onyx: audioUrl
    })
  });
  
  if (!updateResp.ok) {
    console.error("Update DB error:", await updateResp.text());
    return;
  }
  
  console.log("✅ Tudo pronto! Áudio real injetado!");
}

main().catch(console.error);
