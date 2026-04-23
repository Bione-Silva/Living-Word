import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, handleCorsOptions, sanitizeField, isValidSlug } from "../_shared/cors.ts";

// ═══ Input limits (security hardening) ═══
const MAX_HANDLE_LEN = 30;
const MAX_NAME_LEN = 50;
const MAX_BODY_SIZE = 5_000;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
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

    // ═══ Input validation & sanitization ═══
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return new Response(JSON.stringify({ error: "Request body too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = JSON.parse(rawBody);

    const language = sanitizeField(body.language, 5, "PT");
    const doctrine_line = sanitizeField(body.doctrine_line, 50, "evangelical");
    const tone = sanitizeField(body.tone, 50, "acolhedor");
    const theme_color = sanitizeField(body.theme_color, 20, "amber");
    const font_family = sanitizeField(body.font_family, 30, "cormorant");
    const layout_style = sanitizeField(body.layout_style, 20, "classic");
    const blog_handle = sanitizeField(body.blog_handle, MAX_HANDLE_LEN, "").toLowerCase();
    const blog_name = sanitizeField(body.blog_name, MAX_NAME_LEN, "");

    // Validate blog_handle format (alphanumeric + hyphens only)
    if (blog_handle && !isValidSlug(blog_handle, MAX_HANDLE_LEN)) {
      return new Response(
        JSON.stringify({ error: "blog_handle must be alphanumeric with hyphens only, max 30 chars" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
            image_style: "none",  // Text-only for fast onboarding (skip image generation)
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

        // Short delay between articles to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
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
