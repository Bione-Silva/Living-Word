import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { notes_text, language } = await req.json();

    if (!notes_text?.trim()) {
      return new Response(
        JSON.stringify({ error: "empty_notes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langLabel =
      language === "PT" ? "Português" : language === "ES" ? "Español" : "English";

    const systemPrompt = `You are a careful biblical studies reviewer. Analyze the user's notes/study and return a structured review in ${langLabel}. 
Cover these areas:
1. **Estrutura e organização** — Is it clear, logical, easy to understand?
2. **Conteúdo teológico** — Any interpretation errors, contradictions, or doctrinal deviations?
3. **Precisão textual** — Are cited Bible passages correctly transcribed and contextualized?
4. **Coerência** — Do the reflections and connections between points make sense?
5. **Formato** — Does the presentation help or hinder comprehension?

For each area give a brief verdict (✅ OK, ⚠️ Atenção, or ❌ Problema) followed by a concise explanation. 
End with a short "Sugestões de melhoria" section if applicable.
Keep the response under 800 words. Use markdown formatting.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analise estas anotações/estudos bíblicos:\n\n${notes_text}` },
          ],
        }),
      },
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limit" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-notes error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
