// Señales sonoras con Web Audio (sin archivos externos).
let ctx = null;

export function initAudio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur = 0.15, delay = 0, type = 'sine', vol = 0.4) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Clic breve para cualquier interacción (pausar, reanudar, saltar, ajustar)
export const sonidoTap = () => tone(620, 0.06, 0, 'sine', 0.22);

// Cada número de la cuenta atrás previa (3, 2, 1)
export const sonidoCuenta = () => tone(700, 0.12, 0, 'sine', 0.35);

// Arranca la serie de trabajo (¡vamos!)
export const sonidoInicio = () => {
  tone(880, 0.12, 0, 'sine', 0.42);
  tone(1320, 0.3, 0.12, 'sine', 0.42);
};

// Aviso en cada uno de los últimos segundos de una serie de trabajo
export const sonidoUltimos = () => tone(1180, 0.1, 0, 'square', 0.3);

// Tick de la cuenta regresiva durante el descanso
export const sonidoTick = () => tone(880, 0.09, 0, 'square', 0.25);

// Se completa una serie y empieza el descanso
export const sonidoFinSerie = () => {
  tone(988, 0.14, 0, 'sine', 0.4);
  tone(1319, 0.24, 0.12, 'sine', 0.4);
};

// Termina el descanso: empieza la siguiente serie
export const sonidoSerie = () => tone(1318, 0.3, 0, 'sine', 0.45);

// Cambio de ejercicio
export const sonidoEjercicio = () => {
  tone(784, 0.14, 0);
  tone(988, 0.14, 0.15);
  tone(1318, 0.35, 0.3);
};

// Entrenamiento completado
export const sonidoFin = () => {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, i * 0.16, 'triangle', 0.45));
};

// Compat: el nombre anterior seguía usándose en otros sitios
export const sonidoGo = sonidoInicio;
