import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SITE_URL = "https://living-word.lovable.app";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const handle = url.searchParams.get("handle");
  const articleId = url.searchParams.get("articleId");

  if (!handle || !articleId) {
    return new Response(JSON.stringify({ error: "Missing handle or articleId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [{ data: articleRows }, { data: profileRows }] = await Promise.all([
    supabase.rpc("get_public_blog_article", { p_article_id: articleId }),
    supabase.rpc("get_public_blog_profile", { p_handle: handle }),
  ]);

  const article = Array.isArray(articleRows) ? articleRows[0] : articleRows;
  const profile = Array.isArray(profileRows) ? profileRows[0] : profileRows;

  if (!article) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const title = escapeHtml(article.title || "Living Word");
  const authorName = escapeHtml(profile?.full_name || "Living Word");
  const description = escapeHtml(
    (article.content || "")
      .replace(/[#*_\[\]()>`~\n]/g, " ")
      .substring(0, 160)
      .trim() + "…"
  );
  const coverImage = article.cover_image_url || "";
  const articleUrl = `${SITE_URL}/blog/${handle}/${articleId}`;
  const locale =
    article.language === "EN" ? "en_US" : article.language === "ES" ? "es_ES" : "pt_BR";

  const html = `<!DOCTYPE html>
<html lang="${locale.substring(0, 2)}">
<head>
  <meta charset="UTF-8"/>
  <title>${title} — ${authorName}</title>
  <meta name="description" content="${description}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:url" content="${articleUrl}"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description}"/>
  <meta property="og:image" content="${escapeHtml(coverImage)}"/>
  <meta property="og:site_name" content="${authorName} — Living Word"/>
  <meta property="og:locale" content="${locale}"/>
  <meta property="article:published_time" content="${article.created_at}"/>
  <meta property="article:author" content="${authorName}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${description}"/>
  <meta name="twitter:image" content="${escapeHtml(coverImage)}"/>
  <meta http-equiv="refresh" content="0;url=${articleUrl}"/>
</head>
<body>
  <p>Redirecting to <a href="${articleUrl}">${title}</a>…</p>
</body>
</html>`;

  return new Response(html, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});
