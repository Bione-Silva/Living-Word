// Banco compartilhado de cenas bíblicas:
// 1. Sempre prioriza buscar no banco (biblical_scene_library)
// 2. Só gera nova com IA se mode='generate' ou 'generate_batch' E usuário tem plano + cota
// 3. Imagens novas vão pro Storage Supabase (bucket biblical-scenes) e entram no catálogo
// Custo: ~$0.039 por geração nova (Gemini 2.5 Flash Image)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  normalizePlan,
  BIBLICAL_SCENE_QUOTA as SCENE_QUOTA,
  SCENE_STUDIO_PLANS as ALLOWED_PLANS,
} from '../_shared/plan.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface SceneRow {
  id: string;
  prompt: string;
  description: string;
  keywords: string[];
  image_url: string;
  is_curated: boolean;
  use_count: number;
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúçñ0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .slice(0, 12);
}

const VISUAL_MODES = {
  biblica: {
    prefix:
      'Cinematic authentic photography set in the ancient Middle East, HIGHLY DETAILED REALISTIC PHOTOGRAPH, natural daylight or overcast, historical documentary style. STRICTLY NO painting, NO illustration, NO dramatic warm golden lighting, NO fantasy glow, period-accurate stone architecture, real sand and dust, textured clothing, museum-quality composition',
    negative:
      'no oil painting, no watercolor, no sketch, no golden medieval castles, no fantasy auras, no modern clothing, no smartphones, no contemporary buildings, no urban setting, no text, no captions, no watermarks',
  },
  moderna: {
    prefix:
      'Contemporary lifestyle photography, photorealistic real-world scene, soft natural daylight, editorial Christian brand campaign aesthetic, clean modern composition with negative space for typography, premium magazine quality, warm and human atmosphere, shallow depth of field, candid moment, muted natural color palette',
    negative:
      'STRICT: no biblical period costumes, no tunics, no sandals, no ancient architecture, no desert, no painterly sacred art style, no oil painting look, no dramatic golden light rays, no giant cross on mountain, no mystical glow, no fog, no theatrical staging, no excessive gold tones, no Renaissance painting, no medieval art, no text, no captions, no watermarks',
  },
  editorial: {
    prefix:
      'Editorial design poster, sophisticated minimalist composition, premium magazine layout, single hero element on a flat solid background, abundant negative space designed to receive large typography, refined neutral palette of cream beige off-white and deep charcoal, art-direction quality, calm and elegant',
    negative:
      'no people, no faces, no biblical costumes, no painterly style, no busy background, no clutter, no decorative ornaments, no rainbow gradients, no neon, no 3D render, no stock photo look, no text, no watermarks',
  },
  simbolica: {
    prefix:
      'Minimalist symbolic illustration, single conceptual element as the only subject, clean geometric composition, flat or low-texture background, contemporary Christian visual identity, calm muted palette with one subtle accent color',
    negative:
      'no people, no faces, no realistic biblical scenes, no period costumes, no busy environment, no photographic detail, no dramatic cinematic lighting, no painterly sacred art, no text, no watermark',
  },
} as const;

// Variações de ângulo/composição para manter coerência da cena no carrossel.
// Cada slot é um "twist" diferente sobre a MESMA cena.
const ANGLE_VARIATIONS = [
  'wide establishing shot capturing the full environment, eye-level perspective',
  'medium shot from a slight low angle, focused on the main subject',
  'close-up detail shot emphasizing emotion and texture, shallow depth of field',
  'over-the-shoulder perspective with strong negative space on the right for typography',
  'bird\'s-eye top-down composition with symmetrical balance',
  'side profile shot in golden ratio composition, cinematic framing',
  'three-quarter angle with leading lines guiding the eye toward the focal point',
  'backlit silhouette composition with dramatic rim light, soft background bokeh',
  'symmetrical front-facing composition with centered subject and clean background',
  'dynamic diagonal composition with motion-implied framing',
];

async function generateOneImage(
  enrichedPrompt: string,
): Promise<{ ok: true; dataUrl: string } | { ok: false; status: number; error: string }> {
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image',
      messages: [{ role: 'user', content: enrichedPrompt }],
      modalities: ['image', 'text'],
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text().catch(() => '');
    console.error('AI gateway error:', aiResponse.status, errText);
    return { ok: false, status: aiResponse.status, error: errText };
  }

  const aiData = await aiResponse.json();
  const dataUrl: string | undefined = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return { ok: false, status: 500, error: 'No image returned' };
  }
  return { ok: true, dataUrl };
}

async function uploadToStorage(
  adminClient: ReturnType<typeof createClient>,
  dataUrl: string,
): Promise<{ ok: true; publicUrl: string; fileName: string } | { ok: false; error: string }> {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mimeType = mimeMatch?.[1] || 'image/png';
  const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const fileName = `community/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await adminClient.storage
    .from('biblical-scenes')
    .upload(fileName, bytes, { contentType: mimeType, upsert: false });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return { ok: false, error: 'Storage upload failed' };
  }

  const { data: pub } = adminClient.storage.from('biblical-scenes').getPublicUrl(fileName);
  return { ok: true, publicUrl: pub.publicUrl, fileName };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile } = await adminClient
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle();
    const rawPlan = typeof profile?.plan === 'string' ? profile.plan : 'free';
    const userPlan = normalizePlan(rawPlan);

    const { data: isAdminData } = await adminClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    const isAdmin = isAdminData === true;

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const mode: 'search' | 'generate' | 'generate_batch' =
      body?.mode === 'generate_batch'
        ? 'generate_batch'
        : body?.mode === 'generate'
          ? 'generate'
          : 'search';

    const visualMode: 'biblica' | 'moderna' | 'editorial' | 'simbolica' =
      ['biblica', 'moderna', 'editorial', 'simbolica'].includes(body?.visualMode)
        ? body.visualMode
        : 'biblica';

    // Plano free não tem acesso ao Estúdio (apenas para GENERATE; SEARCH é livre p/ logados)
    if ((mode === 'generate' || mode === 'generate_batch') && !isAdmin && !ALLOWED_PLANS.has(userPlan)) {
      return new Response(JSON.stringify({
        error: 'plan_required',
        message: 'O Estúdio Social está disponível nos planos Starter, Pro e Igreja.',
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if ((mode === 'generate' || mode === 'generate_batch') && (!prompt || prompt.length < 3)) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keywords = extractKeywords(prompt);

    // ──────────────────────────────────────────
    // MODO SEARCH
    // ──────────────────────────────────────────
    if (mode === 'search') {
      let query = adminClient
        .from('biblical_scene_library')
        .select('id, prompt, description, keywords, image_url, is_curated, use_count')
        .order('is_curated', { ascending: false })
        .order('use_count', { ascending: false })
        .limit(12);

      if (keywords.length > 0) {
        query = query.overlaps('keywords', keywords);
      }

      const { data: matches } = await query;
      let scenes: SceneRow[] = (matches as SceneRow[]) || [];

      if (scenes.length === 0) {
        const { data: fallback } = await adminClient
          .from('biblical_scene_library')
          .select('id, prompt, description, keywords, image_url, is_curated, use_count')
          .order('is_curated', { ascending: false })
          .order('use_count', { ascending: false })
          .limit(12);
        scenes = (fallback as SceneRow[]) || [];
      }

      const { data: usedCount } = await adminClient.rpc('count_user_scene_generations_this_month', {
        p_user_id: user.id,
      });
      const used = (usedCount as number) || 0;
      const quota = SCENE_QUOTA[userPlan] || 0;

      return new Response(JSON.stringify({
        scenes,
        quota: { used, limit: quota, remaining: Math.max(0, quota - used), plan: userPlan },
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ──────────────────────────────────────────
    // MODO GENERATE (single) ou GENERATE_BATCH (carrossel)
    // ──────────────────────────────────────────
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Conta cota e calcula quantas imagens vamos gerar
    const quota = SCENE_QUOTA[userPlan] || 0;
    const { data: usedCount } = await adminClient.rpc('count_user_scene_generations_this_month', {
      p_user_id: user.id,
    });
    const used = (usedCount as number) || 0;
    const remaining = Math.max(0, quota - used);

    const requestedCount =
      mode === 'generate_batch'
        ? Math.max(1, Math.min(10, Number(body?.count) || 1))
        : 1;

    if (remaining < requestedCount) {
      return new Response(JSON.stringify({
        error: 'quota_exceeded',
        message: `Você tem ${remaining} cota(s) este mês mas pediu ${requestedCount}. Faça upgrade para gerar mais.`,
        quota: { used, limit: quota, remaining, plan: userPlan },
      }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const visual = VISUAL_MODES[visualMode];
    const monthKey = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Sao_Paulo',
    }).slice(0, 7);

    // Gera N imagens (1 ou várias). Para batch, cada imagem usa um angle variation
    // diferente para manter a MESMA cena com composições distintas.
    const results: Array<{
      sceneId: string | null;
      imageUrl: string;
      label: string;
      prompt: string;
      angle: string;
    }> = [];

    for (let i = 0; i < requestedCount; i++) {
      const angle = requestedCount > 1
        ? ANGLE_VARIATIONS[i % ANGLE_VARIATIONS.length]
        : '';
      const enrichedPrompt =
        `Subject: ${prompt}.\n\n` +
        (angle ? `Camera/composition: ${angle}.\n\n` : '') +
        `Visual direction: ${visual.prefix}.\n\n` +
        `Do NOT include: ${visual.negative}.`;

      const gen = await generateOneImage(enrichedPrompt);
      if (!gen.ok) {
        // Se falhar no meio do lote, devolve o que já tem se for batch
        if (results.length > 0 && mode === 'generate_batch') {
          break;
        }
        if (gen.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limited, try again shortly' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (gen.status === 402) {
          return new Response(JSON.stringify({ error: 'AI credits exhausted (admin)' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ error: 'AI gateway error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const upload = await uploadToStorage(adminClient, gen.dataUrl);
      if (!upload.ok) {
        if (results.length > 0 && mode === 'generate_batch') break;
        return new Response(JSON.stringify({ error: upload.error }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const labelSuffix = requestedCount > 1 ? ` (${i + 1}/${requestedCount})` : '';
      const { data: inserted, error: catalogErr } = await adminClient
        .from('biblical_scene_library')
        .insert({
          prompt,
          description: (prompt + labelSuffix).slice(0, 200),
          keywords,
          image_url: upload.publicUrl,
          storage_path: upload.fileName,
          is_curated: false,
          created_by: user.id,
          use_count: 1,
        })
        .select('id')
        .single();

      if (catalogErr) console.error('Catalog insert error:', catalogErr);

      await adminClient.from('biblical_scene_usage').insert({
        user_id: user.id,
        scene_library_id: inserted?.id,
        month_key: monthKey,
      });

      adminClient.from('generation_logs').insert({
        user_id: user.id,
        feature: 'biblical-scene',
        model: 'google/gemini-2.5-flash-image',
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        cost_usd: 0.039,
      }).then(() => {}).catch(() => {});

      results.push({
        sceneId: inserted?.id ?? null,
        imageUrl: upload.publicUrl,
        label: prompt + labelSuffix,
        prompt,
        angle,
      });
    }

    const newUsed = used + results.length;
    const responseQuota = {
      used: newUsed,
      limit: quota,
      remaining: Math.max(0, quota - newUsed),
      plan: userPlan,
    };

    // Compatibilidade: modo 'generate' (single) devolve o shape antigo
    if (mode === 'generate') {
      const first = results[0];
      return new Response(JSON.stringify({
        imageUrl: first.imageUrl,
        sceneId: first.sceneId,
        quota: responseQuota,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Batch: devolve array de variações
    return new Response(JSON.stringify({
      variations: results,
      count: results.length,
      requested: requestedCount,
      quota: responseQuota,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in generate-biblical-scene:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
