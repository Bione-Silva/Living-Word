import { useEffect, useState } from 'react';

/**
 * Detects whether the app is running in standalone (installed PWA) mode.
 * Returns true when launched from the home screen on iOS/Android or as installed PWA on desktop.
 */
export function useIsStandalone() {
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const mql = window.matchMedia('(display-mode: standalone)').matches;
      // iOS Safari exposes navigator.standalone
      const iosStandalone = (window.navigator as any).standalone === true;
      return mql || iosStandalone;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    const onChange = () => setIsStandalone(mql.matches || (window.navigator as any).standalone === true);
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  return isStandalone;
}
