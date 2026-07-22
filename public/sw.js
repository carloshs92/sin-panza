// Service worker: cachea el shell y los datos para funcionar sin conexión.
// El media vive en jsDelivr y se cachea al usarse (nunca se precachea: son 136 MB).
const CACHE = 'sinpanza-v2';
const HOSTS_MEDIA = ['cdn.jsdelivr.net'];
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
  if (e.request.method !== 'GET') return;
  // Solo se gestiona lo propio y el media del dataset (jsDelivr)
  if (url.origin !== location.origin && !HOSTS_MEDIA.includes(url.hostname)) return;

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
              // Las imágenes de otro origen llegan como respuesta opaca (status 0):
              // se cachean igual para que el modo sin conexión funcione.
              if (res.ok || res.type === 'opaque') {
                const copia = res.clone();
                caches.open(CACHE).then((c) => c.put(e.request, copia));
              }
              return res;
            })
        )
  );
});
