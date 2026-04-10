import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const sb = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sermon, language = "PT" } = await req.json();
    if (!sermon) {
      return new Response(JSON.stringify({ error: "Missing sermon content" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langLabel = language === "EN" ? "English" : language === "ES" ? "Spanish" : "Portuguese";

    const systemPrompt = `You are a carousel slide designer for church sermons. Given a sermon in Markdown, extract and summarize into exactly 6-8 slides for a social media carousel. Reply ONLY with valid JSON.

Output format:
{
  "slides": [
    { "type": "cover", "title": "Sermon Title", "body": "Subtitle or theme", "reference": "Main verse" },
    { "type": "verse", "title": "Key Verse", "body": "Full verse text", "reference": "Book Chapter:Verse" },
    { "type": "point", "title": "Point 1 Title", "body": "Summary of point 1 in 2-3 sentences" },
    { "type": "point", "title": "Point 2 Title", "body": "Summary of point 2 in 2-3 sentences" },
    { "type": "point", "title": "Point 3 Title", "body": "Summary of point 3 in 2-3 sentences" },
    { "type": "application", "title": "Practical Application", "body": "Action items" },
    { "type": "conclusion", "title": "Conclusion", "body": "Closing thought or call to action" }
  ]
}

Rules:
- All text in ${langLabel}
- Keep slide text concise (max 40 words per body)
- Use the original sermon references
- Make titles impactful and memorable`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: sermon.slice(0, 8000) },
        ],
        temperature: 0.5,
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse carousel JSON:", content);
      return new Response(JSON.stringify({ error: "Failed to parse carousel data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-sermon-carousel error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
