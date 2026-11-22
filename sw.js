const CACHE="ffglory-siam-v1";
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["/","/style.css","/app.js","/manifest.json"]))));
self.addEventListener("fetch",e=>{if(e.request.url.includes("/api/"))return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)))});
