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
        'Content-Length': dataStr.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 400) reject(json.error ? json.error.message : body);
          else resolve(json);
        } catch(e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function run() {
  const results = {};

  try {
    // 1. Create SEAT Product (Recurring)
    console.log(`⏳ Criando produto: Assento Extra...`);
    const seatProduct = await request('POST', '/products', {
      name: 'Living Word - Assento Extra (Plano Igreja)',
      description: `Membro extra recorrente na carteira da igreja`
    });

    results['seat'] = { monthly: {}, annual: {} };
    
    // Seat Monthly
    const seatBrlMonthly = await request('POST', '/prices', {
      product: seatProduct.id,
      currency: 'brl',
      unit_amount: 1990,
      'recurring[interval]': 'month'
    });
    results['seat'].monthly['brl'] = seatBrlMonthly.id;

    const seatUsdMonthly = await request('POST', '/prices', {
      product: seatProduct.id,
      currency: 'usd',
      unit_amount: 1000,
      'recurring[interval]': 'month'
    });
    results['seat'].monthly['usd'] = seatUsdMonthly.id;

    // Seat Annual (10x for 2 free months)
    const seatBrlAnnual = await request('POST', '/prices', {
      product: seatProduct.id,
      currency: 'brl',
      unit_amount: 19900,
      'recurring[interval]': 'year'
    });
    results['seat'].annual['brl'] = seatBrlAnnual.id;

    const seatUsdAnnual = await request('POST', '/prices', {
      product: seatProduct.id,
      currency: 'usd',
      unit_amount: 10000,
      'recurring[interval]': 'year'
    });
    results['seat'].annual['usd'] = seatUsdAnnual.id;

    
    // 2. Create TOP-UP Product (One-Time)
    console.log(`⏳ Criando produto: Recarga Avulsa...`);
    const topupProduct = await request('POST', '/products', {
      name: 'Living Word - Recarga Imediata (+4k Créditos)',
      description: `Recarga avulsa de 4.000 créditos (sem renovação automática)`
    });

    results['topup'] = { onetime: {} };

    // Top-Up One-time BRL
    const topupBrl = await request('POST', '/prices', {
      product: topupProduct.id,
      currency: 'brl',
      unit_amount: 2700
      // No recurring property, making it one-time
    });
    results['topup'].onetime['brl'] = topupBrl.id;

    // Top-Up One-time USD
    const topupUsd = await request('POST', '/prices', {
      product: topupProduct.id,
      currency: 'usd',
      unit_amount: 700
      // No recurring property, making it one-time
    });
    results['topup'].onetime['usd'] = topupUsd.id;

    console.log('\n\n============= EVIDÊNCIA DE CRIAÇÃO (ADDONS) =============\n');
    console.log(JSON.stringify(results, null, 2));
    console.log('\n=======================================================\n');

  } catch(e) {
    console.error('❌ Erro Stripe:', e);
  }
}

run();
