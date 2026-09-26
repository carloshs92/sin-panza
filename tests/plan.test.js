import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ajustesPorEdad,
  duracionEstimadaMin,
  equipoPermitido,
  esEstiramiento,
  estructurasPermitidas,
  generarRutinas,
  segundosPorEjercicio,
  segundosPorSerie,
} from '../src/lib/plan.js';

const DEFAULT = { minPorEjercicio: 3, series: 4, descansoSeg: 5 };

// Dataset mínimo y controlado: 6 ejercicios por categoría y tipo
let n = 0;
const ej = (category, equipment, extra = {}) => ({
  id: String(++n).padStart(4, '0'),
  name: `${category} ${equipment} ${n}`,
  category,
  equipment,
  target: 'abs',
  steps: [],
  ...extra,
});
const DATASET = [
  ...Array.from({ length: 6 }, () => ej('waist', 'body weight')),
  ...Array.from({ length: 6 }, () => ej('chest', 'body weight')),
  ...Array.from({ length: 6 }, () => ej('chest', 'dumbbell')),
  ...Array.from({ length: 6 }, () => ej('upper legs', 'body weight')),
  ...Array.from({ length: 3 }, () => ej('waist', 'body weight', { name: `hamstring stretch ${n}` })),
  ej('back', 'body weight', { name: 'pull-up', req: 'barra' }),
  ej('back', 'body weight', { name: 'bench dip', req: 'banco' }),
  ej('back', 'barbell'),
];

const perfil = (extra = {}) => ({
  tiempoMin: 15,
  categorias: ['waist', 'chest', 'upper legs'],
  equipo: ['cuerpo'],
  dias: ['lunes', 'miercoles', 'viernes'],
  ...extra,
});

describe('duraciones', () => {
  it('reparte los minutos entre las series, con un mínimo de 10 s', () => {
    expect(segundosPorSerie(3, 4)).toBe(45);
    expect(segundosPorSerie(1, 8)).toBe(10); // 7,5 s → mínimo 10
  });

  it('cuenta cuenta atrás, trabajo y descansos entre series (no tras la última)', () => {
    // 3 s + 4 × 45 s + 3 × 5 s
    expect(segundosPorEjercicio(DEFAULT)).toBe(198);
    expect(segundosPorEjercicio({ minPorEjercicio: 2, series: 1, descansoSeg: 30 })).toBe(123);
  });

  it('estima los minutos del día redondeando', () => {
    expect(duracionEstimadaMin(5, DEFAULT)).toBe(17); // 990 s = 16,5 min
    expect(duracionEstimadaMin(0, DEFAULT)).toBe(0);
  });
});

describe('ajustesPorEdad', () => {
  it('no toca nada por debajo de 50', () => {
    expect(ajustesPorEdad(49, DEFAULT)).toEqual(DEFAULT);
  });
  it('a partir de 50 sube el descanso a 10 s', () => {
    expect(ajustesPorEdad(50, DEFAULT)).toEqual({ ...DEFAULT, descansoSeg: 10 });
  });
  it('a partir de 65 además baja a 3 series y 15 s de descanso', () => {
    expect(ajustesPorEdad(65, DEFAULT)).toEqual({ ...DEFAULT, series: 3, descansoSeg: 15 });
  });
  it('nunca baja un descanso que ya era mayor', () => {
    expect(ajustesPorEdad(70, { ...DEFAULT, descansoSeg: 40 }).descansoSeg).toBe(40);
  });
});

describe('filtros de ejercicios', () => {
  it('reconoce estiramientos y posturas', () => {
    expect(esEstiramiento({ name: 'all fours squad stretch' })).toBe(true);
    expect(esEstiramiento({ name: 'butterfly yoga pose' })).toBe(true);
    expect(esEstiramiento({ name: 'push-up' })).toBe(false);
    expect(esEstiramiento({ name: 'exposed plank' })).toBe(false); // «pose» dentro de otra palabra
  });

  it('el gym lo permite todo y el resto suma su equipo al peso corporal', () => {
    expect(equipoPermitido({ equipo: ['gym'] })).toBeNull();
    expect([...equipoPermitido({ equipo: ['cuerpo', 'mancuernas'] })].sort()).toEqual(['body weight', 'dumbbell']);
    expect([...equipoPermitido({ equipo: [] })]).toEqual(['body weight']);
  });

  it('las estructuras (barra, banco) salen del equipo elegido', () => {
    expect(estructurasPermitidas({ equipo: ['gym'] })).toBeNull();
    expect([...estructurasPermitidas({ equipo: ['cuerpo', 'dominadas'] })]).toEqual(['barra']);
    expect(estructurasPermitidas({ equipo: ['cuerpo'] }).size).toBe(0);
  });
});

describe('generarRutinas', () => {
  it('crea una rutina por día con los ejercicios que caben en el tiempo', () => {
    const r = generarRutinas(perfil(), DATASET, DEFAULT);
    expect(Object.keys(r)).toEqual(['lunes', 'miercoles', 'viernes']);
    // 15 min / 198 s por ejercicio = 4,5 → 5
    for (const dia of Object.values(r)) expect(dia).toHaveLength(5);
  });

  it('nunca menos de 3 ejercicios aunque el tiempo no dé', () => {
    const r = generarRutinas(perfil({ tiempoMin: 1 }), DATASET, DEFAULT);
    for (const dia of Object.values(r)) expect(dia.length).toBe(3);
  });

  it('no repite ejercicios dentro de un día', () => {
    for (let k = 0; k < 50; k++) {
      for (const dia of Object.values(generarRutinas(perfil(), DATASET, DEFAULT))) {
        expect(new Set(dia.map((e) => e.id)).size).toBe(dia.length);
      }
    }
  });

  it('respeta el equipo: con solo el cuerpo no aparecen mancuernas', () => {
    for (let k = 0; k < 50; k++) {
      const todos = Object.values(generarRutinas(perfil(), DATASET, DEFAULT)).flat();
      expect(todos.every((e) => e.equipment === 'body weight')).toBe(true);
    }
  });

  it('no mete estiramientos ni ejercicios que exigen barra o banco sin tenerlos', () => {
    const p = perfil({ categorias: ['waist', 'back'] });
    for (let k = 0; k < 50; k++) {
      const todos = Object.values(generarRutinas(p, DATASET, DEFAULT)).flat();
      expect(todos.some(esEstiramiento)).toBe(false);
      expect(todos.some((e) => e.req)).toBe(false);
    }
  });

  it('con la barra de dominadas sí puede proponer dominadas', () => {
    const p = perfil({ categorias: ['back'], equipo: ['cuerpo', 'dominadas'], dias: ['lunes'] });
    const vistos = new Set();
    for (let k = 0; k < 50; k++) generarRutinas(p, DATASET, DEFAULT).lunes.forEach((e) => vistos.add(e.name));
    expect(vistos.has('pull-up')).toBe(true);
    expect(vistos.has('bench dip')).toBe(false);
  });
});

// Invariantes con el catálogo real (1.324 ejercicios): el que ve el usuario
describe('generarRutinas con el catálogo real', () => {
  const catalogo = JSON.parse(readFileSync(new URL('../public/data/exercises.es.json', import.meta.url)));
  const casos = [
    perfil(),
    perfil({ equipo: ['cuerpo', 'mancuernas', 'bandas'], tiempoMin: 30 }),
    perfil({ equipo: ['gym'], categorias: ['back', 'shoulders', 'upper arms', 'lower legs', 'cardio'] }),
    perfil({ dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'], tiempoMin: 10 }),
  ];

  it.each(casos.map((p, i) => [i, p]))('perfil %i: días completos, sin repetidos, sin estiramientos y con equipo válido', (_, p) => {
    const permitido = equipoPermitido(p);
    const estructuras = estructurasPermitidas(p);
    for (let k = 0; k < 20; k++) {
      const r = generarRutinas(p, catalogo, DEFAULT);
      expect(Object.keys(r)).toEqual(p.dias);
      for (const dia of Object.values(r)) {
        expect(dia.length).toBeGreaterThanOrEqual(3);
        expect(new Set(dia.map((e) => e.id)).size).toBe(dia.length);
        for (const e of dia) {
          expect(esEstiramiento(e)).toBe(false);
          expect(p.categorias).toContain(e.category);
          if (permitido) expect(permitido.has(e.equipment)).toBe(true);
          if (e.req && estructuras) expect(estructuras.has(e.req)).toBe(true);
        }
      }
    }
  });
});
