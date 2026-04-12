// provision-user-blog/index.ts
// Edge Function: Provisionar blog automático do usuário no cadastro
// Chamada automaticamente pelo frontend após signup
// Gera 2 devocionais de boas-vindas e publica imediatamente

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";
import { corsHeaders } from "../common/utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const LLM_MODEL = Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini";

// Passagens litúrgicas contextuais por época do ano
const LITURGICAL_PASSAGES: Record<string, { passage: string; theme: string }> = {
  // Janeiro - Novo Ano, Propósito
  "01": { passage: "Jeremias 29:11", theme: "propósito e esperança para o novo ano" },
  // Fevereiro - Amor, Comunhão
  "02": { passage: "1 Coríntios 13:4-7", theme: "amor verdadeiro e comunhão" },
  // Março - Quaresma, Reflexão
  "03": { passage: "Salmo 51:10-12", theme: "renovação e arrependimento" },
  // Abril - Páscoa, Ressurreição
  "04": { passage: "João 11:25-26", theme: "ressurreição e vida eterna" },
  // Maio - Mães, Família
  "05": { passage: "Provérbios 31:25-31", theme: "família e valor da mulher de fé" },
  // Junho - Pais, Fortaleza
  "06": { passage: "Josué 1:9", theme: "coragem e liderança fiel" },
  // Julho - Meio do ano, Perseverança
  "07": { passage: "Gálatas 6:9", theme: "perseverança e não desanimar" },
  // Agosto - Missões
  "08": { passage: "Mateus 28:19-20", theme: "missões e grande comissão" },
  // Setembro - Bíblia
  "09": { passage: "Salmo 119:105", theme: "a Palavra como lâmpada" },
  // Outubro - Reforma, Fé
  "10": { passage: "Romanos 1:17", theme: "o justo viverá pela fé" },
  // Novembro - Gratidão
  "11": { passage: "1 Tessalonicenses 5:18", theme: "gratidão em tudo" },
  // Dezembro - Natal, Advento
  "12": { passage: "Isaías 9:6", theme: "a vinda do Príncipe da Paz" },
};

// Passagem clássica de encorajamento (artigo 2 de boas-vindas)
const WELCOME_PASSAGE = {
  passage: "Salmo 23:1-6",
  theme: "O Senhor é meu pastor — confiança e provisão",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Parse — pode ser chamada pelo frontend OU por webhook
    const body = await req.json();

    // Extrair dados do usuário
    const user_id = body.user_id || body.record?.id;
    const email = body.email || body.record?.email;
    const user_metadata = body.user_metadata || body.record?.raw_user_meta_data || {};

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = user_metadata.full_name || user_metadata.name || email?.split("@")[0] || "Pastor";
    const language = user_metadata.language || "PT";
    const doctrine_line = user_metadata.doctrine_line || "evangelical_general";
    
    // Capturar dados de personalização do wizard
    const tone = user_metadata.tone || body.tone || "welcoming";
    const theme_color = user_metadata.theme_color || body.theme_color || "#2d3748";
    const font_family = user_metadata.font_family || body.font_family || "Inter";
    const layout_style = user_metadata.layout_style || body.layout_style || "modern";

    // 2. Usar service_role para operações admin (provisioning é server-side)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3. Buscar handle do usuário (já definido no cadastro)
    const { data: userProfile } = await adminClient
      .from("profiles")
      .select("handle, blog_url")
      .eq("id", user_id)
      .single();

    let handle = userProfile?.handle;

    // Se handle não existe, gerar do nome
    if (!handle) {
      handle = slugify(name);

      // Verificar unicidade
      const { data: existing } = await adminClient
        .from("profiles")
        .select("handle")
        .eq("handle", handle)
        .single();

      if (existing) {
        handle = `${handle}-${Date.now().toString(36).slice(-4)}`;
      }

      // Salvar handle e blog_url
      await adminClient.from("profiles").update({
        handle,
        blog_url: `https://${handle}.livingword.app`,
      }).eq("id", user_id);
    }

    const blogUrl = `https://${handle}.livingword.app`;

    // 4. Criar perfil editorial se não existe
    const { data: existingProfile } = await adminClient
      .from("user_editorial_profile")
      .select("id")
      .eq("user_id", user_id)
      .single();

    if (!existingProfile) {
      await adminClient.from("user_editorial_profile").insert({
        user_id,
        tone: tone,
        theme_color: theme_color,
        font_family: font_family,
        layout_style: layout_style,
        active_sites: [{
          url: blogUrl,
          name: `Blog de ${name}`,
          type: "livingword_internal",
          language,
        }],
      });
    }

    // 5. Gerar artigo 1: contextual ao mês litúrgico
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    const liturgical = LITURGICAL_PASSAGES[currentMonth] || LITURGICAL_PASSAGES["07"];

    const article1 = await generateWelcomeArticle({
      name,
      language,
      doctrine_line,
      passage: liturgical.passage,
      theme: liturgical.theme,
      articleType: "devotional_seasonal",
      adminClient,
    });

    // 6. Gerar artigo 2: passagem clássica de encorajamento
    const article2 = await generateWelcomeArticle({
      name,
      language,
      doctrine_line,
      passage: WELCOME_PASSAGE.passage,
      theme: WELCOME_PASSAGE.theme,
      articleType: "devotional_welcome",
      adminClient,
    });

    // 6.5 Gerar artigo 3: Provérbios
    const article3 = await generateWelcomeArticle({
      name,
      language,
      doctrine_line,
      passage: "Provérbios 3:5-6",
      theme: "Confiar no Senhor além do nosso próprio entendimento",
      articleType: "devotional_wisdom",
      adminClient,
    });

    // 7. Salvar os 3 artigos no banco
    const savedArticles = [];

    for (const article of [article1, article2, article3]) {
      // Salvar material
      const { data: material } = await adminClient.from("materials").insert({
        user_id,
        mode: "devotional",
        language,
        bible_passage: article.passage,
        doctrine_line,
        pastoral_voice: "welcoming",
        article_title: article.title,
        meta_description: article.meta_description,
        seo_slug: article.seo_slug,
        output_blog: article.body,
        output_devotional: article.body,
        word_count: article.word_count,
        tags: article.tags,
        is_published: true,
        published_url: `${blogUrl}/${article.seo_slug}`,
      }).select().single();

      if (material) {
        // Inserir na fila editorial como publicado
        await adminClient.from("editorial_queue").insert({
          user_id,
          material_id: material.id,
          status: "published",
          published_at: new Date().toISOString(),
          published_url: `${blogUrl}/${article.seo_slug}`,
          target_site_url: blogUrl,
        });

        savedArticles.push({
          id: material.id,
          title: article.title,
          slug: article.seo_slug,
          url: `${blogUrl}/${article.seo_slug}`,
        });
      }
    }

    // 8. Registrar log de geração (custo de onboarding)
    for (const article of [article1, article2, article3]) {
      await adminClient.from("generation_logs").insert({
        user_id,
        language,
        mode: "devotional",
        input_tokens: article.usage?.prompt_tokens || 0,
        output_tokens: article.usage?.completion_tokens || 0,
        generation_time_ms: article.generation_time_ms || 0,
        llm_model: LLM_MODEL,
        cost_usd: estimateCost(article.usage),
      });
    }

    // 9. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        blog_url: blogUrl,
        handle,
        articles_published: savedArticles.length,
        articles: savedArticles,
        message: `Blog de ${name} está no ar com ${savedArticles.length} devocionais publicados!`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("provision-user-blog error:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao provisionar blog",
        details: error.message,
        fallback: "Seu blog está sendo preparado. Tente novamente em alguns minutos.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// === GERAÇÃO DE ARTIGOS DE BOAS-VINDAS ===

interface WelcomeArticleInput {
  name: string;
  language: string;
  doctrine_line: string;
  passage: string;
  theme: string;
  articleType: string;
  adminClient?: any;
}

interface WelcomeArticleOutput {
  title: string;
  meta_description: string;
  body: string;
  seo_slug: string;
  word_count: number;
  tags: string[];
  passage: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
  generation_time_ms?: number;
}

// Helper para base64 -> Uint8Array
const decodeBase64 = (b64: string) => {
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
};

async function generateWelcomeArticle(input: WelcomeArticleInput): Promise<WelcomeArticleOutput> {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const languageNames: Record<string, string> = {
    PT: "português brasileiro",
    EN: "English",
    ES: "español",
  };

  const langName = languageNames[input.language] || "português brasileiro";

  const prompt = `Você é um escritor cristão pastoral. Gere um artigo profundo e SEO-otimizado (Omniseen standards) em ${langName}.

PASSAGEM BÍBLICA: ${input.passage}
TEMA: ${input.theme}
LINHA DOUTRINÁRIA: ${input.doctrine_line}
AUTOR: ${input.name}

INSTRUÇÕES (CRÍTICAS):
1. **EXPANSION MANDATE:** O artigo deve ter entre 400-800 palavras.
2. **OMNISEEN EDITORIAL STRUCTURE:** O 'body' deve usar Markdown premium:
   - **USE MARKDOWN STRICTLY:** Você deve obrigatóriamente usar "##" para cabeçalhos H2 e "###" para H3. NUNCA substitua os cabeçalhos H2 por texto normal em negrito! Não use H1.
   - **MANDATORY HERO IMAGE (1):** Adicione EXATAMENTE UM (1) placeholder de imagem no topo do texto (antes de qualquer coisa): [IMAGE_PROMPT: <Descreva um prompt fotorealista e cinemático em inglês para Gemini Imagen>]
   - Use blockquotes (> ) para ênfase bíblica.
   - Termine sempre com uma seção "## Perguntas Frequentes" com 3 perguntas comuns sobre o tema.
3. Marque citações com [CITAÇÃO DIRETA].
4. Tom acolhedor e pastoral.

FORMATO DE SAÍDA (JSON):
{
  "title": "título atraente",
  "meta_description": "descrição de 150 chars para SEO",
  "body": "corpo completo em markdown com a hero image",
  "tags": ["tag1", "tag2", "tag3"],
  "word_count": 600
}

Retorne APENAS o JSON válido.`;

  const startTime = Date.now();

  const response = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1500,
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const generationTime = Date.now() - startTime;
  const content = response.choices[0].message.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {
      title: `Reflexão sobre ${input.passage}`,
      meta_description: `Devocional baseado em ${input.passage} — ${input.theme}`,
      body: content,
      tags: [input.theme, input.passage.split(" ")[0]],
      word_count: content.split(/\s+/).length,
    };
  }

  // Gemini Imagen Hero Image Processing
  const imagePromptRegex = /\[IMAGE_PROMPT:\s*(.+?)\]/;
  const match = parsed.body?.match(imagePromptRegex);
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  if (match && geminiKey && input.adminClient) {
    const fullTag = match[0];
    const imageDesc = match[1];

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: `An editorial blog illustration, photorealistic, cinematic lighting: ${imageDesc}` }],
          parameters: { sampleCount: 1, aspectRatio: "16:9", outputOptions: { mimeType: "image/jpeg" } }
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        if (b64) {
          const fileName = `${crypto.randomUUID()}.jpg`;
          const filePath = `generated/${fileName}`;
          await input.adminClient.storage.from("images").upload(filePath, decodeBase64(b64), { contentType: "image/jpeg" });
          const { data: publicUrlData } = input.adminClient.storage.from("images").getPublicUrl(filePath);
          parsed.body = parsed.body.replace(fullTag, `\n\n![Ilustração](${publicUrlData.publicUrl})\n\n`);
        } else {
          parsed.body = parsed.body.replace(fullTag, `\n\n![Ilustração de Capa](https://via.placeholder.com/1024x576?text=Fallback+API+Gemini)\n\n`);
        }
      } else {
        parsed.body = parsed.body.replace(fullTag, `\n\n![Ilustração de Capa](https://via.placeholder.com/1024x576?text=Fallback+API+Gemini+Error)\n\n`);
      }
    } catch(e) {
      console.error("Gemini Imagen erro in Onboarding:", e);
      parsed.body = parsed.body.replace(fullTag, `\n\n![Ilustração de Capa](https://via.placeholder.com/1024x576?text=Catch+Gemini+Error)\n\n`);
    }
  } else if (match) {
    parsed.body = parsed.body.replace(match[0], `\n\n![Ilustração de Capa](https://via.placeholder.com/1024x576?text=Gemini+Key+Missing)\n\n`);
  }

  return {
    title: parsed.title,
    meta_description: parsed.meta_description,
    body: parsed.body,
    seo_slug: slugify(parsed.title || input.passage),
    word_count: parsed.word_count || parsed.body?.split(/\s+/).length || 0,
    tags: parsed.tags || [],
    passage: input.passage,
    usage: response.usage ? {
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens,
    } : undefined,
    generation_time_ms: generationTime,
  };
}

// === UTILIDADES ===

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function estimateCost(usage?: { prompt_tokens: number; completion_tokens: number }): number {
  if (!usage) return 0.002;
  // gpt-4o-mini pricing: $0.15/1M input, $0.60/1M output
  const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15;
  const outputCost = (usage.completion_tokens / 1_000_000) * 0.60;
  return Math.round((inputCost + outputCost) * 100_000_000) / 100_000_000;
}
