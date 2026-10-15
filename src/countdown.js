/* =========================================================
   Cuenta atrás días : horas : min : seg hasta el drop.
   ========================================================= */

const DAY = 864e5;
const HOUR = 36e5;
const MIN = 6e4;

const pad = (n) => String(n).padStart(2, "0");

export function startCountdown(root, target) {
  const cells = {
    d: root.querySelector('[data-unit="d"]'),
    h: root.querySelector('[data-unit="h"]'),
    m: root.querySelector('[data-unit="m"]'),
    s: root.querySelector('[data-unit="s"]'),
  };

  // Texto para lectores de pantalla (no se repite cada segundo).
  const when = target.toLocaleString("es-ES", {
    timeZone: "Europe/Madrid", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  root.setAttribute("aria-label", `Cuenta atrás hasta el drop: ${when}, hora de España`);

  let timer = 0;
  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / DAY); diff -= d * DAY;
    const h = Math.floor(diff / HOUR); diff -= h * HOUR;
    const m = Math.floor(diff / MIN); diff -= m * MIN;
    const s = Math.floor(diff / 1000);
    cells.d.textContent = pad(d);
    cells.h.textContent = pad(h);
    cells.m.textContent = pad(m);
    cells.s.textContent = pad(s);
    // Programa el siguiente tic justo al cambiar de segundo, sin desfasarse.
    if (target - Date.now() > 0) timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  }
  tick();
  return () => clearTimeout(timer);
}
