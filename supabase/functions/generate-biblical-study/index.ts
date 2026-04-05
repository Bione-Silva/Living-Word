import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      theme = "",
      language = "PT",
      bible_version = "ARA",
      doctrine_line = "evangelical_general",
      pastoral_voice = "welcoming",
      depth_level = "intermediate",
    } = body;

    if (!bible_passage) {
      return new Response(JSON.stringify({ error: "bible_passage is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(
        JSON.stringify({ error: "generation_limit_reached" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    const cautionInstruction = cautionMode
      ? `\n\nIMPORTANT: The topic "${detectedTopic}" is pastorally sensitive. Use careful, welcoming, non-judgmental language. Include a pastoral_warning at the end recommending consultation with a qualified pastor or Christian counselor.`
      : "";

    const systemPrompt = `You are a world-class biblical scholar and theologian. You produce rigorous, academically-informed biblical studies rooted in the ${doctrine_line} tradition with a ${pastoral_voice} pastoral voice.

Your output MUST be a valid JSON object matching the exact schema below. Do NOT include markdown code fences. Output ONLY the JSON object.

Schema:
{
  "schema_version": "1.0",
  "title": "string",
  "bible_passage": "string",
  "central_idea": "string (1-2 sentences)",
  "summary": "string (150-300 words)",
  "depth_level": "${depth_level}",
  "doctrine_line": "${doctrine_line}",
  "language": "${language}",
  "historical_context": { "text": "string", "source_confidence": "high|medium|low" },
  "literary_context": { "genre": "string", "position_in_book": "string", "source_confidence": "high|medium|low" },
  "text_structure": [{ "section": "string", "verses": "string", "description": "string" }],
  "bible_text": [{ "reference": "string", "text": "string (the actual biblical text)", "version": "${bible_version}" }],
  "exegesis": [{ "focus": "string", "linguistic_note": "string", "theological_insight": "string", "source_confidence": "high|medium|low" }],
  "theological_interpretation": [{ "perspective": "string", "interpretation": "string", "is_debated": boolean, "sources": ["string"], "source_confidence": "high|medium|low" }],
  "biblical_connections": [{ "passage": "string", "relationship": "typology|fulfillment|parallel|contrast|echo", "note": "string" }],
  "application": [{ "context": "string", "application": "string", "practical_action": "string" }],
  "reflection_questions": [{ "question": "string", "target_audience": "string" }],
  "conclusion": "string (100-200 words)",
  "pastoral_warning": "string (empty if not applicable)",
  "rag_sources_used": ["string"]
}

Write everything in ${targetLang}. Depth: ${depthDesc}.${cautionInstruction}`;

    const userPrompt = `Generate a complete biblical study for: ${bible_passage} (${bible_version}).${theme ? ` Focus theme: ${theme}.` : ""} Return ONLY the JSON object.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
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
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let rawContent = aiData.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    rawContent = rawContent.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    let study;
    try {
      study = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI output:", rawContent.substring(0, 500));
      return new Response(JSON.stringify({ error: "schema_validation_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to materials table
    const { data: material } = await supabase
      .from("materials")
      .insert({
        user_id: userId,
        title: study.title || bible_passage,
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

    return new Response(
      JSON.stringify({
        success: true,
        material_id: material?.id || "",
        caution_mode: cautionMode,
        sensitive_topic_detected: detectedTopic,
        study,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-biblical-study error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
