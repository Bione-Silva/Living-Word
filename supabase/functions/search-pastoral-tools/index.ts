import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function languageLock(langCode: string, langLabel: string): string {
  if (langCode === 'PT') {
    return `🚨 TRAVA ABSOLUTA DE IDIOMA — OBRIGATÓRIO:
- Toda a resposta DEVE estar 100% em Português do Brasil. ZERO palavras ou frases em inglês.
- Nomes de livros bíblicos SEMPRE em Português (ex: "João" e NUNCA "John"; "Gênesis" e NUNCA "Genesis"; "Salmos" e NUNCA "Psalms").
- Versículos bíblicos SEMPRE citados em Português do Brasil (ARA, NVI, ACF, NTLH). NUNCA cite a Bíblia em inglês.
- Termos teológicos em Português (ex: "graça", "salvação", "redenção" — não "grace", "salvation", "redemption").
- Se não souber algo em Português, traduza ou use equivalente — NUNCA caia para o inglês.`;
  }
  if (langCode === 'ES') {
    return `🚨 BLOQUEO ABSOLUTO DE IDIOMA — OBLIGATORIO:
- Toda la respuesta DEBE estar 100% en Español. CERO palabras en inglés.
- Nombres de libros bíblicos en Español (ej: "Juan" y NUNCA "John"; "Génesis"; "Salmos").
- Versículos SIEMPRE citados en Español. NUNCA cites la Biblia en inglés.`;
  }
  return `🔒 LANGUAGE LOCK: Entire response in English only.`;
}

const TOOL_PROMPTS: Record<string, (langLabel: string, langCode: string) => string> = {
  trivia: (langLabel, langCode) =>
    `${languageLock(langCode, langLabel)}

You are a Bible trivia expert. Create 10 fun and challenging Bible trivia questions with 4 multiple-choice options each. Include the correct answer and a brief explanation. Mix easy and hard questions. Write everything in ${langLabel}, including book names and verse quotations.`,
  poetry: (langLabel, langCode) =>
    `${languageLock(langCode, langLabel)}

You are a Christian poet. Create a beautiful, heartfelt poem inspired by the given topic or passage. Use vivid imagery and theological depth. 12-20 lines. Write entirely in ${langLabel}.`,
  kids_story: (langLabel, langCode) =>
    `${languageLock(langCode, langLabel)}

You are a children's ministry storyteller. Create an engaging, age-appropriate (5-10 years) retelling of the Bible story or theme. Use simple language, fun characters, and a clear moral lesson. 300-400 words. Write entirely in ${langLabel}, including all biblical names in the appropriate language form.`,
  deep_translation: (langLabel, langCode) =>
    `${languageLock(langCode, langLabel)}

You are a theological translation expert. Translate the given text while preserving theological nuance, cultural context, and pastoral tone. Provide the translation and notes on key theological terms. Target language: ${langLabel}.`,
};

const VALID_TOOLS = new Set(Object.keys(TOOL_PROMPTS));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { tool, userPrompt, language } = body;

    if (!tool || !VALID_TOOLS.has(tool)) {
      return new Response(
        JSON.stringify({ error: `Invalid tool. Valid: ${[...VALID_TOOLS].join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userPrompt || typeof userPrompt !== "string" || userPrompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "userPrompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langLabel =
      language === "PT" ? "Portuguese (Brazilian)" :
      language === "ES" ? "Spanish" : "English";

    const systemPrompt = TOOL_PROMPTS[tool](langLabel);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI generation failed");
    }

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ content, tool }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("search-pastoral-tools error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
