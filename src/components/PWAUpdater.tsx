import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

/**
 * PWAUpdater
 *
 * Aggressively keeps installed PWAs on the latest version:
 *  1. Registers the auto-generated SW from vite-plugin-pwa.
 *  2. Polls for new versions every 15 minutes.
 *  3. Re-checks for updates whenever the tab regains focus / becomes visible.
 *  4. When a new SW is found, it auto-activates (skipWaiting + clientsClaim
 *     are set in vite.config.ts) and we show a brief toast then reload.
 *
 * The user never has to close all tabs or "Add to Home Screen" again.
 */
export function PWAUpdater() {
  const reloadingRef = useRef(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      registrationRef.current = registration;

      const checkForUpdate = () => {
        if (!registration || registration.installing) return;
        if (typeof navigator !== "undefined" && "onLine" in navigator && !navigator.onLine) return;
        registration.update().catch(() => {
          /* silent — next tick will retry */
        });
      };

      // Periodic update check — every 15 minutes for long-lived sessions.
      const FIFTEEN_MIN = 15 * 60 * 1000;
      const interval = window.setInterval(checkForUpdate, FIFTEEN_MIN);

      // Also check when the user comes back to the app (very common in PWAs).
      const onVisibility = () => {
        if (document.visibilityState === "visible") checkForUpdate();
      };
      const onFocus = () => checkForUpdate();
      const onOnline = () => checkForUpdate();

      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("focus", onFocus);
      window.addEventListener("online", onOnline);

      // Initial check shortly after registration in case the service worker
      // was already installed from a previous session.
      window.setTimeout(checkForUpdate, 2000);

      return () => {
        window.clearInterval(interval);
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("online", onOnline);
      };
    },
    onRegisterError(err) {
      console.warn("[PWA] SW registration error:", err);
    },
  });

  useEffect(() => {
    if (!needRefresh || reloadingRef.current) return;
    reloadingRef.current = true;

    toast("Atualizando o app para a versão mais recente...", {
      duration: 2000,
    });

    // Brief delay so the toast is visible, then activate SW + reload.
    const t = window.setTimeout(() => {
      void updateServiceWorker(true);
    }, 700);

    return () => window.clearTimeout(t);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
