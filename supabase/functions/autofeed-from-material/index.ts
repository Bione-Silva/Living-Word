// AutoFeed: gera 1 carrossel (5 slides) + 1 citação curta a partir de um sermão.
// Pro+ only. Insere como rascunho em social_calendar_posts.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { normalizePlan } from '../_shared/plan.ts';

const geminiApiKey = Deno.env.get('LOVABLE_API_KEY');

interface Body {
  material_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const body = (await req.json()) as Body;
    if (!body?.material_id) return json({ error: 'material_id required' }, 400);

    // Plan gate: Pro+
    const { data: profile } = await admin
      .from('profiles')
      .select('plan, autofeed_enabled, language')
      .eq('id', user.id)
      .maybeSingle();

    const plan = normalizePlan(profile?.plan);
    if (plan !== 'pro' && plan !== 'igreja') {
      return json({ error: 'AutoFeed requires Pro plan or higher', code: 'plan_required' }, 403);
    }
    if (!profile?.autofeed_enabled) {
      return json({ error: 'AutoFeed disabled for user', code: 'disabled' }, 403);
    }

    // Idempotency: skip if already generated
    const { count: existing } = await admin
      .from('social_calendar_posts')
      .select('id', { count: 'exact', head: true })
      .eq('source_material_id', body.material_id)
      .eq('user_id', user.id);
    if ((existing ?? 0) > 0) {
      return json({ skipped: true, reason: 'already_generated' });
    }

    // Load material
    const { data: material, error: matErr } = await admin
      .from('materials')
      .select('id, title, content, passage, language, user_id')
      .eq('id', body.material_id)
      .maybeSingle();
    if (matErr || !material) return json({ error: 'Material not found' }, 404);
    if (material.user_id !== user.id) return json({ error: 'Forbidden' }, 403);

    if (!geminiApiKey) return json({ error: 'AI not configured' }, 500);

    const lang = (material.language || profile?.language || 'PT').toUpperCase();
    const langLabel = lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese';

    const trimmed = (material.content || '').slice(0, 6000);

    const prompt = `You are a pastoral content assistant. Based on the sermon below, produce TWO social media outputs in ${langLabel}.

SERMON TITLE: ${material.title}
PASSAGE: ${material.passage || '—'}
SERMON BODY (excerpt):
${trimmed}

Return STRICT JSON (no markdown fences) with this shape:
{
  "carousel": {
    "slides": [
      { "type": "verse", "title": "", "text": "" },
      { "type": "hook", "title": "", "text": "" },
      { "type": "insight", "title": "", "text": "" },
      { "type": "application", "title": "", "text": "" },
      { "type": "cta", "title": "", "text": "" }
    ],
    "caption": "engaging caption max 600 chars",
    "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"
  },
  "quote": {
    "text": "single powerful sentence pulled from the sermon (max 180 chars)",
    "reference": "${material.passage || ''}",
    "caption": "short reflection caption max 280 chars",
    "hashtags": "#hashtag1 #hashtag2 #hashtag3"
  }
}

Rules:
- Reverent, pastoral, never cliché.
- Quote must be quotable on its own.
- Carousel slides: 1-2 sentences each, no slide numbers in text.
- All output in ${langLabel}.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${geminiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        max_tokens: 2500,
        messages: [
          { role: 'system', content: 'You output only valid JSON. No commentary.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('autofeed AI error:', aiResp.status, errText);
      if (aiResp.status === 429) return json({ error: 'Rate limited' }, 429);
      if (aiResp.status === 402) return json({ error: 'AI credits exhausted' }, 402);
      return json({ error: 'AI generation failed' }, 502);
    }

    const aiData = await aiResp.json();
    let content: string = aiData.choices?.[0]?.message?.content || '';
    content = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('autofeed: failed to parse AI JSON', content.slice(0, 400));
      return json({ error: 'AI returned invalid JSON' }, 502);
    }

    // Schedule both posts as drafts (no scheduled_at — user picks date)
    const inserts = [
      {
        user_id: user.id,
        network: 'instagram',
        caption: parsed?.carousel?.caption || material.title,
        hashtags: parsed?.carousel?.hashtags || '',
        status: 'draft',
        source_material_id: material.id,
        auto_generated: true,
        material_id: material.id,
      },
      {
        user_id: user.id,
        network: 'instagram',
        caption: `"${parsed?.quote?.text || ''}"\n— ${parsed?.quote?.reference || ''}\n\n${parsed?.quote?.caption || ''}`.trim(),
        hashtags: parsed?.quote?.hashtags || '',
        status: 'draft',
        source_material_id: material.id,
        auto_generated: true,
        material_id: material.id,
      },
    ];

    const { error: insErr } = await admin
      .from('social_calendar_posts')
      .insert(inserts);
    if (insErr) {
      console.error('autofeed: insert error', insErr);
      return json({ error: insErr.message }, 500);
    }

    // Log usage
    if (aiData.usage) {
      const cost =
        (aiData.usage.prompt_tokens || 0) * 0.0000001 +
        (aiData.usage.completion_tokens || 0) * 0.0000004;
      await admin.from('generation_logs').insert({
        user_id: user.id,
        feature: 'autofeed',
        model: 'google/gemini-2.5-flash',
        input_tokens: aiData.usage.prompt_tokens || 0,
        output_tokens: aiData.usage.completion_tokens || 0,
        total_tokens: aiData.usage.total_tokens || 0,
        cost_usd: cost,
      });
    }

    return json({ success: true, posts_created: 2, carousel: parsed?.carousel, quote: parsed?.quote });
  } catch (e) {
    console.error('autofeed-from-material fatal:', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
