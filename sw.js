const CACHE = 'edc2026-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];

// Install: cache app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app shell, network-first for everything else
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isAppShell = ASSETS.some(a => e.request.url.endsWith(a.replace('./', ''))) ||
                     url.pathname === '/' ||
                     url.pathname.endsWith('/tracker/') ||
                     url.pathname.endsWith('/tracker');

  if (isAppShell) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  } else {
    // Network first, fall back to cache (fonts, CDN etc.)
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});

// Push notifications (for set reminders)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
