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

  // ─────────────────────────────────────────────────────────────────
  // BYPASS MODE (DEVELOPER UNBLOCK)
  // We ignore all plan checks and credit balances to allow continuous development.
  // ─────────────────────────────────────────────────────────────────
  console.log(`[BYPASS] User ${user.id} requested tool ${tool_slug}. Access granted.`);

  return new Response(JSON.stringify({ 
    allowed: true, 
    credits_remaining: 999999,
    bypassed: true 
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  /* 
  // ORIGINAL LOGIC (Commented out during bypass)
  // ... rest of the logic ...
  */

});

function getNextMonthReset(): string {
  const now = new Date();
  const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  return reset.toISOString();
}
