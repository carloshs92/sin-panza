// Lectura de instrucciones con la SpeechSynthesis API del navegador.
import { vozDe } from './voice.js';

export const soportaTTS = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

// Lee un texto en el idioma dado. Devuelve la utterance; onFin se llama al
// terminar o al cancelar. Se usa una sola utterance para que cancelar sea limpio.
export function leer(texto, idioma, onFin) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  const lang = vozDe(idioma).lang;
  u.lang = lang;
  const voz = synth.getVoices().find((v) => v.lang.replace('_', '-').startsWith(lang.split('-')[0]));
  if (voz) u.voice = voz;
  u.rate = 0.95;
  u.onend = () => onFin?.();
  u.onerror = () => onFin?.();
  synth.speak(u);
  return u;
}

export const callar = () => {
  if (soportaTTS()) window.speechSynthesis.cancel();
};

// Algunos navegadores cargan las voces en diferido
if (soportaTTS()) window.speechSynthesis.getVoices();
