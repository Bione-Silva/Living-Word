import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL_PREMIUM = "openai/gpt-4o";
const MODEL_FREE = "openai/gpt-4o-mini";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Attempt to repair truncated JSON by closing open braces/brackets/strings */
function repairTruncatedJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/,\s*$/, "");
  let inString = false, escape = false;
  let openBrackets = 0, openBraces = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    else if (ch === "}") openBraces--;
    else if (ch === "[") openBrackets++;
    else if (ch === "]") openBrackets--;
  }
  if (inString) s += '"';
  s = s.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, "");
  
  inString = false; escape = false; openBraces = 0; openBrackets = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    else if (ch === "}") openBraces--;
    else if (ch === "[") openBrackets++;
    else if (ch === "]") openBrackets--;
  }
  if (inString) s += '"';
  while (openBrackets > 0) { s += "]"; openBrackets--; }
  while (openBraces > 0) { s += "}"; openBraces--; }
  return s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!geminiApiKey) {
      return jsonResponse({ error: "LOVABLE_API_KEY not configured" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const {
      bible_passage,
      language = "PT",
    } = body;

    if (!bible_passage || bible_passage.trim().length < 3) {
      return jsonResponse({ error: "bible_passage is required" }, 400);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, plan, generations_used, generations_limit, dna_data")
      .eq("id", userId)
      .maybeSingle();

    const generationsUsed = profile?.generations_used || 0;
    const generationsLimit = profile?.generations_limit || 500;
    const creditCost = 15; // Cheaper than a full study

    const isPremium = profile?.plan === "premium" || profile?.plan === "pro";
    const MODEL = isPremium ? MODEL_PREMIUM : MODEL_FREE;

    if ((generationsLimit - generationsUsed) < creditCost) {
      return jsonResponse({ error: "insufficient_credits", remaining: generationsLimit - generationsUsed, cost: creditCost }, 402);
    }

    const langMap: Record<string, string> = {
      PT: "Portuguese (Brazilian)",
      EN: "English",
      ES: "Spanish",
    };
    const targetLang = langMap[language.toUpperCase()] || "Portuguese (Brazilian)";

    const systemPrompt = `You are an elite biblical scholar and exegete, mastering Biblical Hebrew, Aramaic, and Koine Greek.
Your ONLY job is to analyze a given bible passage word-by-word in its original language, and provide a deep semantic and morphological table.

If the passage is Old Testament -> Analyze ONLY in Hebrew/Aramaic.
If the passage is New Testament -> Analyze ONLY in Koine Greek.

Your output MUST be a valid JSON object matching EXACTLY this schema. Do NOT include markdown code fences. Output ONLY the raw JSON.
{
  "schema_version": "1.0",
  "title": "string",
  "bible_passage": "string",
  "language": "${language}",
  "original_text": "string (The complete raw biblical text of the queried passage in the original Hebrew or Greek characters)",
  "word_by_word": [
    {
      "original_word": "string (the word in Hebrew/Greek characters)",
      "transliteration": "string",
      "translation": "string (literal translation of the word to ${targetLang})",
      "strong_number": "string (e.g. G25)",
      "morphology": "string (e.g. Verb, Aorist, Active, Indicative)",
      "deeper_meaning": "string (A 2-3 sentence deep-dive into the pastoral or theological richness of this specific word. Explain if the verb has a specific tense implication or if it carries a cultural weight.)"
    }
  ],
  "exegetical_summary": "string (A 2-4 paragraph deep pastoral and exegetical reflection tying all these original words together into a beautiful and solid truth. Address the nuances of the original language and how it brings life to ${targetLang}. Use linebreaks.)"
}

Write all explanations and the summary in ${targetLang}. Be profound, pastoral, and surgically accurate.`;

    const userPrompt = `Deliver a deep word-by-word original language analysis of: ${bible_passage}.`;

    const startTime = Date.now();
    const usageTotals = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    let study: any = null;
    let lastRawContent = "";
    
    // Attempt generation once
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${geminiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return jsonResponse({ error: "Rate limited. Try again later." }, 429);
      if (status === 402) return jsonResponse({ error: "AI credits exhausted." }, 402);
      return jsonResponse({ error: "AI generation failed" }, 502);
    }

    const aiData = await aiResponse.json();
    if (aiData.usage) {
      usageTotals.prompt_tokens += aiData.usage.prompt_tokens || 0;
      usageTotals.completion_tokens += aiData.usage.completion_tokens || 0;
      usageTotals.total_tokens += aiData.usage.total_tokens || 0;
    }

    lastRawContent = (aiData.choices?.[0]?.message?.content || "")
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    try {
      study = JSON.parse(lastRawContent);
    } catch {
      const repaired = repairTruncatedJson(lastRawContent);
      study = JSON.parse(repaired);
    }

    if (!study || !study.word_by_word || !Array.isArray(study.word_by_word)) {
      return jsonResponse({ error: "schema_validation_failed", details: ["Missing word_by_word array"] }, 500);
    }

    if (usageTotals.total_tokens > 0) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      await adminClient.from("generation_logs").insert({
        user_id: userId,
        feature: "Texto Original",
        model: MODEL,
        input_tokens: usageTotals.prompt_tokens,
        output_tokens: usageTotals.completion_tokens,
        total_tokens: usageTotals.total_tokens,
        cost_usd: isPremium
          ? (usageTotals.prompt_tokens / 1_000_000) * 5 + (usageTotals.completion_tokens / 1_000_000) * 15
          : (usageTotals.prompt_tokens / 1_000_000) * 0.15 + (usageTotals.completion_tokens / 1_000_000) * 0.60,
      });
    }

    // Save to materials table
    const { data: material } = await supabase
      .from("materials")
      .insert({
        user_id: userId,
        title: study.title || \`Texto Original: \${bible_passage}\`,
        content: JSON.stringify(study),
        type: "original_text",
        passage: bible_passage,
        language: language,
      })
      .select("id")
      .single();

    // Deduct credit cost
    await supabase
      .from("profiles")
      .update({ generations_used: generationsUsed + creditCost })
      .eq("id", userId);

    return jsonResponse({
      success: true,
      material_id: material?.id || "",
      study,
      generation_meta: {
        model: MODEL,
        total_tokens: usageTotals.total_tokens,
        elapsed_ms: Date.now() - startTime,
      },
    });
  } catch (e) {
    console.error("generate-original-text error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
