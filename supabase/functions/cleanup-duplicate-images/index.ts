import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Removes duplicate consecutive image lines from markdown content.
 * Pattern: two image lines (![...](url)) within 1-2 lines of each other
 * with the same URL → keep only the first one.
 * Also removes cases where two different-URL images appear back-to-back
 * after the same heading (keeps only the second, which is the newer/better one).
 */
function deduplicateImages(content: string): { cleaned: string; removedCount: number } {
  const lines = content.split("\n");
  const imagePattern = /^\s*!\[.*?\]\((.*?)\)\s*$/;
  const toRemove = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const matchA = lines[i].match(imagePattern);
    if (!matchA) continue;

    // Look ahead up to 3 lines for another image (allowing blank lines between)
    for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
      // Skip blank lines
      if (lines[j].trim() === "") continue;

      const matchB = lines[j].match(imagePattern);
      if (matchB) {
        // Two images close together — remove the first one (older/duplicate)
        toRemove.add(i);
        // Also remove surrounding blank lines that were part of the insertion
        if (i > 0 && lines[i - 1].trim() === "") toRemove.add(i - 1);
        if (i + 1 < lines.length && lines[i + 1].trim() === "" && i + 1 < j) toRemove.add(i + 1);
        break;
      } else {
        // Non-blank, non-image line — stop looking
        break;
      }
    }
  }

  if (toRemove.size === 0) {
    return { cleaned: content, removedCount: 0 };
  }

  const cleaned = lines.filter((_, idx) => !toRemove.has(idx)).join("\n");
  // Collapse triple+ blank lines into double
  const collapsed = cleaned.replace(/\n{4,}/g, "\n\n\n");
  return { cleaned: collapsed, removedCount: toRemove.size };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond({ error: "No auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const sbAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: ue } = await sbAuth.auth.getUser();
    if (ue || !user) return respond({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await sbAuth.rpc("is_admin");
    if (!isAdmin) return respond({ error: "Admin only" }, 403);

    // Fetch all blog articles with content
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: articles, error: fetchErr } = await admin
      .from("materials")
      .select("id, content, user_id")
      .eq("type", "blog_article")
      .not("content", "is", null);

    if (fetchErr) {
      console.error("[cleanup] Fetch error:", fetchErr);
      return respond({ error: "Failed to fetch articles" }, 500);
    }

    let totalFixed = 0;
    let totalImagesRemoved = 0;
    const fixedIds: string[] = [];

    for (const article of articles || []) {
      if (!article.content) continue;

      const { cleaned, removedCount } = deduplicateImages(article.content);
      if (removedCount === 0) continue;

      const { error: updateErr } = await admin
        .from("materials")
        .update({ content: cleaned })
        .eq("id", article.id);

      if (updateErr) {
        console.warn(`[cleanup] Failed to update article ${article.id}:`, updateErr);
        continue;
      }

      totalFixed++;
      totalImagesRemoved += removedCount;
      fixedIds.push(article.id);
      console.log(`[cleanup] Fixed article ${article.id}: removed ${removedCount} duplicate lines`);
    }

    console.log(`[cleanup] ✅ Done. Fixed ${totalFixed} articles, removed ${totalImagesRemoved} duplicate lines total.`);
    return respond({
      success: true,
      articles_scanned: articles?.length || 0,
      articles_fixed: totalFixed,
      duplicate_lines_removed: totalImagesRemoved,
      fixed_article_ids: fixedIds,
    });
  } catch (err) {
    console.error("[cleanup] Error:", err);
    return respond({ error: (err as Error).message || "Internal error" }, 500);
  }
});
