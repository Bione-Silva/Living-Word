const https = require('https');
const fs = require('fs');
const path = require('path');

// ⚠️ CHEFE: COLE SUA CHAVE DO STRIPE AQUI (sk_test_REMOVED_FOR_SECURITY... ou sk_live_...)
const STRIPE_SECRET_KEY = 'sk_test_REMOVED_FOR_SECURITY';

const CREDITS_TS_PATH = path.join(__dirname, 'supabase', 'functions', 'common', 'credits.ts');

const plans = [
  {
    key: 'starter',
    name: 'Living Word - Plano Starter',
    prices: [
      { id: 'brl', currency: 'brl', amount: 1900 },
      { id: 'usd', currency: 'usd', amount: 990 },
      { id: 'latam', currency: 'usd', amount: 590 },
      { id: 'test', currency: 'usd', amount: 100 }  // Teste de $1.00
    ]
  },
  {
    key: 'pro',
    name: 'Living Word - Plano Pro',
    prices: [
      { id: 'brl', currency: 'brl', amount: 4900 },
      { id: 'usd', currency: 'usd', amount: 2990 },
      { id: 'latam', currency: 'usd', amount: 1900 },
      { id: 'test', currency: 'usd', amount: 100 }  // Teste de $1.00
    ]
  },
  {
    key: 'church',
    name: 'Living Word - Plano Igreja',
    prices: [
      { id: 'brl', currency: 'brl', amount: 9700 },
      { id: 'usd', currency: 'usd', amount: 7990 },
      { id: 'latam', currency: 'usd', amount: 4900 },
      { id: 'test', currency: 'usd', amount: 100 }  // Teste de $1.00
    ]
  },
  {
    key: 'addon',
    name: 'Living Word - Assento Extra (Igreja)',
    prices: [
      { id: 'brl', currency: 'brl', amount: 900 },
      { id: 'usd', currency: 'usd', amount: 590 },
      { id: 'latam', currency: 'usd', amount: 390 },
      { id: 'test', currency: 'usd', amount: 100 }  // Teste de $1.00
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

function generateCreditsFileContent(priceMappings) {
  return `/**
 * Living Word — Credits Engine (Geo Pricing)
 * 
 * Motor centralizado de créditos, limitadores e roteamento de IA.
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export const PLAN_CREDITS: Record<string, number> = {
  free: 500,
  starter: 2000,
  pro: 8000,
  church: 10000,
}

export const GENERATION_COSTS: Record<string, number> = {
  sermon: 20, study: 30, devotional: 10, post: 5,
  outline: 15, reels: 10, bilingual: 25, cell: 15,
}

export const RATE_LIMITS: Record<string, { per_minute: number; per_day: number }> = {
  free:    { per_minute: 2,  per_day: 10  },
  starter: { per_minute: 5,  per_day: 50  },
  pro:     { per_minute: 10, per_day: 200 },
  church:  { per_minute: 15, per_day: 500 },
}

const MODEL_ROUTING: Record<string, Record<string, string>> = {
  free: {
    post: "gemini-2.5-flash", devotional: "gemini-2.5-flash", outline: "gemini-2.5-flash",
    reels: "gemini-2.5-flash", cell: "gemini-2.5-flash", sermon: "gemini-2.5-flash",
    study: "gemini-2.5-flash", bilingual: "gemini-2.5-flash",
  },
  starter: {
    post: "gpt-4o-mini", devotional: "gpt-4o-mini", outline: "gpt-4o-mini",
    reels: "gpt-4o-mini", cell: "gpt-4o-mini", sermon: "gpt-4o",
    study: "gpt-4o", bilingual: "gpt-4o",
  },
  pro: {
    post: "gpt-4o-mini", devotional: "gpt-4o", outline: "gpt-4o",
    reels: "gpt-4o-mini", cell: "gpt-4o-mini", sermon: "gpt-4o",
    study: "gpt-4o", bilingual: "gpt-4o",
  },
  church: {
    post: "gpt-4o-mini", devotional: "gpt-4o", outline: "gpt-4o",
    reels: "gpt-4o-mini", cell: "gpt-4o-mini", sermon: "gpt-4o",
    study: "gpt-4o", bilingual: "gpt-4o",
  },
}

// Mapeamento Regional (Geo Pricing)
export const STRIPE_PRICE_TO_PLAN: Record<string, string> = {
  // --- Starter ---
  "${priceMappings.starter.brl}": "starter",
  "${priceMappings.starter.usd}": "starter",
  "${priceMappings.starter.latam}": "starter",
  // --- Pro ---
  "${priceMappings.pro.brl}": "pro",
  "${priceMappings.pro.usd}": "pro",
  "${priceMappings.pro.latam}": "pro",
  // --- Igreja ---
  "${priceMappings.church.brl}": "church",
  "${priceMappings.church.usd}": "church",
  "${priceMappings.church.latam}": "church",
}

export const STRIPE_ADDON_PRICE_IDS = [
  "${priceMappings.addon.brl}",
  "${priceMappings.addon.usd}",
  "${priceMappings.addon.latam}",
]

// ============================================================
// Funções Principais
// ============================================================

export function calculateTotalCost(outputModes: string[]): number {
  return outputModes.reduce((total, mode) => total + (GENERATION_COSTS[mode] ?? 10), 0)
}

export function getGenerationCost(type: string): number {
  return GENERATION_COSTS[type] ?? 10
}

export function calculateTotalCredits(plan: string, extraSeats: number = 0): number {
  const base = PLAN_CREDITS[plan] ?? 500
  if (plan === "church" && extraSeats > 0) return base + Math.floor(base * 0.10 * extraSeats)
  return base
}

export function selectAIModel(plan: string, generationType: string): string {
  const planRouting = MODEL_ROUTING[plan] ?? MODEL_ROUTING.free
  return planRouting[generationType] ?? planRouting.sermon ?? "gemini-2.5-flash"
}

export function isGeminiModel(model: string): boolean {
  return model.startsWith("gemini")
}

export async function checkRateLimit(
  adminClient: SupabaseClient,
  userId: string,
  plan: string,
  endpoint: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number; error?: string }> {
  const limits = RATE_LIMITS[plan] ?? RATE_LIMITS.free
  const now = new Date()

  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString()
  const { count: minuteCount } = await adminClient
    .from("rate_limit_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneMinuteAgo)

  if ((minuteCount ?? 0) >= limits.per_minute) {
    return { allowed: false, retryAfterSeconds: 60, error: \`rate_limit\` }
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const { count: dayCount } = await adminClient
    .from("rate_limit_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart)

  if ((dayCount ?? 0) >= limits.per_day) {
    return { allowed: false, retryAfterSeconds: 3600, error: \`rate_limit\` }
  }

  await adminClient.from("rate_limit_log").insert({ user_id: userId, endpoint })
  return { allowed: true }
}

export async function checkAndDebitCredits(
  adminClient: SupabaseClient,
  userId: string,
  generationType: string,
  materialId?: string,
  customAmount?: number
): Promise<{ success: boolean; remaining: number; cost: number; error?: string }> {
  const cost = customAmount ?? getGenerationCost(generationType)
  const { data, error } = await adminClient.rpc("debit_credits", {
    p_user_id: userId,
    p_amount: cost,
    p_generation_type: generationType,
    p_material_id: materialId ?? null,
    p_description: \`Generation: \${generationType} (\${cost} credits)\`,
  })

  if (error) return { success: false, remaining: 0, cost, error: "credits_debit_failed" }

  const result = data?.[0] ?? data
  if (!result?.success) return { success: false, remaining: result?.balance_remaining ?? 0, cost, error: result?.error_message ?? "insufficient" }

  return { success: true, remaining: result.balance_remaining, cost }
}

export async function getCreditsBalance(
  adminClient: SupabaseClient,
  userId: string
): Promise<{ balance: number; plan: string; maxSeats: number }> {
  const { data } = await adminClient
    .from("users")
    .select("credits_balance, plan, max_seats")
    .eq("id", userId)
    .single()

  return { balance: data?.credits_balance ?? 0, plan: data?.plan ?? "free", maxSeats: data?.max_seats ?? 1 }
}

export function estimateApiCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const costs: Record<string, { input: number; output: number }> = {
    "gemini-2.5-flash": { input: 0.000000075, output: 0.0000003 },
    "gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
    "gpt-4o": { input: 0.0000025, output: 0.00001 },
  }
  const c = costs[model] ?? costs["gpt-4o-mini"]
  return (inputTokens * c.input) + (outputTokens * c.output)
}
`
}

async function run() {
  if (STRIPE_SECRET_KEY === 'sk_test_REMOVED_FOR_SECURITY...') {
    console.error('❌ ERRO: Você precisa colocar sua Chave Secreta do Stripe na linha 5!');
    return;
  }

  console.log('🚀 Iniciando automação GEO PRICING com o Stripe...\n');
  const priceMappings = {
    starter: {}, pro: {}, church: {}, addon: {}
  };

  try {
    for (const plan of plans) {
      console.log(`\n📦 Criando produto: ${plan.name}...`);
      const product = await request('POST', '/products', {
        name: plan.name,
        description: `Plano ${plan.key.toUpperCase()} na plataforma Living Word (Geo Pricing)`
      });

      for (const priceDef of plan.prices) {
        console.log(` 💎 Criando preço ${priceDef.id.toUpperCase()} de ${(priceDef.amount/100).toFixed(2)} ${priceDef.currency.toUpperCase()}...`);
        const price = await request('POST', '/prices', {
          product: product.id,
          currency: priceDef.currency,
          unit_amount: priceDef.amount,
          'recurring[interval]': 'month'
        });
        
        console.log(`    ✅ ID Gerado: ${price.id}`);
        priceMappings[plan.key][priceDef.id] = price.id;
      }
    }

    console.log('\n📝 Recrevendo o arquivo credits.ts com os novos mapeamentos Geo Pricing...');
    const newContent = generateCreditsFileContent(priceMappings);
    fs.writeFileSync(CREDITS_TS_PATH, newContent, 'utf8');

    console.log('✅ Arquivo credits.ts atualizado com sucesso e tipado perfeitamente!');
    console.log('\n🎉 Tudo pronto, Chefe! Rode o git status e confirme!');

  } catch(e) {
    console.error('\n❌ Ocorreu um erro na requisição à API:', e);
  }
}

run();
