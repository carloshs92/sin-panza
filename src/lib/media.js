// Origen de las imágenes y GIFs de los ejercicios.
//
// El media (© Gym visual) no se redistribuye en este repo: se sirve desde el
// dataset original vía jsDelivr. Así el repositorio queda liviano y el build
// no depende de rutas externas.
//
// Para servirlo en local, copia images/ y videos/ dentro de public/ y define
// PUBLIC_MEDIA_BASE= (vacío) en un archivo .env
const CDN = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main';

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
