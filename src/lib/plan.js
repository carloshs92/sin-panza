// Genera rutinas semanales a partir del perfil del onboarding.
import { EQUIPOS } from './db.js';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Estiramientos y posturas de yoga: sirven para calentar o estirar, no como
// ejercicio principal de 3 minutos con series.
export const esEstiramiento = (e) => /stretch|\bpose\b/i.test(e.name);

// Duración de cada serie de trabajo: los minutos del ejercicio repartidos
// entre las series (mínimo 10 s). La usa el player y la estimación.
export const segundosPorSerie = (minPorEjercicio, series) =>
  Math.max(10, Math.round((minPorEjercicio * 60) / series));

const CUENTA_PREVIA_SEG = 3;

// Segundos reales de un ejercicio: cuenta atrás + series de trabajo + descansos entre series.
export function segundosPorEjercicio({ minPorEjercicio, series, descansoSeg }) {
  return CUENTA_PREVIA_SEG + series * segundosPorSerie(minPorEjercicio, series) + (series - 1) * descansoSeg;
}

export const duracionEstimadaMin = (numEjercicios, settings) =>
  Math.round((numEjercicios * segundosPorEjercicio(settings)) / 60);

// Intensidad inicial según la edad: más descanso a partir de los 50 y una
// serie menos a partir de los 65. Solo se aplica al crear el primer plan.
export function ajustesPorEdad(edad, base) {
  if (edad >= 65) return { ...base, series: Math.min(base.series, 3), descansoSeg: Math.max(base.descansoSeg, 15) };
  if (edad >= 50) return { ...base, descansoSeg: Math.max(base.descansoSeg, 10) };
  return base;
}

export async function cargarEjercicios(idioma = 'es') {
  const res = await fetch(`/data/exercises.${idioma}.json`);
  if (!res.ok) return (await fetch('/data/exercises.es.json')).json();
  return res.json();
}

// Devuelve el set de equipamiento permitido según el perfil, o null si todo vale (gym).
export function equipoPermitido(perfil) {
  const ids = perfil.equipo?.length ? perfil.equipo : ['cuerpo'];
  if (ids.includes('gym')) return null;
  const set = new Set(['body weight']);
  for (const id of ids) {
    const eq = EQUIPOS.find((e) => e.id === id);
    if (Array.isArray(eq?.equip)) eq.equip.forEach((x) => set.add(x));
  }
  return set;
}

// Estructuras disponibles (barra de dominadas, banco…) para ejercicios que las requieren.
export function estructurasPermitidas(perfil) {
  const ids = perfil.equipo?.length ? perfil.equipo : ['cuerpo'];
  if (ids.includes('gym')) return null; // en el gym hay de todo
  const set = new Set();
  for (const id of ids) {
    const eq = EQUIPOS.find((e) => e.id === id);
    if (eq?.req) set.add(eq.req);
  }
  return set;
}

export function generarRutinas(perfil, ejercicios, settings) {
  // Cuántos ejercicios caben en el tiempo del perfil, contando los descansos
  const cantidad = Math.max(3, Math.round((perfil.tiempoMin * 60) / segundosPorEjercicio(settings)));
  const permitido = equipoPermitido(perfil);
  const estructuras = estructurasPermitidas(perfil);

  const sePuede = (e) => {
    if (permitido && !permitido.has(e.equipment)) return false;
    // Peso corporal que exige barra/banco: solo si el usuario tiene esa estructura
    if (e.req && estructuras && !estructuras.has(e.req)) return false;
    return true;
  };

  const principales = ejercicios.filter((e) => !esEstiramiento(e));
  const disponibles = principales.filter(sePuede);

  const pools = {};
  for (const cat of perfil.categorias) {
    // Todo lo que se puede hacer con el equipo elegido. Si una zona se queda
    // corta, el reparto de abajo completa el día con las demás zonas.
    pools[cat] = shuffle(disponibles.filter((e) => e.category === cat));
  }

  const rutinas = {};
  perfil.dias.forEach((dia, d) => {
    const elegidos = [];
    const usados = new Set();
    // Rota las categorías para que cada día tenga un énfasis distinto pero variado
    const cats = [...perfil.categorias.slice(d % perfil.categorias.length), ...perfil.categorias.slice(0, d % perfil.categorias.length)];
    let i = 0;
    while (elegidos.length < cantidad && i < cantidad * 10) {
      const pool = pools[cats[i % cats.length]];
      const pick = pool?.length ? pool[(d * cantidad + Math.floor(i / cats.length)) % pool.length] : null;
      if (pick && !usados.has(pick.id)) {
        usados.add(pick.id);
        elegidos.push(pick);
      }
      i++;
    }
    rutinas[dia] = elegidos;
  });
  return rutinas;
}
