import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendWebPush, type VapidConfig } from '../_shared/web-push.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Load VAPID
    const { data: settings } = await admin
      .from('global_settings')
      .select('key, value')
      .in('key', ['vapid_public_jwk', 'vapid_private_jwk', 'vapid_subject']);
    const map = Object.fromEntries((settings ?? []).map((s: any) => [s.key, s.value]));
    if (!map.vapid_public_jwk || !map.vapid_private_jwk) {
      return new Response(JSON.stringify({ error: 'VAPID not initialized. Call push-vapid-public-key first.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const vapid: VapidConfig = {
      publicJwk: JSON.parse(map.vapid_public_jwk),
      privateJwk: JSON.parse(map.vapid_private_jwk),
      subject: map.vapid_subject || 'mailto:noreply@livingword.app',
    };

    // Load this user's subscriptions
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', user.id);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ error: 'No subscriptions found for user' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3 notificações de teste diferentes para validar entrega
    const payloads = [
      {
        title: '✦ Living Word — Teste 1/3',
        body: 'Devocional do dia: "Aquietai-vos e sabei que Eu sou Deus." (Sl 46.10)',
        url: '/devocional',
        tag: 'test-1',
      },
      {
        title: '📖 Living Word — Teste 2/3',
        body: 'Sua leitura bíblica está esperando. Continue de onde parou em Romanos 8.',
        url: '/biblia',
        tag: 'test-2',
      },
      {
        title: '🕊️ Living Word — Teste 3/3',
        body: 'Notificações ativas com sucesso. A Palavra chegará a você todos os dias ✨',
        url: '/dashboard',
        tag: 'test-3',
      },
    ];

    let sent = 0;
    let failed = 0;
    for (const s of subs) {
      for (let i = 0; i < payloads.length; i++) {
        const payload = JSON.stringify(payloads[i]);
        try {
          // pequeno delay entre envios para o navegador renderizar separadamente
          if (i > 0) await new Promise((r) => setTimeout(r, 800));
          const res = await sendWebPush(
            { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
            payload,
            vapid
          );
          const ok = res.status >= 200 && res.status < 300;
          await admin.from('push_deliveries').insert({
            user_id: user.id,
            subscription_id: s.id,
            payload: JSON.parse(payload),
            status: ok ? 'sent' : 'failed',
            status_code: res.status,
            error: ok ? null : await res.text().catch(() => null),
          });
          if (ok) {
            sent++;
            await admin.from('push_subscriptions').update({ last_success_at: new Date().toISOString() }).eq('id', s.id);
          } else {
            failed++;
            if (res.status === 404 || res.status === 410) {
              await admin.from('push_subscriptions').delete().eq('id', s.id);
              break;
            }
          }
        } catch (e) {
          failed++;
          await admin.from('push_deliveries').insert({
            user_id: user.id,
            subscription_id: s.id,
            payload: JSON.parse(payload),
            status: 'failed',
            error: String(e),
          });
        }
      }
    }

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('push-send-test error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
