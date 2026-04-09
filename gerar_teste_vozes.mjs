import fs from 'fs';
import https from 'https';

const API_KEY = process.argv[2];

if (!API_KEY || !API_KEY.startsWith('sk-')) {
  console.error('\n❌ ERRO: Você precisa fornecer a sua chave da OpenAI como primeiro argumento.');
  console.error('Exemplo de uso: node gerar_teste_vozes.mjs "sk-proj-xxxxxxxxxxxxxxxxxxx"\n');
  process.exit(1);
}

const DEVOCIONAL_TEXT = `Bom dia. Muitas vezes acordamos com um peso gigantesco sobre os ombros, buscando atalhos para resolver problemas que deveriam ser colocados simplesmente em oração. Deus não trabalha com atalhos, Ele forja o nosso caráter na espera. Lembre-se do que está escrito no Salmo 27: 'Espere no Senhor, seja forte e corajoso'. Hoje não é dia de desistir nem de retroceder. É dia de entregar tudo aquilo que você não consegue controlar, nas mãos Daquele que desenhou o universo e nunca perdeu o poder. Confie no ritmo da paciência divina. Respire fundo, perdoe quem precisa ser perdoado na sua casa hoje, e avance. Que a graça e o cuidado do Pai abracem o seu dia.`;

const voices = ['alloy', 'onyx', 'echo'];

async function generateSpeech(voice) {
  console.log(`🎙️  Gerando áudio com a voz "${voice}" (Aguarde alguns segundos)...`);
  
  const data = JSON.stringify({
    model: 'tts-1',
    voice: voice,
    input: DEVOCIONAL_TEXT,
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/audio/speech',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      // CORREÇÃO CRÍTICA: data.length corta acentos! Usar Buffer.byteLength.
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errorBody = '';
        res.on('data', chunk => errorBody += chunk);
        res.on('end', () => reject(new Error(`Falha na API: ${res.statusCode} - ${errorBody}`)));
        return;
      }
      
      const fileStream = fs.createWriteStream(`teste_voz_${voice}.mp3`);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        console.log(`✅ Salvo: teste_voz_${voice}.mp3`);
        resolve();
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('⏳ Iniciando motor de geração de Devocionais Piloto (1 minuto)...');
    for (const v of voices) {
      await generateSpeech(v);
    }
    console.log('\n🎉 SUCESSO! Os 3 áudios em MP3 foram salvos na sua pasta. Estão prontos para serem testados.');
  } catch (err) {
    console.error('\n❌ Falha na geração (Verifique sua chave ou saldo da OpenAI):', err.message);
  }
})();
