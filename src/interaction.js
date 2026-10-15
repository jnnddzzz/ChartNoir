/* =========================================================
   Interacción: arrastrar con ratón o dedo, flechas del teclado
   y posición del cursor (para la inclinación y la luz).
   Solo guarda el estado; la animación lo usa en cada fotograma.

   En móvil el dedo en horizontal gira el logo y en vertical
   hace scroll de la página (touch-action: pan-y en el CSS).
   ========================================================= */

export function createControls(canvas, { onFirstDrag } = {}) {
  const state = {
    enabled: false,   // se activa cuando el logo ya ha entrado
    visible: true,    // la portada está en pantalla
    dragging: false,
    rotY: 0, rotX: 0, // giro acumulado
    velY: 0, velX: 0, // inercia
    px: 0, py: 0,     // cursor normalizado de -1 a 1 sobre la portada
  };
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    if (!state.enabled) return;
    state.dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    state.velX = state.velY = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
    onFirstDrag?.();
  });

  window.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    state.px = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.py = -((e.clientY - r.top) / r.height) * 2 + 1;
    if (!state.dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    state.velY = dx * 0.008;
    state.velX = dy * 0.004;
    state.rotY += state.velY;
    state.rotX = clamp(state.rotX + state.velX, -0.55, 0.55);
  });

  const endDrag = (e) => {
    state.dragging = false;
    canvas.classList.remove("dragging");
    // En móvil, al soltar el dedo el "cursor" vuelve al centro
    // para que el logo no se quede inclinado hacia un lado.
    if (e.pointerType !== "mouse") state.px = state.py = 0;
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag); // el navegador tomó el gesto para hacer scroll

  // ← → giran el logo mientras la portada está a la vista.
  // (↑ ↓ se dejan para hacer scroll, como en cualquier web.)
  window.addEventListener("keydown", (e) => {
    if (!state.enabled || !state.visible) return;
    if (e.key === "ArrowLeft") state.velY -= 0.07;
    else if (e.key === "ArrowRight") state.velY += 0.07;
    else return;
    e.preventDefault();
    onFirstDrag?.();
  });

  return state;
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
