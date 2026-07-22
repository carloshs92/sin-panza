# SinPanza · Webapp de entrenamiento personal

Webapp en **Astro 5** con View Transitions que convierte el catálogo de ExerciseDB
(`../exercises-dataset-main`) en un entrenador personal guiado por voz.

## Correr

Requiere Node 18.17+ (hay `.nvmrc` con 22):

```bash
nvm use 22
npm install
npm run dev        # http://localhost:4321
```

> Las imágenes y GIFs **no viven en este repo**: se sirven desde el dataset
> original ([exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset))
> vía jsDelivr — ver `src/lib/media.js`. Así el repositorio pesa ~12 MB en vez de
> 150 MB y el deploy no depende de rutas externas.
>
> Para servir el media localmente (modo sin conexión total): copia `images/` y
> `videos/` del dataset dentro de `public/` y crea un `.env` con
> `PUBLIC_MEDIA_BASE=` (vacío).
>
> Los `public/data/exercises.<idioma>.json` son versiones recortadas del
> `data/exercises.json` original; se regeneran con
> `python3 scripts/generar-datos.py` (necesita el dataset en `../exercises-dataset-main`).

## Deploy en Vercel

El repo es la carpeta `app/`, así que Vercel funciona sin configuración: detecta
Astro, corre `pnpm run build` y publica `dist/`. No definas Root Directory.

## Flujo

1. **Onboarding** (`/`): idioma de las instrucciones → edad → zonas a trabajar →
   equipamiento disponible (solo cuerpo, mancuernas, bandas, kettlebell, barra o
   gym completo) → tiempo disponible (15 min por defecto) → días de la semana.
   Genera una rutina distinta por día usando **solo ejercicios que puedas hacer
   con tu equipo**; el comando de voz y las explicaciones usan el idioma elegido
   (hay 10: es, en, fr, it, pl, tr, ru, zh, hi, ko — un JSON por idioma en
   `public/data/`). Los nombres de los ejercicios vienen solo en inglés en el
   dataset original.
2. **Rutinas** (`/rutinas`): lista de días con el de hoy destacado, miniaturas y
   duración estimada.
3. **Entrenar** (`/entrenar?dia=lunes`): muestra un solo ejercicio a la vez.
   - Timer de **3 min** por ejercicio y **4 series**, ambos configurables ahí
     mismo y en Ajustes.
   - El ejercicio **solo empieza cuando dices «ahora»** (o «inicio», «vamos»…)
     con el micrófono activado — hay botón de respaldo si no hay voz.
   - Entre series hay un descanso de **5 s con ticks sonoros**; otro sonido marca
     la siguiente serie y una campanilla el cambio de ejercicio.
4. **Editar** (`/editar?dia=lunes`): reordena los ejercicios del día, cámbialos o
   quítalos. Cada cambio se guarda al instante.
5. **Buscar** (`/buscar?dia=lunes&pos=2`): catálogo completo con búsqueda por
   nombre, filtro por zona y, activado por defecto, «solo lo que puedo hacer con
   mi equipo». Se pinta de a 30 con scroll infinito. `pos=nueva` añade al final.
6. **Ajustes** (`/ajustes`): minutos/series/descanso, instalar la app,
   regenerar rutinas, borrar todo.

## Caché del media

Las ilustraciones nunca cambian, así que el service worker usa **dos cachés**:
`sinpanza-shell-vN` (versionada, se renueva al actualizar la app) y
`sinpanza-media` (sin versión, **nunca se borra**). Además se precargan en
segundo plano las miniaturas de la semana, los GIFs de las siguientes series y
los resultados de búsqueda ya vistos.

## Datos

Todo es personal y local: perfil, rutinas, ajustes e historial viven en
`localStorage` (claves `sp.*`). No hay backend.

Voz: Web Speech API (`es-ES`) — funciona en Chrome/Edge/Safari. Sonidos: Web Audio
(sin archivos). La pantalla se mantiene encendida durante el entrenamiento con
Wake Lock cuando el navegador lo soporta.
# sin-panza
