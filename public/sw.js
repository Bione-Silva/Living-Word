// Living Word — App Service Worker
// Minimal SW required to make the PWA installable (Lighthouse / Chrome).
// Provides a tiny offline fallback. Push handling lives in /sw-push.js.

const CACHE_NAME = 'lw-shell-v1';
const OFFLINE_URL = '/offline.html';
const SHELL_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/livingword-icon.png',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navigation requests: try network, fall back to offline page.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets: cache-first for our known shell.
  const url = new URL(req.url);
  if (url.origin === self.location.origin && SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
