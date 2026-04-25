import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders, handleCorsOptions, sanitizeField } from "../_shared/cors.ts";

// ═══ Input limits (security hardening) ═══
const MAX_PASSAGE_LEN = 500;
const MAX_PAIN_POINT_LEN = 1000;
const MAX_AUDIENCE_LEN = 100;
const MAX_VOICE_LEN = 100;
const MAX_BODY_SIZE = 10_000; // max request body in characters

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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
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
    const geminiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
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

    // ═══ Input validation & sanitization ═══
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return new Response(JSON.stringify({ error: "Request body too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body: RequestBody = JSON.parse(rawBody);

    const bible_passage = sanitizeField(body.bible_passage, MAX_PASSAGE_LEN);
    const audience = sanitizeField(body.audience, MAX_AUDIENCE_LEN, "general");
    const pain_point = sanitizeField(body.pain_point, MAX_PAIN_POINT_LEN, "");
    const language = sanitizeField(body.language, 5, "PT");
    const bible_version = sanitizeField(body.bible_version, 10, "NVI");
    const output_modes = Array.isArray(body.output_modes)
      ? body.output_modes.filter((m): m is string => typeof m === "string").slice(0, 6)
      : ["sermon", "outline", "devotional"];
    const pastoral_voice = sanitizeField(body.pastoral_voice, MAX_VOICE_LEN);

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
    const creditCost = 20;

    // ═══ Atomic credit deduction (prevents race conditions) ═══
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: creditOk, error: creditErr } = await adminClient.rpc("debit_credits", {
      p_user_id: userId,
      p_cost: creditCost,
    });

    if (creditErr || creditOk !== true) {
      return new Response(
        JSON.stringify({
          error: "Generation limit reached",
          upgrade_hint: language === "PT"
            ? "Você atingiu o limite de gerações deste mês. Desbloqueie gerações ilimitadas no plano Pastoral."
            : language === "ES"
            ? "Has alcanzado el límite de generaciones este mes. Obtén más créditos en el plan Pastoral."
            : "You've reached your generation limit this month. Get more credits on the Pastoral plan.",
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
    const voice = pastoral_voice || profile?.pastoral_voice || "acolhedor";

    // Determine which formats are free vs blocked
    const MODEL_PREMIUM = "gpt-4o";
    const MODEL_FREE = "gpt-4o-mini";
    const isPremium = profile?.plan === "premium" || profile?.plan === "pro";
    const MODEL = isPremium ? MODEL_PREMIUM : MODEL_FREE;

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
      sermon: `Write a complete, publication-ready sermon of 1800-2600 words based on ${bible_passage} (${bible_version}) for ${audienceDesc}.

═══ MANDATORY EXEGETICAL DEPTH ═══
Before writing, internally do this study and surface the results in the sermon body:
1. HISTORICAL-CULTURAL CONTEXT: who wrote, to whom, when, why; the cultural setting that shapes meaning.
2. LITERARY CONTEXT: genre of the passage, where it sits in the book's argument, how it connects to the immediate surrounding verses.
3. ORIGINAL LANGUAGES: identify 2-3 KEY words in Greek/Hebrew with transliteration and a one-line semantic note (e.g., *agapē* (ἀγάπη) — sacrificial covenant love). Use them naturally inside the explanation, not as a glossary dump.
4. INTERPRETIVE TRADITION: briefly acknowledge how this text has been read in classical Christian tradition (Reformers, Patristics, or major commentators when relevant). Stay faithful to the ${doctrine} tradition.

═══ MANDATORY STRUCTURE ═══
- TITLE (H1).
- BIG IDEA / CENTRAL PROPOSITION: one sharp sentence the audience must take home.
- INTRODUCTION: a hook (story, question or contemporary tension) → context bridge → state the Big Idea.
- 3 to 5 MAJOR MOVEMENTS, each derived directly from the text. For EACH movement include:
   • Exposition of the verse(s) with original-language insight when relevant.
   • At least 2 cross-references with brief explanation (not a bare list).
   • ONE concrete, contemporary illustration — anchored in the text, avoiding tired clichés (no "diamond in the rough", no generic sports analogies).
   • Pastoral application (the "so what?") — specific, behavioral, addressed to ${audienceDesc}.
   • An EXPLICIT TRANSITION sentence into the next movement.
- CONCLUSION: recap the Big Idea, restate the movements in one line each, deliver a clear call to action or call to decision.
- CLOSING PRAYER: 4-8 sentences, in the voice of the preacher, responding to the Big Idea.
- PREACHER'S NOTES (small section at the end): suggested length in minutes, tone, and 2-3 visual/illustration ideas.

${pain_point ? `Address this pastoral context throughout: ${pain_point}.` : ""}
Tone: ${voice}. Tradition: ${doctrine}. Language: ${targetLang}.
Format in Markdown. Do NOT compress into a devotional. Do NOT skip the exegetical depth.`,

      outline: `Create a detailed sermon outline based on ${bible_passage} (${bible_version}) for ${audienceDesc}.
Include: Title, Big Idea / central proposition, fallen condition focus, historical-literary context (2-4 lines), 1-2 key Greek/Hebrew terms with transliteration, introduction (hook + context), 3-5 major points with multiple sub-points, supporting cross-references (min. 2 per point), illustration suggestions (concrete & contemporary), explicit transitions between points, applications, conclusion with call to action, and a closing prayer outline.
Each major point must be developed enough that a pastor could preach from it without rebuilding the structure.
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

    const systemPrompt = `You are an expert pastoral content generator for Christian leaders, trained on the homiletical method of great expository preachers (Spurgeon, Lloyd-Jones, Wesley, Calvin) and on classical biblical commentaries.
You produce theologically sound, exegetically rigorous, pastorally warm content that respects the ${doctrine} tradition.
When the user requests a sermon or outline, you MUST honor every section demanded by the user prompt — historical-cultural context, literary context, original-language terms, cross-references, contemporary illustrations, transitions, application, call to action, and closing prayer. Never silently drop a section.
Tone: ${voice}. Always write in ${targetLang}.`;

    // Minimum word counts per format
    const minWords: Record<string, number> = {
      sermon: 400, outline: 400, devotional: 400,
      reels: 100, bilingual: 400, cell: 400,
    };
    const MAX_RETRIES = 2;
    function countWords(text: string): number {
      return text.trim().split(/\s+/).filter(Boolean).length;
    }

    // Generate content for each allowed mode
    const outputs: Record<string, string> = {};
    const meta: Record<string, { tokens: number; words: number; cost_usd: number; attempts: number }> = {};
    const startTime = Date.now();
    let totalTokensAll = 0;
    let totalCostAll = 0;

    for (const mode of allowedModes) {
      const userPrompt = formatPrompts[mode];
      if (!userPrompt) continue;

      const requiredMin = minWords[mode] || 400;
      let bestContent = "";
      let bestWordCount = 0;
      let lastUsage: Record<string, number> | null = null;
      let errorOccurred = false;
      let attemptsTaken = 0;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        attemptsTaken = attempt + 1;
        const retryHint = attempt > 0
          ? `\n\nCRITICAL: Your previous response had only ${bestWordCount} words. The ABSOLUTE MINIMUM is ${requiredMin} words. You MUST write significantly more. Expand every section with detailed explanations, examples, illustrations, and applications. Do NOT summarize.`
          : "";

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${geminiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 7000,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt + retryHint },
            ],
          }),
        });

        if (!aiResponse.ok) {
          const status = aiResponse.status;
          if (status === 429) {
            return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (status === 402) {
            return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          const errText = await aiResponse.text();
          console.error(`AI error for ${mode} (attempt ${attempt + 1}):`, status, errText);
          outputs[mode] = `Error generating ${mode}. Please try again.`;
          errorOccurred = true;
          break;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        const wc = countWords(content);
        lastUsage = aiData.usage || null;

        console.log(`[${mode}] attempt ${attempt + 1}: ${wc} words (min: ${requiredMin})`);

        if (wc > bestWordCount) {
          bestContent = content;
          bestWordCount = wc;
        }

        if (wc >= requiredMin) break;

        if (attempt === MAX_RETRIES) {
          console.warn(`[${mode}] best: ${bestWordCount} words after ${MAX_RETRIES + 1} attempts`);
        }
      }

      if (!errorOccurred) {
        outputs[mode] = bestContent;
      }

      if (lastUsage) {
        const tokens = lastUsage.total_tokens || 0;
        const cost = (lastUsage.prompt_tokens || 0) * 0.0000001 + (lastUsage.completion_tokens || 0) * 0.0000004;
        totalTokensAll += tokens;
        totalCostAll += cost;
        meta[mode] = { tokens, words: bestWordCount, cost_usd: cost, attempts: attemptsTaken };
        await adminClient.from("generation_logs").insert({
          user_id: userId,
          feature: mode,
          model: MODEL,
          input_tokens: lastUsage.prompt_tokens || 0,
          output_tokens: lastUsage.completion_tokens || 0,
          total_tokens: lastUsage.total_tokens || 0,
          // gpt-4o-mini: $0.15/1M input, $0.60/1M output — gpt-4o: $5/1M input, $15/1M output
          cost_usd: isPremium
            ? ((lastUsage.prompt_tokens || 0) / 1_000_000) * 5 + ((lastUsage.completion_tokens || 0) / 1_000_000) * 15
            : ((lastUsage.prompt_tokens || 0) / 1_000_000) * 0.15 + ((lastUsage.completion_tokens || 0) / 1_000_000) * 0.60,
        });
      }
    }

    const elapsedMs = Date.now() - startTime;

    // Credits already deducted atomically above — fetch remaining for response
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("generations_used, generations_limit")
      .eq("id", userId)
      .maybeSingle();
    const generationsRemaining = (updatedProfile?.generations_limit || 500) - (updatedProfile?.generations_used || 0);

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
        generation_meta: {
          model: MODEL,
          total_tokens: totalTokensAll,
          total_cost_usd: totalCostAll,
          elapsed_ms: elapsedMs,
          per_format: meta,
        },
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
