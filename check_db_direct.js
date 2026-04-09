const https = require('https');

const SUPABASE_APP_URL = 'priumwdestycikzfcysg.supabase.co';
// A chave Anon ou Service Role que peguei do seu arquivo ".env" agora há pouco
const SECRETA = 'cTHoHWKgbS7pOwUHBYQUBJ60FNWs5FS/po/tD2L9dQOateoBWtoRH0e9qjlXC8BPm/j7YXUXulRj+Q149TYMVw==';

function run() {
  console.log("🕵️‍♂️ DETETIVE: Investigando o cofre do banco de dados...\n");

  const options = {
    hostname: SUPABASE_APP_URL,
    path: '/rest/v1/profiles?select=email,plan,credits_remaining,stripe_customer_id,subscription_status&limit=5',
    method: 'GET',
    headers: {
      'apikey': SECRETA,
      'Authorization': 'Bearer ' + SECRETA
    }
  };

  const req = https.request(options, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      if (res.statusCode >= 400) {
        console.error("❌ ERRO AO LER O BANCO:", res.statusCode, body);
        return;
      }
      
      const profiles = JSON.parse(body);
      console.log("================ RESULTADO NO BANCO DE DADOS ================");
      profiles.forEach(p => {
        console.log(`👤 Email: ${p.email || 'sem email'}`);
        console.log(`💳 Cliente Stripe ID: ${p.stripe_customer_id || 'VAZIO'}`);
        console.log(`🚀 Plano Registrado: ${p.plan}`);
        console.log(`💰 Créditos: ${p.credits_remaining}`);
        console.log(`-------------------------------------------------------------`);
      });
      console.log("\n🧐 MANDAR ESSA CAPTURA PRO SEVERINO/AI IMEDIATAMENTE.");
    });
  });

  req.on('error', error => console.error(error));
  req.end();
}

run();
