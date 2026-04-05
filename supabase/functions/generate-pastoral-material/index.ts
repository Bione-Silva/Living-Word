import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  bible_passage: string;
  audience?: string;
  pain_point?: string;
  language?: string;
  bible_version?: string;
  output_modes?: string[];
  pastoral_voice?: string;
  mind_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body: RequestBody = await req.json();
    const {
      bible_passage,
      audience = "general",
      pain_point = "",
      language = "PT",
      bible_version = "NVI",
      output_modes = ["sermon", "outline", "devotional"],
      pastoral_voice,
    } = body;

    if (!bible_passage) {
      return new Response(JSON.stringify({ error: "bible_passage is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, plan, doctrine, pastoral_voice, generations_used, generations_limit")
      .eq("id", userId)
      .maybeSingle();

    const isFree = profile?.plan === "free";
    const generationsUsed = profile?.generations_used || 0;
    const generationsLimit = profile?.generations_limit || 5;

    // Check generation limits
    if (generationsUsed >= generationsLimit) {
      return new Response(
        JSON.stringify({
          error: "Generation limit reached",
          upgrade_hint: language === "PT"
            ? "Você atingiu o limite de gerações deste mês. Desbloqueie gerações ilimitadas no plano Pastoral."
            : language === "ES"
            ? "Has alcanzado el límite de generaciones este mes. Desbloquea generaciones ilimitadas en el plan Pastoral."
            : "You've reached your generation limit this month. Unlock unlimited generations on the Pastoral plan.",
          generations_remaining: 0,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langMap: Record<string, string> = {
      PT: "Portuguese (Brazilian)",
      EN: "English",
      ES: "Spanish",
    };
    const targetLang = langMap[language] || "Portuguese (Brazilian)";
    const doctrine = profile?.doctrine || "evangelical";
    const requestedVoice = typeof pastoral_voice === "string" ? pastoral_voice.trim() : "";
    const voice = requestedVoice || profile?.pastoral_voice || "acolhedor";

    // Determine which formats are free vs blocked
    const freeFormats = ["sermon", "outline", "devotional"];
    const blockedFormats = isFree
      ? output_modes.filter((m) => !freeFormats.includes(m))
      : [];
    const allowedModes = output_modes.filter((m) => freeFormats.includes(m) || !isFree);

    const audienceMap: Record<string, string> = {
      general: "a general church congregation",
      youth: "young adults and teenagers",
      immigrants: "Brazilian immigrants living abroad",
      women: "a women's ministry group",
      leaders: "cell group leaders",
    };
    const audienceDesc = audienceMap[audience] || audience;

    // Build prompts for each allowed format
    const formatPrompts: Record<string, string> = {
      sermon: `Write a complete sermon (800-1200 words) based on ${bible_passage} (${bible_version}) for ${audienceDesc}.
      sermon: `Write a complete sermon of 1800-2600 words based on ${bible_passage} (${bible_version}) for ${audienceDesc}.
Include: Title (H1), central proposition, a strong introduction with a hook, contextual framing of the passage, 3 to 5 major movements with sub-points, exegetical explanation, illustrations, cross references, pastoral application after each movement, and a conclusion with a clear call to action.
The sermon must feel publication-ready and long enough to read like at least 3 pages. Do not compress it into a short devotional or a few paragraphs.
${pain_point ? `Address this context: ${pain_point}.` : ""}
Tone: ${voice}. Tradition: ${doctrine}. Language: ${targetLang}.
Format in Markdown.`,

      outline: `Create a detailed sermon outline based on ${bible_passage} (${bible_version}) for ${audienceDesc}.
Include: Title, central theme, fallen condition focus, introduction (hook + context), 3-5 major points with multiple sub-points and supporting verses, transitions, illustration suggestions, applications, and a conclusion.
Each major point must be developed with enough detail that a pastor could preach from it without needing to rebuild the structure from scratch.
${pain_point ? `Address: ${pain_point}.` : ""}
Tone: ${voice}. Tradition: ${doctrine}. Language: ${targetLang}.
Format as a structured Markdown outline with bullet points.`,

      devotional: `Write a devotional reflection of 700-1100 words based on ${bible_passage} (${bible_version}).
Include: Title (H1), opening reflection, Scripture reading, meditation, doctrinal insight, practical daily application, and closing prayer.
${pain_point ? `Address: ${pain_point}.` : ""}
Tone: warm and personal, ${voice}. Tradition: ${doctrine}. Language: ${targetLang}.
Format in Markdown.`,

      reels: `Create a short-form social media script (60-90 seconds) based on ${bible_passage} for Instagram Reels/TikTok.
Include: Hook (first 3 seconds), 3 key points (punchy and visual), Call to action.
Language: ${targetLang}. Format in Markdown.`,

      bilingual: `Write a bilingual devotional based on ${bible_passage} (${bible_version}).
Alternate paragraphs between Portuguese (Brazilian) and English.
Include: Bilingual title, Reflection in both languages, Prayer in both languages.
Format in Markdown with clear language labels.`,

      cell: `Create a cell group study guide based on ${bible_passage} (${bible_version}) for ${audienceDesc}.
Include: Title, Ice-breaker question, Scripture reading, 5-7 discussion questions (progressive depth), Application challenge, Closing prayer suggestion.
${pain_point ? `Address: ${pain_point}.` : ""}
Tone: ${voice}. Language: ${targetLang}. Format in Markdown.`,
    };

    const systemPrompt = `You are an expert pastoral content generator for Christian leaders. You create theologically sound, engaging content that respects the ${doctrine} tradition. Your tone is ${voice}. Always write in ${targetLang}.`;

    // Generate content for each allowed mode
    const outputs: Record<string, string> = {};

    for (const mode of allowedModes) {
      const userPrompt = formatPrompts[mode];
      if (!userPrompt) continue;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          max_tokens: 7000,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await aiResponse.text();
        console.error(`AI error for ${mode}:`, status, errText);
        outputs[mode] = `Error generating ${mode}. Please try again.`;
        continue;
      }

      const aiData = await aiResponse.json();
      outputs[mode] = aiData.choices?.[0]?.message?.content || "";

      // Log generation for AI billing
      const usage = aiData.usage;
      if (usage) {
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        await adminClient.from("generation_logs").insert({
          user_id: userId,
          feature: mode,
          model: "google/gemini-3-flash-preview",
          input_tokens: usage.prompt_tokens || 0,
          output_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0,
          cost_usd: ((usage.prompt_tokens || 0) * 0.0000001 + (usage.completion_tokens || 0) * 0.0000004),
        });
      }
    }

    // Increment generations_used
    await supabase
      .from("profiles")
      .update({ generations_used: generationsUsed + 1 })
      .eq("id", userId);

    const generationsRemaining = generationsLimit - generationsUsed - 1;

    // Build upgrade hint
    let upgradeHint: string | null = null;
    if (isFree && generationsRemaining <= 2) {
      upgradeHint = language === "PT"
        ? `Você ainda tem ${generationsRemaining} geração(ões) este mês. Experimente o plano Pastoral por 7 dias grátis.`
        : language === "ES"
        ? `Aún tienes ${generationsRemaining} generación(es) este mes. Prueba el plan Pastoral 7 días gratis.`
        : `You have ${generationsRemaining} generation(s) left this month. Try Pastoral free for 7 days.`;
    }

    return new Response(
      JSON.stringify({
        outputs,
        blocked_formats: blockedFormats,
        generations_remaining: generationsRemaining,
        upgrade_hint: upgradeHint,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate-pastoral-material error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
