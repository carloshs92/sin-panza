// Copia de seguridad en un archivo JSON: la única defensa si el navegador borra
// sus datos, y de paso la forma de pasar tus datos del móvil al ordenador.
import { exportarDatos, importarDatos, VERSION_DATOS } from './db.js';

export const FORMATO = 'sinpanza-copia';

export const crearCopia = (ahora = new Date()) => ({
  formato: FORMATO,
  version: VERSION_DATOS,
  exportado: ahora.toISOString(),
  datos: exportarDatos(),
});

// sinpanza-2026-09-25.json (fecha local, la que ve el usuario)
export function nombreArchivo(ahora = new Date()) {
  const dos = (n) => String(n).padStart(2, '0');
  return `sinpanza-${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}.json`;
}

const esObjeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// Comprueba una copia antes de tocar nada. Devuelve { ok: true, resumen } o
// { ok: false, error } con un mensaje para mostrar tal cual.
export function validarCopia(copia) {
  if (!esObjeto(copia) || copia.formato !== FORMATO) {
    return { ok: false, error: 'Este archivo no es una copia de SinPanza.' };
  }
  if (!Number.isInteger(copia.version) || copia.version < 0) {
    return { ok: false, error: 'La copia está dañada: no se reconoce su versión.' };
  }
  if (copia.version > VERSION_DATOS) {
    return { ok: false, error: 'La copia es de una versión más nueva de la app. Actualiza SinPanza e inténtalo de nuevo.' };
  }
  const { profile, routines, history, settings } = copia.datos ?? {};
  if (!esObjeto(profile) || !Array.isArray(profile.dias)) {
    return { ok: false, error: 'La copia está incompleta: falta tu perfil.' };
  }
  if ((routines != null && !esObjeto(routines)) || (history != null && !Array.isArray(history)) || (settings != null && !esObjeto(settings))) {
    return { ok: false, error: 'La copia está dañada: algún dato no tiene el formato esperado.' };
  }
  return {
    ok: true,
    resumen: {
      nombre: profile.nombre ?? '',
      dias: profile.dias.length,
      ejercicios: Object.values(routines ?? {}).reduce((n, dia) => n + (dia?.length ?? 0), 0),
      sesiones: history?.length ?? 0,
      exportado: copia.exportado ?? null,
    },
  };
}

export const restaurarCopia = (copia) => importarDatos(copia.datos, copia.version);

// Lee un archivo elegido por el usuario: JSON + validación en un paso.
export async function leerArchivoCopia(archivo) {
  let copia;
  try {
    copia = JSON.parse(await archivo.text());
  } catch {
    return { ok: false, error: 'No se pudo leer el archivo: no es un JSON válido.' };
  }
  const v = validarCopia(copia);
  return v.ok ? { ...v, copia } : v;
}

// «Copia del 25 de septiembre de 2026. Ana: 3 días de entrenamiento, …»
export function describirCopia(r) {
  const fecha = r.exportado
    ? `Copia del ${new Date(r.exportado).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}. `
    : '';
  return `${fecha}${r.nombre ? r.nombre + ': ' : ''}${r.dias} días de entrenamiento, ${r.ejercicios} ejercicios en tus rutinas y ${r.sesiones} sesiones registradas.`;
}
