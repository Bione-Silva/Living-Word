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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    // Auth client to get user
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for writes
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      language = "PT",
      doctrine_line = "evangelical",
      tone = "acolhedor",
      theme_color = "amber",
      font_family = "cormorant",
      layout_style = "classic",
      blog_handle,
      blog_name,
    } = body;

    // 1. Update profile with personalization
    await supabaseAdmin
      .from("profiles")
      .update({
        language,
        doctrine: doctrine_line,
        pastoral_voice: tone,
        blog_handle: blog_handle || undefined,
        blog_name: blog_name || undefined,
        profile_completed: true,
      })
      .eq("id", user.id);

    // 2. Generate 3 devotional articles server-side
    const articleTopics: Record<string, { passage: string; title: string }[]> = {
      PT: [
        { passage: "Salmo 23", title: "O Senhor é meu pastor: encontrando paz em tempos difíceis" },
        { passage: "Filipenses 4:13", title: "Tudo posso naquele que me fortalece" },
        { passage: "Provérbios 3:5-6", title: "Confia no Senhor de todo o teu coração" },
      ],
      EN: [
        { passage: "Psalm 23", title: "The Lord is my shepherd: finding peace" },
        { passage: "Philippians 4:13", title: "I can do all things through Christ" },
        { passage: "Proverbs 3:5-6", title: "Trust in the Lord with all your heart" },
      ],
      ES: [
        { passage: "Salmo 23", title: "El Señor es mi pastor: encontrando paz" },
        { passage: "Filipenses 4:13", title: "Todo lo puedo en Cristo que me fortalece" },
        { passage: "Proverbios 3:5-6", title: "Confía en el Señor con todo tu corazón" },
      ],
    };

    const topics = articleTopics[language] || articleTopics["PT"];
    const results: { title: string; material_id: string }[] = [];

    for (const topic of topics) {
      try {
        // Generate article content via AI
        let articleContent = "";
        if (lovableApiKey) {
          const aiResp = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "system",
                    content: `You are a pastoral writer. Write a devotional blog article in ${language === "PT" ? "Portuguese" : language === "ES" ? "Spanish" : "English"}. Tone: ${tone}. Doctrine: ${doctrine_line}. Format in markdown with a clear H1 title. About 600 words.`,
                  },
                  {
                    role: "user",
                    content: `Write a devotional article about ${topic.passage} titled "${topic.title}"`,
                  },
                ],
              }),
            }
          );
          if (aiResp.ok) {
            const aiData = await aiResp.json();
            articleContent = aiData.choices?.[0]?.message?.content || "";
          }
        }

        if (!articleContent) {
          articleContent = `# ${topic.title}\n\n> ${topic.passage}\n\nContent coming soon...`;
        }

        // Insert material
        const { data: material, error: matError } = await supabaseAdmin
          .from("materials")
          .insert({
            user_id: user.id,
            title: topic.title,
            content: articleContent,
            type: "blog_article",
            passage: topic.passage,
            language,
          })
          .select("id")
          .single();

        if (material && !matError) {
          // Insert to editorial queue as published
          await supabaseAdmin.from("editorial_queue").insert({
            user_id: user.id,
            material_id: material.id,
            status: "published",
            published_at: new Date().toISOString(),
          });
          results.push({ title: topic.title, material_id: material.id });
        }
      } catch (e) {
        console.error("Article generation failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        articles_created: results.length,
        articles: results,
        personalization: { theme_color, font_family, layout_style },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("provision-user-blog error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
