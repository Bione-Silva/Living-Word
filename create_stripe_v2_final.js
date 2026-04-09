const https = require('https');
const fs = require('fs');
const path = require('path');

const STRIPE_SECRET_KEY = 'sk_test_REMOVED_FOR_SECURITY';

const plansData = [
  {
    key: 'starter',
    name: 'Living Word V1.0 - Plano Starter',
    prices: [
      { id: 'brl', currency: 'brl', amount: 3700 },
      { id: 'usd', currency: 'usd', amount: 990 }
    ],
    annualPrices: [
      { id: 'brl', currency: 'brl', amount: 37000 },
      { id: 'usd', currency: 'usd', amount: 9900 }
    ]
  },
  {
    key: 'pro',
    name: 'Living Word V1.0 - Plano Pro',
    prices: [
      { id: 'brl', currency: 'brl', amount: 7900 },
      { id: 'usd', currency: 'usd', amount: 2990 }
    ],
    annualPrices: [
      { id: 'brl', currency: 'brl', amount: 79000 },
      { id: 'usd', currency: 'usd', amount: 29900 }
    ]
  },
  {
    key: 'igreja',
    name: 'Living Word V1.0 - Plano Igreja',
    prices: [
      { id: 'brl', currency: 'brl', amount: 19700 },
      { id: 'usd', currency: 'usd', amount: 7990 }
    ],
    annualPrices: [
      { id: 'brl', currency: 'brl', amount: 197000 },
      { id: 'usd', currency: 'usd', amount: 79900 }
    ]
  },
  {
    key: 'addon_seat',
    name: 'Living Word V1.0 - Assento Extra (Seat)',
    prices: [
      { id: 'brl', currency: 'brl', amount: 1990 },
      { id: 'usd', currency: 'usd', amount: 1000 }
    ],
    annualPrices: [
      { id: 'brl', currency: 'brl', amount: 19900 },
      { id: 'usd', currency: 'usd', amount: 10000 }
    ]
  },
  {
    key: 'addon_topup',
    name: 'Living Word V1.0 - Recarga Avulsa (+4k)',
    prices: [
      { id: 'brl', currency: 'brl', amount: 2700 },
      { id: 'usd', currency: 'usd', amount: 700 }
    ],
    annualPrices: [] // ONE-TIME PAYMENT (no annual options)
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
  const finalIds = {
    BRL: { monthly: {}, annual: {}, addons: {} },
    USD: { monthly: {}, annual: {}, addons: {} }
  };

  try {
    for (const plan of plansData) {
      console.log(`⏳ Criando produto: ${plan.name}...`);
      const product = await request('POST', '/products', {
        name: plan.name,
        description: `Arquitetura Financeira Oficial V1.0`
      });

      // Handle Monthly / One-Time Prices
      for (const priceDef of plan.prices) {
        const payload = {
          product: product.id,
          currency: priceDef.currency,
          unit_amount: priceDef.amount
        };
        
        // Add recurring only if it's not the topup
        if (plan.key !== 'addon_topup') {
          payload['recurring[interval]'] = 'month';
        }

        const price = await request('POST', '/prices', payload);
        const cur = priceDef.id.toUpperCase();
        
        if (plan.key.startsWith('addon_')) {
          finalIds[cur].addons[plan.key] = price.id;
        } else {
          finalIds[cur].monthly[plan.key] = price.id;
        }
      }

      // Handle Annual Prices
      for (const priceDef of plan.annualPrices) {
        const price = await request('POST', '/prices', {
          product: product.id,
          currency: priceDef.currency,
          unit_amount: priceDef.amount,
          'recurring[interval]': 'year'
        });
        const cur = priceDef.id.toUpperCase();
        if (plan.key.startsWith('addon_')) {
          finalIds[cur].addons[`${plan.key}_annual`] = price.id;
        } else {
          finalIds[cur].annual[plan.key] = price.id;
        }
      }
      console.log(`✅ Produto ${plan.name} finalizado!`);
    }

    console.log('\n\n============= SUCESSO: IDs GERADOS =============\n');
    console.log(JSON.stringify(finalIds, null, 2));

    // Agora, injetar magicamente no arquivo Markdown do usuário
    const markdownPath = path.join(__dirname, 'LOVABLE_PROMPT_STRIPE_IDS_FINAL.md');
    
    let mdContent = `
# Atualização Final de Preços (Produção V1.0)

Lovable, a infraestrutura do Stripe foi finalizada com sucesso. 
Todos os planos antigos foram descartados e agora a **Arquitetura Financeira V1.0** está viva.

Por favor, atualize o arquivo **\`src/utils/geoPricing.ts\`** com a matriz de preços oficiais gerada pelo backend:

\`\`\`typescript
// src/utils/geoPricing.ts

export const GEO_PRICING = {
  BRL: {
    currency: 'BRL',
    symbol: 'R$',
    plans: {
      starter: { id: '${finalIds.BRL.monthly.starter}', amount: 37.00 },
      pro:     { id: '${finalIds.BRL.monthly.pro}', amount: 79.00 },
      igreja:  { id: '${finalIds.BRL.monthly.igreja}', amount: 197.00 },
    },
    annual: {
      starter: { id: '${finalIds.BRL.annual.starter}', amount: 370.00 },
      pro:     { id: '${finalIds.BRL.annual.pro}', amount: 790.00 },
      igreja:  { id: '${finalIds.BRL.annual.igreja}', amount: 1970.00 },
    },
    addon_seat: { id: '${finalIds.BRL.addons.addon_seat}', amount: 19.90 },
    addon_topup: { id: '${finalIds.BRL.addons.addon_topup}', amount: 27.00 },
  },
  
  USD: {
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: '${finalIds.USD.monthly.starter}', amount: 9.90 },
      pro:     { id: '${finalIds.USD.monthly.pro}', amount: 29.90 },
      igreja:  { id: '${finalIds.USD.monthly.igreja}', amount: 79.90 },
    },
    annual: {
      starter: { id: '${finalIds.USD.annual.starter}', amount: 99.00 },
      pro:     { id: '${finalIds.USD.annual.pro}', amount: 299.00 },
      igreja:  { id: '${finalIds.USD.annual.igreja}', amount: 799.00 },
    },
    addon_seat: { id: '${finalIds.USD.addons.addon_seat}', amount: 10.00 },
    addon_topup: { id: '${finalIds.USD.addons.addon_topup}', amount: 7.00 },
  },
};
\`\`\`

**Contexto adicional para você, Lovable:**
1. A tabela \`plan_config\` também precisa refletir esses novos IDs no banco de dados.
2. A Edge Function \`stripe-webhook\` deve ser revisada para garantir que o \`addon_topup\` apenas conceda +4000 créditos (One-Time Payment, sem alterar hierarquia de plano) e o \`addon_seat\` incremente o limite de usuários do tenant da Igreja.
3. Não esqueça do Slider de seats na tela de Igreja e do botão de Recarga!
`;

    fs.writeFileSync(markdownPath, mdContent, 'utf-8');
    console.log(`\n✅ O arquivo LOVABLE_PROMPT_STRIPE_IDS_FINAL.md foi automaticamente reescrito com os novos IDs reais!`);

  } catch(e) {
    console.error('\n❌ ERRO FATAL STRIPE (Sua internet ou DNS caiu?):', e.message);
    console.log('Rode este script novamente quando a internet normalizar.');
  }
}

run();
