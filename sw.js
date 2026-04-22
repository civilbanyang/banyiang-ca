const CACHE = 'scam5-v17';
const TILE_CACHE = 'scam5-tiles-v17';
const ASSETS = [
  '/banyiang-ca/',
  '/banyiang-ca/index.html',
  '/banyiang-ca/manifest.json',
  '/banyiang-ca/icon-192.png',
  '/banyiang-ca/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== TILE_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // OSM map tiles — cache aggressively for offline
  if (url.includes('tile.openstreetmap.org') || url.includes('tile.opentopomap.org')) {
    e.respondWith(
      caches.open(TILE_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => new Response('', { status: 408 }));
        })
      )
    );
    return;
  }

  // App shell
  if (!url.startsWith(self.location.origin)) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 408 })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match('/banyiang-ca/index.html'));
    })
  );
});

// รับข้อความจาก app เพื่อ pre-cache tiles ใน area
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'CACHE_TILES') {
    const { tiles } = e.data;
    caches.open(TILE_CACHE).then(cache => {
      tiles.forEach(url => {
        fetch(url).then(res => { if (res.ok) cache.put(url, res); }).catch(() => {});
      });
    });
    e.ports[0]?.postMessage({ ok: true, count: tiles.length });
  }
  if (e.data && e.data.type === 'CLEAR_TILE_CACHE') {
    caches.delete(TILE_CACHE).then(() => e.ports[0]?.postMessage({ ok: true }));
  }
  if (e.data && e.data.type === 'TILE_CACHE_SIZE') {
    caches.open(TILE_CACHE).then(c => c.keys()).then(keys => {
      e.ports[0]?.postMessage({ count: keys.length });
    });
  }
});
