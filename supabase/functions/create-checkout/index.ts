import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../common/utils.ts"

// O credits.ts agora tem os mapeamentos de preços
import {
  STRIPE_PRICE_TO_PLAN,
  STRIPE_ADDON_PRICE_IDS
} from "../common/credits.ts"

// Lista de preços do script setup_stripe.js
// Precisamos carregar eles aqui ou manter um mapeamento local (melhor importar)
// Como STRIPE_PRICE_TO_PLAN só traduz ID -> Plan, precisamos do reverso (Plan -> Region -> ID).
// Mas no runtime da edge function, é mais fácil buscar no banco de dados, ou ter um config literal.
// Vamos fazer um map simples para as 3 regiões com base na estrutura que sabemos.
// Para ficar desacoplado, o ideal era o Supabase já ter isso em uma tabela, mas como
// fizemos hardcoded, vamos receber o `price_id` direto do client, ou o client 
// manda { plan: "starter", region: "BRL" } e a gente traduz aqui.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  return new Response(JSON.stringify({ 
    error: "O faturamento (Stripe) está temporariamente desativado para desenvolvimento.",
    url: "/dashboard" // Redirect back to dashboard safely
  }), {
    status: 200, // Return 200 to allow frontend to handle the redirect/message gracefully
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
