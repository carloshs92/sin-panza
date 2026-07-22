// Origen de las imágenes y GIFs de los ejercicios.
//
// El media (© Gym visual) no se redistribuye en este repo: se sirve desde el
// dataset original vía jsDelivr. Así el repositorio queda liviano y el build
// no depende de rutas externas.
//
// Para servirlo en local, copia images/ y videos/ dentro de public/ y define
// PUBLIC_MEDIA_BASE= (vacío) en un archivo .env
const CDN = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main';

// Debe coincidir con MEDIA_CACHE de public/sw.js: la caché sin versión que
// sobrevive a las actualizaciones de la app.
export const MEDIA_CACHE = 'sinpanza-media';

export const MEDIA_BASE = import.meta.env.PUBLIC_MEDIA_BASE ?? CDN;

// Recibe una ruta relativa del dataset ("images/0001-x.jpg") y devuelve la URL final.
export const mediaUrl = (ruta) => `${MEDIA_BASE}/${ruta}`;

export const ATRIBUCION = '© Gym visual — gymvisual.com';

// Precarga en segundo plano. El media es inmutable, así que una vez descargado
// queda en la caché del service worker y del navegador para siempre.
export function precargar(rutas) {
  if (typeof window === 'undefined' || !rutas?.length) return;
  const bajar = () => {
    for (const ruta of rutas) {
      if (!ruta) continue;
      const img = new Image();
      img.decoding = 'async';
      img.src = mediaUrl(ruta);
    }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(bajar, { timeout: 3000 });
  else setTimeout(bajar, 600);
}

// ---- Descarga deliberada para entrenar sin internet ----

export const hayCache = () => typeof caches !== 'undefined';

// Todas las URLs (miniatura + animación) de las rutinas guardadas.
export function urlsDeRutinas(rutinas) {
  const urls = new Set();
  for (const dia of Object.values(rutinas || {})) {
    for (const e of dia || []) {
      if (e.image) urls.add(mediaUrl(e.image));
      if (e.gif) urls.add(mediaUrl(e.gif));
    }
  }
  return [...urls];
}

export async function cuantoFalta(urls) {
  if (!hayCache()) return { guardados: 0, total: urls.length };
  const c = await caches.open(MEDIA_CACHE);
  const hits = await Promise.all(urls.map((u) => c.match(u)));
  return { guardados: hits.filter(Boolean).length, total: urls.length };
}

// Descarga en paralelo controlado (6 a la vez) informando el progreso.
export async function descargar(urls, onProgreso) {
  if (!hayCache()) throw new Error('Este navegador no permite guardar sin conexión');
  const c = await caches.open(MEDIA_CACHE);
  let hechos = 0;
  let bytes = 0;
  let fallos = 0;

  const uno = async (url) => {
    try {
      const guardado = await c.match(url);
      if (guardado) {
        bytes += Number(guardado.headers.get('content-length')) || 0;
      } else {
        const res = await fetch(url);
        if (res.ok) {
          bytes += Number(res.headers.get('content-length')) || 0;
          await c.put(url, res.clone());
        } else fallos++;
      }
    } catch {
      fallos++;
    }
    hechos++;
    onProgreso?.({ hechos, total: urls.length, bytes, fallos });
  };

  const cola = [...urls];
  const obreros = Array.from({ length: Math.min(6, cola.length) }, async () => {
    while (cola.length) await uno(cola.shift());
  });
  await Promise.all(obreros);
  return { hechos, bytes, fallos };
}
