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

    // 1. Update profile with personalization + theme preferences
    await supabaseAdmin
      .from("profiles")
      .update({
        language,
        doctrine: doctrine_line,
        pastoral_voice: tone,
        blog_handle: blog_handle || undefined,
        blog_name: blog_name || undefined,
        theme_color,
        font_family,
        layout_style,
        profile_completed: true,
      })
      .eq("id", user.id);

    // 2. Generate 3 devotional articles using the full generate-blog-article function
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

    // Call generate-blog-article for each topic SEQUENTIALLY to avoid rate limits
    for (const topic of topics) {
      try {
        console.log(`[Provision] Generating full article: "${topic.title}"...`);

        const articleResp = await fetch(`${supabaseUrl}/functions/v1/generate-blog-article`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            apikey: anonKey,
          },
          body: JSON.stringify({
            passage: topic.passage,
            title: topic.title,
            language,
            image_style: "oil",
          }),
        });

        if (!articleResp.ok) {
          const errText = await articleResp.text().catch(() => "");
          console.error(`[Provision] Article generation failed (${articleResp.status}): ${errText}`);
          continue;
        }

        const articleData = await articleResp.json();

        if (!articleData?.success || !articleData?.material_id) {
          console.error(`[Provision] Article not successful:`, articleData?.error);
          continue;
        }

        // Publish the article to editorial queue
        await supabaseAdmin.from("editorial_queue").insert({
          user_id: user.id,
          material_id: articleData.material_id,
          status: "published",
          published_at: new Date().toISOString(),
        });

        results.push({
          title: articleData.title || topic.title,
          material_id: articleData.material_id,
        });

        console.log(`[Provision] Article created: "${topic.title}" with ${articleData.article_images?.length || 0} images`);

        // Delay between articles to avoid rate limiting
        await new Promise(r => setTimeout(r, 3000));
      } catch (e) {
        console.error("[Provision] Article generation failed:", e);
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
