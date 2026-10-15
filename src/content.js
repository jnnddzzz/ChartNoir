/* =========================================================
   Contenido de las secciones: rellena los datos del drop y
   las redes desde config.js, y controla las apariciones al
   hacer scroll y la cabecera.
   ========================================================= */

export function fillContent({ DROP_DATE, DROP, REDES }) {
  const fecha = DROP_DATE.toLocaleString("es-ES", {
    timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric",
  }).replaceAll("/", ".");
  const hora = DROP_DATE.toLocaleString("es-ES", {
    timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit",
  });

  const values = {
    numero: DROP.numero,
    unidades: String(DROP.unidades),
    serie: DROP.ejemploSerie,
    fecha,
    hora,
  };
  document.querySelectorAll("[data-drop]").forEach((el) => {
    el.textContent = values[el.dataset.drop] ?? "";
  });

  const prices = document.getElementById("prices");
  for (const [pieza, precio] of DROP.precios) {
    const li = document.createElement("li");
    li.append(pieza, Object.assign(document.createElement("b"), { textContent: precio }));
    prices.append(li);
  }

  // Redes: si hay enlace, botón; si no, "Muy pronto".
  const social = document.getElementById("social");
  for (const [key, name] of [["instagram", "Instagram"], ["tiktok", "TikTok"]]) {
    const li = document.createElement("li");
    const url = REDES[key];
    const el = document.createElement(url ? "a" : "span");
    el.textContent = name;
    if (url) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener";
      // Enseña el usuario (@...) sacado del propio enlace.
      const user = url.replace(/\/+$/, "").split("/").pop().replace(/^@/, "");
      el.setAttribute("aria-label", `${name}: @${user} (se abre en otra pestaña)`);
      el.append(Object.assign(document.createElement("small"), { textContent: `@${user} ↗` }));
    } else {
      el.append(Object.assign(document.createElement("small"), { textContent: "Muy pronto" }));
    }
    li.append(el);
    social.append(li);
  }

  document.getElementById("year").textContent = new Date().getFullYear();
}

// Los bloques con .reveal aparecen al entrar en pantalla (una sola vez).
export function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach((el) => io.observe(el));
}

// Al dejar atrás la portada, la cabecera enseña la cuenta atrás mini.
export function setupHeader(hero) {
  new IntersectionObserver(([entry]) => {
    document.body.classList.toggle("scrolled", entry.intersectionRatio < 0.35);
  }, { threshold: [0, 0.35, 1] }).observe(hero);
}
