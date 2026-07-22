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

// Tick de cuenta regresiva durante el descanso de 5 s
export const sonidoTick = () => tone(880, 0.09, 0, 'square', 0.25);

// ¡Vamos! — arranca una serie
export const sonidoGo = () => {
  tone(1046, 0.12);
  tone(1568, 0.25, 0.13);
};

// Pasa a la siguiente serie (fin del descanso)
export const sonidoSerie = () => {
  tone(1318, 0.3, 0, 'sine', 0.45);
};

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
