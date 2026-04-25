import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildImagePrompt } from "../_shared/image-styles.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function generateWithHuggingFace(prompt: string, hfToken: string): Promise<Uint8Array | null> {
  console.log("[generate-article-cover] Trying Hugging Face SDXL...");
  try {
    const resp = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[generate-article-cover] HF error (${resp.status}): ${errText}`);
      return null;
    }

    const arrayBuffer = await resp.arrayBuffer();
    if (arrayBuffer.byteLength < 1000) {
      console.error("[generate-article-cover] HF returned too-small response");
      return null;
    }

    console.log("[generate-article-cover] ✅ Image generated via Hugging Face");
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.error("[generate-article-cover] HF exception:", err);
    return null;
  }
}

async function generateWithGemini(prompt: string, geminiKey: string): Promise<Uint8Array | null> {
  console.log("[generate-article-cover] Trying Gemini (API nativa)...");
  try {
    const aiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error(`[generate-article-cover] Gemini error (${aiResp.status}): ${errText}`);
      return null;
    }

    const aiData = await aiResp.json();
    const b64 = aiData?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

    if (!b64) {
      console.error("[generate-article-cover] No image in Gemini response");
      return null;
    }

    const binaryStr = atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    console.log("[generate-article-cover] ✅ Image generated via Gemini");
    return bytes;
  } catch (err) {
    console.error("[generate-article-cover] Gemini exception:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hfToken = Deno.env.get("HF_TOKEN") || "";
    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;

    // Auth
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { article_id, title, content } = body;

    if (!article_id || !title) {
      return new Response(JSON.stringify({ error: "Missing article_id or title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snippet = (content || "").replace(/[#*_\[\]()]/g, "").slice(0, 150);

    // Prompt com variação fotográfica realista (rotação por article_id + título)
    const prompt = buildImagePrompt({
      title,
      context: snippet || undefined,
      seed: `${article_id}-${title}`,
      aspectRatio: '16:9',
    });

    console.log(`[generate-article-cover] Generating cover for article ${article_id}`);

    // Priority 1: Hugging Face
    let imageBytes: Uint8Array | null = null;
    if (hfToken) {
      imageBytes = await generateWithHuggingFace(prompt, hfToken);
    } else {
      console.log("[generate-article-cover] HF_TOKEN not configured, skipping HF");
    }

    // Priority 2: Gemini fallback
    if (!imageBytes) {
      imageBytes = await generateWithGemini(prompt, geminiKey);
    }

    if (!imageBytes) {
      return new Response(JSON.stringify({ error: "All image generation methods failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to Supabase Storage
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const filePath = `${user.id}/${article_id}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("article-covers")
      .upload(filePath, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-article-cover] Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("article-covers")
      .getPublicUrl(filePath);

    const coverUrl = publicUrlData.publicUrl;

    // Update material with cover_image_url
    const { error: updateError } = await supabaseAdmin
      .from("materials")
      .update({ cover_image_url: coverUrl })
      .eq("id", article_id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[generate-article-cover] DB update error:", updateError);
    }

    console.log(`[generate-article-cover] Cover generated and saved: ${coverUrl}`);

    return new Response(
      JSON.stringify({ success: true, cover_image_url: coverUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("[generate-article-cover] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
