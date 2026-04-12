/**
 * gerar_audio_gemini.mjs
 * Gera áudio TTS usando Gemini 2.5 Flash Preview e injeta no devocional de hoje.
 * Gemini TTS retorna áudio PCM 16-bit 24kHz. O script monta um WAV válido e faz o upload.
 */
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
const geminiKey   = getEnv('GEMINI_API_KEY');

/** Cria um buffer WAV a partir de dados PCM 16-bit 24kHz mono */
function pcmToWav(pcmBuffer) {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBuffer.length;
  const totalSize = 36 + dataSize;

  const wav = Buffer.alloc(44 + dataSize);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(totalSize, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);           // Chunk size
  wav.writeUInt16LE(1, 20);            // PCM format
  wav.writeUInt16LE(numChannels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(blockAlign, 32);
  wav.writeUInt16LE(bitsPerSample, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);
  Buffer.from(pcmBuffer).copy(wav, 44);
  return wav;
}

async function gerarAudioGemini(texto, voiceName) {
  console.log(`  → Chamando Gemini TTS (voz: ${voiceName})...`);
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: texto }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      })
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini TTS erro (${voiceName}): ${err}`);
  }

  const data = await resp.json();
  const b64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64Audio) throw new Error(`Gemini TTS não retornou áudio para voz ${voiceName}`);

  const pcmBuffer = Buffer.from(b64Audio, 'base64');
  return pcmToWav(pcmBuffer);
}

async function uploadAudio(wavBuffer, fileName) {
  // Tenta PUT primeiro (upsert)
  const resp = await fetch(`${supabaseUrl}/storage/v1/object/devotionals-audio/${fileName}`, {
    method: 'PUT',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'audio/wav',
      'x-upsert': 'true'
    },
    body: wavBuffer
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Upload falhou (${fileName}): ${errText}`);
  }
  return `${supabaseUrl}/storage/v1/object/public/devotionals-audio/${fileName}`;
}

async function main() {
  console.log('\n🎙  Gerador de Áudio — Gemini TTS\n');

  console.log('Credenciais:');
  console.log('  SUPABASE_URL:', supabaseUrl ? '✅' : '❌ VAZIO');
  console.log('  SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌ VAZIO');
  console.log('  GEMINI_API_KEY:', geminiKey ? '✅' : '❌ VAZIO');

  // 1. Busca devocional de hoje (ou mais recente)
  const today = new Date().toISOString().split('T')[0];
  console.log(`\nBuscando devocional de hoje (${today})...`);

  let fetchUrl = `${supabaseUrl}/rest/v1/devotionals?scheduled_date=eq.${today}&is_published=eq.true&select=*`;
  let resp = await fetch(fetchUrl, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Accept': 'application/json' }
  });
  let rows = await resp.json();

  if (!rows || rows.length === 0) {
    console.log('  Sem devocional hoje, buscando o mais recente...');
    resp = await fetch(`${supabaseUrl}/rest/v1/devotionals?is_published=eq.true&order=scheduled_date.desc&limit=1&select=*`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Accept': 'application/json' }
    });
    rows = await resp.json();
  }

  if (!rows || rows.length === 0) {
    console.error('❌ Nenhum devocional publicado encontrado!');
    return;
  }

  const devotional = rows[0];
  console.log(`✅ Devocional: "${devotional.title}" (${devotional.scheduled_date})`);

  // 2. Monta o script de áudio
  const script = `
Bem-vindo ao seu momento Devocional. Hoje a nossa reflexão é: ${devotional.title}.

A palavra de Deus diz em ${devotional.anchor_verse}: ${devotional.anchor_verse_text}.

${devotional.body_text}

Reflita hoje: ${devotional.reflection_question}

Vamos orar juntos: ${devotional.closing_prayer}
`.trim();

  // 3. Gera áudio para as 3 vozes (vozes disponíveis no Gemini TTS)
  // Aoede = feminina suave (equivale a nova)
  // Charon = masculino médio (equivale a alloy)
  // Fenrir = masculino profundo (equivale a onyx)
  const voiceMap = [
    { key: 'nova',  geminiVoice: 'Aoede'  },
    { key: 'alloy', geminiVoice: 'Charon' },
    { key: 'onyx',  geminiVoice: 'Fenrir' },
  ];

  const audioUrls = {};
  const dateStr = devotional.scheduled_date;

  for (const { key, geminiVoice } of voiceMap) {
    try {
      const wavBuffer = await gerarAudioGemini(script, geminiVoice);
      const fileName = `devocional_${dateStr}_${key}.wav`;
      console.log(`  Fazendo upload: ${fileName} (${(wavBuffer.length / 1024).toFixed(0)} KB)...`);
      const url = await uploadAudio(wavBuffer, fileName);
      audioUrls[key] = url;
      console.log(`  ✅ ${key}: ${url.slice(0, 80)}...`);
    } catch (err) {
      console.warn(`  ⚠️  Erro na voz ${key}: ${err.message}`);
      audioUrls[key] = null;
    }
  }

  // 4. Atualiza o banco
  console.log('\nAtualizando banco de dados...');
  const updateResp = await fetch(`${supabaseUrl}/rest/v1/devotionals?id=eq.${devotional.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      audio_url:       audioUrls['nova'],
      audio_url_nova:  audioUrls['nova'],
      audio_url_alloy: audioUrls['alloy'],
      audio_url_onyx:  audioUrls['onyx'],
    })
  });

  if (updateResp.ok || updateResp.status === 204) {
    console.log('\n✅ TUDO PRONTO! Áudio Gemini TTS injetado com sucesso!');
    console.log('   Abra o app no Lovable e teste o player!\n');
  } else {
    console.error('❌ Erro ao atualizar banco:', await updateResp.text());
  }
}

main().catch(console.error);
