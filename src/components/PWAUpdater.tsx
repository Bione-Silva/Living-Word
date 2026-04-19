import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

/**
 * PWAUpdater
 *
 * Listens for new Service Worker versions emitted by vite-plugin-pwa.
 * When a new version is available we:
 *   1. Show a brief, non-intrusive toast.
 *   2. Call updateSW(true) which posts SKIP_WAITING to the new SW and
 *      reloads the page once it activates.
 *
 * We also poll the SW every 60 minutes so long-lived sessions
 * (installed PWAs left open for days) eventually pick up new builds.
 */
export function PWAUpdater() {
  const reloadingRef = useRef(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      // Periodic update check — once an hour
      const ONE_HOUR = 60 * 60 * 1000;
      const interval = setInterval(() => {
        if (registration.installing || !navigator) return;
        if ("connection" in navigator && !(navigator as Navigator & { onLine: boolean }).onLine) return;
        registration.update().catch(() => {
          /* silent — next tick will retry */
        });
      }, ONE_HOUR);

      // Cleanup if the registration changes (rare, but defensive)
      return () => clearInterval(interval);
    },
    onRegisterError(err) {
      // Keep this quiet in production — don't bother the user.
      console.warn("[PWA] SW registration error:", err);
    },
  });

  useEffect(() => {
    if (!needRefresh || reloadingRef.current) return;
    reloadingRef.current = true;

    toast("Atualizando o app para a versão mais recente...", {
      duration: 2500,
    });

    // Small delay so the user can see the toast briefly,
    // then activate the new SW and reload.
    const t = setTimeout(() => {
      void updateServiceWorker(true);
    }, 800);

    return () => clearTimeout(t);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
