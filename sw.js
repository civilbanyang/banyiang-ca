const CACHE = 'surveycam-v3';
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
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // ไม่ cache request ภายนอก (leaflet, osm tiles)
  if (!e.request.url.startsWith(self.location.origin)) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 408 })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/surveycam/index.html'));
    })
  );
});
