import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateImage(
  lovableApiKey: string,
  prompt: string,
  supabaseAdmin: any,
  userId: string
): Promise<string | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error("Image gen error:", response.status);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl || !imageUrl.startsWith("data:image")) return null;

    const base64Data = imageUrl.split(",")[1];
    if (!base64Data) return null;

    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const imagePath = `${userId}/${crypto.randomUUID()}.png`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("blog-images")
      .upload(imagePath, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return null;
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from("blog-images")
      .getPublicUrl(imagePath);

    return publicUrl?.publicUrl || null;
  } catch (err) {
    console.error("Image generation failed:", err);
    return null;
  }
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { passage, language: requestedLanguage, title: inputTitle } = await req.json();

    if (!passage) {
      return new Response(JSON.stringify({ error: "passage is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, doctrine, pastoral_voice, bible_version, language")
      .eq("id", userId)
      .maybeSingle();

    const langMap: Record<string, string> = {
      PT: "Portuguese (Brazilian)",
      EN: "English",
      ES: "Spanish",
    };
    const resolvedLanguage = requestedLanguage || profile?.language || "PT";
    const targetLang = langMap[resolvedLanguage] || "Portuguese (Brazilian)";
    const doctrine = profile?.doctrine || "evangelical";
    const voice = profile?.pastoral_voice || "acolhedor";

    const systemPrompt = `You are a pastoral content writer for Christian leaders. Write in ${targetLang}.
Style: ${voice} tone, ${doctrine} tradition.
Output a complete devotional blog article in Markdown format with:
- A compelling title (H1)
- Opening reflection (2-3 paragraphs)
- Bible passage reference and commentary with historical and cultural context
- Practical application for daily life
- Closing prayer or reflection
The article MUST have between 400 and 700 words. Structure it like a well-organized sermon with scannable sections (use H2/H3 headings). Be warm, theologically sound, and accessible.`;

    const userPrompt = inputTitle
      ? `Write a devotional article about "${passage}" with the title "${inputTitle}".`
      : `Write a devotional article based on the passage: ${passage}.`;

    // Generate article content using GPT-5 for superior writing quality
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
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
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    if (!content) throw new Error("Empty AI response");

    const h1Match = content.match(/^#\s+(.+)$/m);
    const articleTitle = inputTitle || h1Match?.[1] || `Devotional — ${passage}`;

    // Generate up to 3 images in parallel
    // Generate historically accurate, epoch-representative images (max 4)
    const imagePrompts = [
      `A historically accurate, epoch-representative scene from the Bible passage "${passage}". Ancient Middle Eastern setting with period-appropriate architecture, clothing, and landscape. If this is about Genesis, show ancient Mesopotamian aesthetics; if about Psalms, show ancient Israel with shepherds and rolling hills; if about the Gospels, show 1st century Judea. Warm earth tones, golden light, painterly oil painting style. No text, no words, no letters.`,
      `A contemplative biblical scene inspired by "${passage}" with historical accuracy. Ancient setting with period-correct details: clay vessels, olive trees, stone buildings, desert landscape. Warm golden hour light. No text or letters. Renaissance painting style.`,
      `A spiritual illustration of "${passage}" showing the cultural context of the biblical era. Include period-accurate clothing, tools, and environment. If Old Testament: ancient Near East aesthetics. If New Testament: Roman-era Judea. Artistic, warm tones, dramatic lighting. No text or words.`,
      `A serene, devotional image representing the theological message of "${passage}". Biblical landscape with divine light rays, ancient architecture in the background, warm earth and gold tones. Historical accuracy in any human figures shown. Cinematic photography style. No text.`,
    ];

    const imageResults = await Promise.allSettled(
      imagePrompts.map((prompt) => generateImage(lovableApiKey, prompt, supabaseAdmin, userId))
    );

    const articleImages: string[] = [];
    for (const result of imageResults) {
      if (result.status === "fulfilled" && result.value) {
        articleImages.push(result.value);
      }
    }

    const coverImageUrl = articleImages[0] || null;

    // Save to materials table
    const { data: material, error: matErr } = await supabase
      .from("materials")
      .insert({
        user_id: userId,
        title: articleTitle,
        type: "blog_article",
        passage,
        content,
        language,
        bible_version: profile?.bible_version || "NVI",
        cover_image_url: coverImageUrl,
        article_images: articleImages,
      } as any)
      .select("id")
      .single();

    if (matErr) {
      console.error("Material insert error:", matErr);
      throw new Error("Failed to save article");
    }

    // Publish to editorial queue
    const { error: qErr } = await supabase.from("editorial_queue").insert({
      user_id: userId,
      material_id: material.id,
      status: "published",
      published_at: new Date().toISOString(),
    });

    if (qErr) console.error("Queue insert error:", qErr);

    return new Response(
      JSON.stringify({
        success: true,
        material_id: material.id,
        title: articleTitle,
        cover_image_url: coverImageUrl,
        article_images: articleImages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-blog-article error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
