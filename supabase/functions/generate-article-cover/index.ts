import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    const { article_id, title, content } = body;

    if (!article_id || !title) {
      return new Response(JSON.stringify({ error: "Missing article_id or title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt from title + first 200 chars of content
    const snippet = (content || "").replace(/[#*_\[\]()]/g, "").slice(0, 200);
    const prompt = `Generate a beautiful, inspirational Christian article cover image about "${title}". ${snippet ? `Context: ${snippet}.` : ""} Style: soft warm golden light, peaceful atmosphere, photorealistic, high quality, 16:9 aspect ratio, no text or letters on the image.`;

    console.log(`[generate-article-cover] Generating cover for article ${article_id}`);

    // Call Lovable AI Gateway with Gemini image model
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
      console.error(`[generate-article-cover] AI error (${aiResp.status}): ${errText}`);
      return new Response(JSON.stringify({ error: "Image generation failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const imageUrl = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl || !imageUrl.startsWith("data:image")) {
      console.error("[generate-article-cover] No image in AI response");
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64
    const base64Data = imageUrl.split(",")[1];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const filePath = `${user.id}/${article_id}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("article-covers")
      .upload(filePath, bytes, {
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
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
