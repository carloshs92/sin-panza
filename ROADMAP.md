# Roadmap · SinPanza

Documento vivo. Vamos de arriba abajo, **un ítem por sesión**, cada uno con su
commit y verificado en el navegador antes de darlo por hecho.

Esfuerzo: **S** ≈ una sesión corta · **M** ≈ una sesión · **L** ≈ varias sesiones.

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho

---

## Fase 0 — Cimientos 🧱

> **El problema**: cada fase siguiente mete pantallas y datos nuevos, y hoy no
> hay sistema de diseño (29 tamaños de letra, 10 radios, CSS copiado entre
> páginas, emojis como iconos), el esquema de `localStorage` no tiene versión y
> hay bugs visibles en la pantalla principal. Construir encima multiplica la
> deuda. Esto va primero.

- [x] **0.1 · Bugs activos** · S · _sin dependencias_
  - Duración estimada real: hoy es `ejercicios × minPorEjercicio` e ignora
    descansos y cuenta atrás; la tarjeta de hoy dice «~5 min» y «son solo 15
    minutos» en la misma línea. Un único `duracionEstimadaMin()` para rutinas y
    editor.
  - Los estiramientos (`stretch`, `pose`) no entran en el pool de `plan.js`
    (sí se pueden añadir a mano desde el buscador).
  - «Septiembre **De** 2026»: `capitalize` pone en mayúscula cada palabra.
  - Músculo y equipamiento en español («abdominales», «peso corporal») en vez
    de «ABS / BODY WEIGHT».
  - La edad se pedía «para ajustar la intensidad» y no se usaba: ahora fija el
    descanso y las series iniciales la primera vez que se crea el plan.
  - El nombre del usuario ya no se inyecta con `innerHTML`.
  - El calendario marcaba como fallados los días anteriores a crear el plan
    (y repetir el onboarding reiniciaba esa fecha).
  - El número de ejercicios por día se calcula con el tiempo real (con
    descansos), no solo con los minutos de trabajo.
  - ✅ *Listo cuando*: la tarjeta de hoy y el editor muestran la misma duración,
    coherente con los ajustes, y ninguna rutina generada contiene estiramientos.

- [x] **0.2 · Esquema versionado y migraciones** · S
  `sp.version` + `migrar()` en `db.js` al arrancar. Sin esto, el primer cambio
  de formato (Fase 2) rompe los perfiles existentes.
  - Migración 1: recupera `creado` como la fecha más antigua entre el perfil y
    el historial (el onboarding repetido la sobrescribía).
  - Para añadir una: subir `VERSION_DATOS` y escribir `MIGRACIONES[n]`.
  - ✅ *Listo cuando*: un perfil sin `sp.version` se migra solo y queda marcado.

- [x] **0.3 · Tokens de diseño + componentes base** · M
  - Tokens en `global.css`: espaciado base 4 (`--s-1…7`), 7 tamaños de letra
    (los grandes fluidos con `clamp()`), 4 radios (`--r-sm/md/lg/full`), color
    **semántico** (`--surface-0…3`, `--fg*`, `--line*`, `--accent`,
    `--success`, `--warning`, `--danger`, `--focus`, `--media-bg`),
    duraciones y curvas, `--tap: 44px`.
  - Capa de componentes CSS (sirve también a las listas pintadas desde JS):
    `.btn` (+ `-secondary`, `-ghost`, `-danger`, `-sm`), `.icon-btn`, `.chip`
    con `aria-pressed`, `.tag` rectangular de solo lectura, `.card`,
    `.media-frame` (fondo papel en vez de blanco puro), `.input`, `.switch`,
    `.stepper`, `.progress`, `.topbar`, `.dialog`, `.toast`.
  - Astro: `TopBar`, `Dialog` (`<dialog>` nativo: foco atrapado, Escape) y
    `Stepper`; `lib/ui.js` con `conectarStepper()`, `toast()`, `marcarChip()`.
  - Acento solo para acción principal, selección y progreso. Días fallados en
    neutro; estadísticas en blanco.
  - `:focus-visible` global, `prefers-reduced-motion` en todo, sin `rise` al
    navegar ni resplandor naranja de fondo.
  - Ajustes con steppers y guardado al instante (+ aviso «Guardado»).
  - `Sheet` pasa a 0.5 (donde se usa) e `Icon` a 0.4.
  - ✅ Verificado: ningún `font-size`/`border-radius`/color literal en
    `src/pages` ni `src/components`.

- [x] **0.4 · Iconos SVG en los controles** · S
  Sprite de 34 iconos Lucide (ISC) en `lib/iconos.js`, dibujado una vez en
  `Base.astro` y usado con `<Icon>` o `icono()` desde las plantillas JS.
  - Emojis solo como contenido: saludo, 😄, 💪 y el 🏆/🔥 del final.
  - Chips de zona, equipo e idioma, solo texto; campos `emoji` fuera de
    `db.js`.
  - Diálogos con icono en círculo (tono neutro o peligro); toast con check.
  - Portada del onboarding con la mancuerna de la marca; cargando con spinner.

- [ ] **0.5 · Rediseño de Entrenar** · M · _depende de 0.3_
  Hoy, a 375×667, el botón «Empezar» queda bajo el pliegue.
  - Barra de acción fija abajo (Empezar + micrófono) respetando safe areas.
  - GIF con `aspect-ratio` y `max-height: 34svh`, en marco neutro (no blanco
    puro sobre fondo oscuro).
  - Minutos/series y «Cómo se hace» pasan a `Sheet` (con steppers de 44 px
    ya no caben lado a lado en la tarjeta actual).
  - Timer con `min(70vmin, 420px)` y cifras de tamaño display (adelanta el
    modo «teléfono lejos»).
  - Horizontal: GIF a la izquierda, timer a la derecha. Quitar
    `orientation: portrait` del manifiesto.
  - `aria-live` en los cambios de fase.
  - ✅ *Listo cuando*: todo lo esencial cabe sin scroll en 375×667 y en
    horizontal se ve el timer desde dos metros.

- [ ] **0.6 · Layouts responsive** · M · _depende de 0.3_
  Mobile-first; container queries en componentes, media queries solo para el
  layout.
  - `< 360`: compacto · `360–599`: una columna + barra inferior ·
    `600–899`: grids de 2 · `≥ 900`: rail lateral y vistas de dos paneles.
  - Rutinas: en móvil el calendario se reduce a la tira de la semana; en
    escritorio, hoy + semana a la izquierda y calendario a la derecha.
  - Buscar: filtros en sidebar y resultados en grid `auto-fill` en escritorio.
  - Editar: arrastrar para reordenar y menú «⋯» por fila (no 4 botones de
    32 px); en escritorio, lista + vista previa.
  - `(hover: hover)` para hovers, `(pointer: coarse)` para objetivos táctiles,
    `prefers-reduced-motion` en todo.
  - ✅ *Listo cuando*: se revisa cada pantalla a 320, 375, 768, 1024 y 1440 px
    sin scroll horizontal ni columnas vacías.

- [ ] **0.7 · Tests de la lógica** · S
  Vitest para `plan.js` y `calcularRacha`. Las fases 2 y 5 son pura lógica.

- [ ] **0.8 · «Editar mi plan» conserva lo elegido** · S
  Al repetir el onboarding, zonas, equipo, días y tiempo arrancan vacíos (solo
  se recuperan nombre, idioma y edad): si continúas sin volver a marcarlos,
  pierdes tu equipo. Deben precargarse del perfil.
  - ✅ *Listo cuando*: entrar en «Editar mi plan» y avanzar sin tocar nada deja
    el perfil exactamente igual.

---

## Fase 1 — Que no se pierdan tus datos 💾

> **El riesgo**: todo vive en `localStorage` de un dispositivo. Un «borrar datos
> de Safari» se lleva historial, racha y rutinas, y cada fase siguiente guarda
> más cosas. Por eso sube antes que la progresión.

- [ ] **1.1 · Exportar e importar JSON** · S · _depende de 0.2_
  Botones en Ajustes. Exportar todas las claves `sp.*` con `version` y la fecha
  en el nombre; importar validando y migrando la versión, con confirmación.
  - ✅ *Listo cuando*: exportas, borras todo, importas y queda igual que antes.

- [ ] **1.2 · Almacenamiento persistente** · S
  `navigator.storage.persist()` y espacio usado en Ajustes
  (`navigator.storage.estimate()`), avisando si no se concede.

- [ ] **1.3 · Recordatorio de copia** · S
  Aviso discreto cuando hay muchas sesiones sin exportar.

---

## Fase 2 — Que la app progrese contigo 🎯

> **El problema**: la semana 12 es idéntica a la semana 1. El cuerpo se adapta
> en ~3 semanas y ahí es donde se abandona. Lógica determinista, sin IA.

- [ ] **2.1 · Repeticiones o tiempo por ejercicio** · M
  Va primero: el motor de progresión necesita saber en qué unidad progresa.
  Un ejercicio puede ser «12 repeticiones» y registrar cuántas hiciste.

- [ ] **2.2 · Registrar cómo te fue** · S
  Tras el último set: **fácil / justo / difícil**, un toque, omitible.
  `sp.rendimiento` → `{ [id]: [{ fecha, valoracion, series, minutos|reps }] }`.

- [ ] **2.3 · Motor de progresión** · M · _depende de 2.1, 2.2, 0.7_
  `src/lib/progresion.js` → `subir | mantener | bajar`. Dos «fácil» → +1 serie
  (tope 6); un «difícil» → −1 (mínimo 2). Ajuste por ejercicio en
  `sp.ajustesEjercicio`, leído antes que el global. La interfaz dice por qué.

- [ ] **2.4 · Familias de variantes** · L · _depende de 2.3_
  ~10 familias de peso corporal de fácil a difícil (flexiones, sentadillas,
  plancha…). Al topar series, se pasa a la siguiente: «subimos de nivel».

- [ ] **2.5 · Semana de descarga** · S · _depende de 2.3_
  Cada 4–6 semanas, −1 serie en todo durante una semana.

- [ ] **2.6 · Rutinas equilibradas** · M
  `plan.js` reparte empuje / tirón / pierna / core en vez de rotar categorías
  al azar.

---

## Fase 3 — Calidad de la sesión 🧘

- [ ] **3.1 · Calentamiento y vuelta a la calma** · M
  Con los estiramientos que 0.1 saca del pool principal (campo `tipo` en
  `scripts/generar-datos.py`).
- [ ] **3.2 · Descanso entre ejercicios con vista previa del siguiente** · S
- [ ] **3.3 · «No puedo con este»** · S
  Cambiar en plena sesión por otro del mismo músculo y equipo.
- [ ] **3.4 · Sesión exprés de 5 min** · S
  Para los días sin tiempo: mantiene la racha.
- [ ] **3.5 · Resumen final por ejercicio** · S
- [ ] **3.6 · Vibración en los cambios de fase** · S (`navigator.vibrate`, Android)

---

## Fase 4 — Voz completa: entrenar sin tocar la pantalla 🎙️

- [ ] **4.1 · Vocabulario de comandos** · M
  Mapa de intenciones (`empezar`, `siguiente`, `pausa`, `seguir`, `repetir`,
  `saltar`, `cuánto falta`, `terminar`) en los 10 idiomas y un despachador por
  fase.
  - ✅ *Listo cuando*: se completa una sesión entera sin tocar la pantalla.
- [ ] **4.2 · El entrenador habla** · M · _depende de 4.1_
  Helper `hablar()` que silencia el micrófono mientras habla.
- [ ] **4.3 · Micrófono activo toda la sesión** · S · _depende de 4.1_

---

## Fase 5 — Progreso y motivación 🏆

- [ ] **5.1 · Pantalla de Progreso** · M
  Tercera pestaña: calendario completo, mapa de calor anual, horas, mejor
  racha, zona más trabajada. Cero datos nuevos.
- [ ] **5.2 · Medidas** · M
  Peso o cintura semanal, gráfica SVG propia sin librerías.
- [ ] **5.3 · Logros** · S · _depende de 5.1_
- [ ] **5.4 · Resumen semanal** · S
  Los lunes en la home: «3/3 días, +2 series en flexiones».
- [ ] **5.5 · Compartir la sesión como imagen** · S
  `<canvas>` + Web Share API, sin servidor.

---

## Fase 6 — Constancia sin servidor 🔔

> Sustituye a los recordatorios push: con lo que ofrece el sistema se cubre la
> mayor parte sin backend.

- [ ] **6.1 · Exportar recordatorios `.ics`** · S
  Eventos recurrentes a la hora elegida en tus días de entreno; avisa el
  calendario del móvil. Fiable también en iOS.
- [ ] **6.2 · Badge en el icono** · S
  `navigator.setAppBadge()` si hoy toca y no está hecho (app instalada).
- [ ] **6.3 · Comodín de racha** · S
  Uno por semana para enfermedad o viaje.

---

## Fase 7 — Pulido ✨

- [ ] **7.1 · Nombres de ejercicios en español** · M
  Decisión: glosario manual de los ~325 de peso corporal, con el nombre en
  inglés como subtítulo; el resto queda en inglés.
- [ ] **7.2 · Convivir con la música** · S
  `navigator.audioSession.type = 'ambient'` donde exista (Safari 17+) y pitidos
  más cortos. Una web **no puede** bajar el volumen de otra app.
- [ ] **7.3 · Tema claro** · S · _depende de 0.3_
  Mejor legibilidad al aire libre; sale casi gratis con tokens semánticos.
- [ ] **7.4 · Onboarding más corto** · S
  Lo mínimo para empezar: zonas, equipo y días. Nombre y edad, opcionales.

---

## Lo que rompe el modelo actual ⚠️

- [ ] **Push de verdad** · L · _requiere servidor_ — solo si 6.1/6.2 no bastan.
- [ ] **Sincronización automática** · L · _requiere servidor_ — con 1.1 ya
  existe la manual. Probablemente no vale la pena.

---

## Lo que NO vamos a construir 🚫

Cuentas de usuario, feed social, suscripciones y chat con IA. Suenan a producto
pero no mueven la única métrica que importa aquí: si entrenas el martes. Añaden
coste, complejidad y superficie de fallo, y diluyen la fortaleza de esta app,
que es ser **tuya, local y gratis**.

Tampoco IA donde unas reglas y tus propios datos resuelven mejor: decidir si
subir una serie no necesita un modelo de lenguaje, necesita recordar cómo te fue.

---

## Cómo trabajamos

1. Un ítem por sesión, empezando por el más alto sin marcar.
2. Verificación real en el navegador (no solo que compile) antes de darlo por
   hecho — en móvil (375 px) y escritorio desde la Fase 0.
3. Un commit por ítem, marcando aquí la casilla en el mismo commit.
4. Si algo se descubre por el camino, se añade al roadmap en vez de improvisar.

**Siguiente**: 0.5 — rediseño de Entrenar.
