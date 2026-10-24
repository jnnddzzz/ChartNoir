/* =========================================================
   Contenido: la obra (conjunto que se separa al hacer scroll),
   la ficha de cada pieza, las redes, las apariciones al hacer
   scroll y la cabecera.
   ========================================================= */

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

/* ---------- Obra destacada ---------- */
export function renderObra(obra, { onOpen }) {
  const values = {
    numero: `Obra ${obra.numero}`,
    edicion: obra.edicion,
    titular: obra.titular,
    texto: obra.texto,
  };
  document.querySelectorAll("[data-obra]").forEach((n) => {
    n.textContent = values[n.dataset.obra] ?? "";
  });

  const set = document.getElementById("set");
  set.style.setProperty("--ratio", obra.proporcion);

  obra.piezas.forEach((pieza, i) => {
    const { x, y, w, h } = pieza.caja;
    const side = x + w / 2 < 50 || (i === 0 && obra.piezas.length > 1) ? "left" : "right";
    const btn = el("button", { type: "button", className: "set-piece" },
      el("img", { src: pieza.imagen, alt: `${pieza.nombre} de la obra ${obra.numero}`, loading: "eager", decoding: "async" }),
      el("span", { className: "set-label" },
        el("em", { textContent: obra.edicion }),
        el("b", { textContent: pieza.nombre }),
        el("span", { textContent: "Ver pieza" }),
      ),
    );
    btn.dataset.side = side;
    btn.setAttribute("aria-label", `Ver ${pieza.nombre.toLowerCase()}, pieza ${obra.edicion}`);
    Object.assign(btn.style, { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });
    // Al separarse: la pieza de arriba sube y se va a un lado; la de abajo, al contrario.
    const up = i === 0;
    // (En móvil solo se separan en vertical: no hay sitio a los lados.)
    btn.style.setProperty("--dx-d", up ? "-22%" : "16%");
    btn.style.setProperty("--dy-d", up ? "-12%" : "9%");
    btn.style.setProperty("--rot-d", up ? "-4deg" : "3deg");
    btn.style.setProperty("--dy-m", up ? "-1%" : "13%");
    btn.style.setProperty("--rot-m", up ? "-2deg" : "1.5deg");
    btn.addEventListener("click", () => onOpen(obra, pieza));
    set.append(btn);
  });
}

/* ---------- Ficha de una pieza ---------- */
export function createPieceDialog(redes) {
  const dialog = document.getElementById("piece");
  const img = document.getElementById("piece-img");
  const other = document.getElementById("piece-other");
  const cta = document.getElementById("piece-cta");
  let current = null;

  function open(obra, pieza) {
    current = { obra, pieza };
    img.src = pieza.imagen;
    img.alt = `${pieza.nombre} de la obra ${obra.numero}`;
    document.getElementById("piece-obra").textContent = `Obra ${obra.numero} · ${obra.nombre}`;
    document.getElementById("piece-name").textContent = pieza.nombre;
    document.getElementById("piece-ed").textContent = obra.edicion;
    document.getElementById("piece-detail").textContent = pieza.detalle;

    const facts = document.getElementById("piece-facts");
    facts.replaceChildren();
    const rows = [
      ["Edición", `${obra.edicion} · pieza única`],
      ["Hecho", "A mano"],
      ["Tela", "Elegida para esta obra"],
      ["Disponible", "Primer drop"],
    ];
    if (obra.precio) rows.push(["Precio", obra.precio]);
    for (const [k, v] of rows) facts.append(el("li", {}, el("span", { textContent: k }), el("b", { textContent: v })));

    cta.hidden = !redes.instagram;
    if (redes.instagram) cta.href = redes.instagram;

    const rest = obra.piezas.filter((p) => p !== pieza);
    other.hidden = rest.length === 0;
    if (rest.length) other.textContent = `Ver ${rest[0].nombre.toLowerCase()}`;

    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }

  other.addEventListener("click", () => {
    const rest = current.obra.piezas.filter((p) => p !== current.pieza);
    if (rest.length) open(current.obra, rest[0]);
  });
  document.getElementById("piece-close").addEventListener("click", () => dialog.close());
  // Clic fuera del contenido (en móvil no hay fuera) también cierra.
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  return { open };
}

/* ---------- Redes ---------- */
export function renderSocial(redes) {
  const social = document.getElementById("social");
  for (const [key, name] of [["instagram", "Instagram"], ["tiktok", "TikTok"]]) {
    const url = redes[key];
    const node = el(url ? "a" : "span", { textContent: name });
    if (url) {
      const user = url.replace(/\/+$/, "").split("/").pop().replace(/^@/, "");
      Object.assign(node, { href: url, target: "_blank", rel: "noopener" });
      node.setAttribute("aria-label", `${name}: @${user} (se abre en otra pestaña)`);
      node.append(el("small", { textContent: `@${user} ↗` }));
    } else {
      node.append(el("small", { textContent: "Muy pronto" }));
    }
    social.append(el("li", {}, node));
  }
  document.getElementById("year").textContent = new Date().getFullYear();
}

/* ---------- Apariciones al entrar en pantalla ---------- */
export function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((n) => n.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -10% 0px" });
  items.forEach((n) => io.observe(n));
}
