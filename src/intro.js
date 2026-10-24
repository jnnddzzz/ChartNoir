/* =========================================================
   Pantalla de carga: número 000 → 100 con avance irregular y
   barra granate. Al llegar a 100: corte seco a negro (~300 ms),
   destello blanco y entrada al vestidor.

   El número nunca va por delante de lo que de verdad se ha
   descargado (tipografía, fotos de las prendas, telas): si algo
   tarda, el contador espera.
   ========================================================= */
import { LOADER_MS } from "./config.js";

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Curva irregular: arranca rápido, se atasca hacia el 60-72 y remata.
function curve(r) {
  if (r < 0.55) return easeOut(r / 0.55) * 0.6;
  if (r < 0.8) return 0.6 + ((r - 0.55) / 0.25) * 0.12;
  return 0.72 + easeOut((r - 0.8) / 0.2) * 0.28;
}

/**
 * @param {object} o
 * @param {() => number} o.loaded  fracción descargada (0 a 1)
 * @param {Promise} o.ready        se resuelve cuando todo está listo
 * @param {boolean} o.reduce       prefers-reduced-motion
 * @param {Function} o.onReveal    se llama al aparecer la escena (tras el corte)
 */
export function runIntro({ loaded, ready, reduce, onReveal }) {
  const loader = document.getElementById("loader");
  const num = document.getElementById("num");
  const bar = document.getElementById("bar");
  const flash = document.getElementById("flash");

  let isReady = false;
  ready.then(() => { isReady = true; });

  const duration = reduce ? 300 : LOADER_MS;
  const t0 = performance.now();

  function step(now) {
    const r = Math.min(1, Math.max(0, (now - t0) / duration));
    let p = curve(r);
    if (!isReady) p = Math.min(p, 0.99, 0.08 + loaded() * 0.91);
    num.textContent = String(Math.floor(p * 100)).padStart(3, "0");
    bar.style.transform = `scaleX(${p})`;
    if (r < 1 || !isReady) return requestAnimationFrame(step);
    cut();
  }

  function cut() {
    // Corte seco a negro.
    num.style.visibility = "hidden";
    bar.style.visibility = "hidden";
    loader.querySelector(".loader-brand").style.visibility = "hidden";
    setTimeout(() => {
      loader.remove();
      if (!reduce) {
        flash.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 240, easing: "ease-out" });
      }
      onReveal();
    }, reduce ? 0 : 320);
  }

  requestAnimationFrame(step);
}
