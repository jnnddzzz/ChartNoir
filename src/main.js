/* =========================================================
   Chart Noir — web oficial
   Punto de entrada: monta el vestidor 3D (la sala gira
   alrededor del logo), la pantalla de carga, la cuenta atrás,
   la obra, la puja y la opinión, y las animaciones de scroll.
   ========================================================= */
import "./styles.css";
import * as THREE from "three";
import { DROP_DATE, OBRAS, REDES, FEEDBACK_ENDPOINT, TALLER_FOTOS } from "./config.js";
import { createStage } from "./scene/stage.js";
import { createLogo } from "./scene/logo.js";
import { createRoom } from "./scene/room.js";
import { createControls } from "./interaction.js";
import { runIntro } from "./intro.js";
import { startCountdown } from "./countdown.js";
import { renderObra, createPieceDialog, renderSocial, setupReveal, renderProceso, setupVoz } from "./content.js";
import { createFeedbackStore } from "./feedback.js";

document.documentElement.classList.add("js");
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const Y = new THREE.Vector3(0, 1, 0);

const canvas = document.getElementById("scene");
const hero = document.getElementById("inicio");
const heroBottom = document.getElementById("hero-bottom");
const hint = document.getElementById("hint");
const labelsBox = document.getElementById("labels");
const obraSection = document.getElementById("obra");
const set = document.getElementById("set");
const obraHelp = document.getElementById("obra-help");

// ---------- Contenido ----------
const obra = OBRAS[0];
const dialog = createPieceDialog(REDES, {
  onBid: () => document.getElementById("voz").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }),
});
renderObra(obra, { onOpen: dialog.open });
renderSocial(REDES);
renderProceso(TALLER_FOTOS);
const dropDay = DROP_DATE.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", ".");
document.getElementById("drop-label").textContent = `Primer drop · ${dropDay}`;
startCountdown(document.getElementById("count"), DROP_DATE, { animated: !reduce });
startCountdown(document.getElementById("mini"), DROP_DATE);
createFeedbackStore({ endpoint: FEEDBACK_ENDPOINT }).then((store) => setupVoz(store, obra));

// ---------- Escena 3D ----------
const CAM = { y: 1.5, back: 1.5 };       // cámara: por detrás del centro, ve media sala
const LOGO_DIST = 2.3;                    // distancia del logo a la cámara

const manager = new THREE.LoadingManager();
let loadedFraction = 0;
manager.onProgress = (_, done, total) => { loadedFraction = done / total; };

let three = null;
let sceneReady = Promise.resolve();
try {
  const stage = createStage(canvas);
  const logo = createLogo(stage.studio);
  stage.scene.add(logo);
  three = { ...stage, logo, room: null, garments: [] };

  sceneReady = loadPieces(manager).then((pieces) => {
    const room = createRoom({ pieces });
    stage.scene.add(room.group);
    three.room = room;
    three.garments = room.garments;
    captureReflections(stage, room, logo);
    buildLabels(room.garments);
    stage.renderer.compile(stage.scene, stage.camera);
    stage.renderer.render(stage.scene, stage.camera);
  });
} catch (err) {
  console.warn("WebGL no disponible, se muestra el logo plano.", err);
  canvas.remove();
  hero.querySelector(".hero-sticky").prepend(Object.assign(document.createElement("img"), {
    src: "logo.svg", alt: "Chart Noir", className: "logo-fallback",
  }));
  loadedFraction = 1;
}

/* Las fotos de cada pieza, como texturas para colgarlas en las hornacinas. */
function loadPieces(mgr) {
  const loader = new THREE.TextureLoader(mgr);
  const load = (url) => new Promise((res) => loader.load(url, res, undefined, () => res(null)));
  const jobs = [];
  for (const o of OBRAS) {
    for (const p of o.piezas) {
      jobs.push(load(p.imagen).then((texture) => {
        if (!texture) return null;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        const width = p.ancho || 0.55;
        const height = width * (texture.image.height / texture.image.width);
        return { texture, width, height, percha: p.percha, obra: o, pieza: p };
      }));
    }
  }
  return Promise.all(jobs).then((list) => list.filter(Boolean));
}

/* Una foto de la sala desde el centro: el suelo, la laca y el cromo
   reflejan el vestidor de verdad (sin colores inventados). */
function captureReflections(stage, room, logo) {
  const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cubeCam = new THREE.CubeCamera(0.05, 20, rt);
  cubeCam.position.set(0, 1.3, 0);
  logo.visible = false;
  cubeCam.update(stage.renderer, stage.scene);
  logo.visible = true;
  for (const m of room.reflective) {
    m.envMap = rt.texture;
    m.envMapIntensity = m.metalness > 0.5 ? 1 : 0.7;
    m.needsUpdate = true;
  }
}

// ---------- Selección de prendas ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hovered = null;

function pick(x, y) {
  if (!three?.garments.length) return null;
  ndc.set((x / canvas.clientWidth) * 2 - 1, -(y / canvas.clientHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, three.camera);
  const hits = raycaster.intersectObjects(three.garments.map((g) => g.cloth), false);
  return hits.length ? three.garments.find((g) => g.cloth === hits[0].object) : null;
}

let openTimer = 0;
function selectGarment(g) {
  // La sala gira hasta dejar la prenda junto al logo, y se abre su ficha.
  // (por el camino más corto, y quedándose en el lado donde ya estaba)
  const delta = Math.atan2(Math.sin(g.angle - currentYaw), Math.cos(g.angle - currentYaw));
  const side = Math.sign(delta) || 1;
  const goalYaw = currentYaw + delta - side * 0.32;
  controls.state.goal = goalYaw - baseYaw() - scrollYaw();
  controls.state.vel = 0;
  clearTimeout(openTimer);
  openTimer = setTimeout(() => dialog.open(g.piece.obra, g.piece.pieza), reduce ? 0 : 450);
}

/* Etiquetas flotantes sobre cada prenda (también se pueden tocar). */
const labels = [];
function buildLabels(garments) {
  for (const g of garments) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tag";
    b.innerHTML = `<span>${g.piece.obra.numero}</span><b></b><i aria-hidden="true">+</i>`;
    b.querySelector("b").textContent = g.piece.pieza.nombre;
    b.setAttribute("aria-label", `Ver ${g.piece.pieza.nombre.toLowerCase()}, obra ${g.piece.obra.numero}`);
    b.addEventListener("click", () => selectGarment(g));
    // Mientras el cursor está encima, la sala no se mueve: fácil de pulsar.
    b.addEventListener("pointerenter", () => { controls.state.hold = true; });
    b.addEventListener("pointerleave", () => { controls.state.hold = false; controls.state.idleSince = performance.now(); });
    labelsBox.append(b);
    const top = new THREE.Vector3();
    labels.push({ g, el: b, top });
  }
}

const controls = createControls(three ? canvas : hero, {
  step: (Math.PI * 2) / 6, // de hornacina en hornacina
  onInteract: () => hint.classList.remove("show"),
  onTap: (x, y) => { const g = pick(x, y); if (g) selectGarment(g); },
  onMove: (x, y) => {
    const g = pick(x, y);
    if (g !== hovered) {
      hovered = g;
      canvas.style.cursor = g ? "pointer" : "";
    }
  },
});
document.getElementById("turn-left").addEventListener("click", () => controls.turn(-1));
document.getElementById("turn-right").addEventListener("click", () => controls.turn(1));

// ---------- Scroll ----------
let heroP = 0;
function onScroll() {
  const vh = window.innerHeight;
  const hr = hero.getBoundingClientRect();
  heroP = clamp01(-hr.top / (hr.height - vh));
  controls.state.visible = hr.bottom > 0;
  heroBottom.style.opacity = String(1 - smooth(0.7, 0.95, heroP));
  if (heroP > 0.05) hint.classList.remove("show");
  document.body.classList.toggle("scrolled", hr.bottom < vh * 0.6);

  // El conjunto se separa mientras su sección está fija en pantalla.
  const or = obraSection.getBoundingClientRect();
  const op = clamp01(-or.top / (or.height - vh));
  const split = reduce ? (op > 0.2 ? 1 : 0) : smooth(0.12, 0.62, op);
  set.style.setProperty("--p", split.toFixed(3));
  obraHelp.style.opacity = String(1 - smooth(0.5, 0.7, op));
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

// ---------- Encuadre ----------
const portrait = () => three.camera.aspect < 0.8;
// Al empezar: en horizontal, una prenda a cada lado del logo; en vertical, la primera de frente.
const baseYaw = () => (portrait() ? 0 : (Math.PI * 2) / 12);
// Al bajar por la portada, la sala da media vuelta y enseña el resto de hornacinas.
const scrollYaw = () => heroP * Math.PI * 0.85;

// ---------- Animación ----------
let hitAt = -1;
let last = performance.now();
let currentYaw = 0;
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const logoPos = new THREE.Vector3();
const tmp = new THREE.Vector3();

function frame(now) {
  requestAnimationFrame(frame);
  if (!three || hitAt < 0 || !controls.state.visible) { last = now; return; }
  const { renderer, scene, camera, logo, room } = three;
  const s = controls.state;

  const f = Math.min(4, (now - last) / (1000 / 60)); // fotogramas de 60 Hz transcurridos
  last = now;
  const t = now / 1000;

  // Giro: inercia del arrastre, saltos de hornacina y una deriva lentísima en reposo.
  if (!s.dragging) {
    if (s.goal !== null) {
      s.yaw += (s.goal - s.yaw) * (1 - Math.pow(0.88, f));
      if (Math.abs(s.goal - s.yaw) < 0.0005) { s.yaw = s.goal; s.goal = null; }
    } else {
      s.yaw += s.vel * f;
      s.vel *= Math.pow(0.93, f);
      if (!reduce && !s.hold && now - s.idleSince > 4000) s.yaw += 0.00045 * f;
    }
  }
  const target = baseYaw() + scrollYaw() + s.yaw;
  currentYaw += (target - currentYaw) * (1 - Math.pow(0.8, f));
  const rot = -currentYaw;

  // Cámara: detrás del centro, mirando hacia la pared que toca.
  camPos.set(0, CAM.y, CAM.back).applyAxisAngle(Y, rot);
  // En vertical mira un poco hacia arriba: el logo arriba y la prenda debajo.
  camLook.set(0, CAM.y + (portrait() ? 0.25 : -0.12), CAM.back - 6).applyAxisAngle(Y, rot);

  // Entrada: el logo llega grande y girado y frena en seco, con sacudida.
  let k = 1;
  let shake = 0;
  if (!reduce) {
    const ms = now - hitAt;
    k = easeOutExpo(Math.min(1, ms / 900));
    shake = ms < 380 ? (1 - ms / 380) * 0.04 : 0;
  }
  camPos.x += (Math.random() - 0.5) * shake;
  camPos.y += (Math.random() - 0.5) * shake;
  camera.position.copy(camPos);
  camera.lookAt(camLook);

  // Logo: siempre de frente, centrado, a su tamaño en cada pantalla.
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const visH = 2 * LOGO_DIST * Math.tan(vFov / 2);
  const visW = visH * camera.aspect;
  const width = (portrait() ? 0.8 : 0.4) * visW;
  const lift = visH * (portrait() ? 0.27 : 0.05); // en vertical, el logo arriba y la prenda debajo
  logoPos.set(0, CAM.y + lift + (reduce ? 0 : Math.sin(t * 0.9) * 0.01), CAM.back - LOGO_DIST).applyAxisAngle(Y, rot);
  logo.position.copy(logoPos);
  logo.scale.setScalar((width / 10) * (1 + (1 - k) * 0.5));
  for (const m of logo.userData.materials) m.envMapRotation.set(0, rot, 0);
  logo.rotation.set(
    -s.py * 0.06 + (1 - k) * 0.25,
    rot + s.px * 0.12 + (reduce ? 0 : Math.sin(t * 0.5) * 0.03) + (1 - k) * -0.8,
    0,
  );

  // Prendas: brillan un poco más bajo el cursor.
  for (const g of three.garments) {
    const spot = g.group.userData.spot;
    if (spot) spot.intensity += ((g === hovered ? 15 : 9) - spot.intensity) * 0.15;
  }
  room?.update(t);
  renderer.render(scene, camera);
  placeLabels();
}
requestAnimationFrame(frame);

/* Coloca cada etiqueta sobre su prenda; se ocultan si la prenda no está de frente. */
const fwd = new THREE.Vector3();
const toG = new THREE.Vector3();
function placeLabels() {
  if (!labels.length) return;
  const cam = three.camera;
  cam.getWorldDirection(fwd);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  for (const L of labels) {
    // Sobre el gancho (no sobre la tela, que se mece): la etiqueta queda quieta.
    L.g.group.getWorldPosition(L.top);
    L.top.y += 0.2;
    toG.subVectors(L.top, cam.position).normalize();
    const facing = toG.dot(fwd);
    tmp.copy(L.top).project(cam);
    const x = (tmp.x * 0.5 + 0.5) * w;
    const y = (-tmp.y * 0.5 + 0.5) * h;
    const visible = facing > 0.75 && x > 24 && x < w - 24 && y > 70 && y < h - 40;
    L.el.classList.toggle("show", visible && document.body.classList.contains("revealed"));
    L.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
    L.el.tabIndex = visible ? 0 : -1;
  }
}

// ---------- Entrada ----------
const fontsReady = Promise.race([
  document.fonts?.ready ?? Promise.resolve(),
  new Promise((r) => setTimeout(r, 3000)),
]);

runIntro({
  loaded: () => loadedFraction,
  ready: Promise.all([fontsReady, sceneReady.catch(() => {})]),
  reduce,
  onReveal() {
    if (three) canvas.style.visibility = "visible";
    hitAt = performance.now();
    document.body.classList.remove("is-loading");
    document.body.classList.add("revealed");
    setupReveal();
    requestAnimationFrame(() => document.body.classList.add("entered"));
    setTimeout(() => {
      controls.state.enabled = true;
      if (three) {
        hint.classList.add("show");
        setTimeout(() => hint.classList.remove("show"), 5000);
      }
    }, reduce ? 0 : 700);
  },
});
