// Comportamiento compartido de los componentes de interfaz.

// Conecta un <Stepper>: limita al rango, deshabilita los extremos y avisa de
// cada cambio. Devuelve un setter para fijar el valor desde fuera.
export function conectarStepper(el, { min, max, valor, onCambio }) {
  const salida = el.querySelector('output');
  const [menos, mas] = el.querySelectorAll('button');
  let actual = valor;

  const pintar = () => {
    salida.textContent = String(actual);
    menos.disabled = actual <= min;
    mas.disabled = actual >= max;
  };

  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-paso]');
    if (!b) return;
    const nuevo = Math.min(max, Math.max(min, actual + Number(b.dataset.paso)));
    if (nuevo === actual) return;
    actual = nuevo;
    pintar();
    onCambio?.(actual);
  });

  pintar();
  return (v) => { actual = v; pintar(); };
}

// Aviso breve abajo de la pantalla («Guardado»). Reemplaza al anterior.
let toastActual = null;
export function toast(texto, ms = 1600) {
  toastActual?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = texto;
  document.body.appendChild(el);
  toastActual = el;
  setTimeout(() => {
    el.classList.add('saliendo');
    setTimeout(() => el.remove(), 250);
  }, ms);
}

// Marca un chip como elegido (o no) accesiblemente
export const marcarChip = (el, on) => el.setAttribute('aria-pressed', on ? 'true' : 'false');
