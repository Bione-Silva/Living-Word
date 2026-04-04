import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MASTER_EMAIL = "bionicaosilva@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find minds deactivated for 7+ days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: inactiveMinds } = await supabase
      .from("mind_settings")
      .select("mind_id, active, updated_at")
      .eq("active", false)
      .lte("updated_at", sevenDaysAgo.toISOString());

    if (!inactiveMinds || inactiveMinds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No minds inactive for 7+ days", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mindList = inactiveMinds.map((m) => m.mind_id).join(", ");

    // Try to send email via Lovable transactional email if available
    const callbackUrl = Deno.env.get("EMAIL_CALLBACK_URL");
    
    if (callbackUrl) {
      try {
        const emailResponse = await fetch(callbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: MASTER_EMAIL,
            subject: `⚠️ Living Word: ${inactiveMinds.length} mente(s) desativada(s) há mais de 7 dias`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #3D2B1F;">Alerta de Mentes Inativas</h2>
                <p style="color: #6B4F3A;">As seguintes mentes estão desativadas há mais de 7 dias:</p>
                <ul style="color: #3D2B1F;">
                  ${inactiveMinds.map((m) => `<li><strong>${m.mind_id}</strong> — desativada desde ${new Date(m.updated_at).toLocaleDateString("pt-BR")}</li>`).join("")}
                </ul>
                <p style="color: #6B4F3A; font-size: 14px;">Acesse o Back-office para reativar ou confirmar a desativação.</p>
                <hr style="border: none; border-top: 1px solid #E5DDD0; margin: 20px 0;" />
                <p style="color: #8B7355; font-size: 12px;">Living Word · Sistema Automático de Monitoramento</p>
              </div>
            `,
          }),
        });
        console.log("Email sent:", emailResponse.status);
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }
    }

    // Always store alert in global_settings for admin panel visibility
    await supabase.from("global_settings").upsert(
      {
        key: "inactive_minds_alert",
        value: JSON.stringify({
          count: inactiveMinds.length,
          minds: inactiveMinds.map((m) => ({
            id: m.mind_id,
            since: m.updated_at,
          })),
          checked_at: new Date().toISOString(),
        }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    return new Response(
      JSON.stringify({
        message: `Alert generated for ${inactiveMinds.length} inactive mind(s)`,
        minds: mindList,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
