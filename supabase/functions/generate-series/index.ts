import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAndDebitCredits } from "../common/credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SERIES_SYSTEM_PROMPT = `Você é um teólogo e pregador expositivo altamente capacitado.
Sua tarefa é criar um Guia de Série Homilética completo e coerente teologicamente.

REGRAS ABSOLUTAS:
- Responda SOMENTE com JSON válido, sem nenhum markdown, sem \`\`\`json
- Cada semana deve ter uma progressão lógica narrativa e doutrinária
- As referências bíblicas devem ser REAIS e existentes no cânon
- Temas de cada semana devem ser distintos mas integrados à série
- Adapte o estilo para o público-alvo se informado

SCHEMA obrigatório de resposta:
{
  "title": "Título da Série",
  "overview": "Parágrafo de visão geral doutrinária da série (2-3 frases)",
  "weeks": [
    {
      "week_number": 1,
      "title": "Título da semana",
      "overview": "Parágrafo descritivo (3-4 frases) sobre o foco desta semana",
      "texts": ["Ref 1:2", "Ref 3:4-5"],
      "topics": ["Tópico1", "Tópico2", "Tópico3"]
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { theme, weeks = 4, focus, language = "PT", audience } = await req.json();

    if (!theme) {
      return new Response(JSON.stringify({ error: "theme is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Debit credits BEFORE generation
    const creditResult = await checkAndDebitCredits(supabaseAdmin, user.id, "series_calendar");
    if (!creditResult.success) {
      return new Response(JSON.stringify({ error: "insufficient_credits", remaining: creditResult.remaining }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langMap: Record<string, string> = { PT: "Português", EN: "English", ES: "Español" };
    const userPrompt = `
Crie uma série homilética de ${weeks} semanas sobre o tema: "${theme}"
${focus ? `Foco especial: ${focus}` : ""}
${audience ? `Público-alvo: ${audience}` : ""}
Idioma de resposta: ${langMap[language] || "Português"}
Gere exatamente ${weeks} semanas.
    `.trim();

    // Use OpenAI for structured JSON generation
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SERIES_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI Error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "{}";
    const series = JSON.parse(rawContent);

    // Persist to materials table
    const { data: material, error: insertError } = await supabaseAdmin
      .from("materials")
      .insert({
        user_id: user.id,
        title: series.title || theme,
        type: "series_calendar",
        content: JSON.stringify(series),
        passage: null,
        language,
        bible_version: "NVI",
      })
      .select("id, title")
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ series, materialId: material.id, creditsRemaining: creditResult.remaining }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-series error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
