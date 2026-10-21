// Change the version whenever bundled files change.
const CACHE = 'elementmath-offline-v1';
const ASSETS = ["/", "+-speed.html", "0+-0.html", "0+-0eq.html", "00+-00.html", "00+-00eq.html", "000+-000.html", "000+-000eq.html", "000x000.html", "00x0.html", "00x00.html", "0x0.html", "complexcalcu.html", "devide001.html", "devide002.html", "devide003.html", "devide004.html", "index.html", "practice.html", "tdspeed.html", "test.html", "pwa.js", "pwa.css", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('elementmath-offline-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data === 'OFFLINE_STATUS') {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE);
      const ready = (await Promise.all(ASSETS.map(url => cache.match(url)))).every(Boolean);
      event.source?.postMessage({type:'OFFLINE_STATUS', ready});
    })());
  }
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Netlify also exposes HTML pages without their extension.
  let path = decodeURIComponent(url.pathname);
  if (path === '/') path = '/index.html';
  if (!path.split('/').pop().includes('.')) path += '.html';
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(path);
    if (hit) return hit;
    return fetch(event.request);
  })());
});
