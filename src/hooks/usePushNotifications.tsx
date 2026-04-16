import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const SW_URL = '/sw-push.js';

export function usePushNotifications() {
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'default'
  );
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  const refreshState = useCallback(async () => {
    if (!supported) return;
    setPermission(Notification.permission);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      const sub = await reg?.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      setSubscribed(false);
    }
  }, [supported]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const subscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!supported) return { ok: false, error: 'unsupported' };
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return { ok: false, error: 'denied' };

      const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const { data: vapidData, error: vapidErr } = await supabase.functions.invoke(
        'push-vapid-public-key'
      );
      if (vapidErr || !vapidData?.publicKey) {
        return { ok: false, error: vapidErr?.message || 'vapid-missing' };
      }

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
        }));

      const payload = {
        endpoint: sub.endpoint,
        p256dh: bufferToBase64Url(sub.getKey('p256dh')!),
        auth: bufferToBase64Url(sub.getKey('auth')!),
        userAgent: navigator.userAgent,
        platform: /iPhone|iPad/i.test(navigator.userAgent)
          ? 'ios'
          : /Android/i.test(navigator.userAgent)
          ? 'android'
          : 'desktop',
      };

      const { error } = await supabase.functions.invoke('push-register', { body: payload });
      if (error) return { ok: false, error: error.message };

      setSubscribed(true);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? String(e) };
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.functions.invoke('push-register', {
          body: { action: 'unsubscribe', endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const sendTest = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('push-send-test');
    if (error) return { ok: false, error: error.message };
    return { ok: true, sent: data?.sent ?? 0, failed: data?.failed ?? 0 };
  }, []);

  return { supported, permission, subscribed, busy, subscribe, unsubscribe, sendTest, refresh: refreshState };
}
