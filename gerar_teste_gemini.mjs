import fs from 'fs';
import https from 'https';

const GEMINI_API_KEY = "AIzaSyCS5U6lQitZmkhILX8jHUYg1rbr4OvbKlM";

const DEVOCIONAL_TEXT = `Bom dia. Muitas vezes acordamos com um peso gigantesco sobre os ombros, buscando atalhos para resolver problemas que deveriam ser colocados simplesmente em oração. Deus não trabalha com atalhos, Ele forja o nosso caráter na espera. 
Lembre-se do que está escrito no Salmo 27: 'Espere no Senhor, seja forte e corajoso'. 
Hoje não é dia de desistir nem de retroceder. É dia de entregar tudo aquilo que você não consegue controlar, nas mãos Daquele que desenhou o universo e nunca perdeu o poder. 
Confie no ritmo da paciência divina. Respire fundo, perdoe quem precisa ser perdoado na sua casa hoje, e avance. Que a graça e o cuidado do Pai abracem o seu dia.`;

const voices = ['Puck', 'Charon', 'Fenrir'];

async function generateGeminiSpeech(voice) {
  console.log(`🎙️  Gerando áudio com a voz Gemini "${voice}" (Aguarde alguns segundos)...`);
  
  const payload = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [
        { text: "Por favor, narre este devocional exatamente como escrito, usando uma entonação acolhedora e pastoral: " + DEVOCIONAL_TEXT }
      ]
    }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice
          }
        }
      }
    }
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    // O modelo -exp foi deprecado/renomeado. Use gemini-2.0-flash ou gemini-2.5-flash para audio modals
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Falha na API: ${res.statusCode} - ${data}`));
          return;
        }
        
        try {
          const responseJson = JSON.parse(data);
          let audioBase64 = null;
          
          if (responseJson.candidates && responseJson.candidates[0].content.parts) {
             const parts = responseJson.candidates[0].content.parts;
             for (const part of parts) {
               if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                 audioBase64 = part.inlineData.data;
                 break;
               }
             }
          }

          if (!audioBase64) {
             reject(new Error(`Nenhum áudio retornado pelo Gemini para a voz ${voice}`));
             return;
          }

          const fileBuffer = Buffer.from(audioBase64, 'base64');
          fs.writeFileSync(`teste_voz_gemini_${voice}.wav`, fileBuffer);
          console.log(`✅ Salvo: teste_voz_gemini_${voice}.wav`);
          resolve();
        } catch (e) {
          reject(new Error(`Erro ao interpretar resposta: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  try {
    console.log('⏳ Iniciando motor Gemini 2.0 (Puck, Charon e Fenrir)...');
    for (const v of voices) {
      await generateGeminiSpeech(v);
    }
    console.log('\n🎉 SUCESSO! Os 3 áudios (WAV) do Gemini foram salvos na sua pasta. Estão prontos para serem ouvidos.');
  } catch (err) {
    console.error('\n❌ Falha na geração Gemini:', err.message);
  }
})();
