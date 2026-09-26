import { describe, expect, it } from 'vitest';
import { estadoInicial, perfilDesdeEstado, planRutinas, traducirRutinas } from '../src/lib/perfil.js';

const PERFIL = {
  nombre: 'Ana',
  idioma: 'es',
  edad: 41,
  categorias: ['chest', 'waist'],
  equipo: ['cuerpo', 'mancuernas'],
  tiempoMin: 20,
  dias: ['lunes', 'jueves', 'sabado'],
  creado: '2026-07-01T10:00:00.000Z',
};

describe('estadoInicial', () => {
  it('un perfil nuevo arranca con los valores por defecto', () => {
    const e = estadoInicial(null);
    expect(e.idioma).toBe('es');
    expect(e.tiempoMin).toBe(15);
    expect([...e.equipo]).toEqual(['cuerpo']);
    expect(e.categorias.size).toBe(0);
    expect(e.dias.size).toBe(0);
  });

  it('al editar parte de todo lo que ya elegiste', () => {
    const e = estadoInicial(PERFIL);
    expect([...e.categorias]).toEqual(PERFIL.categorias);
    expect([...e.equipo]).toEqual(PERFIL.equipo);
    expect([...e.dias]).toEqual(PERFIL.dias);
    expect(e.tiempoMin).toBe(20);
  });

  it('un perfil antiguo sin equipo arranca con el peso corporal', () => {
    expect([...estadoInicial({ ...PERFIL, equipo: undefined }).equipo]).toEqual(['cuerpo']);
  });
});

describe('perfilDesdeEstado', () => {
  it('avanzar sin tocar nada deja el perfil exactamente igual', () => {
    expect(perfilDesdeEstado(estadoInicial(PERFIL), PERFIL)).toEqual(PERFIL);
  });

  it('conserva la fecha de creación y campos que el onboarding no edita', () => {
    const conExtra = { ...PERFIL, algoFuturo: 42 };
    const e = estadoInicial(conExtra);
    e.nombre = '  Ana María ';
    const p = perfilDesdeEstado(e, conExtra, new Date('2030-01-01'));
    expect(p.creado).toBe(PERFIL.creado);
    expect(p.algoFuturo).toBe(42);
    expect(p.nombre).toBe('Ana María');
  });

  it('un perfil nuevo lleva la fecha de ahora y los días en orden de la semana', () => {
    const e = estadoInicial(null);
    e.nombre = 'Leo';
    e.dias = new Set(['viernes', 'lunes']);
    const ahora = new Date('2026-09-25T08:00:00.000Z');
    const p = perfilDesdeEstado(e, null, ahora);
    expect(p.creado).toBe(ahora.toISOString());
    expect(p.dias).toEqual(['lunes', 'viernes']);
  });
});

describe('planRutinas', () => {
  const con = (cambios) => ({ ...PERFIL, ...cambios });

  it('sin perfil o sin rutinas previas: crear', () => {
    expect(planRutinas(null, PERFIL, false)).toBe('crear');
    expect(planRutinas(PERFIL, PERFIL, false)).toBe('crear');
  });

  it('sin cambios, o solo nombre y edad: mantener', () => {
    expect(planRutinas(PERFIL, PERFIL, true)).toBe('mantener');
    expect(planRutinas(PERFIL, con({ nombre: 'Otra', edad: 70 }), true)).toBe('mantener');
  });

  it('el orden en que marcas zonas o equipo no cuenta como cambio', () => {
    expect(planRutinas(PERFIL, con({ categorias: ['waist', 'chest'], equipo: ['mancuernas', 'cuerpo'] }), true)).toBe('mantener');
  });

  it('solo el idioma: traducir', () => {
    expect(planRutinas(PERFIL, con({ idioma: 'fr' }), true)).toBe('traducir');
  });

  it.each([
    ['zonas', { categorias: ['chest'] }],
    ['equipo', { equipo: ['cuerpo'] }],
    ['días', { dias: ['lunes', 'jueves'] }],
    ['tiempo', { tiempoMin: 30 }],
    ['idioma y días a la vez', { idioma: 'fr', dias: ['lunes'] }],
  ])('cambian %s: regenerar', (_, cambios) => {
    expect(planRutinas(PERFIL, con(cambios), true)).toBe('regenerar');
  });
});

describe('traducirRutinas', () => {
  it('mantiene ejercicios y orden, con los textos del nuevo idioma', () => {
    const rutinas = {
      lunes: [{ id: '0002', steps: ['Túmbate…'] }, { id: '0001', steps: ['Ponte…'] }],
    };
    const catalogoFr = [
      { id: '0001', steps: ['Mets-toi…'] },
      { id: '0002', steps: ['Allonge-toi…'] },
    ];
    expect(traducirRutinas(rutinas, catalogoFr)).toEqual({
      lunes: [{ id: '0002', steps: ['Allonge-toi…'] }, { id: '0001', steps: ['Mets-toi…'] }],
    });
  });

  it('un ejercicio que no está en el catálogo se queda como estaba', () => {
    const rutinas = { martes: [{ id: '9999', steps: ['x'] }] };
    expect(traducirRutinas(rutinas, [])).toEqual(rutinas);
  });
});
