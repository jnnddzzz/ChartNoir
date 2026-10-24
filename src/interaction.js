/* =========================================================
   Controles del vestidor:
   - arrastrar (ratón o dedo, en horizontal) gira la sala, con inercia;
   - flechas ← → del teclado y botones ‹ › saltan a la siguiente hornacina;
   - un toque sin arrastrar es un "clic" sobre la escena (para elegir prenda);
   - la posición del cursor inclina un poco el logo.
   En móvil, el dedo en vertical sigue haciendo scroll (touch-action: pan-y).
   ========================================================= */

export function createControls(canvas, { step, onTap, onMove, onInteract }) {
  const state = {
    enabled: false,
    visible: true,
    dragging: false,
    yaw: 0,       // giro añadido por la persona (radianes)
    vel: 0,       // inercia del giro
    goal: null,   // giro objetivo al saltar de hornacina
    px: 0, py: 0, // cursor normalizado de -1 a 1 sobre la escena
    idleSince: performance.now(),
  };
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let moved = false;

  canvas.addEventListener("pointerdown", (e) => {
    if (!state.enabled) return;
    state.dragging = true;
    moved = false;
    startX = lastX = e.clientX;
    startY = e.clientY;
    state.vel = 0;
    state.goal = null;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
    onInteract?.();
  });

  window.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    state.px = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.py = -((e.clientY - r.top) / r.height) * 2 + 1;
    if (!state.dragging) {
      onMove?.(e.clientX - r.left, e.clientY - r.top);
      return;
    }
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 6) moved = true;
    // Arrastrar a la izquierda mueve la sala a la izquierda: miramos más a la derecha.
    const k = 2.4 / Math.max(320, r.width);
    state.vel = -dx * k;
    state.yaw += state.vel;
    state.idleSince = performance.now();
  });

  const end = (e) => {
    if (!state.dragging) return;
    state.dragging = false;
    canvas.classList.remove("dragging");
    state.idleSince = performance.now();
    if (!moved && e.type === "pointerup") {
      const r = canvas.getBoundingClientRect();
      onTap?.(e.clientX - r.left, e.clientY - r.top);
    }
  };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end); // el navegador tomó el gesto para hacer scroll

  function turn(dir) {
    state.goal = (state.goal ?? state.yaw) + dir * step;
    state.vel = 0;
    state.idleSince = performance.now();
    onInteract?.();
  }

  window.addEventListener("keydown", (e) => {
    if (!state.enabled || !state.visible || e.target.closest?.("input, textarea, dialog")) return;
    if (e.key === "ArrowLeft") turn(-1);
    else if (e.key === "ArrowRight") turn(1);
    else return;
    e.preventDefault();
  });

  return { state, turn };
}
