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

// ── image generation (HF → Gemini fallback) ──────────────────────────

async function generateImage(prompt: string, hfToken: string, lovableKey: string): Promise<Uint8Array | null> {
  if (hfToken) {
    try {
      const r = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0", {
        method: "POST",
        headers: { Authorization: `Bearer ${hfToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt }),
      });
      if (r.ok) {
        const ab = await r.arrayBuffer();
        if (ab.byteLength > 1000) {
          console.log("[article-images] ✅ HF ok");
          return new Uint8Array(ab);
        }
      }
      console.warn(`[article-images] HF failed (${r.status})`);
    } catch (e) {
      console.warn("[article-images] HF exception:", e);
    }
  }

  // Gemini fallback
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!r.ok) {
      console.warn(`[article-images] Gemini ${r.status}`);
      return null;
    }
    const d = await r.json();
    const url = d?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url?.startsWith("data:image")) return null;
    const bin = atob(url.split(",")[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    console.log("[article-images] ✅ Gemini ok");
    return bytes;
  } catch (e) {
    console.warn("[article-images] Gemini exception:", e);
    return null;
  }
}

// ── content analysis ─────────────────────────────────────────────────

interface Section {
  heading: string;
  lineIndex: number;
  snippet: string;
}

function analyzeSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#{2,3}\s+(.+)/);
    if (m) {
      // Skip headings that already have an image in the next 4 lines
      const nearbyLines = lines.slice(i + 1, i + 5).join("\n");
      if (/!\[.*?\]\(.*?\)/.test(nearbyLines)) continue; // already has image
      const snippet = lines
        .slice(i + 1, i + 6)
        .join(" ")
        .replace(/[#*_\[\]()>`~]/g, " ")
        .trim()
        .slice(0, 120);
      sections.push({ heading: m[1], lineIndex: i, snippet });
    }
  }
  return sections;
}

function requiredInternalImages(wordCount: number): number {
  if (wordCount >= 1200) return 4;
  if (wordCount >= 600) return 3;
  return 2;
}

// ── main ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond({ error: "No auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hfToken = Deno.env.get("HF_TOKEN") || "";
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const sbAuth = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const {
      data: { user },
      error: ue,
    } = await sbAuth.auth.getUser();
    if (ue || !user) return respond({ error: "Unauthorized" }, 401);

    const { article_id, title, content } = await req.json();
    if (!article_id || !content) return respond({ error: "Missing article_id or content" }, 400);

    const wordCount = content.split(/\s+/).length;
    const needed = requiredInternalImages(wordCount);
    const sections = analyzeSections(content);

    // Pick which sections get images (skip first H2 which is near the top)
    const candidates = sections.slice(1);
    const targets = candidates.slice(0, Math.max(needed, candidates.length > needed ? needed : candidates.length));

    if (targets.length === 0) {
      console.log("[article-images] No sections found, skipping internal images");
      return respond({ success: true, images_added: 0 });
    }

    console.log(
      `[article-images] Generating ${targets.length} internal images for article ${article_id} (${wordCount} words)`,
    );

    // Generate all images in parallel
    const results = await Promise.allSettled(
      targets.map(async (section, idx) => {
        const prompt = `Biblical historical illustration about "${section.heading}", ${section.snippet ? `context: ${section.snippet},` : ""} ancient Middle East setting, warm golden tones, oil painting style, cinematic lighting, highly detailed, no text or letters`;
        const bytes = await generateImage(prompt, hfToken, lovableKey);
        if (!bytes) return null;

        // Upload to storage
        const admin = createClient(supabaseUrl, serviceKey);
        const filePath = `${user.id}/articles/${article_id}/image-${idx}.png`;
        const { error: upErr } = await admin.storage
          .from("article-covers")
          .upload(filePath, bytes, { contentType: "image/png", upsert: true });
        if (upErr) {
          console.warn(`[article-images] Upload error image-${idx}:`, upErr);
          return null;
        }

        const { data: pub } = admin.storage.from("article-covers").getPublicUrl(filePath);
        return { lineIndex: section.lineIndex, url: pub.publicUrl, heading: section.heading };
      }),
    );

    // Collect successful images
    const images: { lineIndex: number; url: string; heading: string }[] = [];
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) images.push(r.value);
    }

    if (images.length === 0) {
      console.log("[article-images] All image generations failed");
      return respond({ success: true, images_added: 0 });
    }

    // Insert images into markdown (bottom-up to preserve line indices)
    const lines = content.split("\n");
    const sorted = [...images].sort((a, b) => b.lineIndex - a.lineIndex);
    for (const img of sorted) {
      const insertAt = Math.min(img.lineIndex + 2, lines.length);
      // Check if there's already an image in the next 5 lines — replace its URL instead of inserting
      let replaced = false;
      for (let k = insertAt; k < Math.min(insertAt + 5, lines.length); k++) {
        if (/^\s*!\[.*?\]\(.*?\)\s*$/.test(lines[k])) {
          lines[k] = `![${img.heading}](${img.url})`;
          replaced = true;
          break;
        }
      }
      if (!replaced) {
        lines.splice(insertAt, 0, "", `![${img.heading}](${img.url})`, "");
      }
    }
    const updatedContent = lines.join("\n");

    // Save article_images array and updated content
    const imageUrls = images.map((i) => i.url);
    const admin = createClient(supabaseUrl, serviceKey);

    // Get existing article_images to merge
    const { data: existing } = await admin
      .from("materials")
      .select("article_images, cover_image_url")
      .eq("id", article_id)
      .single();
    const existingImages = ((existing?.article_images as string[]) || []).filter(Boolean);
    const coverUrl = existing?.cover_image_url;
    const allImages = coverUrl ? [coverUrl, ...imageUrls] : imageUrls;
    const mergedImages = [...new Set([...existingImages, ...allImages])];

    const { error: updateErr } = await admin
      .from("materials")
      .update({ content: updatedContent, article_images: mergedImages })
      .eq("id", article_id)
      .eq("user_id", user.id);

    if (updateErr) console.error("[article-images] DB update error:", updateErr);

    console.log(`[article-images] ✅ ${images.length} images added to article ${article_id}`);
    return respond({ success: true, images_added: images.length, image_urls: imageUrls });
  } catch (err) {
    console.error("[article-images] Error:", err);
    return respond({ error: (err as Error).message || "Internal error" }, 500);
  }
});
