// Traducción de los campos del dataset que solo vienen en inglés (músculo y
// equipamiento). Si aparece un valor nuevo, se muestra tal cual.
const MUSCULOS = {
  abductors: 'abductores',
  abs: 'abdominales',
  adductors: 'aductores',
  biceps: 'bíceps',
  calves: 'gemelos',
  'cardiovascular system': 'cardio',
  delts: 'hombros',
  forearms: 'antebrazos',
  glutes: 'glúteos',
  hamstrings: 'isquios',
  lats: 'dorsales',
  'levator scapulae': 'elevador escápula',
  pectorals: 'pectorales',
  quads: 'cuádriceps',
  'serratus anterior': 'serrato',
  spine: 'lumbares',
  traps: 'trapecios',
  triceps: 'tríceps',
  'upper back': 'espalda alta',
};

const EQUIPAMIENTO = {
  assisted: 'asistido',
  band: 'banda',
  barbell: 'barra',
  'body weight': 'peso corporal',
  'bosu ball': 'bosu',
  cable: 'polea',
  dumbbell: 'mancuernas',
  'elliptical machine': 'elíptica',
  'ez barbell': 'barra EZ',
  hammer: 'martillo',
  kettlebell: 'kettlebell',
  'leverage machine': 'máquina',
  'medicine ball': 'balón medicinal',
  'olympic barbell': 'barra olímpica',
  'resistance band': 'banda elástica',
  roller: 'rodillo',
  rope: 'cuerda',
  'skierg machine': 'skierg',
  'sled machine': 'trineo',
  'smith machine': 'máquina Smith',
  'stability ball': 'fitball',
  'stationary bike': 'bici estática',
  'stepmill machine': 'escaladora',
  tire: 'neumático',
  'trap bar': 'barra hexagonal',
  'upper body ergometer': 'ergómetro de brazos',
  'wheel roller': 'rueda abdominal',
  weighted: 'con lastre',
};

export const musculo = (x) => MUSCULOS[x] ?? x;
export const equipamiento = (x) => EQUIPAMIENTO[x] ?? x;

// Para interpolar texto del usuario dentro de plantillas HTML
export const escapar = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// «septiembre de 2026» → «Septiembre de 2026» (capitalize pondría «De»)
export const mayusInicial = (s) => s.charAt(0).toUpperCase() + s.slice(1);
