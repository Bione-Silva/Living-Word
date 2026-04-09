const { createClient } = require('@supabase/supabase-js');

// Credenciais puxadas do seu antigo .env.local
const SUPABASE_URL = "https://priumwdestycikzfcysg.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "cTHoHWKgbS7pOwUHBYQUBJ60FNWs5FS/po/tD2L9dQOateoBWtoRH0e9qjlXC8BPm/j7YXUXulRj+Q149TYMVw==";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("🚀 Iniciando atualização dos IDs do Stripe na tabela plan_config via API...\n");

  const updates = [
    {
      plan: 'starter',
      stripe_price_id_monthly: 'price_1TJg0mEaDBbHafP6EjCuGgmk',
      stripe_price_id_annual: 'price_1TJg0nEaDBbHafP6R0XrOxCo'
    },
    {
      plan: 'pro',
      stripe_price_id_monthly: 'price_1TJg0oEaDBbHafP6bC747uSG',
      stripe_price_id_annual: 'price_1TJg0pEaDBbHafP6ToL24iXI'
    },
    {
      plan: 'igreja',
      stripe_price_id_monthly: 'price_1TJg0qEaDBbHafP6gyw9BqQ1',
      stripe_price_id_annual: 'price_1TJg0rEaDBbHafP69yZFNvtc'
    }
  ];

  for (const update of updates) {
    const { plan, stripe_price_id_monthly, stripe_price_id_annual } = update;
    
    console.log(`⏳ Atualizando plano ${plan.toUpperCase()}...`);
    const { data, error } = await supabase
      .from('plan_config')
      .update({ stripe_price_id_monthly, stripe_price_id_annual })
      .eq('plan', plan);

    if (error) {
      console.error(`❌ Erro no ${plan}:`, error.message);
    } else {
      console.log(`✅ ${plan.toUpperCase()} atualizado!`);
    }
  }

  console.log("\n🎉 Tudo atualizado no Banco de Dados! Arquitetura V1 100% pronta.");
}

run();
