# Roadmap · SinPanza

Documento vivo. Vamos de arriba abajo, **un ítem por sesión**, cada uno con su
commit y verificado en el navegador antes de darlo por hecho.

Esfuerzo: **S** ≈ una sesión corta · **M** ≈ una sesión · **L** ≈ varias sesiones.

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho

---

## Fase 1 — Que la app progrese contigo 🎯

> **El problema**: hoy la semana 12 es idéntica a la semana 1. Mismos minutos,
> mismas series, ejercicios al azar. El cuerpo se adapta en ~3 semanas y ahí es
> donde se abandona. Todo esto es lógica determinista, sin backend y sin IA:
> funciona sin conexión y no cuesta nada.

- [ ] **1.1 · Registrar cómo te fue** · S · _sin dependencias_
  Al terminar el último set de cada ejercicio, una tarjeta con un solo toque:
  **fácil / justo / difícil**. Nada de formularios.
  - `db.js`: nueva clave `sp.rendimiento` → `{ [idEjercicio]: [{ fecha, valoracion, series, minutos }] }`
    y funciones `getRendimiento()` / `addValoracion(id, valor)`.
  - `entrenar.astro`: mostrarla en `siguienteEjercicio()`, antes de avanzar.
    Se puede omitir (no bloquea el entrenamiento).
  - ✅ *Listo cuando*: tras una sesión, `sp.rendimiento` tiene una entrada por
    ejercicio y se puede saltar sin romper el flujo.

- [ ] **1.2 · Motor de progresión** · M · _depende de 1.1_
  Nuevo `src/lib/progresion.js` que, dado el histórico de un ejercicio, decide
  `subir | mantener | bajar`.
  - Regla inicial: dos «fácil» seguidos → +1 serie (tope 6). Un «difícil» → −1
    serie (mínimo 2). Si ya está en el tope, se pasa a la variante más dura (1.3).
  - Se guarda por ejercicio en `sp.ajustesEjercicio` → `{ [id]: { series, minutos } }`.
  - `entrenar.astro` debe leer el ajuste del ejercicio **antes** que el global
    de `getSettings()`.
  - ✅ *Listo cuando*: marcar «fácil» dos veces hace que ese ejercicio arranque
    con una serie más la próxima vez, y se ve en la interfaz por qué subió.

- [ ] **1.3 · Familias de variantes (progresión real)** · L · _depende de 1.2_
  El dataset **no trae dificultad**, hay que aportarla nosotros. Empezar con
  ~10 familias de peso corporal ordenadas de fácil a difícil (flexión de pared →
  de rodillas → normal → diamante → arquero; sentadilla asistida → normal →
  búlgara → a una pierna; plancha de rodillas → normal → lateral → con toque).
  - Mapa manual en `src/lib/variantes.js` o como campo extra en
    `scripts/generar-datos.py`.
  - ✅ *Listo cuando*: al topar las series, el ejercicio se sustituye por el
    siguiente de su familia avisando «subimos de nivel».

- [ ] **1.4 · Repeticiones, no solo tiempo** · M
  Muchos ejercicios son por repeticiones y hoy todo es cronómetro. Permitir que
  un ejercicio sea «12 repeticiones» y registrar cuántas hiciste.

---

## Fase 2 — Voz completa: entrenar sin tocar la pantalla 🎙️

> **Por qué**: ya tenemos micrófono y síntesis funcionando, pero solo para decir
> «ahora». En plancha, con las manos en el suelo, nadie toca el teléfono. Es la
> ventaja real frente a cualquier otra app de rutinas.

- [ ] **2.1 · Vocabulario de comandos** · M
  Hoy `voice.js` tiene una sola expresión regular por idioma. Convertirla en un
  mapa de intenciones: `empezar`, `siguiente`, `pausa`, `seguir`, `repetir`,
  `saltar`, `cuánto falta`, `terminar` — en los 10 idiomas ya soportados.
  - `entrenar.astro`: un despachador que enrute cada intención según la fase
    (`espera` / `trabajo` / `descanso`).
  - ✅ *Listo cuando*: se completa una sesión entera sin tocar la pantalla.

- [ ] **2.2 · El entrenador habla** · M · _depende de 2.1_
  Que anuncie el ejercicio y el músculo, cuente «tres, dos, uno» antes de
  arrancar, avise «última serie» y «vas por la mitad».
  - Generalizar el patrón que ya usa el botón «Escuchar instrucciones»: un
    helper `hablar()` que **silencia el micrófono mientras habla** para que la
    propia voz no dispare comandos.

- [ ] **2.3 · Micrófono activo toda la sesión** · S · _depende de 2.1_
  Hoy solo escucha en la pantalla de espera. Mantenerlo vivo durante trabajo y
  descanso, vigilando el consumo de batería (`onend` ya lo reinicia solo).

- [ ] **2.4 · Modo «teléfono lejos»** · S
  Números gigantes y alto contraste durante el temporizador, para verlo desde
  el suelo a dos metros.

---

## Fase 3 — Que no se pierdan tus datos 💾

> **El riesgo**: todo vive en `localStorage` de un dispositivo. Un «borrar datos
> de Safari» se lleva historial, racha y rutinas. Estar instalada en la pantalla
> de inicio protege bastante, pero no es garantía.

- [ ] **3.1 · Exportar e importar JSON** · S
  Botones en Ajustes. Exportar `{ version, perfil, rutinas, ajustes, historial,
  rendimiento }` como descarga con la fecha en el nombre; importar validando
  `version` y confirmando con el modal que ya existe.
  - Bonus: sirve de sincronización manual entre móvil y escritorio.
  - ✅ *Listo cuando*: exportas, borras todo, importas y queda igual que antes.

- [ ] **3.2 · Pedir almacenamiento persistente** · S
  Llamar a `navigator.storage.persist()` y mostrar en Ajustes el espacio usado
  (`navigator.storage.estimate()`), avisando si el navegador no lo concede.

---

## Fase 4 — Calidad de la sesión 🧘

- [ ] **4.1 · Calentamiento y estiramientos** · M
  Dos minutos de activación al empezar y estiramientos al terminar, sacados del
  mismo dataset (los nombres con `stretch` ya son identificables; marcarlos con
  un campo `tipo` en `scripts/generar-datos.py`).

- [ ] **4.2 · Descanso entre ejercicios** · S
  Hoy solo existe el descanso de 5 s entre series; al cambiar de ejercicio no
  hay pausa configurable.

---

## Fase 5 — El «para qué» y la motivación 🏆

- [ ] **5.1 · Objetivo medible** · M
  La app se llama SinPanza y no registra un solo dato del objetivo. Peso o
  cintura una vez por semana, con su gráfica. Es lo que hace volver en la
  semana 8.

- [ ] **5.2 · Pantalla de progreso** · M
  Ya guardamos cada sesión pero solo mostramos un contador y el mes. Con esos
  mismos datos: horas totales, mejor racha histórica, zona más entrenada y mapa
  de calor del año. Cero datos nuevos.

- [ ] **5.3 · Logros** · S · _depende de 5.2_
  Primera semana completa, 10 sesiones, racha de 30 días.

---

## Fase 6 — Pulido ✨

- [ ] **6.1 · Nombres de ejercicios en español** · M
  Traducimos las instrucciones pero los títulos siguen en inglés («Arms Apart
  Circular Toe Touch»). El dataset no trae nombres traducidos, así que hay que
  decidir: glosario manual de los ~250 de peso corporal, o mostrar el nombre en
  inglés con un subtítulo claro en español. **Decisión pendiente.**

- [ ] **6.2 · Convivir con la música** · S
  Bajar el volumen de la música en vez de pelear con ella al sonar los pitidos
  y la voz.

---

## Fase 7 — Lo que rompe el modelo actual ⚠️

> Todo lo anterior es local, gratis y sin conexión. Esto no. Decidir antes de
> construir.

- [ ] **7.1 · Recordatorios push** · L · _requiere servidor_
  Es lo que más mejoraría la constancia. Una PWA no tiene notificaciones locales
  programadas fiables; iOS admite push en apps instaladas desde la 16.4, pero
  **enviarlas exige un servidor**. Introduce infraestructura y coste en algo que
  hoy cuesta cero.

- [ ] **7.2 · Sincronización entre dispositivos** · L · _requiere servidor_
  Con 3.1 ya tienes sincronización manual. Automatizarla implica backend y
  cuentas. Probablemente no vale la pena.

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
2. Verificación real en el navegador (no solo que compile) antes de darlo por hecho.
3. Un commit por ítem, marcando aquí la casilla en el mismo commit.
4. Si algo se descubre por el camino, se añade al roadmap en vez de improvisar.

**Siguiente**: 1.1 — el toque de fácil/justo/difícil. Es poco código y desbloquea
toda la Fase 1.
