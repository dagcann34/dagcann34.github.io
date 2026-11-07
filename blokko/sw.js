// Offline cache for the web version (native builds load files locally and skip this).
const V = 'blokko-v2';
const FILES = ['./', 'index.html', 'style.css', 'game.js', 'config.js', 'services.js', 'vendor/supabase.js', 'manifest.webmanifest', 'privacy.html', 'terms.html',
  'assets/logo.png', 'assets/bg-dream.jpg', 'assets/icon-192.png', 'assets/favicon-64.png',
  'assets/mascot-wave.png', 'assets/mascot-jump.png', 'assets/mascot-wow.png', 'assets/mascot-sad.png',
  'assets/fonts/baloo-2-latin-600-normal.woff2', 'assets/fonts/baloo-2-latin-800-normal.woff2',
  'assets/fonts/baloo-2-latin-ext-600-normal.woff2', 'assets/fonts/baloo-2-latin-ext-800-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request)));
});
