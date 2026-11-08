/* Blend & Read service worker: lets the app open and play with no internet.
   App files: try the network first so updates arrive straight away, fall back to the saved copy offline.
   Fonts: use the saved copy first (they never change). Everything else (Claude, the speech model) is left alone. */
const VERSION = 'blend-read-v2';
const APP_FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'css/style.css',
  'js/data.js', 'js/sounds.js', 'js/games.js', 'js/book-maker.js', 'js/main.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('blend-read-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const c = await caches.open(VERSION);
    try {
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (e) {
      return (await c.match(req, { ignoreSearch: true })) ||
        (req.mode === 'navigate' ? await c.match('index.html') : undefined) ||
        new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
