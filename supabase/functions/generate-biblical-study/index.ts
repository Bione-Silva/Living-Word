import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "gemini-2.5-flash";

const depthRequirements = {
  basic: {
    totalWords: 1100,
    summaryWords: 180,
    historicalWords: 160,
    literaryWords: 70,
    conclusionWords: 140,
    textStructureCount: 3,
    exegesisCount: 4,
    theologyCount: 2,
    connectionsCount: 3,
    applicationCount: 3,
    questionsCount: 6,
  },
  intermediate: {
    totalWords: 1500,
    summaryWords: 220,
    historicalWords: 220,
    literaryWords: 100,
    conclusionWords: 140,
    textStructureCount: 4,
    exegesisCount: 5,
    theologyCount: 3,
    connectionsCount: 4,
    applicationCount: 4,
    questionsCount: 7,
  },
  advanced: {
    totalWords: 1900,
    summaryWords: 260,
    historicalWords: 280,
    literaryWords: 140,
    conclusionWords: 240,
    textStructureCount: 5,
    exegesisCount: 6,
    theologyCount: 4,
    connectionsCount: 5,
    applicationCount: 5,
    questionsCount: 8,
  },
} as const;

type StudyRequirements = (typeof depthRequirements)[keyof typeof depthRequirements];

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function countWords(value: unknown) {
  const text = asString(value);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function getRequirements(depthLevel: string): StudyRequirements {
  return depthRequirements[depthLevel as keyof typeof depthRequirements] ?? depthRequirements.intermediate;
}

function validateStudy(candidate: Record<string, unknown>, requirements: StudyRequirements) {
  const issues: string[] = [];
  const historicalContext = asObject(candidate.historical_context);
  const literaryContext = asObject(candidate.literary_context);

  const totalWords = [
    asString(candidate.central_idea),
    asString(candidate.summary),
    asString(historicalContext.text),
    asString(literaryContext.position_in_book),
    ...asArray(candidate.exegesis).flatMap((item) => {
      const entry = asObject(item);
      return [asString(entry.linguistic_note), asString(entry.theological_insight)];
    }),
    ...asArray(candidate.theological_interpretation).map((item) => asString(asObject(item).interpretation)),
    ...asArray(candidate.biblical_connections).map((item) => asString(asObject(item).note)),
    ...asArray(candidate.application).flatMap((item) => {
      const entry = asObject(item);
      return [asString(entry.application), asString(entry.practical_action)];
    }),
    ...asArray(candidate.reflection_questions).map((item) => asString(asObject(item).question)),
    asString(candidate.conclusion),
    asString(candidate.pastoral_warning),
  ].join(" ").split(/\s+/).filter(Boolean).length;

  if (!asString(candidate.title)) issues.push("title is empty");
  if (countWords(candidate.central_idea) < 25) issues.push("central_idea is too short");
  if (countWords(candidate.summary) < requirements.summaryWords) issues.push(`summary must have at least ${requirements.summaryWords} words`);
  if (countWords(historicalContext.text) < requirements.historicalWords) issues.push(`historical_context.text must have at least ${requirements.historicalWords} words`);
  if (!asString(literaryContext.genre)) issues.push("literary_context.genre is empty");
  if (countWords(literaryContext.position_in_book) < requirements.literaryWords) issues.push(`literary_context.position_in_book must have at least ${requirements.literaryWords} words`);
  if (asArray(candidate.text_structure).length < requirements.textStructureCount) issues.push(`text_structure must have at least ${requirements.textStructureCount} items`);
  if (asArray(candidate.bible_text).length < 1) issues.push("bible_text must contain at least 1 item");
  if (asArray(candidate.exegesis).length < requirements.exegesisCount) issues.push(`exegesis must have at least ${requirements.exegesisCount} items`);
  if (asArray(candidate.theological_interpretation).length < requirements.theologyCount) issues.push(`theological_interpretation must have at least ${requirements.theologyCount} items`);
  if (asArray(candidate.biblical_connections).length < requirements.connectionsCount) issues.push(`biblical_connections must have at least ${requirements.connectionsCount} items`);
  if (asArray(candidate.application).length < requirements.applicationCount) issues.push(`application must have at least ${requirements.applicationCount} items`);
  if (asArray(candidate.reflection_questions).length < requirements.questionsCount) issues.push(`reflection_questions must have at least ${requirements.questionsCount} items`);
  if (countWords(candidate.conclusion) < requirements.conclusionWords) issues.push(`conclusion must have at least ${requirements.conclusionWords} words`);
  if (asArray(candidate.rag_sources_used).length > 0) issues.push("rag_sources_used must be an empty array when no real retrieval source was provided");
  if (totalWords < requirements.totalWords) issues.push(`study must have at least ${requirements.totalWords} words in total`);

  return issues;
}

async function requestStudyGeneration({
  geminiApiKey,
  systemPrompt,
  userPrompt,
}: {
  geminiApiKey: string;
  systemPrompt: string;
  userPrompt: string;
}) {
  const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${geminiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const status = aiResponse.status;
    const errText = await aiResponse.text();
    console.error("AI error:", status, errText);

    if (status === 429) return { error: jsonResponse({ error: "Rate limited. Try again later." }, 429) };
    if (status === 402) return { error: jsonResponse({ error: "AI credits exhausted." }, 402) };

    return { error: jsonResponse({ error: "AI generation failed" }, 502) };
  }

  const aiData = await aiResponse.json();
  const finishReason = aiData.choices?.[0]?.finish_reason || "";
  const rawContent = (aiData.choices?.[0]?.message?.content || "")
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  return {
    rawContent,
    usage: aiData.usage || null,
    truncated: finishReason === "length",
  };
}

interface RequestBody {
  bible_passage: string;
  theme?: string;
  language?: string;
  bible_version?: string;
  doctrine_line?: string;
  pastoral_voice?: string;
  depth_level?: string;
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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY');

    if (!geminiApiKey) {
      return jsonResponse({ error: "GEMINI_API_KEY not configured" }, 500);
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

    const body: RequestBody = await req.json();
    const {
      bible_passage,
      theme = "",
      language = "PT",
      bible_version = "ARA",
      doctrine_line = "evangelical_general",
      pastoral_voice = "welcoming",
      depth_level = "intermediate",
    } = body;

    if (!bible_passage) {
      return jsonResponse({ error: "bible_passage is required" }, 400);
    }

    // Fetch user profile for generation limits
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, plan, generations_used, generations_limit")
      .eq("id", userId)
      .maybeSingle();

    const generationsUsed = profile?.generations_used || 0;
    const generationsLimit = profile?.generations_limit || 5;

    if (generationsUsed >= generationsLimit) {
      return jsonResponse({ error: "generation_limit_reached" }, 429);
    }

    const langMap: Record<string, string> = {
      PT: "Portuguese (Brazilian)",
      EN: "English",
      ES: "Spanish",
    };
    const targetLang = langMap[language] || "Portuguese (Brazilian)";

    const depthMap: Record<string, string> = {
      basic: "basic level for beginners, cell groups, and new believers",
      intermediate: "intermediate level for leaders and teachers",
      advanced: "advanced level for pastors and theologians with deep exegetical analysis",
    };
    const depthDesc = depthMap[depth_level] || depthMap.intermediate;

    // Detect sensitive topics
    const sensitiveTopics = [
      "suicídio", "suicide", "suicidio",
      "abuso", "abuse",
      "divórcio", "divorce", "divorcio",
      "depressão", "depression", "depresion",
      "morte", "death", "muerte",
      "aborto", "abortion",
      "sexualidade", "sexuality", "sexualidad",
      "violência", "violence", "violencia",
    ];
    const passageLower = bible_passage.toLowerCase() + " " + (theme || "").toLowerCase();
    const detectedTopic = sensitiveTopics.find((t) => passageLower.includes(t)) || null;
    const cautionMode = !!detectedTopic;
    const requirements = getRequirements(depth_level);

    const cautionInstruction = cautionMode
      ? `\n\nIMPORTANT: The topic "${detectedTopic}" is pastorally sensitive. Use careful, welcoming, non-judgmental language. Include a pastoral_warning at the end recommending consultation with a qualified pastor or Christian counselor.`
      : "";

    const systemPrompt = `You are a world-class biblical scholar and theologian. You produce rigorous, academically-informed biblical studies rooted in the ${doctrine_line} tradition with a ${pastoral_voice} pastoral voice.

Your output MUST be a valid JSON object matching the exact schema below. Do NOT include markdown code fences. Output ONLY the JSON object.
This study must be fully structured, substantial, and long enough to read like at least 3 pages when assembled in the UI. Do not collapse sections into short notes.
You do NOT have a live retrieval system in this request. Never invent retrieval provenance. Set "rag_sources_used" to an empty array.

Schema:
{
  "schema_version": "1.0",
  "title": "string",
  "bible_passage": "string",
  "central_idea": "string (2-3 dense sentences)",
  "summary": "string (${requirements.summaryWords}-${requirements.summaryWords + 120} words)",
  "depth_level": "${depth_level}",
  "doctrine_line": "${doctrine_line}",
  "language": "${language}",
  "historical_context": { "text": "string (${requirements.historicalWords}-${requirements.historicalWords + 140} words)", "source_confidence": "high|medium|low" },
  "literary_context": { "genre": "string", "position_in_book": "string (${requirements.literaryWords}-${requirements.literaryWords + 90} words)", "source_confidence": "high|medium|low" },
  "text_structure": [{ "section": "string", "verses": "string", "description": "string" }],
  "bible_text": [{ "reference": "string", "text": "string (the actual biblical text)", "version": "${bible_version}" }],
  "exegesis": [{ "focus": "string", "linguistic_note": "string", "theological_insight": "string", "source_confidence": "high|medium|low" }],
  "theological_interpretation": [{ "perspective": "string", "interpretation": "string", "is_debated": boolean, "sources": ["string"], "source_confidence": "high|medium|low" }],
  "biblical_connections": [{ "passage": "string", "relationship": "typology|fulfillment|parallel|contrast|echo", "note": "string" }],
  "application": [{ "context": "string", "application": "string", "practical_action": "string" }],
  "reflection_questions": [{ "question": "string", "target_audience": "string" }],
  "conclusion": "string (${requirements.conclusionWords}-${requirements.conclusionWords + 120} words)",
  "pastoral_warning": "string (empty if not applicable)",
  "rag_sources_used": ["string"]
}

Minimum structure requirements:
- text_structure: at least ${requirements.textStructureCount} items
- exegesis: at least ${requirements.exegesisCount} items
- theological_interpretation: at least ${requirements.theologyCount} items
- biblical_connections: at least ${requirements.connectionsCount} items
- application: at least ${requirements.applicationCount} items
- reflection_questions: at least ${requirements.questionsCount} items
- total study length: at least ${requirements.totalWords} words across all narrative fields

Write everything in ${targetLang}. Depth: ${depthDesc}.${cautionInstruction}`;

    const baseUserPrompt = `Generate a complete biblical study for: ${bible_passage} (${bible_version}).${theme ? ` Focus theme: ${theme}.` : ""}
Build every section fully. Do not summarize the whole study into 3 short paragraphs. Return ONLY the JSON object.`;

    const startTime = Date.now();
    const usageTotals = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    let study: Record<string, unknown> | null = null;
    let lastIssues: string[] = [];
    let lastRawContent = "";
    let attemptsUsed = 0;

    for (let attempt = 1; attempt <= 3; attempt++) {
      attemptsUsed = attempt;
      const repairPrompt = attempt === 1
        ? baseUserPrompt
        : `${baseUserPrompt}\n\nCRITICAL REVISION REQUIRED (attempt ${attempt}): your previous JSON was REJECTED for these reasons:\n- ${lastIssues.join("\n- ")}\n\nYou MUST fix ALL of the above. For any field that was "too short", write AT LEAST double the minimum word count. The conclusion MUST be a substantial, multi-paragraph reflection of at least ${requirements.conclusionWords} words. Rewrite the ENTIRE study from scratch.`;

      const generation = await requestStudyGeneration({
        geminiApiKey,
        systemPrompt,
        userPrompt: repairPrompt,
      });

      if (generation.error) return generation.error;

      if (generation.usage) {
        usageTotals.prompt_tokens += generation.usage.prompt_tokens || 0;
        usageTotals.completion_tokens += generation.usage.completion_tokens || 0;
        usageTotals.total_tokens += generation.usage.total_tokens || 0;
      }

      lastRawContent = generation.rawContent;

      try {
        const candidate = JSON.parse(lastRawContent);
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
          lastIssues = ["output is not a JSON object"];
          continue;
        }

        const validationIssues = validateStudy(candidate as Record<string, unknown>, requirements);
        if (!validationIssues.length) {
          study = candidate as Record<string, unknown>;
          break;
        }

        lastIssues = validationIssues;
        console.error(`Study validation failed on attempt ${attempt}:`, validationIssues);
      } catch {
        lastIssues = ["output could not be parsed as JSON"];
        console.error("Failed to parse AI output:", lastRawContent.substring(0, 500));
      }
    }

    if (!study) {
      return jsonResponse({ error: "schema_validation_failed", details: lastIssues }, 500);
    }

    if (usageTotals.total_tokens > 0) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      await adminClient.from("generation_logs").insert({
        user_id: userId,
        feature: "Estudo Bíblico",
        model: MODEL,
        input_tokens: usageTotals.prompt_tokens,
        output_tokens: usageTotals.completion_tokens,
        total_tokens: usageTotals.total_tokens,
        cost_usd: (usageTotals.prompt_tokens * 0.0000001 + usageTotals.completion_tokens * 0.0000004),
      });
    }

    // Save to materials table
    const { data: material } = await supabase
      .from("materials")
      .insert({
        user_id: userId,
        title: asString(study.title) || bible_passage,
        content: JSON.stringify(study),
        type: "biblical_study",
        passage: bible_passage,
        bible_version: bible_version,
        language: language,
      })
      .select("id")
      .single();

    // Increment generations_used
    await supabase
      .from("profiles")
      .update({ generations_used: generationsUsed + 1 })
      .eq("id", userId);

    return jsonResponse({
      success: true,
      material_id: material?.id || "",
      caution_mode: cautionMode,
      sensitive_topic_detected: detectedTopic,
      study,
      generation_meta: {
        model: MODEL,
        total_tokens: usageTotals.total_tokens,
        total_cost_usd: (usageTotals.prompt_tokens * 0.0000001 + usageTotals.completion_tokens * 0.0000004),
        elapsed_ms: Date.now() - startTime,
        attempts_used: attemptsUsed,
      },
    });
  } catch (e) {
    console.error("generate-biblical-study error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
