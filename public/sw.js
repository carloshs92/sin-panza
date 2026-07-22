// Service worker: shell + datos para funcionar sin conexión.
//
// Dos cachés separadas a propósito: el media (imágenes y GIFs) es inmutable y
// caro de descargar, así que vive en una caché sin versión que NO se borra al
// actualizar la app. Solo el shell se invalida al subir de versión.
const SHELL_CACHE = 'sinpanza-shell-v6';
const MEDIA_CACHE = 'sinpanza-media';
const HOSTS_MEDIA = ['cdn.jsdelivr.net'];

// Todo lo imprescindible para arrancar sin red: páginas, manifiesto y la
// tipografía (autoalojada justamente para no depender de Google Fonts).
const SHELL = [
  '/', '/rutinas', '/entrenar', '/editar', '/buscar', '/ajustes',
  '/manifest.webmanifest',
  '/fonts/sora-latin.woff2',
  '/fonts/sora-latin-ext.woff2',
  '/icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      // add individual: si una ruta falla no se cae la instalación entera
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== MEDIA_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Guarda una copia sin bloquear la respuesta al navegador
function guardar(cache, request, response) {
  const copia = response.clone();
  caches.open(cache).then((c) => c.put(request, copia));
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  const esMedia = HOSTS_MEDIA.includes(url.hostname);
  if (url.origin !== location.origin && !esMedia) return;

  // Media: caché primero y para siempre (las ilustraciones nunca cambian)
  if (esMedia) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((res) => {
            // Las imágenes de otro origen llegan opacas (status 0): se guardan igual
            if (res.ok || res.type === 'opaque') guardar(MEDIA_CACHE, e.request, res);
            return res;
          })
      )
    );
    return;
  }

  // Páginas: red primero (para recibir actualizaciones), caché de respaldo
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          guardar(SHELL_CACHE, e.request, res);
          return res;
        })
        // ignoreSearch: las páginas se abren con query (/entrenar?dia=lunes) y
        // en la caché están sin ella; sin esto, sin red caerían todas al inicio.
        .catch(() =>
          caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('/'))
        )
    );
    return;
  }

  // Resto de recursos propios (JS, CSS, JSON): caché primero
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          if (res.ok) guardar(SHELL_CACHE, e.request, res);
          return res;
        })
    )
  );
});
