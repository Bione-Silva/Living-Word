import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_MODEL = "google/gemini-2.5-flash-image";

async function generateImageWithRetry(
  geminiApiKey: string,
  prompt: string,
  supabaseAdmin: any,
  userId: string,
  maxRetries = 2
): Promise<string | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Image] Attempt ${attempt + 1} with model ${IMAGE_MODEL}`);

      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 3000 * attempt));
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${geminiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`[Image] HTTP ${response.status}: ${errText}`);
        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        if (response.status === 402) {
          console.error("[Image] Payment required — skipping");
          return null;
        }
        continue;
      }

      const data = await response.json();
      let imageUrl: string | null = null;

      const images = data.choices?.[0]?.message?.images;
      if (images && images.length > 0) {
        imageUrl = images[0]?.image_url?.url || images[0]?.url || null;
      }

      if (!imageUrl) {
        const content = data.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.includes("data:image")) {
          const match = content.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/);
          if (match) imageUrl = match[1];
        }
        if (Array.isArray(content)) {
          for (const part of content) {
            if (part.type === "image_url") {
              imageUrl = part.image_url?.url || null;
              break;
            }
            if (part.type === "image" && part.data) {
              imageUrl = `data:image/png;base64,${part.data}`;
              break;
            }
          }
        }
      }

      if (!imageUrl || !imageUrl.startsWith("data:image")) {
        console.error(`[Image] No valid base64 image found`);
        continue;
      }

      const base64Data = imageUrl.split(",")[1];
      if (!base64Data) continue;

      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const imagePath = `${userId}/${crypto.randomUUID()}.png`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from("blog-images")
        .upload(imagePath, imageBytes, { contentType: "image/png", upsert: true });

      if (uploadErr) {
        console.error("[Image] Upload error:", uploadErr);
        continue;
      }

      const { data: publicUrl } = supabaseAdmin.storage
        .from("blog-images")
        .getPublicUrl(imagePath);

      const url = publicUrl?.publicUrl || null;
      if (url) {
        console.log(`[Image] Success: ${url.substring(0, 80)}...`);
        return url;
      }
    } catch (err) {
      console.error(`[Image] Exception attempt ${attempt + 1}:`, err);
    }
  }
  console.error("[Image] All attempts failed");
  return null;
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
    const geminiApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!geminiApiKey) {
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

    const { passage, language: requestedLanguage, title: inputTitle, image_style, source_content, source_type } = await req.json();

    if (!passage) {
      return new Response(JSON.stringify({ error: "passage is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, doctrine, pastoral_voice, bible_version, language, plan, generations_used, generations_limit")
      .eq("id", userId)
      .maybeSingle();

    // Credit check (15 credits for blog article)
    const creditCost = 15;
    const generationsUsed = profile?.generations_used || 0;
    const generationsLimit = profile?.generations_limit || 500;
    if ((generationsLimit - generationsUsed) < creditCost) {
      return new Response(
        JSON.stringify({ error: "insufficient_credits", remaining: generationsLimit - generationsUsed, cost: creditCost }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
- A compelling title (H1) — ONLY the article topic, NEVER include prefixes like "Blog", "Artigos", "Blog & Artigos", "Devotional", category labels, or any similar prefix. Just the topic itself, e.g. "Ressurreição de Lázaro", not "Blog & Artigos — Ressurreição de Lázaro".
- Opening reflection (2-3 paragraphs)
- Bible passage reference and commentary with historical and cultural context
- At least 3-4 distinct sections with H2/H3 headings for depth and visual structure
- Practical application for daily life
- Closing prayer or reflection
The article MUST have between 500 and 800 words. Structure it like a well-organized sermon with scannable sections (use H2/H3 headings). Be warm, theologically sound, and accessible. Use at least 4 H2/H3 headings throughout.`;

    const userPrompt = source_content
      ? `Transform the following ${source_type || "source material"} into a devotional blog article about "${passage}"${inputTitle ? ` with the title "${inputTitle}"` : ""}. Preserve the strongest ideas, restructure it with a polished H1/H2/H3 blog flow, and return only Markdown.\n\nSOURCE MATERIAL:\n${source_content}`
      : inputTitle
        ? `Write a devotional article about "${passage}" with the title "${inputTitle}".`
        : `Write a devotional article based on the passage: ${passage}.`;

    // Generate article content
    console.log("[Article] Generating text content...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${geminiApiKey}`,
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

    console.log(`[Article] Text generated: ${content.length} chars`);

    // Log generation for AI billing
    const usage = aiData.usage;
    if (usage) {
      await supabaseAdmin.from("generation_logs").insert({
        user_id: userId,
        feature: "Blog Creator",
        model: "google/gemini-2.5-flash",
        input_tokens: usage.prompt_tokens || 0,
        output_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
        cost_usd: ((usage.prompt_tokens || 0) * 0.000003 + (usage.completion_tokens || 0) * 0.000015),
      });
    }

    const h1Match = content.match(/^#\s+(.+)$/m);
    let articleTitle = inputTitle || h1Match?.[1] || passage;
    articleTitle = articleTitle.replace(/^(Blog\s*&?\s*Artigos?\s*[-—–:]\s*)/i, '').trim();

    // Image style mapping — enhanced prompts for professional quality
    const styleMap: Record<string, string> = {
      oil: "Warm earth tones, golden hour lighting, painterly oil painting style with rich brushstrokes and classical Renaissance composition. Deep shadows and luminous highlights. Museum-quality fine art feel.",
      watercolor: "Soft watercolor style with gentle washes, transparent layers, warm pastel earth tones, and flowing organic edges. Delicate brushwork reminiscent of classical botanical illustrations. Ethereal and contemplative mood.",
      minimalist: "Clean minimalist illustration with simple geometric shapes, muted earth tones, flat design with subtle gradients. Modern editorial art style with generous negative space and sophisticated color palette.",
      photographic: "Cinematic photograph with dramatic natural lighting, shallow depth of field, warm color grading. Professional editorial photography style with rich textures and atmospheric perspective.",
    };
    const artStyle = styleMap[image_style] || styleMap["oil"];

    // Extract H2/H3 headings for contextual body images
    const headings = [...content.matchAll(/^#{2,3}\s+(.+)$/gm)].map(m => m[1]);
    const numBodyImages = Math.min(Math.max(headings.length, 2), 4); // 2-4 body images

    // Cover image prompt — wide landscape format (1200x630 aspect)
    const coverPrompt = `Create a stunning, wide-format horizontal illustration (landscape aspect ratio, approximately 1200x630 pixels). A historically accurate, epoch-representative scene from the Bible passage "${passage}". Ancient Middle Eastern setting with period-appropriate architecture, clothing, and landscape. Cinematic wide composition with dramatic depth. ${artStyle} ABSOLUTELY NO text, no words, no letters, no watermarks. Professional quality suitable for a blog header.`;

    // Body image prompts — one per section heading
    const bodyPrompts: string[] = [];
    for (let i = 0; i < numBodyImages; i++) {
      const heading = headings[i];
      if (heading) {
        bodyPrompts.push(
          `Create a contemplative biblical illustration representing the concept "${heading}" related to "${passage}". Square composition (1:1 aspect ratio). ${artStyle} Ancient Middle Eastern setting with authentic period details. Rich visual storytelling with symbolic elements. ABSOLUTELY NO text, no words, no letters, no watermarks.`
        );
      } else {
        const fallbacks = [
          `A peaceful biblical landscape representing spiritual reflection on "${passage}". Square composition. ${artStyle} ABSOLUTELY NO text, no watermarks.`,
          `A contemplative scene of ancient worship and prayer inspired by "${passage}". Square composition. ${artStyle} ABSOLUTELY NO text, no watermarks.`,
          `An intimate biblical moment of faith and devotion related to "${passage}". Square composition. ${artStyle} ABSOLUTELY NO text, no watermarks.`,
        ];
        bodyPrompts.push(fallbacks[i % fallbacks.length]);
      }
    }

    // Generate images SEQUENTIALLY with delays to avoid rate limiting
    console.log(`[Image] Starting sequential image generation: 1 cover + ${bodyPrompts.length} body images...`);

    const coverImage = await generateImageWithRetry(geminiApiKey, coverPrompt, supabaseAdmin, userId);

    const bodyImages: (string | null)[] = [];
    for (let i = 0; i < bodyPrompts.length; i++) {
      await new Promise(r => setTimeout(r, 2000)); // delay between generations
      const img = await generateImageWithRetry(geminiApiKey, bodyPrompts[i], supabaseAdmin, userId);
      bodyImages.push(img);
    }

    const allImages: string[] = [coverImage, ...bodyImages].filter(Boolean) as string[];
    const coverImageUrl = coverImage || null;

    console.log(`[Article] Images generated: ${allImages.length}/${1 + bodyPrompts.length} successful`);

    // Deduct credits (15 for blog article)
    await supabase
      .from("profiles")
      .update({ generations_used: generationsUsed + creditCost })
      .eq("id", userId);

    // Save to materials table
    const { data: material, error: matErr } = await supabase
      .from("materials")
      .insert({
        user_id: userId,
        title: articleTitle,
        type: "blog_article",
        passage,
        content,
        language: resolvedLanguage,
        bible_version: profile?.bible_version || "NVI",
        cover_image_url: coverImageUrl,
        article_images: allImages,
      } as any)
      .select("id")
      .single();

    if (matErr) {
      console.error("Material insert error:", matErr);
      throw new Error("Failed to save article");
    }

    return new Response(
      JSON.stringify({
        success: true,
        material_id: material.id,
        title: articleTitle,
        content,
        passage,
        language: resolvedLanguage,
        cover_image_url: coverImageUrl,
        article_images: allImages,
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
