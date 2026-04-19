import { supabase } from '@/integrations/supabase/client';

export type InstallEvent = 'shown' | 'clicked' | 'installed' | 'dismissed';
export type InstallVariant = 'initial' | 'soft_reengagement';

const SESSION_KEY = 'lw_pwa_session_id';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

/**
 * Fire-and-forget analytics for the PWA install card lifecycle.
 * Never blocks UI. Silently no-ops on error.
 */
export async function trackInstallEvent(
  event: InstallEvent,
  variant: InstallVariant = 'initial',
): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ?? null;
    await supabase.from('pwa_install_events').insert({
      user_id: userId,
      session_id: getSessionId(),
      event,
      variant,
      platform: detectPlatform(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
    });
  } catch {
    // Analytics must never break the UI.
  }
}
