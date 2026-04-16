import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendWebPush, type VapidConfig } from '../_shared/web-push.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Returns the current hour (0-23) in the given IANA timezone.
function hourInTimezone(tz: string): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: tz,
    });
    const parts = fmt.formatToParts(new Date());
    const h = parts.find((p) => p.type === 'hour')?.value ?? '0';
    const n = parseInt(h, 10);
    return n === 24 ? 0 : n;
  } catch {
    return new Date().getUTCHours();
  }
}

function todayInTimezone(tz: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: tz,
    });
    return fmt.format(new Date()); // yyyy-mm-dd
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
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
      return new Response(JSON.stringify({ error: 'VAPID not initialized' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const vapid: VapidConfig = {
      publicJwk: JSON.parse(map.vapid_public_jwk),
      privateJwk: JSON.parse(map.vapid_private_jwk),
      subject: map.vapid_subject || 'mailto:noreply@livingword.app',
    };

    // Load all opted-in users
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, push_enabled, push_hour, push_timezone, language')
      .eq('push_enabled', true);

    const due = (profiles ?? []).filter((p: any) => {
      const h = hourInTimezone(p.push_timezone || 'America/Sao_Paulo');
      return h === Number(p.push_hour ?? 6);
    });

    if (due.length === 0) {
      return new Response(JSON.stringify({ checked: profiles?.length ?? 0, due: 0, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    let failed = 0;

    // Per language, fetch today's devotional once
    const cache = new Map<string, any>();
    async function getDevotional(lang: string, tz: string) {
      const key = `${lang}|${todayInTimezone(tz)}`;
      if (cache.has(key)) return cache.get(key);
      const today = todayInTimezone(tz);
      const { data } = await admin
        .from('devotionals')
        .select('id, title, anchor_verse, anchor_verse_text, category')
        .eq('language', lang)
        .lte('scheduled_date', today)
        .order('scheduled_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      cache.set(key, data);
      return data;
    }

    for (const p of due) {
      const lang = (p.language || 'PT').toUpperCase();
      const dev = await getDevotional(lang, p.push_timezone || 'America/Sao_Paulo');
      if (!dev) continue;

      const titleByLang: Record<string, string> = {
        PT: '☕ Sua Palavra Viva de hoje',
        EN: '☕ Your Living Word for today',
        ES: '☕ Tu Palabra Viva de hoy',
      };
      const ctaByLang: Record<string, string> = {
        PT: 'Toque para meditar agora ✦',
        EN: 'Tap to meditate now ✦',
        ES: 'Toca para meditar ahora ✦',
      };

      const payload = JSON.stringify({
        title: titleByLang[lang] || titleByLang.PT,
        body: `${dev.title}\n${dev.anchor_verse} — ${ctaByLang[lang] || ctaByLang.PT}`,
        url: '/devocional',
        tag: `devotional-${dev.id}`,
        devotionalId: dev.id,
      });

      const { data: subs } = await admin
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', p.id);

      for (const s of subs ?? []) {
        try {
          const res = await sendWebPush(
            { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
            payload,
            vapid
          );
          const ok = res.status >= 200 && res.status < 300;
          await admin.from('push_deliveries').insert({
            user_id: p.id,
            subscription_id: s.id,
            payload: JSON.parse(payload),
            status: ok ? 'sent' : 'failed',
            status_code: res.status,
            error: ok ? null : await res.text().catch(() => null),
          });
          if (ok) {
            sent++;
            await admin
              .from('push_subscriptions')
              .update({ last_success_at: new Date().toISOString() })
              .eq('id', s.id);
          } else {
            failed++;
            if (res.status === 404 || res.status === 410) {
              await admin.from('push_subscriptions').delete().eq('id', s.id);
            }
          }
        } catch (e) {
          failed++;
          await admin.from('push_deliveries').insert({
            user_id: p.id,
            subscription_id: s.id,
            payload: JSON.parse(payload),
            status: 'failed',
            error: String(e),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ checked: profiles?.length ?? 0, due: due.length, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('push-send-daily error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
