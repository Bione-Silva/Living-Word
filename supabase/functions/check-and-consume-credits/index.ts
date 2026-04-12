import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verificar JWT e obter user_id
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (authError || !user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 });

  const { tool_slug } = await req.json();

  // Buscar perfil + config da ferramenta em paralelo
  const [profileResult, toolResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("tool_config").select("*").eq("slug", tool_slug).single(),
  ]);

  if (profileResult.error || toolResult.error) {
    return new Response(JSON.stringify({ error: "Configuração ou Usuário não encontrado" }), { status: 400 });
  }

  const profile = profileResult.data;
  const tool = toolResult.data;

  // Verificar se o plano do usuário tem acesso à ferramenta
  const planOrder = ["free", "starter", "pro", "igreja"];
  const userPlanIndex = planOrder.indexOf(profile.plan);
  const requiredPlanIndex = planOrder.indexOf(tool.min_plan);

  if (userPlanIndex < requiredPlanIndex) {
    return new Response(JSON.stringify({
      allowed: false,
      reason: "plan_insufficient",
      required_plan: tool.min_plan,
      current_plan: profile.plan,
    }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Lógica específica do plano Free
  if (profile.plan === "free") {
    if (!tool.available_on_free) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: "not_on_free",
        required_plan: tool.min_plan,
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verificar se já usou esta ferramenta no mês
    const resetAt = getNextMonthReset();
    const { data: existingUsage } = await supabase
      .from("free_tool_usage")
      .select("id")
      .eq("user_id", user.id)
      .eq("tool_slug", tool_slug)
      .gte("reset_at", new Date().toISOString())
      .maybeSingle();

    if (existingUsage) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: "free_monthly_limit_reached",
        reset_at: resetAt,
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Registrar uso no Free e deduzir créditos via RPC
    const { data: debitResult, error: debitError } = await supabase.rpc("debit_credits", {
      p_user_id: user.id,
      p_amount: tool.credits_cost,
      p_generation_type: tool_slug,
      p_description: `Uso de ferramenta (Plano Free): ${tool_slug}`
    });

    if (debitError || !debitResult?.[0]?.success) {
      return new Response(JSON.stringify({ 
        allowed: false, 
        reason: debitResult?.[0]?.error_message || "insufficient_credits",
        credits_remaining: debitResult?.[0]?.balance_remaining ?? profile.credits_remaining,
        credits_needed: tool.credits_cost,
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Apenas para plano free, registramos na tabela de uso mensal por ferramenta
    await supabase.from("free_tool_usage").insert({
      user_id: user.id,
      tool_slug,
      reset_at: resetAt,
    });

    return new Response(JSON.stringify({ 
      allowed: true, 
      credits_remaining: debitResult[0].balance_remaining 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Planos pagos: deduzir créditos via RPC (Atômico)
  const { data: debitResult, error: debitError } = await supabase.rpc("debit_credits", {
    p_user_id: user.id,
    p_amount: tool.credits_cost,
    p_generation_type: tool_slug,
    p_description: `Uso de ferramenta: ${tool_slug}`
  });

  if (debitError || !debitResult?.[0]?.success) {
    return new Response(JSON.stringify({
      allowed: false,
      reason: debitResult?.[0]?.error_message || "insufficient_credits",
      credits_remaining: debitResult?.[0]?.balance_remaining ?? profile.credits_remaining,
      credits_needed: tool.credits_cost,
      reset_at: profile.current_period_end,
    }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ 
    allowed: true, 
    credits_remaining: debitResult[0].balance_remaining 
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

});

function getNextMonthReset(): string {
  const now = new Date();
  const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  return reset.toISOString();
}
