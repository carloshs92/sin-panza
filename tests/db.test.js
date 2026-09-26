import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calcularRacha, VERSION_DATOS } from '../src/lib/db.js';

// Fechas construidas en hora local, igual que la app (toDateString / getDay):
// así los tests no dependen de la zona horaria de quien los ejecute.
// 23/09/2026 es miércoles.
const MIERCOLES = new Date(2026, 8, 23, 12);
const hace = (dias, desde = MIERCOLES) => {
  const d = new Date(desde);
  d.setDate(d.getDate() - dias);
  d.setHours(10);
  return d;
};
const historial = (...diasAtras) => diasAtras.map((k) => ({ fecha: hace(k).toISOString() }));
const perfil = { dias: ['lunes', 'miercoles', 'viernes'] };

describe('calcularRacha', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MIERCOLES);
  });
  afterEach(() => vi.useRealTimers());

  it('sin historial es 0', () => {
    expect(calcularRacha(perfil, [])).toBe(0);
  });

  it('hoy pendiente no la rompe: cuenta hacia atrás desde ayer', () => {
    // lunes 21, viernes 18 y miércoles 16 hechos; hoy (miércoles 23) aún no
    expect(calcularRacha(perfil, historial(2, 5, 7))).toBe(3);
  });

  it('hoy hecho suma', () => {
    expect(calcularRacha(perfil, historial(0, 2, 5, 7))).toBe(4);
  });

  it('un día programado sin hacer la corta', () => {
    // hoy y lunes hechos, el viernes 18 no → 2
    expect(calcularRacha(perfil, historial(0, 2, 7))).toBe(2);
  });

  it('los días libres no la rompen y si entrenas en uno, suma', () => {
    // hoy, martes 22 (libre, entrenado) y lunes 21
    expect(calcularRacha(perfil, historial(0, 1, 2))).toBe(3);
  });

  it('con hoy pendiente y el último día programado sin hacer, es 0', () => {
    // lunes 21 sin hacer; el viernes anterior hecho no cuenta
    expect(calcularRacha(perfil, historial(5))).toBe(0);
  });

  it('varias sesiones el mismo día cuentan como un día', () => {
    expect(calcularRacha(perfil, historial(0, 0, 0))).toBe(1);
  });

  it('en un día libre sin entrenar, la racha sigue desde el último programado', () => {
    vi.setSystemTime(new Date(2026, 8, 24, 12)); // jueves (libre)
    expect(calcularRacha(perfil, historial(0, 2))).toBe(2); // miércoles 23 y lunes 21
  });
});

// ---- Migraciones (necesitan un localStorage: se simula uno en memoria) ----
function localStorageFalso(inicial = {}) {
  const datos = new Map(Object.entries(inicial).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v)),
    removeItem: (k) => datos.delete(k),
    leer: (k) => (datos.has(k) ? JSON.parse(datos.get(k)) : null),
  };
}

// db.js migra al importarse: cada test lo carga de nuevo sobre su almacenamiento
async function cargarDb(almacen) {
  vi.stubGlobal('localStorage', almacen);
  vi.resetModules();
  return import('../src/lib/db.js');
}

describe('migraciones', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('una instalación nueva queda marcada con la versión actual', async () => {
    const ls = localStorageFalso();
    await cargarDb(ls);
    expect(ls.leer('sp.version')).toBe(VERSION_DATOS);
    expect(ls.leer('sp.profile')).toBeNull();
  });

  it('1: recupera la fecha de creación desde la sesión más antigua', async () => {
    const ls = localStorageFalso({
      'sp.profile': { nombre: 'Ana', creado: hace(3).toISOString() },
      'sp.history': historial(1, 20, 10),
    });
    await cargarDb(ls);
    expect(ls.leer('sp.profile').creado).toBe(hace(20).toISOString());
    expect(ls.leer('sp.version')).toBe(1);
  });

  it('1: si el perfil ya es más antiguo que el historial, no lo toca', async () => {
    const creado = hace(60).toISOString();
    const ls = localStorageFalso({ 'sp.profile': { creado }, 'sp.history': historial(5) });
    await cargarDb(ls);
    expect(ls.leer('sp.profile').creado).toBe(creado);
  });

  it('1: ignora fechas inválidas sin romperse', async () => {
    const ls = localStorageFalso({ 'sp.profile': { creado: 'basura' } });
    await cargarDb(ls);
    expect(ls.leer('sp.profile').creado).toBe('basura');
    expect(ls.leer('sp.version')).toBe(1);
  });

  it('no vuelve a migrar datos ya migrados', async () => {
    const ls = localStorageFalso({
      'sp.version': 1,
      'sp.profile': { creado: hace(3).toISOString() },
      'sp.history': historial(20),
    });
    await cargarDb(ls);
    expect(ls.leer('sp.profile').creado).toBe(hace(3).toISOString());
  });

  it('no toca datos de una versión más nueva de la app', async () => {
    const ls = localStorageFalso({ 'sp.version': 99, 'sp.profile': { creado: hace(3).toISOString() }, 'sp.history': historial(20) });
    await cargarDb(ls);
    expect(ls.leer('sp.version')).toBe(99);
    expect(ls.leer('sp.profile').creado).toBe(hace(3).toISOString());
  });
});
