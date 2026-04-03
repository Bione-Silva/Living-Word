// schedule-publication/index.ts
// Edge Function: Agendar publicação de artigo na fila editorial
// Cria a entrada na editorial_queue e, se no Pastoral+, agenda automação

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createScopedClient, getAuthUser, corsHeaders } from "../common/utils.ts";

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação necessário" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createScopedClient(authHeader.replace("Bearer ", ""));
    const user = await getAuthUser(supabase);

    // 2. Parse request
    const {
      material_id,
      site_url,
      scheduled_at,
      status = "scheduled",
    } = await req.json();

    if (!material_id) {
      return new Response(
        JSON.stringify({ error: "material_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!scheduled_at) {
      return new Response(
        JSON.stringify({ error: "scheduled_at é obrigatório (ISO 8601)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Validar que scheduled_at é no futuro
    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate <= new Date()) {
      return new Response(
        JSON.stringify({
          error: "A data de agendamento deve ser no futuro",
          scheduled_at,
          server_time: new Date().toISOString(),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Verificar ownership do material
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("id, user_id, article_title, bible_passage")
      .eq("id", material_id)
      .eq("user_id", user.id)
      .single();

    if (materialError || !material) {
      return new Response(
        JSON.stringify({ error: "Material não encontrado ou não pertence a você" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Verificar plano (agendamento requer Pastoral+)
    const { data: userProfile } = await supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (userProfile?.plan === "free") {
      // Registrar evento de conversão (Gatilho: agendamento bloqueado)
      await supabase.from("conversion_events").insert({
        user_id: user.id,
        event_type: "upgrade_cta_shown",
        trigger_name: "blog_limit",
        metadata: { action: "schedule_blocked", material_id },
      });

      return new Response(
        JSON.stringify({
          error: "Agendamento editorial disponível no plano Pastoral",
          upgrade_hint: "Com o Pastoral, agende publicações automáticas e nunca perca um domingo sem conteúdo novo.",
          trial_cta: "7 dias grátis, sem cartão de crédito",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Resolver site de destino
    let targetSiteUrl = site_url;
    if (!targetSiteUrl) {
      const { data: profile } = await supabase
        .from("user_editorial_profile")
        .select("active_sites")
        .eq("user_id", user.id)
        .single();

      const sites = profile?.active_sites || [];
      if (sites.length > 0) {
        targetSiteUrl = sites[0].url;
      }
    }

    // 7. Upsert na fila editorial
    const { data: queueEntry, error: queueError } = await supabase
      .from("editorial_queue")
      .upsert(
        {
          user_id: user.id,
          material_id,
          status: "scheduled",
          scheduled_at: scheduledDate.toISOString(),
          target_site_url: targetSiteUrl || null,
        },
        { onConflict: "material_id" }
      )
      .select()
      .single();

    if (queueError) {
      console.error("Queue upsert error:", queueError);
      return new Response(
        JSON.stringify({ error: "Falha ao agendar publicação", details: queueError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Retornar confirmação
    return new Response(
      JSON.stringify({
        scheduled: true,
        queue_id: queueEntry.id,
        material_id,
        material_title: material.article_title || material.bible_passage,
        scheduled_at: scheduledDate.toISOString(),
        site_url: targetSiteUrl || "blog interno Living Word",
        status: "scheduled",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("schedule-publication error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao agendar", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
