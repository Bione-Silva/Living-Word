import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Credit cost per tool (mirrors src/lib/plans.ts TOOL_CREDITS)
const TOOL_CREDITS: Record<string, number> = {
  'topic-explorer': 5,
  'verse-finder': 3,
  'historical-context': 5,
  'quote-finder': 4,
  'original-text': 4,
  'lexical': 5,
  'studio': 20,
  'biblical-study': 30,
  'free-article': 15,
  'free-article-universal': 10,
  'title-gen': 3,
  'metaphor-creator': 4,
  'bible-modernizer': 6,
  'illustrations': 10,
  'youtube-blog': 0,
  'reels-script': 15,
  'cell-group': 15,
  'social-caption': 10,
  'newsletter': 30,
  'announcements': 10,
  'trivia': 20,
  'poetry': 15,
  'kids-story': 20,
  'deep-translation': 15,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { systemPrompt, userPrompt, toolId, history } = await req.json();

    if (!systemPrompt || !userPrompt) {
      return new Response(JSON.stringify({ error: "systemPrompt and userPrompt are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Credit wallet enforcement ──
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let userId: string | undefined;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id;
    }

    const creditCost = TOOL_CREDITS[toolId] || 5; // default 5 if unknown tool

    if (userId && toolId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan, generations_used, generations_limit")
        .eq("id", userId)
        .single();

      if (profile) {
        const used = profile.generations_used || 0;
        const limit = profile.generations_limit || 500;
        const remaining = limit - used;

        if (remaining < creditCost) {
          return new Response(
            JSON.stringify({ error: "insufficient_credits", remaining, cost: creditCost }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    // ── AI generation ──
    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${geminiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(Array.isArray(history) ? history.map((m: any) => ({ role: m.role, content: m.content })) : []),
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
      console.error("AI gateway error:", status, errText);
      throw new Error("AI generation failed");
    }

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || "";

    // ── Deduct credits AFTER successful generation ──
    if (userId && toolId) {
      await supabaseAdmin.rpc("deduct_credits", { p_user_id: userId, p_amount: creditCost }).catch(() => {
        // Fallback: direct update
        supabaseAdmin
          .from("profiles")
          .update({ generations_used: (data as any).__used + creditCost })
          .eq("id", userId);
      });

      // Simple direct increment as primary method
      const { data: currentProfile } = await supabaseAdmin
        .from("profiles")
        .select("generations_used")
        .eq("id", userId)
        .single();

      if (currentProfile) {
        await supabaseAdmin
          .from("profiles")
          .update({ generations_used: currentProfile.generations_used + creditCost })
          .eq("id", userId);
      }
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tool error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
