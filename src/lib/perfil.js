// Estado del onboarding ↔ perfil guardado. Separado de la página para poder
// probarlo: repetir el onboarding («Editar mi plan») debe partir de lo que ya
// elegiste y no tocar tus rutinas si no hace falta.
import { DIAS } from './db.js';

// Lo que se edita en el onboarding, con los valores por defecto de un perfil nuevo
export function estadoInicial(previo) {
  return {
    nombre: previo?.nombre ?? '',
    idioma: previo?.idioma ?? 'es',
    edad: previo?.edad ?? 30,
    categorias: new Set(previo?.categorias ?? []),
    equipo: new Set(previo?.equipo?.length ? previo.equipo : ['cuerpo']),
    tiempoMin: previo?.tiempoMin ?? 15,
    dias: new Set(previo?.dias ?? []),
  };
}

export function perfilDesdeEstado(estado, previo, ahora = new Date()) {
  return {
    ...previo, // conserva cualquier campo que el onboarding no edite
    nombre: estado.nombre.trim(),
    idioma: estado.idioma,
    edad: estado.edad,
    categorias: [...estado.categorias],
    equipo: [...estado.equipo],
    tiempoMin: estado.tiempoMin,
    dias: DIAS.map((d) => d.id).filter((id) => estado.dias.has(id)),
    creado: previo?.creado ?? ahora.toISOString(),
  };
}

const mismoConjunto = (a = [], b = []) => a.length === b.length && a.every((x) => b.includes(x));

// Qué hacer con las rutinas guardadas al guardar el perfil:
//   'crear'     → no hay rutinas previas
//   'regenerar' → cambió algo que decide qué ejercicios tocan
//   'traducir'  → solo cambió el idioma: mismos ejercicios, pasos en el nuevo
//   'mantener'  → nada que afecte a las rutinas (nombre, edad o sin cambios)
export function planRutinas(previo, nuevo, hayRutinas) {
  if (!previo || !hayRutinas) return 'crear';
  const cambiaSeleccion =
    !mismoConjunto(previo.categorias, nuevo.categorias) ||
    !mismoConjunto(previo.equipo, nuevo.equipo) ||
    !mismoConjunto(previo.dias, nuevo.dias) ||
    previo.tiempoMin !== nuevo.tiempoMin;
  if (cambiaSeleccion) return 'regenerar';
  if (previo.idioma !== nuevo.idioma) return 'traducir';
  return 'mantener';
}

// Mismos ejercicios (por id) y en el mismo orden, con los textos del catálogo
// en el nuevo idioma. Si alguno no aparece, se queda como estaba.
export function traducirRutinas(rutinas, catalogo) {
  const porId = new Map(catalogo.map((e) => [e.id, e]));
  return Object.fromEntries(
    Object.entries(rutinas).map(([dia, lista]) => [dia, lista.map((e) => porId.get(e.id) ?? e)])
  );
}
