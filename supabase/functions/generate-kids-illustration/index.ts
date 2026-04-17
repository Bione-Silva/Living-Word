import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function generateWithHuggingFace(prompt: string, hfToken: string): Promise<string | null> {
  console.log("[generate-kids-illustration] Trying Hugging Face SDXL...");
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
      console.error(`[generate-kids-illustration] HF error (${resp.status}): ${errText}`);
      return null;
    }

    const arrayBuffer = await resp.arrayBuffer();
    if (arrayBuffer.byteLength < 1000) {
      console.error("[generate-kids-illustration] HF returned too-small response");
      return null;
    }

    // Convert to base64 data URL
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));
    console.log("[generate-kids-illustration] ✅ Image generated via Hugging Face");
    return `data:image/png;base64,${base64}`;
  } catch (err) {
    console.error("[generate-kids-illustration] HF exception:", err);
    return null;
  }
}

async function generateWithGemini(prompt: string, lovableApiKey: string): Promise<string | null> {
  console.log("[generate-kids-illustration] Trying Gemini (fallback)...");
  try {
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error(`[generate-kids-illustration] Gemini error (${aiResp.status}): ${errText}`);
      return null;
    }

    const aiData = await aiResp.json();
    const imageUrl = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl || !imageUrl.startsWith("data:image")) {
      console.error("[generate-kids-illustration] No image in Gemini response");
      return null;
    }

    console.log("[generate-kids-illustration] ✅ Image generated via Gemini (fallback)");
    return imageUrl;
  } catch (err) {
    console.error("[generate-kids-illustration] Gemini exception:", err);
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
    const hfToken = Deno.env.get("HF_TOKEN") || "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

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

    const { character_name, story_title, type } = await req.json();

    if (!character_name) {
      return new Response(JSON.stringify({ error: "character_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isDrawing = type === "drawing";
    const prompt = isDrawing
      ? `Colorful children's Bible coloring page illustration of ${character_name}, story "${story_title || ""}". Cartoon style, friendly characters, vibrant colors, storybook feel, simple outlines, cute, age-appropriate, white background`
      : `Beautiful warm children's book illustration of the Bible character ${character_name} in the story "${story_title || ""}". Storybook watercolor style, friendly characters, warm golden light, vibrant colors, age-appropriate, no text`;

    console.log(`[generate-kids-illustration] Generating ${isDrawing ? "drawing" : "illustration"} for ${character_name}`);

    // Priority 1: Hugging Face
    let imageDataUrl: string | null = null;
    if (hfToken) {
      imageDataUrl = await generateWithHuggingFace(prompt, hfToken);
    } else {
      console.log("[generate-kids-illustration] HF_TOKEN not configured, skipping HF");
    }

    // Priority 2: Gemini fallback
    if (!imageDataUrl) {
      imageDataUrl = await generateWithGemini(prompt, lovableApiKey);
    }

    if (!imageDataUrl) {
      return new Response(JSON.stringify({ error: "All image generation methods failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, image_url: imageDataUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[generate-kids-illustration] Error:", err);
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
