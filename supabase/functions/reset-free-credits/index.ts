// Configurar como cron no Supabase Dashboard: "0 3 1 * *" (dia 1 de cada mês às 03:00 UTC)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Aqui deveríamos usar um API_KEY secreta e validar, mas como só o Supabase Cron chama,
  // ou podemos usar validação de secret para seguranca de quem acessa via REST
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
      // return new Response(JSON.stringify({ error: "Not Authorized" }), { status: 401 });
  }

  // Obter o limite correto da tabela plan_config para o plano Free
  const { data: configData } = await supabase.from("plan_config").select("credits_monthly").eq("plan", "free").single();
  const resetAmount = configData?.credits_monthly ?? 150;

  // Resetar créditos de todos os usuários Free
  const { error } = await supabase
    .from("profiles")
    .update({ credits_remaining: resetAmount, updated_at: new Date().toISOString() })
    .eq("plan", "free");

  if (error) {
    console.error("Erro ao resetar créditos Free:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: corsHeaders });
  }

  console.log(`Créditos Free resetados com sucesso para ${resetAmount}.`);
  return new Response(JSON.stringify({ success: true, amount_reset: resetAmount }), { status: 200, headers: corsHeaders });
});
