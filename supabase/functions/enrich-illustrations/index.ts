import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const IMAGE_MODEL = "google/gemini-2.5-flash-image";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { material_id } = await req.json();

    if (!material_id) {
      return new Response(JSON.stringify({ error: "material_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the material
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: material, error: matErr } = await supabaseAdmin
      .from("materials")
      .select("id, content, title, passage, user_id")
      .eq("id", material_id)
      .single();

    if (matErr || !material) {
      return new Response(JSON.stringify({ error: "Material not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (material.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract 3 visual scenes from the study content
    const contentText = typeof material.content === "string"
      ? material.content.substring(0, 2000)
      : JSON.stringify(material.content).substring(0, 2000);

    const sceneResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        tools: [{
          type: "function",
          function: {
            name: "extract_scenes",
            description: "Extract 3 visual scenes from a biblical study for watercolor illustration",
            parameters: {
              type: "object",
              properties: {
                scenes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      prompt: {
                        type: "string",
                        description: "A detailed prompt for generating a biblical watercolor illustration. Include the scene, characters, setting, and mood. Always include: 'subtle biblical watercolor style, warm earth tones, elegant and reverent, soft lighting'"
                      }
                    },
                    required: ["prompt"]
                  },
                  minItems: 3,
                  maxItems: 3
                }
              },
              required: ["scenes"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_scenes" } },
        messages: [
          {
            role: "system",
            content: "You are a biblical art director. Extract 3 key visual moments from a biblical study that would make beautiful watercolor illustrations. Focus on dramatic or emotionally resonant scenes from the passage."
          },
          {
            role: "user",
            content: `Study title: ${material.title}\nPassage: ${material.passage || "N/A"}\n\nContent:\n${contentText}`
          }
        ],
      }),
    });

    if (!sceneResponse.ok) {
      console.error("Scene extraction failed:", await sceneResponse.text());
      return new Response(JSON.stringify({ error: "Failed to extract scenes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sceneData = await sceneResponse.json();
    const toolCall = sceneData.choices?.[0]?.message?.tool_calls?.[0];
    let scenes: { prompt: string }[] = [];
    try {
      const args = JSON.parse(toolCall.function.arguments);
      scenes = args.scenes;
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse scenes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 3 images in parallel
    const imagePromises = scenes.slice(0, 3).map(async (scene, idx) => {
      try {
        const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: scene.prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!imgResp.ok) {
          console.error(`Image ${idx} generation failed:`, imgResp.status);
          return null;
        }

        const imgData = await imgResp.json();
        const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!imageUrl) return null;

        // Upload to storage
        const base64 = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const filePath = `${user.id}/study-illustrations/${material_id}_${idx}.png`;

        const { error: uploadErr } = await supabaseAdmin.storage
          .from("blog-images")
          .upload(filePath, bytes, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadErr) {
          console.error(`Upload error for image ${idx}:`, uploadErr);
          return null;
        }

        const { data: publicUrl } = supabaseAdmin.storage
          .from("blog-images")
          .getPublicUrl(filePath);

        return publicUrl.publicUrl;
      } catch (e) {
        console.error(`Image ${idx} error:`, e);
        return null;
      }
    });

    const imageUrls = (await Promise.all(imagePromises)).filter(Boolean) as string[];

    if (imageUrls.length === 0) {
      return new Response(JSON.stringify({ error: "No images generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update material with article_images
    const { error: updateErr } = await supabaseAdmin
      .from("materials")
      .update({ article_images: imageUrls })
      .eq("id", material_id);

    if (updateErr) {
      console.error("Update error:", updateErr);
    }

    // Log usage
    await supabaseAdmin.from("generation_logs").insert({
      user_id: user.id,
      feature: "study_illustrations",
      model: IMAGE_MODEL,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      cost_usd: imageUrls.length * 0.02,
    });

    return new Response(
      JSON.stringify({ success: true, images: imageUrls }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("enrich-illustrations error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
