/* =========================================================
   Contenido: la obra (conjunto que se separa al hacer scroll),
   la ficha de cada pieza, los formularios de puja y opinión,
   el taller, las redes y las apariciones al hacer scroll.
   ========================================================= */

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

/* ---------- Obra destacada ---------- */
export function renderObra(obra, { onOpen }) {
  const values = {
    numero: `Obra ${obra.numero} · ${obra.nombre}`,
    "numero-corto": obra.numero,
    edicion: obra.edicion,
    talla: obra.talla,
    titular: obra.titular,
    texto: obra.texto,
  };
  document.querySelectorAll("[data-obra]").forEach((n) => {
    n.textContent = values[n.dataset.obra] ?? "";
  });

  const facts = document.getElementById("obra-facts");
  for (const [k, v] of [["Edición", `${obra.edicion} · pieza única`], ["Talla", obra.talla], ["Hecho", "A mano"], ["Forro", "Doble"]]) {
    facts.append(el("li", {}, el("span", { textContent: k }), el("b", { textContent: v })));
  }

  const set = document.getElementById("set");
  set.style.setProperty("--ratio", obra.proporcion);
  obra.piezas.forEach((pieza, i) => {
    const { x, y, w, h } = pieza.caja;
    const up = i === 0;
    const btn = el("button", { type: "button", className: "set-piece" },
      el("img", { src: pieza.imagen, alt: `${pieza.nombre} de la obra ${obra.numero}`, decoding: "async" }),
      el("span", { className: "set-label" },
        el("em", { textContent: `${obra.edicion} · ${obra.talla}` }),
        el("b", { textContent: pieza.nombre }),
        el("span", { textContent: "Ver pieza" }),
      ),
    );
    btn.dataset.side = up ? "left" : "right";
    btn.setAttribute("aria-label", `Ver ${pieza.nombre.toLowerCase()}, pieza ${obra.edicion}`);
    Object.assign(btn.style, { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });
    // Al separarse: la pieza de arriba sube y se va a un lado; la de abajo, al contrario.
    // (En móvil solo se separan en vertical: no hay sitio a los lados.)
    btn.style.setProperty("--dx-d", up ? "-20%" : "14%");
    btn.style.setProperty("--dy-d", up ? "-10%" : "8%");
    btn.style.setProperty("--rot-d", up ? "-3deg" : "2deg");
    btn.style.setProperty("--dy-m", up ? "-1%" : "13%");
    btn.style.setProperty("--rot-m", up ? "-1.5deg" : "1deg");
    btn.addEventListener("click", () => onOpen(obra, pieza));
    set.append(btn);
  });
}

/* ---------- Ficha de una pieza ---------- */
export function createPieceDialog(redes, { onBid }) {
  const dialog = document.getElementById("piece");
  const img = document.getElementById("piece-img");
  const other = document.getElementById("piece-other");
  const cta = document.getElementById("piece-cta");
  const prev = document.getElementById("piece-prev");
  const next = document.getElementById("piece-next");
  const count = document.getElementById("piece-count");
  let current = null;

  function open(obra, pieza) {
    current = { obra, pieza };
    img.src = pieza.imagen;
    img.alt = `${pieza.nombre} de la obra ${obra.numero}`;
    document.getElementById("piece-obra").textContent = `Obra ${obra.numero} · ${obra.nombre}`;
    document.getElementById("piece-name").textContent = pieza.nombre;
    document.getElementById("piece-ed").textContent = obra.edicion;
    document.getElementById("piece-size").textContent = `Talla ${obra.talla}`;
    document.getElementById("piece-summary").textContent = pieza.resumen;

    const details = document.getElementById("piece-details");
    details.replaceChildren(...pieza.detalles.map((d) => el("li", { textContent: d })));

    const measures = document.getElementById("piece-measures");
    measures.replaceChildren(...pieza.medidas.map(([k, v]) => el("div", {}, el("dt", { textContent: k }), el("dd", { textContent: v }))));

    cta.hidden = !redes.instagram;
    if (redes.instagram) cta.href = redes.instagram;

    const rest = obra.piezas.filter((p) => p !== pieza);
    other.hidden = rest.length === 0;
    if (rest.length) other.textContent = `Ver ${rest[0].nombre.toLowerCase()}`;

    // Flechas ‹ › y contador: de una pieza a otra sin salir de la ficha.
    const n = obra.piezas.length;
    const i = obra.piezas.indexOf(pieza);
    prev.hidden = next.hidden = n < 2;
    count.textContent = n > 1 ? `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")} · ${pieza.nombre}` : "";

    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }

  const step = (d) => {
    if (!current) return;
    const list = current.obra.piezas;
    const i = list.indexOf(current.pieza);
    open(current.obra, list[(i + d + list.length) % list.length]);
  };
  prev.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  document.getElementById("piece-back").addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", (e) => {
    if (e.target.closest?.("input, textarea")) return;
    if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); }
    else if (e.key === "ArrowRight") { step(1); e.preventDefault(); }
  });

  other.addEventListener("click", () => {
    const rest = current.obra.piezas.filter((p) => p !== current.pieza);
    if (rest.length) open(current.obra, rest[0]);
  });
  document.getElementById("piece-bid").addEventListener("click", () => {
    dialog.close();
    onBid?.(current.obra);
  });
  document.getElementById("piece-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  return { open };
}

/* ---------- Puja y opinión ---------- */
export function setupVoz(store, obra) {
  const bidForm = document.getElementById("bid-form");
  const opForm = document.getElementById("opinion-form");
  const amount = document.getElementById("bid-amount");
  const range = document.getElementById("bid-range");

  // La cantidad y la barra van a la par.
  range.addEventListener("input", () => { amount.value = range.value; });
  amount.addEventListener("input", () => {
    const v = Number(amount.value);
    if (v >= Number(range.min) && v <= Number(range.max)) range.value = String(v);
  });

  if (store.mode === "off") {
    document.getElementById("voz-off").hidden = false;
    for (const f of [bidForm, opForm]) {
      f.querySelectorAll("input, textarea, button").forEach((n) => { n.disabled = true; });
    }
    return;
  }

  // Los botones empiezan desactivados en el HTML hasta saber dónde se guarda todo.
  bidForm.querySelector("button[type=submit]").disabled = false;
  opForm.querySelector("button[type=submit]").disabled = false;

  const clean = (s) => String(s || "").trim().slice(0, 600);

  bidForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("bid-status");
    const cantidad = Math.round(Number(amount.value));
    if (!Number.isFinite(cantidad) || cantidad < 1 || cantidad > 5000) {
      status.textContent = "Escribe una cantidad entre 1 y 5.000 €.";
      status.dataset.state = "error";
      amount.focus();
      return;
    }
    await submit(bidForm, status, () => store.saveBid(obra.id, {
      cantidad,
      nombre: clean(bidForm.nombre.value),
      contacto: clean(bidForm.contacto.value),
    }), `Puja registrada: ${cantidad} €. Gracias por decirnos lo que vale para ti.`);
  });

  opForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("op-status");
    const texto = clean(opForm.texto.value);
    if (texto.length < 3) {
      status.textContent = "Escribe tu opinión antes de enviarla.";
      status.dataset.state = "error";
      opForm.texto.focus();
      return;
    }
    const nota = Number(new FormData(opForm).get("nota")) || null;
    await submit(opForm, status, () => store.saveOpinion({
      obra: obra.id, nota, texto, nombre: clean(opForm.nombre.value),
    }), "Opinión recibida. Gracias: la leemos con calma.", () => opForm.reset());
  });

  async function submit(form, status, save, okText, after) {
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    status.textContent = "Enviando…";
    status.dataset.state = "";
    try {
      await save();
      status.textContent = okText;
      status.dataset.state = "ok";
      after?.();
    } catch (err) {
      console.warn(err);
      status.textContent = "No se ha podido guardar desde aquí. Inténtalo de nuevo o escríbenos por Instagram.";
      status.dataset.state = "error";
    } finally {
      btn.disabled = false;
    }
  }

  // Panel privado del dueño: todas las respuestas, en directo.
  if (store.isOwner) {
    const owner = document.getElementById("owner");
    owner.hidden = false;
    const fmt = (iso) => (iso ? new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");
    store.watchAll(({ bids, opinions }) => {
      const tb = document.getElementById("owner-bids");
      const sorted = [...bids].sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0));
      tb.replaceChildren(...sorted.map((b) => el("tr", {},
        el("td", { textContent: `${b.cantidad} €` }),
        el("td", { textContent: b.nombre || "—" }),
        el("td", { textContent: b.contacto || "—" }),
        el("td", { textContent: fmt(b.fecha) }),
      )));
      if (!sorted.length) tb.append(el("tr", {}, el("td", { colSpan: 4, textContent: "Aún no hay pujas." })));
      document.getElementById("owner-bid-count").textContent = `(${bids.length})`;

      const ul = document.getElementById("owner-ops");
      const ops = [...opinions].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
      ul.replaceChildren(...ops.map((o) => el("li", {},
        el("p", { textContent: o.texto }),
        el("small", { textContent: [o.nombre || "Anónimo", o.nota ? `${o.nota}/5` : "", fmt(o.fecha)].filter(Boolean).join(" · ") }),
      )));
      if (!ops.length) ul.append(el("li", {}, el("p", { textContent: "Aún no hay opiniones." })));
      document.getElementById("owner-op-count").textContent = `(${opinions.length})`;
    });
  }
}

/* ---------- Taller: fotos del proceso ---------- */
export function renderProceso(fotos) {
  const box = document.getElementById("proceso");
  for (const f of fotos) {
    box.append(el("figure", { className: "reveal" },
      el("img", { src: f.src, alt: f.texto, loading: "lazy", decoding: "async" }),
      el("figcaption", { textContent: f.texto }),
    ));
  }
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
