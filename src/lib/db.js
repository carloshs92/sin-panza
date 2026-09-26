// Persistencia local (localStorage). Claves con prefijo sp. — la app es 100% personal/offline.
const K = {
  profile: 'sp.profile',
  settings: 'sp.settings',
  routines: 'sp.routines',
  history: 'sp.history',
  sesion: 'sp.sesion', // entrenamiento en curso, para reanudar si se sale por error
  version: 'sp.version', // versión del formato de los datos guardados
};

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// ---- Versión del formato y migraciones ----
// Cada cambio de formato de los datos guardados sube VERSION_DATOS y añade su
// migración en MIGRACIONES[n] (de n-1 a n). Se aplican en orden al cargar este
// módulo, que importan todas las páginas. Una migración debe tolerar que no
// haya datos (instalación nueva) y poder repetirse sin romper nada.
export const VERSION_DATOS = 1;

const MIGRACIONES = {
  // 1: repetir el onboarding reescribía `creado` con la fecha de la edición, y
  // el calendario la usa para no contar como fallados los días previos al plan.
  // Se recupera como la más antigua entre `creado` y la primera sesión.
  1: () => {
    const perfil = read(K.profile, null);
    if (!perfil) return;
    const fechas = [perfil.creado, ...read(K.history, []).map((h) => h.fecha)]
      .map((f) => new Date(f).getTime())
      .filter((t) => !Number.isNaN(t));
    if (fechas.length === 0) return;
    write(K.profile, { ...perfil, creado: new Date(Math.min(...fechas)).toISOString() });
  },
};

export function migrar() {
  const desde = read(K.version, 0);
  // Datos de una versión más nueva de la app (p. ej. importados): no se tocan
  if (desde >= VERSION_DATOS) return;
  for (let n = desde + 1; n <= VERSION_DATOS; n++) {
    try {
      MIGRACIONES[n]();
    } catch (err) {
      // Se deja la versión en la última buena para reintentar en la próxima carga
      console.error(`[sinpanza] falló la migración ${n}`, err);
      return;
    }
    write(K.version, n);
  }
}

if (typeof localStorage !== 'undefined') migrar();

export const DEFAULT_SETTINGS = {
  minPorEjercicio: 3,
  series: 4,
  descansoSeg: 5,
};

export const getProfile = () => read(K.profile, null);
export const saveProfile = (p) => write(K.profile, p);

export const getSettings = () => ({ ...DEFAULT_SETTINGS, ...read(K.settings, {}) });
export const saveSettings = (s) => write(K.settings, s);
export const hayAjustesGuardados = () => localStorage.getItem(K.settings) !== null;

export const getRoutines = () => read(K.routines, {});
export const saveRoutines = (r) => write(K.routines, r);

export const getRoutineDay = (dia) => getRoutines()[dia] || [];
export const saveRoutineDay = (dia, ejercicios) => {
  const r = getRoutines();
  r[dia] = ejercicios;
  saveRoutines(r);
};

export const getHistory = () => read(K.history, []);
export const addHistory = (entry) => {
  const h = getHistory();
  h.unshift(entry);
  write(K.history, h.slice(0, 200));
};

// Entrenamiento en curso: se guarda mientras entrenas y se limpia al terminar
// o salir. Permite reanudar donde ibas si sales por error o se recarga.
export const getSesion = () => read(K.sesion, null);
export const saveSesion = (s) => write(K.sesion, s);
export const clearSesion = () => localStorage.removeItem(K.sesion);

export const resetAll = () => Object.values(K).forEach((k) => localStorage.removeItem(k));

export const DIAS = [
  { id: 'lunes', label: 'Lunes', corto: 'L' },
  { id: 'martes', label: 'Martes', corto: 'M' },
  { id: 'miercoles', label: 'Miércoles', corto: 'X' },
  { id: 'jueves', label: 'Jueves', corto: 'J' },
  { id: 'viernes', label: 'Viernes', corto: 'V' },
  { id: 'sabado', label: 'Sábado', corto: 'S' },
  { id: 'domingo', label: 'Domingo', corto: 'D' },
];

export const CATEGORIAS = [
  { id: 'waist', label: 'Abdomen', emoji: '🔥' },
  { id: 'cardio', label: 'Cardio', emoji: '❤️' },
  { id: 'chest', label: 'Pecho', emoji: '💪' },
  { id: 'back', label: 'Espalda', emoji: '🦾' },
  { id: 'shoulders', label: 'Hombros', emoji: '🏋️' },
  { id: 'upper arms', label: 'Brazos', emoji: '💥' },
  { id: 'upper legs', label: 'Piernas', emoji: '🦵' },
  { id: 'lower legs', label: 'Pantorrillas', emoji: '🦶' },
];

export const IDIOMAS = [
  { id: 'es', label: 'Español', emoji: '🇪🇸' },
  { id: 'en', label: 'English', emoji: '🇬🇧' },
  { id: 'fr', label: 'Français', emoji: '🇫🇷' },
  { id: 'it', label: 'Italiano', emoji: '🇮🇹' },
  { id: 'pl', label: 'Polski', emoji: '🇵🇱' },
  { id: 'tr', label: 'Türkçe', emoji: '🇹🇷' },
  { id: 'ru', label: 'Русский', emoji: '🇷🇺' },
  { id: 'zh', label: '中文', emoji: '🇨🇳' },
  { id: 'hi', label: 'हिन्दी', emoji: '🇮🇳' },
  { id: 'ko', label: '한국어', emoji: '🇰🇷' },
];

// Dónde y con qué entrena: cada opción habilita equipamiento del dataset.
// El peso corporal siempre está disponible; «gym» habilita todo.
// «req» habilita ejercicios de peso corporal que necesitan una estructura
// (dominadas → barra fija, banco → banco/silla/apoyo elevado).
export const EQUIPOS = [
  { id: 'cuerpo', label: 'Solo mi cuerpo', emoji: '🧍', equip: ['body weight'] },
  { id: 'dominadas', label: 'Barra de dominadas', emoji: '🚪', equip: [], req: 'barra' },
  { id: 'banco', label: 'Banco o silla firme', emoji: '🪑', equip: [], req: 'banco' },
  { id: 'mancuernas', label: 'Mancuernas', emoji: '🏋️', equip: ['dumbbell'] },
  { id: 'bandas', label: 'Bandas elásticas', emoji: '🪢', equip: ['band', 'resistance band'] },
  { id: 'kettlebell', label: 'Kettlebell', emoji: '🔔', equip: ['kettlebell'] },
  { id: 'barra', label: 'Barra y discos', emoji: '🛠️', equip: ['barbell', 'ez barbell', 'olympic barbell', 'trap bar'] },
  { id: 'gym', label: 'Gym con máquinas', emoji: '🏢', equip: '*' },
];

const ORDEN_JS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export const diaHoy = () => ORDEN_JS[new Date().getDay()];
export const diaDe = (fecha) => ORDEN_JS[fecha.getDay()];

// Racha: días programados cumplidos de forma consecutiva (los días libres no la
// rompen, y si además entrenas en uno, suma). Hoy pendiente tampoco la rompe.
export function calcularRacha(perfil, historial) {
  const hechos = new Set(historial.map((h) => new Date(h.fecha).toDateString()));
  const d = new Date();
  let racha = 0;
  if (perfil.dias.includes(diaDe(d)) && !hechos.has(d.toDateString())) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const hecho = hechos.has(d.toDateString());
    if (perfil.dias.includes(diaDe(d))) {
      if (!hecho) break;
      racha++;
    } else if (hecho) {
      racha++;
    }
    d.setDate(d.getDate() - 1);
  }
  return racha;
}
