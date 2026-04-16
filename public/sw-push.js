// Custom service worker for push notifications.
// Registered separately from the PWA workbox SW so it survives prod and dev.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Living Word', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Living Word';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'living-word',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/dashboard',
      devotionalId: data.devotionalId,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const u = new URL(client.url);
          if (u.origin === self.location.origin) {
            client.focus();
            client.postMessage({ type: 'PUSH_NAVIGATE', url: targetUrl });
            return;
          }
        } catch {}
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
