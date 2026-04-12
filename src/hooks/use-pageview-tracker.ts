// @ts-nocheck
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Other';
}

function getSessionId(): string {
  let sid = sessionStorage.getItem('lw_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('lw_session_id', sid);
  }
  return sid;
}

export function usePageviewTracker(path?: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const trackPath = path || window.location.pathname;

    supabase.functions.invoke('track-pageview', {
      body: {
        path: trackPath,
        referrer: document.referrer || null,
        device: detectDevice(),
        browser: detectBrowser(),
        user_agent: navigator.userAgent,
        session_id: getSessionId(),
      },
    }).catch(() => {
      // Silent fail - tracking should never break the app
    });
  }, [path]);
}
