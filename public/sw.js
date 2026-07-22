// Service worker: cachea el shell y los datos para funcionar sin conexión.
// Los GIFs de /videos no se precachean (125 MB): se cachean al usarse.
const CACHE = 'sinpanza-v1';
const SHELL = ['/', '/rutinas', '/entrenar', '/ajustes', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // red primero para las páginas (para recibir actualizaciones), caché de respaldo
  const esPagina = e.request.mode === 'navigate';
  e.respondWith(
    esPagina
      ? fetch(e.request)
          .then((res) => {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copia));
            return res;
          })
          .catch(() => caches.match(e.request).then((r) => r || caches.match('/')))
      : caches.match(e.request).then(
          (hit) =>
            hit ||
            fetch(e.request).then((res) => {
              if (res.ok) {
                const copia = res.clone();
                caches.open(CACHE).then((c) => c.put(e.request, copia));
              }
              return res;
            })
        )
  );
});
