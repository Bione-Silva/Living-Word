import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Service role client for storage uploads
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

    const { passage, language = "PT", title: inputTitle } = await req.json();

    if (!passage) {
      return new Response(JSON.stringify({ error: "passage is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, doctrine, pastoral_voice, bible_version")
      .eq("id", userId)
      .maybeSingle();

    const langMap: Record<string, string> = {
      PT: "Portuguese (Brazilian)",
      EN: "English",
      ES: "Spanish",
    };
    const targetLang = langMap[language] || "Portuguese (Brazilian)";
    const doctrine = profile?.doctrine || "evangelical";
    const voice = profile?.pastoral_voice || "acolhedor";

    const systemPrompt = `You are a pastoral content writer for Christian leaders. Write in ${targetLang}.
Style: ${voice} tone, ${doctrine} tradition.
Output a complete devotional blog article in Markdown format with:
- A compelling title (H1)
- Opening reflection (2-3 paragraphs)
- Bible passage reference and commentary
- Practical application for daily life
- Closing prayer
Keep it between 400-600 words. Be warm, theologically sound, and accessible.`;

    const userPrompt = inputTitle
      ? `Write a devotional article about "${passage}" with the title "${inputTitle}".`
      : `Write a devotional article based on the passage: ${passage}.`;

    // Call Lovable AI for article content
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
      console.error("AI error:", status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    if (!content) {
      throw new Error("Empty AI response");
    }

    // Extract title from markdown H1 or use input title
    const h1Match = content.match(/^#\s+(.+)$/m);
    const articleTitle = inputTitle || h1Match?.[1] || `Devotional — ${passage}`;

    // Generate cover image using AI
    let coverImageUrl: string | null = null;
    try {
      const imagePrompt = `A beautiful, warm, serene Christian devotional cover image for an article about "${passage}". Pastoral landscape with soft golden light, peaceful atmosphere. No text, no words, no letters. Photographic style, high quality, warm tones.`;

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          prompt: imagePrompt,
          n: 1,
          size: "1024x576",
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const b64 = imageData.data?.[0]?.b64_json;
        if (b64) {
          const imageBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
          const imagePath = `${userId}/${crypto.randomUUID()}.png`;

          const { error: uploadErr } = await supabaseAdmin.storage
            .from("blog-images")
            .upload(imagePath, imageBytes, { contentType: "image/png", upsert: true });

          if (!uploadErr) {
            const { data: publicUrl } = supabaseAdmin.storage
              .from("blog-images")
              .getPublicUrl(imagePath);
            coverImageUrl = publicUrl?.publicUrl || null;
          } else {
            console.error("Image upload error:", uploadErr);
          }
        }
      } else {
        console.error("Image generation error:", imageResponse.status);
      }
    } catch (imgErr) {
      console.error("Cover image generation failed:", imgErr);
      // Continue without image — not critical
    }

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

    if (qErr) {
      console.error("Queue insert error:", qErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        material_id: material.id,
        title: articleTitle,
        cover_image_url: coverImageUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate-blog-article error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
