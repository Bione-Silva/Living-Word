import { useCallback, useEffect, useRef, useState } from 'react';
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
  // Pre-loaded VAPID key — fetched once on mount so the subscribe() handler
  // doesn't have to await a network round-trip after the user gesture.
  const vapidKeyRef = useRef<string | null>(null);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

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

  // Pre-warm: register the SW and fetch the VAPID key as soon as possible,
  // so by the time the user clicks "enable" we can call requestPermission and
  // pushManager.subscribe synchronously without losing the user gesture.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    (async () => {
      try {
        const reg =
          (await navigator.serviceWorker.getRegistration(SW_URL)) ||
          (await navigator.serviceWorker.register(SW_URL, { scope: '/' }));
        await navigator.serviceWorker.ready;
        if (cancelled) return;
        swRegRef.current = reg;

        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setSubscribed(!!sub);
      } catch (e) {
        console.warn('[push] sw register prewarm failed', e);
      }

      try {
        const { data, error } = await supabase.functions.invoke('push-vapid-public-key');
        if (cancelled) return;
        if (error) {
          console.warn('[push] vapid prewarm error', error);
        } else if (data?.publicKey) {
          vapidKeyRef.current = data.publicKey;
        }
      } catch (e) {
        console.warn('[push] vapid prewarm exception', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const subscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!supported) {
      console.warn('[push] not supported');
      return { ok: false, error: 'unsupported' };
    }
    setBusy(true);
    try {
      // STEP 1 — request permission FIRST, synchronously inside the user gesture.
      // No awaits before this call other than the permission call itself.
      console.log('[push] requesting permission, current=', Notification.permission);
      const perm = await Notification.requestPermission();
      console.log('[push] permission result=', perm);
      setPermission(perm);
      if (perm !== 'granted') return { ok: false, error: 'denied' };

      // STEP 2 — make sure we have a SW registration. Use the pre-warmed one if available.
      let reg = swRegRef.current;
      if (!reg) {
        reg =
          (await navigator.serviceWorker.getRegistration(SW_URL)) ||
          (await navigator.serviceWorker.register(SW_URL, { scope: '/' }));
        await navigator.serviceWorker.ready;
        swRegRef.current = reg;
      }
      console.log('[push] sw registration ok');

      // STEP 3 — make sure we have the VAPID key. Use pre-warmed if available.
      let vapidKey = vapidKeyRef.current;
      if (!vapidKey) {
        console.log('[push] vapid not pre-warmed, fetching now');
        const { data: vapidData, error: vapidErr } = await supabase.functions.invoke(
          'push-vapid-public-key'
        );
        if (vapidErr || !vapidData?.publicKey) {
          console.error('[push] vapid fetch failed', vapidErr);
          return { ok: false, error: vapidErr?.message || 'vapid-missing' };
        }
        vapidKey = vapidData.publicKey;
        vapidKeyRef.current = vapidKey;
      }

      // STEP 4 — subscribe (or reuse existing subscription).
      const existing = await reg.pushManager.getSubscription();
      const appServerKey = urlBase64ToUint8Array(vapidKey);
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey.buffer.slice(
            appServerKey.byteOffset,
            appServerKey.byteOffset + appServerKey.byteLength,
          ) as ArrayBuffer,
        }));
      console.log('[push] subscribed to push manager');

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
      if (error) {
        console.error('[push] register failed', error);
        return { ok: false, error: error.message };
      }

      setSubscribed(true);
      console.log('[push] all done');
      return { ok: true };
    } catch (e: any) {
      console.error('[push] subscribe exception', e);
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
