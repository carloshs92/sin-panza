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
  const porEjercicio = settings.minPorEjercicio || 3;
  const cantidad = Math.max(3, Math.round(perfil.tiempoMin / porEjercicio));
  const permitido = equipoPermitido(perfil);
  const estructuras = estructurasPermitidas(perfil);

  const sePuede = (e) => {
    if (permitido && !permitido.has(e.equipment)) return false;
    // Peso corporal que exige barra/banco: solo si el usuario tiene esa estructura
    if (e.req && estructuras && !estructuras.has(e.req)) return false;
    return true;
  };

  const disponibles = ejercicios.filter(sePuede);

  const pools = {};
  for (const cat of perfil.categorias) {
    const delCat = disponibles.filter((e) => e.category === cat);
    // Si con el equipo elegido no alcanza, completa con peso corporal libre de esa categoría
    pools[cat] = shuffle(
      delCat.length >= cantidad
        ? delCat
        : ejercicios.filter((e) => e.category === cat && e.equipment === 'body weight' && !e.req)
    );
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
