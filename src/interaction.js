/* =========================================================
   Controles del vestidor (vista 360°):
   - arrastrar gira la sala alrededor del logo (horizontal) y
     deja mirar arriba y abajo, al techo y al suelo (vertical);
   - flechas del teclado y botones ‹ › giran de escaparate en escaparate;
   - un toque sin arrastrar es un "clic" sobre la escena (elegir prenda);
   - en pantallas táctiles el dedo en vertical hace scroll, salvo en
     el modo "360°" (botón), donde el dedo mira libremente.
   ========================================================= */

export const PITCH_MIN = -0.95; // mirar al suelo
export const PITCH_MAX = 0.95;  // mirar al techo

export function createControls(canvas, { step, onTap, onMove, onInteract }) {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const state = {
    enabled: false,
    visible: true,
    dragging: false,
    explore: !coarse,  // con ratón siempre; en táctil, solo en modo 360°
    yaw: 0, pitch: 0,  // giro añadido por la persona (radianes)
    vel: 0, pvel: 0,   // inercia
    goal: null,        // giro objetivo al saltar de escaparate
    hold: false,       // el cursor está sobre una etiqueta: la sala no se mueve
    px: 0, py: 0,
    idleSince: performance.now(),
  };
  let startX = 0, startY = 0, lastX = 0, lastY = 0, moved = false;

  const syncTouch = () => { canvas.style.touchAction = state.explore ? "none" : "pan-y"; };
  syncTouch();

  canvas.addEventListener("pointerdown", (e) => {
    if (!state.enabled) return;
    state.dragging = true;
    moved = false;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    state.vel = state.pvel = 0;
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
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 6) moved = true;
    // Arrastrar hacia un lado mueve la sala hacia ese lado (como agarrarla).
    const k = 2.6 / Math.max(320, r.width);
    state.vel = -dx * k;
    state.yaw += state.vel;
    if (state.explore) {
      state.pvel = dy * k;
      state.pitch = clamp(state.pitch + state.pvel, PITCH_MIN, PITCH_MAX);
    }
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
  window.addEventListener("pointercancel", end);

  function turn(dir) {
    state.goal = (state.goal ?? state.yaw) + dir * step;
    state.vel = 0;
    state.idleSince = performance.now();
    onInteract?.();
  }

  function setExplore(on) {
    state.explore = on;
    syncTouch();
  }

  window.addEventListener("keydown", (e) => {
    if (!state.enabled || !state.visible || e.target.closest?.("input, textarea, dialog")) return;
    if (e.key === "ArrowLeft") turn(-1);
    else if (e.key === "ArrowRight") turn(1);
    else return;
    e.preventDefault();
  });

  return { state, turn, setExplore, coarse };
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
