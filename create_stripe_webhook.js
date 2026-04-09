const https = require('https');

const STRIPE_SECRET_KEY = 'sk_test_REMOVED_FOR_SECURITY';

function request(method, reqPath, data) {
  return new Promise((resolve, reject) => {
    const dataStr = new URLSearchParams(data).toString();
    const options = {
      hostname: 'api.stripe.com',
      path: '/v1' + reqPath,
      method: method,
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(dataStr)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 400) reject(json.error ? json.error.message : body);
          else resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function main() {
  console.log("⏳ Avisando a Stripe sobre o seu Webhook no Supabase...");
  
  try {
    const endpoint = await request('POST', '/webhook_endpoints', {
      url: 'https://priumwdestycikzfcysg.supabase.co/functions/v1/stripe-webhook',
      'enabled_events[0]': 'checkout.session.completed',
      'enabled_events[1]': 'customer.subscription.created',
      'enabled_events[2]': 'customer.subscription.updated',
      'enabled_events[3]': 'customer.subscription.deleted',
    });

    console.log("\n✅ SUCESSO ABSOLUTO! A Stripe já sabe para onde ligar.");
    console.log("\n🚨 AGORA COPIE A CHAVE ABAIXO (começa com whsec_) 🚨");
    console.log("==================================================");
    console.log(endpoint.secret);
    console.log("==================================================\n");
    console.log("Com ela em mãos, só falta o último comando mágico no seu terminal:");
    console.log("npx supabase secrets set STRIPE_WEBHOOK_SECRET=COLE_A_CHAVE_AQUI\n");

  } catch (error) {
    console.error("❌ Erro ao criar webhook:", error);
  }
}

main();
