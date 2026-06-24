// ================================================================
//  SurveyCAM — Service Worker  v5
//  - App shell cache
//  - OSM tile offline cache
//  - Background sync ready
// ================================================================

const CACHE      = 'scam5-v39';
const TILE_CACHE = 'scam5-tiles-v39';

const ASSETS = [
  '/banyiang-ca/',
  '/banyiang-ca/index.html',
  '/banyiang-ca/manifest.json',
  '/banyiang-ca/icon-192.png',
  '/banyiang-ca/icon-512.png'
];

// ── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE && k !== TILE_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// FIX 5: tile cache — จำกัด size (500 tiles) + expiry (7 วัน)
// เดิมไม่มี limit เลย ใช้งานนานๆ storage เต็มโดยไม่รู้ตัว
const TILE_MAX   = 500;       // จำนวน tile สูงสุดที่เก็บ
const TILE_TTL   = 7*24*3600*1000;  // อายุ tile = 7 วัน (ms)

async function cacheTileWithLimit(cache, request, response) {
  // เพิ่ม timestamp header เพื่อตรวจ expiry ทีหลัง
  const headers = new Headers(response.headers);
  headers.set('x-tile-cached-at', Date.now().toString());
  const toStore = new Response(await response.clone().arrayBuffer(), {
    status: response.status, statusText: response.statusText, headers
  });
  await cache.put(request, toStore);
  // ตรวจ size — ถ้าเกิน TILE_MAX ลบเก่าสุดออก
  const keys = await cache.keys();
  if (keys.length > TILE_MAX) {
    // เรียงตาม cached-at แล้วลบที่เก่าที่สุด
    const withTs = await Promise.all(keys.map(async k => {
      const r = await cache.match(k);
      const ts = parseInt(r?.headers.get('x-tile-cached-at') || '0');
      return { k, ts };
    }));
    withTs.sort((a,b) => a.ts - b.ts);
    const toDelete = withTs.slice(0, keys.length - TILE_MAX);
    await Promise.all(toDelete.map(x => cache.delete(x.k)));
  }
}

async function matchTileWithExpiry(cache, request) {
  const cached = await cache.match(request);
  if (!cached) return null;
  const ts = parseInt(cached.headers.get('x-tile-cached-at') || '0');
  if (Date.now() - ts > TILE_TTL) {
    await cache.delete(request);  // หมดอายุ — ลบออก
    return null;
  }
  return cached;
}

// ── FETCH ─────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // OSM / CartoDB map tiles — cache with size limit + TTL (FIX 5)
  if (
    url.includes('tile.openstreetmap.org') ||
    url.includes('tile.opentopomap.org')   ||
    url.includes('basemaps.cartocdn.com')
  ) {
    e.respondWith(
      caches.open(TILE_CACHE).then(async cache => {
        const cached = await matchTileWithExpiry(cache, e.request);
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) cacheTileWithLimit(cache, e.request, res.clone());
          return res;
        }).catch(() => new Response('', { status: 408 }));
      })
    );
    return;
  }

  // Cross-origin requests (CDN libs, GAS, Drive) — network only
  if (!url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('', { status: 408 }))
    );
    return;
  }

  // App shell — cache first, fallback to network, update cache
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match('/banyiang-ca/index.html'));

      return cached || networkFetch;
    })
  );
});

// ── MESSAGE HANDLER ───────────────────────────────────────────────
self.addEventListener('message', e => {

  // Pre-cache a list of tile URLs (called from app when area is in view)
  if (e.data && e.data.type === 'CACHE_TILES') {
    const { tiles } = e.data;
    caches.open(TILE_CACHE).then(cache => {
      tiles.forEach(url => {
        fetch(url).then(res => {
          if (res.ok) cache.put(url, res);
        }).catch(() => {});
      });
    });
    e.ports[0]?.postMessage({ ok: true, count: tiles.length });
  }

  // Clear all cached tiles
  if (e.data && e.data.type === 'CLEAR_TILE_CACHE') {
    caches.delete(TILE_CACHE).then(() =>
      e.ports[0]?.postMessage({ ok: true })
    );
  }

  // Report tile cache size
  if (e.data && e.data.type === 'TILE_CACHE_SIZE') {
    caches.open(TILE_CACHE)
      .then(c => c.keys())
      .then(keys => e.ports[0]?.postMessage({ count: keys.length }));
  }

  // Force update app cache (called after deploy)
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
