/* =========================================================
   Cuenta atrás días : horas : min : seg hasta el drop.
   En la cuenta grande, cada cifra que cambia cae desde arriba
   como en un marcador. La de la cabecera cambia sin animación.
   ========================================================= */

const DAY = 864e5;
const HOUR = 36e5;
const MIN = 6e4;

const pad = (n) => String(n).padStart(2, "0");

export function startCountdown(root, target, { animated = false } = {}) {
  const cells = ["d", "h", "m", "s"].map((u) => root.querySelector(`[data-unit="${u}"]`));

  // En la cuenta animada, cada cifra va en su propia caja para poder hacerla caer.
  // (Los días pueden tener 3 cifras si el drop está a más de 99 días.)
  const dayDigits = Math.max(2, String(Math.floor(Math.max(0, target - Date.now()) / DAY)).length);
  const digits = animated
    ? cells.map((cell, index) => {
        cell.textContent = "";
        return Array.from({ length: index === 0 ? dayDigits : 2 }, () => {
          const box = document.createElement("span");
          box.className = "digit";
          const i = document.createElement("i");
          i.textContent = "0";
          box.append(i);
          cell.append(box);
          return box;
        });
      })
    : null;

  if (animated) {
    const when = target.toLocaleString("es-ES", {
      timeZone: "Europe/Madrid", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    root.setAttribute("aria-label", `Cuenta atrás hasta el drop: ${when}, hora de España`);
  }

  function show(index, text) {
    if (!digits) {
      cells[index].textContent = text;
      return;
    }
    [...text].forEach((ch, k) => {
      const box = digits[index][k];
      const i = box.firstChild;
      if (i.textContent === ch) return;
      i.textContent = ch;
      box.classList.remove("roll");
      void box.offsetWidth; // reinicia la animación
      box.classList.add("roll");
    });
  }

  let timer = 0;
  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / DAY); diff -= d * DAY;
    const h = Math.floor(diff / HOUR); diff -= h * HOUR;
    const m = Math.floor(diff / MIN); diff -= m * MIN;
    const s = Math.floor(diff / 1000);
    show(0, String(d).padStart(digits ? digits[0].length : 2, "0"));
    [h, m, s].forEach((v, i) => show(i + 1, pad(v)));
    // Programa el siguiente tic justo al cambiar de segundo, sin desfasarse.
    if (target - Date.now() > 0) timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  }
  tick();
  return () => clearTimeout(timer);
}
