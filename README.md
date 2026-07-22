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

> Las carpetas `public/images` y `public/videos` son **symlinks** al dataset
> (`../exercises-dataset-main`), así los 125 MB de GIFs no se duplican.
> `public/data/exercises.es.json` es una versión recortada (solo español) del
> `data/exercises.json` original.

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
4. **Ajustes** (`/ajustes`): minutos/series/descanso, regenerar rutinas, borrar todo.

## Datos

Todo es personal y local: perfil, rutinas, ajustes e historial viven en
`localStorage` (claves `sp.*`). No hay backend.

Voz: Web Speech API (`es-ES`) — funciona en Chrome/Edge/Safari. Sonidos: Web Audio
(sin archivos). La pantalla se mantiene encendida durante el entrenamiento con
Wake Lock cuando el navegador lo soporta.
# sin-panza
