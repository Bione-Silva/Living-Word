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

    // Verificar créditos globais residuais do Free
    if (profile.credits_remaining < tool.credits_cost) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: "insufficient_credits",
        credits_remaining: profile.credits_remaining,
        credits_needed: tool.credits_cost,
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Registrar uso no Free e deduzir créditos em transação
    const newCredits = profile.credits_remaining - tool.credits_cost;

    const [, , txError] = await Promise.all([
      supabase.from("free_tool_usage").insert({
        user_id: user.id,
        tool_slug,
        reset_at: resetAt,
      }),
      supabase.from("profiles").update({ credits_remaining: newCredits }).eq("id", user.id),
      supabase.from("credit_transactions_v1").insert({
        user_id: user.id,
        tool_slug,
        credits_used: tool.credits_cost,
        credits_before: profile.credits_remaining,
        credits_after: newCredits,
      }),
    ]);

    if (txError) return new Response(JSON.stringify({ error: "Erro ao registrar uso" }), { status: 500 });

    return new Response(JSON.stringify({ allowed: true, credits_remaining: newCredits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Planos pagos: verificar créditos
  if (profile.credits_remaining < tool.credits_cost) {
    return new Response(JSON.stringify({
      allowed: false,
      reason: "insufficient_credits",
      credits_remaining: profile.credits_remaining,
      credits_needed: tool.credits_cost,
      reset_at: profile.current_period_end,
    }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Deduzir créditos para planos pagos
  const newCredits = profile.credits_remaining - tool.credits_cost;

  const [updateError, txError] = await Promise.all([
    supabase.from("profiles").update({ credits_remaining: newCredits }).eq("id", user.id),
    supabase.from("credit_transactions_v1").insert({
      user_id: user.id,
      tool_slug,
      credits_used: tool.credits_cost,
      credits_before: profile.credits_remaining,
      credits_after: newCredits,
    }),
  ]);

  if (updateError.error || txError.error) {
    return new Response(JSON.stringify({ error: "Erro grave ao consumir créditos." }), { status: 500 });
  }

  return new Response(JSON.stringify({ allowed: true, credits_remaining: newCredits }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

function getNextMonthReset(): string {
  const now = new Date();
  const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  return reset.toISOString();
}
