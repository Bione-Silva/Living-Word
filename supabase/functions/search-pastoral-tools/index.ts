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
  social_caption: (langLabel, langCode) =>
    `${languageLock(langCode, langLabel)}

You are a Christian Social Media Copywriter specialized in Instagram and Facebook captions for pastors and ministries. Given a topic or Bible passage, write ONE professional caption with:
- A strong opening hook (first line) that stops the scroll.
- A pastoral, warm, engaging body (2–4 short paragraphs, easy to read on mobile).
- Tasteful use of emojis (never excessive — max 4–6 total, only where they truly add warmth).
- A clear CTA (call-to-action) at the end (comment, share, save, or reflect).
- 5–8 relevant hashtags on a separate final line.
- Maximum 300 words total.
Do NOT write a poem. Do NOT write a sermon. Write a caption that sounds human, pastoral, and made for social feeds. Entirely in ${langLabel}.`,
  reels_script: (langLabel, langCode) =>
    `${languageLock(langCode, langLabel)}

You are a Christian Reels/TikTok scriptwriter specialized in 60-second vertical videos for pastors. Given a topic or Bible passage, deliver a script with this EXACT structure and labels (translated to ${langLabel}):
1. HOOK (0–3s) — one punchy line that stops the scroll.
2. RETENTION / DEVELOPMENT (3–48s) — 3 to 5 short spoken beats that build curiosity and deliver the message; include suggested on-screen text in [brackets] when helpful.
3. CTA (48–60s) — a clear pastoral call-to-action (follow, comment, share, save).
Add a final line "🎬 ${langCode === 'PT' ? 'Sugestão visual' : langCode === 'ES' ? 'Sugerencia visual' : 'Visual suggestion'}:" with 1–2 sentences describing B-roll / scene ideas.
Tone: pastoral, engaging, modern, never cringe. Entirely in ${langLabel}.`,
  announcements: (langLabel, langCode) =>
    `${languageLock(langCode, langLabel)}

You are a parish/church announcement writer. Given an event or topic, produce a warm, welcoming announcement suitable for both projection slides AND social media. Structure:
- Short, inviting headline (max 8 words).
- 2–3 short paragraphs with the key info, written in a pastoral and welcoming tone.
- Placeholders in [brackets] for date, time, and location when not specified (e.g., [DATA], [HORÁRIO], [LOCAL]).
- Closing line that invites the community with warmth (no pressure, no marketing hype).
- Optional final line with 1–2 light emojis if appropriate.
Do NOT write a poem, sermon, or social caption with hashtags. Keep it under 180 words. Entirely in ${langLabel}.`,
};

// Tools that route to GPT-4o-mini (creative / literary writing)
const CREATIVE_TOOLS = new Set(['poetry', 'kids_story', 'social_caption', 'reels_script', 'announcements']);

const VALID_TOOLS = new Set(Object.keys(TOOL_PROMPTS));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
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

    const langCode = language === 'PT' ? 'PT' : language === 'ES' ? 'ES' : 'EN';
    const langLabel =
      langCode === 'PT' ? 'Portuguese (Brazilian)' :
      langCode === 'ES' ? 'Spanish' : 'English';

    const systemPrompt = TOOL_PROMPTS[tool](langLabel, langCode);

    const model = CREATIVE_TOOLS.has(tool) ? 'openai/gpt-5-mini' : 'google/gemini-2.5-flash';

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
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
