// publish-to-wordpress/index.ts
// Edge Function: Publicar artigo no WordPress do usuário via REST API
// Reuso direto do padrão Omniseen Publisher

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createScopedClient, getAuthUser, corsHeaders } from "../common/utils.ts";

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação necessário" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createScopedClient(authHeader.replace("Bearer ", ""));
    const user = await getAuthUser(supabase);

    // 2. Parse request
    const {
      material_id,
      site_url,
      status = "publish",
      categories = [],
      scheduled_date = null,
    } = await req.json();

    if (!material_id) {
      return new Response(
        JSON.stringify({ error: "material_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar status
    const validStatuses = ["publish", "draft", "future"];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: `Status inválido. Use: ${validStatuses.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se status é "future", scheduled_date é obrigatório
    if (status === "future" && !scheduled_date) {
      return new Response(
        JSON.stringify({ error: "scheduled_date é obrigatório quando status = 'future'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Buscar material e verificar ownership
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("*")
      .eq("id", material_id)
      .eq("user_id", user.id)
      .single();

    if (materialError || !material) {
      return new Response(
        JSON.stringify({ error: "Material não encontrado ou não pertence a você" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Buscar credenciais do site WordPress do usuário
    const { data: profile, error: profileError } = await supabase
      .from("user_editorial_profile")
      .select("active_sites")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Perfil editorial não configurado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Encontrar o site correto
    const activeSites: any[] = profile.active_sites || [];
    const targetSiteUrl = site_url || (activeSites.length > 0 ? activeSites[0].url : null);

    const site = activeSites.find((s: any) =>
      s.url === targetSiteUrl || s.wp_rest_url?.includes(targetSiteUrl)
    );

    if (!site) {
      return new Response(
        JSON.stringify({
          error: "Site WordPress não configurado",
          hint: "Configure um site WordPress nas configurações do perfil editorial",
          available_sites: activeSites.map((s: any) => s.url),
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Resolver categorias no WordPress
    const wpRestUrl = site.wp_rest_url || `${site.url}/wp-json`;
    const wpAuth = btoa(`${site.wp_username}:${site.wp_app_password}`);

    let wpCategoryIds: number[] = [];
    if (categories.length > 0) {
      wpCategoryIds = await resolveWPCategories(wpRestUrl, wpAuth, categories);
    }

    // 6. Montar payload WordPress
    const articleContent = material.output_blog || material.output_devotional || material.output_sermon || "";

    const wpPayload: Record<string, any> = {
      title: material.article_title || `${material.bible_passage} — Reflexão`,
      content: articleContent,
      status: status,
      slug: material.seo_slug || slugify(material.article_title || material.bible_passage || "reflexao"),
      meta: {
        _yoast_wpseo_metadesc: material.meta_description || "",
      },
    };

    if (wpCategoryIds.length > 0) {
      wpPayload.categories = wpCategoryIds;
    }

    if (status === "future" && scheduled_date) {
      wpPayload.date = scheduled_date;
    }

    // 7. POST para WordPress REST API
    const wpResponse = await fetch(`${wpRestUrl}/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${wpAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wpPayload),
    });

    if (!wpResponse.ok) {
      const wpError = await wpResponse.text();
      console.error("WordPress API error:", wpError);
      return new Response(
        JSON.stringify({
          error: "Falha ao publicar no WordPress",
          wp_status: wpResponse.status,
          wp_error: wpError,
          hint: "Verifique as credenciais WordPress (App Password) e a URL do site",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wpPost = await wpResponse.json();

    // 8. Atualizar fila editorial
    const queueStatus = status === "future" ? "scheduled" : "published";
    await supabase.from("editorial_queue").upsert({
      user_id: user.id,
      material_id: material_id,
      status: queueStatus,
      published_at: status === "publish" ? new Date().toISOString() : null,
      scheduled_at: scheduled_date || null,
      published_url: wpPost.link,
      target_site_url: targetSiteUrl,
      wp_post_id: wpPost.id,
    }, { onConflict: "material_id" });

    // 9. Atualizar material
    await supabase.from("materials").update({
      is_published: status === "publish",
      published_url: wpPost.link,
    }).eq("id", material_id);

    // 10. Retornar sucesso
    return new Response(
      JSON.stringify({
        published_url: wpPost.link,
        wp_post_id: wpPost.id,
        status: queueStatus,
        site_url: targetSiteUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("publish-to-wordpress error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao publicar", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// === UTILIDADES ===

/**
 * Resolver nomes de categorias para IDs do WordPress.
 * Se a categoria não existir, cria automaticamente.
 */
async function resolveWPCategories(
  wpRestUrl: string,
  wpAuth: string,
  categoryNames: string[]
): Promise<number[]> {
  const ids: number[] = [];

  for (const name of categoryNames) {
    try {
      // Buscar categoria existente
      const searchResp = await fetch(
        `${wpRestUrl}/wp/v2/categories?search=${encodeURIComponent(name)}`,
        { headers: { "Authorization": `Basic ${wpAuth}` } }
      );
      const existing = await searchResp.json();

      if (Array.isArray(existing) && existing.length > 0) {
        ids.push(existing[0].id);
      } else {
        // Criar nova categoria
        const createResp = await fetch(`${wpRestUrl}/wp/v2/categories`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${wpAuth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, slug: slugify(name) }),
        });
        const created = await createResp.json();
        if (created.id) ids.push(created.id);
      }
    } catch (e) {
      console.error(`Failed to resolve category "${name}":`, e);
    }
  }

  return ids;
}

/**
 * Converter string para slug URL-safe
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}
