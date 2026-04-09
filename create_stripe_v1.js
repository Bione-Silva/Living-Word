const https = require('https');
const STRIPE_SECRET_KEY = 'sk_test_REMOVED_FOR_SECURITY';

const plans = [
  {
    key: 'starter',
    name: 'Living Word V1 - Plano Starter',
    prices: [
      { id: 'brl', currency: 'brl', amount: 1900 },
      { id: 'usd', currency: 'usd', amount: 990 },
      { id: 'latam', currency: 'usd', amount: 590 }
    ],
    annualPrices: [
      { id: 'brl', currency: 'brl', amount: 19000 },
      { id: 'usd', currency: 'usd', amount: 9900 },
      { id: 'latam', currency: 'usd', amount: 5900 }
    ]
  },
  {
    key: 'pro',
    name: 'Living Word V1 - Plano Pro',
    prices: [
      { id: 'brl', currency: 'brl', amount: 4900 },
      { id: 'usd', currency: 'usd', amount: 2990 },
      { id: 'latam', currency: 'usd', amount: 1900 }
    ],
    annualPrices: [
      { id: 'brl', currency: 'brl', amount: 49000 },
      { id: 'usd', currency: 'usd', amount: 29900 },
      { id: 'latam', currency: 'usd', amount: 19000 }
    ]
  },
  {
    key: 'igreja',
    name: 'Living Word V1 - Plano Igreja',
    prices: [
      { id: 'brl', currency: 'brl', amount: 9700 },
      { id: 'usd', currency: 'usd', amount: 7990 },
      { id: 'latam', currency: 'usd', amount: 4900 }
    ],
    annualPrices: [
      { id: 'brl', currency: 'brl', amount: 97000 },
      { id: 'usd', currency: 'usd', amount: 79900 },
      { id: 'latam', currency: 'usd', amount: 49000 }
    ]
  },
  {
    key: 'addon',
    name: 'Living Word V1 - Assento Extra',
    prices: [
      { id: 'brl', currency: 'brl', amount: 900 },
      { id: 'usd', currency: 'usd', amount: 590 },
      { id: 'latam', currency: 'usd', amount: 390 }
    ],
    annualPrices: [
      { id: 'brl', currency: 'brl', amount: 9000 },
      { id: 'usd', currency: 'usd', amount: 5900 },
      { id: 'latam', currency: 'usd', amount: 3900 }
    ]
  }
];

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
  console.log('| Produto | Mensal | Anual |');
  console.log('|---|---|---|');
  const results = {};

  try {
    for (const plan of plans) {
      console.log(`⏳ Criando produto: ${plan.name}...`);
      const product = await request('POST', '/products', {
        name: plan.name,
        description: `Plano ${plan.key.toUpperCase()} - Arquitetura V1.0`
      });

      results[plan.key] = { monthly: {}, annual: {} };

      for (const priceDef of plan.prices) {
        const price = await request('POST', '/prices', {
          product: product.id,
          currency: priceDef.currency,
          unit_amount: priceDef.amount,
          'recurring[interval]': 'month'
        });
        results[plan.key].monthly[priceDef.id] = price.id;
      }

      for (const priceDef of plan.annualPrices) {
        const price = await request('POST', '/prices', {
          product: product.id,
          currency: priceDef.currency,
          unit_amount: priceDef.amount,
          'recurring[interval]': 'year'
        });
        results[plan.key].annual[priceDef.id] = price.id;
      }
      
      console.log(`✅ Produto ${plan.name} conectado com sucesso!`);
    }

    console.log('\\n\\n============= EVIDÊNCIA DE CRIAÇÃO (IDS DO STRIPE V1.0) =============\\n');
    console.log(JSON.stringify(results, null, 2));
    console.log('\\n=====================================================================\\n');
  } catch(e) {
    console.error('❌ Ocorreu um erro na requisição à API Stripe:', e);
  }
}

run();
