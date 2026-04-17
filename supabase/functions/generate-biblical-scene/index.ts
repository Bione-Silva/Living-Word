// Banco compartilhado de cenas bíblicas:
// 1. Sempre prioriza buscar no banco (biblical_scene_library)
// 2. Só gera nova com IA se mode='generate' E usuário tem plano + cota
// 3. Imagens novas vão pro Storage Supabase (bucket biblical-scenes) e entram no catálogo
// Custo: ~$0.039 por geração nova (Gemini 2.5 Flash Image)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Cota mensal de geração nova de imagem por plano
const SCENE_QUOTA: Record<string, number> = {
  free: 0,
  starter: 0,
  pro: 20,
  igreja: 50,
};

// Bloqueia free, libera demais para uso do banco
const ALLOWED_PLANS = new Set(['starter', 'pro', 'igreja']);

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

    // Service client (bypassa RLS para writes no catálogo)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Carrega plano do usuário
    const { data: profile } = await adminClient
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle();
    const userPlan = (profile?.plan || 'free') as string;

    // Admins sempre passam (para seed/teste); demais regras só se aplicam abaixo.
    const { data: isAdminData } = await adminClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    const isAdmin = isAdminData === true;

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const mode: 'search' | 'generate' = body?.mode === 'generate' ? 'generate' : 'search';

    // Plano free não tem acesso ao Estúdio (apenas para GENERATE; SEARCH é livre p/ logados)
    if (mode === 'generate' && !isAdmin && !ALLOWED_PLANS.has(userPlan)) {
      return new Response(JSON.stringify({
        error: 'plan_required',
        message: 'O Estúdio Social está disponível nos planos Starter, Pro e Igreja.',
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!prompt || prompt.length < 3) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keywords = extractKeywords(prompt);

    // ──────────────────────────────────────────
    // MODO SEARCH: busca no banco compartilhado
    // ──────────────────────────────────────────
    if (mode === 'search') {
      // Busca por keywords (overlap), ordena por relevância (curadas primeiro, mais usadas depois)
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

      // Se não achou nada por keywords, devolve as mais populares/curadas
      if (scenes.length === 0) {
        const { data: fallback } = await adminClient
          .from('biblical_scene_library')
          .select('id, prompt, description, keywords, image_url, is_curated, use_count')
          .order('is_curated', { ascending: false })
          .order('use_count', { ascending: false })
          .limit(12);
        scenes = (fallback as SceneRow[]) || [];
      }

      // Quanto resta da cota deste mês
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
    // MODO GENERATE: cria imagem nova com IA
    // ──────────────────────────────────────────
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verifica cota
    const quota = SCENE_QUOTA[userPlan] || 0;
    const { data: usedCount } = await adminClient.rpc('count_user_scene_generations_this_month', {
      p_user_id: user.id,
    });
    const used = (usedCount as number) || 0;

    if (used >= quota) {
      return new Response(JSON.stringify({
        error: 'quota_exceeded',
        message: `Você já gerou ${used}/${quota} imagens novas este mês. Faça upgrade para gerar mais.`,
        quota: { used, limit: quota, remaining: 0, plan: userPlan },
      }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Chama IA
    const enrichedPrompt = `${prompt} — painterly biblical landscape, cinematic lighting, soft warm tones, reverent atmosphere, no text, no captions, no watermarks`;

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
      const status = aiResponse.status;
      const errText = await aiResponse.text().catch(() => '');
      console.error('AI gateway error:', status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited, try again shortly' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted (admin)' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const dataUrl: string | undefined = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      console.error('No image in response:', JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: 'No image returned' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode base64 → bytes
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
      return new Response(JSON.stringify({ error: 'Storage upload failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: pub } = adminClient.storage.from('biblical-scenes').getPublicUrl(fileName);
    const publicUrl = pub.publicUrl;

    // Salva no catálogo público
    const { data: inserted, error: catalogErr } = await adminClient
      .from('biblical_scene_library')
      .insert({
        prompt,
        description: prompt.slice(0, 200),
        keywords,
        image_url: publicUrl,
        storage_path: fileName,
        is_curated: false,
        created_by: user.id,
        use_count: 1,
      })
      .select('id')
      .single();

    if (catalogErr) console.error('Catalog insert error:', catalogErr);

    // Registra uso da cota
    const monthKey = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Sao_Paulo',
    }).slice(0, 7); // YYYY-MM

    await adminClient.from('biblical_scene_usage').insert({
      user_id: user.id,
      scene_library_id: inserted?.id,
      month_key: monthKey,
    });

    // Log custo
    await adminClient.from('generation_logs').insert({
      user_id: user.id,
      feature: 'biblical-scene',
      model: 'google/gemini-2.5-flash-image',
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      cost_usd: 0.039,
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify({
      imageUrl: publicUrl,
      sceneId: inserted?.id,
      quota: { used: used + 1, limit: quota, remaining: Math.max(0, quota - used - 1), plan: userPlan },
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in generate-biblical-scene:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
