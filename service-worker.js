const CACHE = 'echotap-v2';
const ASSETS = [
  '/', '/index.html','/styles.css','/app.js','/audio.js','/fx.js','/state.js','/store.js','/utils.js',
  '/themes.js','/captions.js','/manifest.webmanifest','/assets/icon-192.png','/assets/icon-512.png','/assets/logo.svg'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e)=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if (e.request.method!=='GET') return;
  e.respondWith((async ()=>{
    const match = await caches.match(e.request);
    if (match) return match;
    try{
      const resp = await fetch(e.request);
      const copy = resp.clone();
      const cache = await caches.open(CACHE);
      // only cache same-origin
      if (url.origin === location.origin) cache.put(e.request, copy);
      return resp;
    }catch{
      return match; // if offline & not cached, fallback to any match
    }
  })());
});
