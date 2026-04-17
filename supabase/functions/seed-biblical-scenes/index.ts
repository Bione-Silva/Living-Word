// Seed das 10 cenas bíblicas curadas. Roda apenas para admins.
// Use uma única vez: chame com supabase.functions.invoke('seed-biblical-scenes')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const SCENES = [
  { id: 'cross', desc: 'Cruz ao pôr do sol', kw: ['cruz','cross','calvario','calvary','golgota','jesus'],
    prompt: "A wooden cross silhouetted at golden hour, dramatic warm sunlight piercing through clouds, painterly biblical landscape, cinematic, soft bokeh, no text" },
  { id: 'ark', desc: 'Arca de Noé com arco-íris', kw: ['arca','ark','noe','noah','diluvio','flood','rainbow','arco'],
    prompt: "Noah's wooden ark on calm waters at dawn, rainbow arching across moody sky, painterly biblical scene, soft warm light, no text" },
  { id: 'lamb', desc: 'Cordeiro ao amanhecer', kw: ['cordeiro','lamb','cordero','ovelha','sheep','pastor','shepherd'],
    prompt: "A gentle lamb on a misty hillside at sunrise, soft golden backlight, painterly biblical landscape, peaceful, cinematic, no text" },
  { id: 'sea-galilee', desc: 'Mar da Galileia', kw: ['mar','sea','galileia','galilee','pescador','barco','boat','aguas'],
    prompt: "The Sea of Galilee at dawn, calm rippling water, distant fishing boat silhouette, warm horizon glow, painterly biblical, no text" },
  { id: 'desert', desc: 'Deserto bíblico', kw: ['deserto','desert','desierto','jornada','journey','caminho'],
    prompt: "Vast biblical desert at dusk, rolling sand dunes, lone path winding through, warm amber light, cinematic painterly, no text" },
  { id: 'wheat', desc: 'Searas douradas', kw: ['seara','wheat','trigo','colheita','harvest','campo','field'],
    prompt: "Golden wheat field swaying in soft wind at golden hour, low warm sun, painterly biblical landscape, cinematic, no text" },
  { id: 'light', desc: 'Vitral e luz divina', kw: ['luz','light','vitral','stained','glass','santuario','igreja','church'],
    prompt: "Cathedral stained glass window casting warm golden and amber light into a quiet sanctuary, dust particles floating, painterly cinematic, no text" },
  { id: 'jerusalem', desc: 'Jerusalém ao amanhecer', kw: ['jerusalem','cidade','city','muralha','templo','temple'],
    prompt: "Ancient Jerusalem at dawn, warm stone walls, soft golden mist over the old city, painterly biblical landscape, cinematic, no text" },
  { id: 'manger', desc: 'Manjedoura natalina', kw: ['manjedoura','manger','pesebre','natal','christmas','jesus','crianca'],
    prompt: "A humble wooden manger filled with hay, soft warm lantern light, peaceful Christmas night atmosphere, painterly biblical, no text" },
  { id: 'path', desc: 'Caminho dourado', kw: ['caminho','path','camino','jornada','esperanca','hope','horizonte'],
    prompt: "A narrow path through golden grass leading to a glowing horizon at sunrise, painterly biblical landscape, hope and journey, cinematic, no text" },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verifica admin
    const { data: isAdminData } = await admin.rpc('is_admin');
    // Fallback: aceita também emails de admin conhecidos
    const adminEmails = ['bionicaosilva@gmail.com'];
    const isAdmin = isAdminData === true || adminEmails.includes(user.email || '');
    if (!isAdmin) return new Response(JSON.stringify({ error: 'Admin only' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const results: { id: string; status: string; url?: string; error?: string }[] = [];

    for (const scene of SCENES) {
      try {
        // Skip se já existe curated com mesmo description
        const { data: existing } = await admin
          .from('biblical_scene_library')
          .select('id')
          .eq('is_curated', true)
          .eq('description', scene.desc)
          .limit(1);
        if (existing && existing.length > 0) {
          results.push({ id: scene.id, status: 'skipped (exists)' });
          continue;
        }

        // Gera com IA
        const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{ role: 'user', content: scene.prompt }],
            modalities: ['image', 'text'],
          }),
        });
        if (!aiRes.ok) throw new Error(`AI ${aiRes.status}`);
        const aiData = await aiRes.json();
        const dataUrl: string = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!dataUrl) throw new Error('no image');

        const [, b64] = dataUrl.split(',');
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const fname = `curated/${scene.id}-${crypto.randomUUID().slice(0, 8)}.png`;

        const { error: upErr } = await admin.storage
          .from('biblical-scenes')
          .upload(fname, bytes, { contentType: 'image/png', upsert: true });
        if (upErr) throw upErr;

        const { data: pub } = admin.storage.from('biblical-scenes').getPublicUrl(fname);

        const { error: insErr } = await admin.from('biblical_scene_library').insert({
          prompt: scene.prompt,
          description: scene.desc,
          keywords: scene.kw,
          image_url: pub.publicUrl,
          storage_path: fname,
          is_curated: true,
          use_count: 0,
        });
        if (insErr) throw insErr;

        results.push({ id: scene.id, status: 'created', url: pub.publicUrl });
      } catch (e) {
        results.push({ id: scene.id, status: 'error', error: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('seed error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
