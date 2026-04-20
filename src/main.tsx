import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/bible-theme.css";

const AUTH_STORAGE_MATCHERS = [/^sb-/, /^supabase\.auth\./, /-auth-token/];

function clearPreviewAuthStorage() {
  try {
    [window.localStorage, window.sessionStorage].forEach((storage) => {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key) continue;
        if (AUTH_STORAGE_MATCHERS.some((matcher) => matcher.test(key))) {
          keys.push(key);
        }
      }
      keys.forEach((key) => storage.removeItem(key));
    });
  } catch {
    // noop
  }
}

// PWA: Prevent service worker registration inside iframes or Lovable preview
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

async function invalidateStaleBuildCaches() {
  try {
    const storageKey = "lw_app_build_id";
    const previousBuildId = window.localStorage.getItem(storageKey);

    if (!previousBuildId) {
      window.localStorage.setItem(storageKey, __APP_BUILD_ID__);
      return;
    }

    if (previousBuildId === __APP_BUILD_ID__) return;

    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all(
      (registrations ?? []).map(async (registration) => {
        const scriptUrl =
          registration.active?.scriptURL ||
          registration.waiting?.scriptURL ||
          registration.installing?.scriptURL ||
          "";

        if (!scriptUrl.includes("/sw-push.js")) {
          await registration.unregister();
        }
      }),
    );

    const cacheNames = await window.caches?.keys?.();
    await Promise.all((cacheNames ?? []).map((cacheName) => window.caches.delete(cacheName)));

    window.localStorage.setItem(storageKey, __APP_BUILD_ID__);
  } catch {
    // noop
  }
}

if (isPreviewHost || isInIframe) {
  clearPreviewAuthStorage();
  // Only unregister non-push service workers in preview/iframe; keep /sw-push.js for testing
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => {
      const scriptUrl = r.active?.scriptURL || '';
      if (!scriptUrl.includes('/sw-push.js')) {
        r.unregister();
      }
    });
  });

  window.caches?.keys?.().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      void window.caches.delete(cacheName);
    });
  });
}

if (!isPreviewHost && !isInIframe) {
  void invalidateStaleBuildCaches();
}
// Production: vite-plugin-pwa registers the generated service worker
// automatically via <PWAUpdater /> (useRegisterSW). No manual registration here —
// the previous /sw.js was a hand-rolled shell that conflicted with the
// auto-generated SW and prevented updates from reaching installed users.

createRoot(document.getElementById("root")!).render(<App />);

