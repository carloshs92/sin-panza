import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// localStorage en memoria: la copia lee y escribe las claves sp.* reales
function localStorageFalso() {
  const datos = new Map();
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v)),
    removeItem: (k) => datos.delete(k),
    get length() { return datos.size; },
    volcado: () => Object.fromEntries(datos),
  };
}

let ls;
let db;
let copia;

beforeEach(async () => {
  ls = localStorageFalso();
  vi.stubGlobal('localStorage', ls);
  vi.resetModules();
  db = await import('../src/lib/db.js');
  copia = await import('../src/lib/respaldo.js');
});
afterEach(() => vi.unstubAllGlobals());

const PERFIL = { nombre: 'Ana', idioma: 'es', edad: 41, categorias: ['chest'], equipo: ['cuerpo'], tiempoMin: 15, dias: ['lunes', 'jueves'], creado: '2026-07-01T10:00:00.000Z' };
const RUTINAS = { lunes: [{ id: '0001', name: 'a' }, { id: '0002', name: 'b' }], jueves: [{ id: '0003', name: 'c' }] };

function llenar() {
  db.saveProfile(PERFIL);
  db.saveSettings({ minPorEjercicio: 2, series: 3, descansoSeg: 10 });
  db.saveRoutines(RUTINAS);
  db.addHistory({ fecha: '2026-09-20T10:00:00.000Z', dia: 'lunes', ejercicios: 2, duracionMin: 12 });
  db.saveSesion({ dia: 'lunes', idx: 1 });
}

describe('copia de seguridad', () => {
  it('exportas, borras todo, importas y queda igual', () => {
    llenar();
    const antes = ls.volcado();
    const archivo = JSON.parse(JSON.stringify(copia.crearCopia())); // ida y vuelta por texto, como un archivo real

    db.resetAll();
    expect(db.getProfile()).toBeNull();

    expect(copia.validarCopia(archivo).ok).toBe(true);
    copia.restaurarCopia(archivo);

    const { 'sp.sesion': _sesion, ...antesSinSesion } = antes;
    expect(ls.volcado()).toEqual(antesSinSesion);
  });

  it('no incluye el entrenamiento en curso', () => {
    llenar();
    expect(copia.crearCopia().datos.sesion).toBeUndefined();
    expect(Object.keys(copia.crearCopia().datos).sort()).toEqual(['history', 'profile', 'routines', 'settings']);
  });

  it('importar reemplaza lo que había, no lo mezcla', () => {
    llenar();
    const archivo = copia.crearCopia();
    db.saveRoutines({ martes: [{ id: '9999' }] });
    db.addHistory({ fecha: '2026-09-24T10:00:00.000Z' });
    copia.restaurarCopia(archivo);
    expect(db.getRoutines()).toEqual(RUTINAS);
    expect(db.getHistory()).toHaveLength(1);
  });

  it('una copia antigua se migra al importarla', () => {
    // versión 0 (antes de las migraciones), con la fecha de creación pisada
    const archivo = {
      formato: copia.FORMATO,
      version: 0,
      datos: {
        profile: { ...PERFIL, creado: '2026-09-20T00:00:00.000Z' },
        history: [{ fecha: '2026-08-01T10:00:00.000Z' }],
      },
    };
    expect(copia.validarCopia(archivo).ok).toBe(true);
    copia.restaurarCopia(archivo);
    expect(db.getProfile().creado).toBe('2026-08-01T10:00:00.000Z');
    expect(JSON.parse(ls.getItem('sp.version'))).toBe(db.VERSION_DATOS);
  });

  it('el nombre del archivo lleva la fecha local', () => {
    expect(copia.nombreArchivo(new Date(2026, 0, 5, 23, 30))).toBe('sinpanza-2026-01-05.json');
  });
});

describe('validarCopia', () => {
  const buena = () => ({ formato: copia.FORMATO, version: 1, exportado: '2026-09-25T10:00:00.000Z', datos: { profile: PERFIL, routines: RUTINAS, history: [{}, {}] } });

  it('resume lo que trae una copia válida', () => {
    expect(copia.validarCopia(buena())).toEqual({
      ok: true,
      resumen: { nombre: 'Ana', dias: 2, ejercicios: 3, sesiones: 2, exportado: '2026-09-25T10:00:00.000Z' },
    });
  });

  it.each([
    ['no es un objeto', () => 'hola', 'no es una copia'],
    ['otro formato', () => ({ ...buena(), formato: 'otra-app' }), 'no es una copia'],
    ['sin versión', () => ({ ...buena(), version: 'x' }), 'versión'],
    ['versión más nueva', () => ({ ...buena(), version: 99 }), 'más nueva'],
    ['sin perfil', () => ({ ...buena(), datos: { routines: RUTINAS } }), 'falta tu perfil'],
    ['perfil sin días', () => ({ ...buena(), datos: { profile: { nombre: 'x' } } }), 'falta tu perfil'],
    ['historial que no es lista', () => ({ ...buena(), datos: { profile: PERFIL, history: {} } }), 'dañada'],
    ['rutinas que no son objeto', () => ({ ...buena(), datos: { profile: PERFIL, routines: [] } }), 'dañada'],
  ])('rechaza: %s', (_, crear, fragmento) => {
    const r = copia.validarCopia(crear());
    expect(r.ok).toBe(false);
    expect(r.error).toContain(fragmento);
  });
});
