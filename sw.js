/* MacroLog service worker — offline cache.
   Kept as a real same-origin file because browsers refuse inline/blob SW
   registration. Strategy: network-first with cache fallback — always fresh
   while online, and the app (plus CDN libs: Chart.js, ZXing, Google Fonts)
   keeps working offline after the first load. Open Food Facts API responses
   are NOT cached here — product data is cached structurally in IndexedDB by
   the app itself (keyed by barcode), which survives cache eviction and is
   queryable. */
const CACHE='macrolog-v1';

self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // Let the app handle OFF API availability itself (it has its own IDB cache
  // and offline UI) — stale API responses from a SW cache would mask that.
  if(url.hostname.endsWith('openfoodfacts.org'))return;
  e.respondWith(
    fetch(e.request).then(r=>{
      const cp=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});
      return r;
    }).catch(()=>caches.match(e.request).then(m=>m||Response.error()))
  );
});
