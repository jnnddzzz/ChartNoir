/* =========================================================
   Chart Noir — web oficial
   Punto de entrada: monta el vestidor-museo 3D (la sala gira
   360° en todas direcciones alrededor del logo y, al bajar, la
   cámara viaja hasta el escaparate de la obra), la pantalla de
   carga, la cuenta atrás de la cabecera, la obra, la puja y la
   opinión.
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
const dir = (a, out = new THREE.Vector3()) => out.set(Math.sin(a), 0, -Math.cos(a));

const canvas = document.getElementById("scene");
const hero = document.getElementById("inicio");
const heroBottom = document.getElementById("hero-bottom");
const heroCaption = document.getElementById("hero-caption");
const hint = document.getElementById("hint");
const labelsBox = document.getElementById("labels");
const obraSection = document.getElementById("obra");
const set = document.getElementById("set");
const obraHelp = document.getElementById("obra-help");
const exploreBtn = document.getElementById("explore");
const exitBtn = document.getElementById("explore-exit");

// ---------- Contenido ----------
const obra = OBRAS[0];
const goTo = (id) => document.getElementById(id).scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
const dialog = createPieceDialog(REDES, { onBid: () => goTo("voz") });
renderObra(obra, { onOpen: dialog.open });
renderSocial(REDES);
renderProceso(TALLER_FOTOS);
startCountdown(document.getElementById("mini"), DROP_DATE);
createFeedbackStore({ endpoint: FEEDBACK_ENDPOINT }).then((store) => setupVoz(store, obra));
document.getElementById("caption-open").addEventListener("click", () => goTo("obra"));
document.getElementById("caption-title").textContent = `${obra.nombre}.`;

// ---------- Escena 3D ----------
const manager = new THREE.LoadingManager();
let loadedFraction = 0;
manager.onProgress = (_, done, total) => { loadedFraction = done / total; };

let three = null;
let sceneReady = Promise.resolve();
try {
  const stage = createStage(canvas);
  const logo = createLogo(stage.studio);
  logo.rotation.order = "YXZ"; // primero mira a la cámara, luego se inclina
  stage.scene.add(logo);
  three = { ...stage, logo, room: null, displays: [], cloths: [] };

  // Las letras del friso y las cartelas se dibujan con Archivo: esperamos a la fuente.
  const fontFor3D = Promise.race([
    Promise.all(["500 46px Archivo", "600 62px Archivo", "400 30px Archivo"].map((f) => document.fonts?.load(f))).catch(() => {}),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
  sceneReady = Promise.all([loadPieces(manager), loadPhotos(manager), loadFabrics(manager), fontFor3D]).then(([pieces, photos, fabrics]) => {
    const room = createRoom({ obras: OBRAS, pieces, photos, fabrics });
    stage.scene.add(room.group);
    three.room = room;
    three.displays = room.displays;
    three.cloths = room.displays.flatMap((d) => d.garments.map((g) => ({ mesh: g.userData.cloth, piece: g.userData.piece, display: d })));
    room.setIntro(99); // todo encendido para la foto de reflejos…
    captureReflections(stage, room, logo);
    if (!reduce) room.setIntro(0); // …y a oscuras para la entrada
    buildLabels(room.displays);
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

/* Las fotos de cada pieza, como texturas para colgarlas en los escaparates. */
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

/* La tela de cada obra, fotografiada de cerca: viste los costados de las prendas 3D. */
function loadFabrics(mgr) {
  const loader = new THREE.TextureLoader(mgr);
  const fabrics = new Map();
  return Promise.all(OBRAS.filter((o) => o.tela).map((o) => new Promise((res) => loader.load(o.tela, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    fabrics.set(o.id, t);
    res();
  }, undefined, () => res())))).then(() => fabrics);
}

/* Las fotos del proceso, para enmarcarlas en la pared del taller. */
function loadPhotos(mgr) {
  const loader = new THREE.TextureLoader(mgr);
  return Promise.all(TALLER_FOTOS.map((f) => new Promise((res) => loader.load(f.src, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    res({ texture, texto: f.texto });
  }, undefined, () => res(null))))).then((list) => list.filter(Boolean));
}

/* Una foto de la sala desde el centro: el mármol, la laca y el cromo
   reflejan el vestidor de verdad. */
function captureReflections(stage, room, logo) {
  const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cubeCam = new THREE.CubeCamera(0.05, 20, rt);
  cubeCam.position.set(0, 1.4, 0);
  logo.visible = false;
  cubeCam.update(stage.renderer, stage.scene);
  logo.visible = true;
  for (const m of room.reflective) {
    m.envMap = rt.texture;
    m.envMapIntensity = m.metalness > 0.5 ? 1 : 0.8;
    m.needsUpdate = true;
  }
}

// ---------- Selección de prendas ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hovered = null;

function pick(x, y) {
  if (!three?.cloths.length) return null;
  ndc.set((x / canvas.clientWidth) * 2 - 1, -(y / canvas.clientHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, three.camera);
  const hits = raycaster.intersectObjects(three.cloths.map((c) => c.mesh), false);
  return hits.length ? three.cloths.find((c) => c.mesh === hits[0].object) : null;
}

/* Una etiqueta flotante por escaparate: lleva a la obra completa. */
const labels = [];
function buildLabels(displays) {
  for (const d of displays) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tag";
    b.innerHTML = `<span>${d.obra.numero}</span><b></b><i aria-hidden="true">+</i>`;
    b.querySelector("b").textContent = `${d.obra.nombre} · ${d.obra.edicion}`;
    b.setAttribute("aria-label", `Ver la obra ${d.obra.numero} completa`);
    b.addEventListener("click", () => goTo("obra"));
    b.addEventListener("pointerenter", () => { controls.state.hold = true; });
    b.addEventListener("pointerleave", () => { controls.state.hold = false; controls.state.idleSince = performance.now(); });
    labelsBox.append(b);
    const anchor = d.labelAt.clone();
    labels.push({ d, el: b, anchor });
  }
}

const controls = createControls(three ? canvas : hero, {
  step: (Math.PI * 2) / 6, // de escaparate en escaparate
  onInteract: () => hint.classList.remove("show"),
  onTap: (x, y) => { const c = pick(x, y); if (c) dialog.open(c.piece.obra, c.piece.pieza); },
  onMove: (x, y) => {
    const c = pick(x, y);
    hovered = c;
    canvas.style.cursor = c ? "pointer" : hitLogo(x, y) ? "grab" : "";
  },
  hitLogo: (x, y) => hitLogo(x, y),
  onLogoDrag: (dx, dy) => spinLogo(dx, dy),
  // En táctil, arriba del todo: deslizar hacia arriba = bajar al conjunto (como en el ordenador).
  onSwipe: (dir) => { if (dir === "up") journey(); },
});

/* ---------- El símbolo gira 360° en cualquier dirección ----------
   Descansa de frente, flotando. Cada pocos segundos da una vuelta completa
   y vuelve a quedar de frente. Arrastrándolo se gira libremente hacia
   cualquier lado; al soltarlo vuelve solo a su sitio. */
const logoQ = new THREE.Quaternion();     // giro que le da la persona (se deshace solo)
const spinVel = new THREE.Vector3();      // inercia del giro (eje × ángulo por fotograma)
const qTmp = new THREE.Quaternion();
const axisUp = new THREE.Vector3();
const axisRight = new THREE.Vector3();
let lastSpinAt = 0;

// Toda la zona del símbolo cuenta (también los huecos entre trazos): agarrarlo es fácil.
function hitLogo(x, y) {
  if (!three?.logo.visible) return false;
  three.logo.updateMatrixWorld();
  const r = logoRect(three.camera, canvas.clientWidth, canvas.clientHeight);
  return x > r.x0 + 10 && x < r.x1 - 10 && y > r.y0 + 10 && y < r.y1 - 10;
}
function spinLogo(dx, dy) {
  // Arrastrar en horizontal gira alrededor del eje vertical de la vista;
  // en vertical, alrededor del eje horizontal (vuelta de campana).
  axisUp.set(0, 1, 0).applyQuaternion(three.camera.quaternion);
  axisRight.set(1, 0, 0).applyQuaternion(three.camera.quaternion);
  spinVel.copy(axisUp).multiplyScalar(dx * 7).addScaledVector(axisRight, dy * 7);
  applySpin(spinVel);
  lastSpinAt = performance.now();
}
function applySpin(v) {
  const angle = v.length();
  if (angle < 1e-6) return;
  qTmp.setFromAxisAngle(axisUp.copy(v).divideScalar(angle), angle);
  logoQ.premultiply(qTmp).normalize();
}
document.getElementById("turn-left").addEventListener("click", () => controls.turn(-1));
document.getElementById("turn-right").addEventListener("click", () => controls.turn(1));

// Modo 360° en pantallas táctiles: el dedo mira libremente (sin hacer scroll).
function setExplore(on) {
  controls.setExplore(on);
  document.body.classList.toggle("exploring", on);
  document.documentElement.style.overflow = on ? "hidden" : "";
  if (on) {
    hint.textContent = "Gira la sala hacia cualquier lado: por encima, por debajo, alrededor";
    hint.classList.add("show");
  } else {
    hint.classList.remove("show");
  }
}
// En táctil, el dedo sobre el símbolo lo gira en cualquier dirección (sin hacer scroll):
// una zona invisible encima del símbolo que no deja desplazar la página.
const grip = document.createElement("div");
grip.className = "logo-grip";
grip.setAttribute("aria-hidden", "true");
if (controls.coarse && three) {
  labelsBox.append(grip);
  controls.bind(grip);
}

// En táctil, arriba del todo (en la sala) el dedo gira la sala y el símbolo en todas
// direcciones; para bajar está el botón ↓ (y, en cuanto se baja, el dedo vuelve a hacer scroll).
if (controls.coarse) {
  hint.textContent = "Arrastra hacia los lados para girar la sala y el símbolo";
}
exitBtn.addEventListener("click", () => setExplore(false));

/* Botón ↓: el recorrido de cámara hasta la vitrina y la vuelta de Génesis, como una
   secuencia de cine (se puede cortar tocando la pantalla o con la rueda). */
let journeyRaf = 0;
function journey() {
  cancelAnimationFrame(journeyRaf);
  const from = window.scrollY;
  const to = hero.offsetTop + hero.offsetHeight - viewH();
  if (reduce) { window.scrollTo(0, to); return; }
  const dur = 4200 * Math.min(1, Math.abs(to - from) / Math.max(1, to - hero.offsetTop));
  const t0 = performance.now();
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const step = (now) => {
    const k = Math.min(1, (now - t0) / Math.max(400, dur));
    window.scrollTo(0, from + (to - from) * ease(k));
    if (k < 1) journeyRaf = requestAnimationFrame(step);
  };
  journeyRaf = requestAnimationFrame(step);
}
const stopJourney = () => cancelAnimationFrame(journeyRaf);
window.addEventListener("wheel", stopJourney, { passive: true });
window.addEventListener("touchstart", stopJourney, { passive: true });
document.getElementById("journey").addEventListener("click", journey);
// Indicador para bajar: dice qué hacer según el aparato y lleva a la vitrina si se toca.
const cue = document.getElementById("scroll-cue");
document.getElementById("cue-text").textContent = controls.coarse ? "Desliza hacia arriba para entrar" : "Baja para entrar";
cue.addEventListener("click", journey);

// ---------- Scroll ----------
let heroP = 0;
// Altura de pantalla estable: la del bloque fijo de la portada (100svh). En el móvil,
// window.innerHeight cambia al aparecer o esconderse la barra del navegador y hacía saltar la cámara.
const heroSticky = hero.querySelector(".hero-sticky");
const viewH = () => heroSticky.clientHeight || window.innerHeight;
function onScroll() {
  const vh = viewH();
  const hr = hero.getBoundingClientRect();
  heroP = clamp01(-hr.top / (hr.height - vh));
  if (controls.coarse && !document.body.classList.contains("exploring")) controls.setExplore(heroP < 0.03);
  controls.state.visible = hr.bottom > 0;
  heroBottom.style.opacity = String(1 - smooth(0.04, 0.2, heroP));
  heroBottom.style.pointerEvents = heroP > 0.2 ? "none" : "";
  heroCaption.classList.toggle("show", heroP > 0.95);
  if (heroP > 0.04) hint.classList.remove("show");
  cue.classList.toggle("show", heroP < 0.02);
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

// ---------- Cámara ----------
const portrait = () => three.camera.aspect < 0.8;
// Al empezar: en horizontal, el escaparate a la derecha del logo; en vertical, detrás (el logo sube).
const baseYaw = () => (portrait() ? 0 : -0.5);

const L = new THREE.Vector3();          // centro del logo
const camOrbit = new THREE.Vector3();   // cámara alrededor del logo
const lookOrbit = new THREE.Vector3();
const camFinal = new THREE.Vector3();   // cámara frente al escaparate
const lookFinal = new THREE.Vector3();
const ctrl = new THREE.Vector3();
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

// Órbita esférica: la cámara recorre una esfera alrededor del símbolo, sin topes
// (por encima, por debajo, dando la vuelta entera) y siempre lo mira: el símbolo
// se queda en el centro y es la sala la que gira a su alrededor.
const camUp = new THREE.Vector3(0, 1, 0);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
let orbitDist = 4.2;
function computeCamera(yaw, pitch, p) {
  const port = portrait();
  const D = port ? 4.6 : 4.2;   // la cámara lejos: el símbolo flota en mitad de la sala
  L.set(0, 1.95, 0);
  const f = dir(yaw, tmp);
  const sp = Math.sin(pitch), cp = Math.cos(pitch);
  // Dentro de la sala: por arriba no pasa de la lámpara, por abajo no atraviesa el suelo.
  const room = sp > 0.001 ? (3.72 - L.y) / sp : sp < -0.001 ? (L.y - 0.28) / -sp : Infinity;
  orbitDist = Math.min(D, room);
  camOrbit.copy(L).addScaledVector(f, -cp * orbitDist);
  camOrbit.y += sp * orbitDist;
  camUp.copy(f).multiplyScalar(sp).addScaledVector(WORLD_UP, cp);
  lookOrbit.copy(L);

  // Escaparate principal: la cámara viaja hasta tenerlo delante.
  const main = three.displays[0];
  if (!main || p <= 0) {
    camPos.copy(camOrbit);
    camLook.copy(lookOrbit);
    return;
  }
  camUp.lerp(WORLD_UP, smooth(0, 0.5, p)).normalize();
  const a = main.angle;
  camFinal.copy(dir(a, tmp)).multiplyScalar(port ? 1.7 : 1.35); // lejos: el conjunto entero cabe en pantalla
  camFinal.y = 1.9;
  lookFinal.copy(main.focus);
  // Curva que pasa por un lado del logo (nunca lo atraviesa).
  const side = tmp.set(Math.cos(a), 0, Math.sin(a));
  const sign = Math.sign(side.dot(camOrbit)) || 1;
  ctrl.copy(side).multiplyScalar(2.6 * sign);
  ctrl.y = 2.2;
  const s = smooth(0, 1, p);
  const u = 1 - s;
  camPos.set(
    u * u * camOrbit.x + 2 * u * s * ctrl.x + s * s * camFinal.x,
    u * u * camOrbit.y + 2 * u * s * ctrl.y + s * s * camFinal.y,
    u * u * camOrbit.z + 2 * u * s * ctrl.z + s * s * camFinal.z,
  );
  camLook.lerpVectors(lookOrbit, lookFinal, smooth(0, 0.8, p));
}

// ---------- Animación ----------
// Entrada: tras el corte a negro, el símbolo ya está ahí, grande y brillando en la
// oscuridad, muy cerca y de lado. Mientras se gira hacia nosotros y se aleja hasta su
// sitio, la sala da una vuelta a su alrededor, se enciende luz a luz y se frena en seco.
const INTRO = 3.6;     // segundos que dura la entrada
let introStart = -1;
let introDone = false;
let last = performance.now();
let currentYaw = null;
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function frame(now) {
  requestAnimationFrame(frame);
  if (!three || introStart < 0 || !controls.state.visible) { last = now; return; }
  const { renderer, scene, camera, logo, room } = three;
  const s = controls.state;
  const f = Math.min(4, (now - last) / (1000 / 60));
  last = now;
  const t = now / 1000;
  const it = reduce ? 99 : (now - introStart) / 1000;

  // Luces de la entrada.
  if (!introDone && room) {
    introDone = room.setIntro(it);
    if (introDone) onIntroDone();
  }

  // Giro de la sala: inercia, saltos de escaparate, deriva lentísima en reposo.
  if (!s.dragging || s.mode === "logo") {
    if (s.goal !== null) {
      s.yaw += (s.goal - s.yaw) * (1 - Math.pow(0.88, f));
      if (Math.abs(s.goal - s.yaw) < 0.0005) { s.yaw = s.goal; s.goal = null; }
    } else {
      s.yaw += s.vel * f;
      s.vel *= Math.pow(0.93, f);
      if (!reduce && !s.hold && heroP < 0.02 && now - s.idleSince > 4500) s.yaw += 0.0003 * f;
    }
    s.pitch += s.pvel * f;
    s.pvel *= Math.pow(0.9, f);
    // En reposo, la mirada vuelve sola al horizonte (por el camino más corto).
    const home = Math.round(s.pitch / (Math.PI * 2)) * Math.PI * 2;
    if (now - s.idleSince > 5000) s.pitch += (home - s.pitch) * (1 - Math.pow(0.985, f));
  }
  const yawTarget = baseYaw() + s.yaw;
  currentYaw = currentYaw === null ? yawTarget : currentYaw + (yawTarget - currentYaw) * (1 - Math.pow(0.8, f));
  const pitchNow = Math.atan2(Math.sin(s.pitch), Math.cos(s.pitch)); // misma vista, sin vueltas acumuladas
  // Al bajar: primero la cámara viaja hasta la vitrina (60 % del scroll de la portada)…
  const fly = clamp01(heroP / 0.6);
  const ip = reduce ? 1 : Math.min(1, it / INTRO);
  const swirl = -2.6 * (1 - easeOutQuart(ip)); // la sala gira alrededor del símbolo y se frena
  computeCamera(currentYaw + swirl, pitchNow * (1 - fly), fly);
  // …y después el conjunto da una vuelta completa de 360°, al ritmo del scroll.
  if (three.displays[0]) three.displays[0].spin = Math.PI * 2 * (reduce ? 0 : smooth(0.62, 0.94, heroP));

  // La cámara empieza pegada al símbolo y se aleja hasta su sitio.
  const dolly = 0.4 + 0.6 * easeOutCubic(ip);
  camPos.sub(L).multiplyScalar(dolly).add(L);
  logo.visible = true;
  camera.position.copy(camPos);
  camera.up.copy(camUp);
  camera.lookAt(camLook);

  // Giro del símbolo: inercia del arrastre y, al soltarlo, vuelta suave de frente.
  if (!(s.dragging && s.mode === "logo")) {
    applySpin(spinVel);
    spinVel.multiplyScalar(Math.pow(0.94, f));
    if (now - lastSpinAt > 1800) logoQ.slerp(qIdentity, 1 - Math.pow(0.96, f));
  }
  // Vuelta completa automática cada pocos segundos, mientras nadie lo toca.
  if (!reduce && introDone && heroP < 0.05) {
    if (autoSpin.start < 0 && now > autoSpin.next && now - lastSpinAt > 4000 && now - s.idleSince > 4000 && !s.dragging) autoSpin.start = now;
    if (autoSpin.start >= 0) {
      const pr = Math.min(1, (now - autoSpin.start) / 2600);
      autoSpin.angle = Math.PI * 2 * (pr < 0.5 ? 4 * pr * pr * pr : 1 - Math.pow(-2 * pr + 2, 3) / 2);
      if (pr >= 1) { autoSpin.start = -1; autoSpin.angle = 0; autoSpin.next = now + 9000; }
    }
  }

  // Tamaño: más pequeño, flotando en el centro de la sala.
  // (Siempre del mismo tamaño en pantalla, también al acercarse por arriba o por abajo.)
  const visW = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect * orbitDist;
  const width = (portrait() ? 0.44 : 0.22) * visW;
  logo.position.copy(L);
  logo.position.y += reduce ? 0 : Math.sin(t * 0.9) * 0.02;
  // Entrada: el símbolo aparece grande, se queda un instante y se encoge hasta su sitio.
  // (El tamaño en pantalla no depende del acercamiento de la cámara: lo marca solo la entrada.)
  const shrink = easeInOutCubic(Math.min(1, Math.max(0, (it - 0.5) / 2.9)));
  const grand = reduce ? 1 : (1 + (portrait() ? 1.0 : 2.2) * (1 - shrink)) * dolly;
  logo.scale.setScalar((width / 10) * grand);
  // Orientación final = giro de la persona × de frente a la cámara (desde
  // cualquier lado: también desde arriba o desde abajo) × vuelta automática.
  qView.copy(camera.quaternion);
  const turn = reduce ? 0 : 1 - easeOutCubic(Math.min(1, it / (INTRO * 0.9)));
  qFace.setFromEuler(tmpEuler.set(turn * 0.42, autoSpin.angle - turn * 1.0, turn * 0.1, "YXZ"));
  logo.quaternion.copy(logoQ).multiply(qView).multiply(qFace);
  // Los reflejos de estudio acompañan a la cámara, con un barrido de luz lento.
  const sweep = reduce ? 0 : Math.sin(t * 0.3) * 0.25;
  // El plató gira pegado al símbolo (con cualquier giro: arrastre, vuelta automática,
  // vista desde arriba, desde abajo o boca abajo): el metal brilla igual desde todos
  // lados, sin saltos. Three.js (r186) usa la inversa de envMapRotation para mirar el
  // plató, así que basta con darle el mismo giro que tiene el símbolo.
  qEnv.copy(logo.quaternion).multiply(qSweep.setFromAxisAngle(WORLD_UP, sweep));
  // En la entrada el metal brilla más fuerte (recién iluminado en la oscuridad) y se calma.
  const gleam = reduce ? 1 : 1 + 0.9 * (1 - easeOutCubic(Math.min(1, it / INTRO)));
  for (const m of logo.userData.materials) {
    m.envMapRotation.setFromQuaternion(qEnv);
    m.envMapIntensity = m.userData.baseEnv * gleam;
  }

  // El escaparate brilla un poco más bajo el cursor (cuando ya se han encendido las luces).
  if (introDone) {
    for (const d of three.displays) {
      const on = hovered && hovered.display === d;
      const base = d === three.displays[0] ? 16 : 10;
      d.spot.intensity += ((on ? base * 1.4 : base) - d.spot.intensity) * 0.15;
    }
  }
  room?.update(t);
  renderer.render(scene, camera);
  adaptQuality(now);
  placeLabels();
}
/* Calidad automática: si el aparato no llega a ~40 imágenes por segundo, se baja la
   resolución poco a poco (hasta 1×). Fluidez antes que píxeles: nada de tirones. */
const quality = { frames: 0, since: 0, dpr: 0 };
function adaptQuality(now) {
  const r = three.renderer;
  if (!quality.dpr) { quality.dpr = r.getPixelRatio(); quality.since = now; }
  // Una pausa (pestaña oculta, portada fuera de pantalla) no cuenta como lentitud.
  if (now - (quality.last || now) > 250) { quality.frames = 0; quality.since = now; }
  quality.last = now;
  quality.frames++;
  if (now - quality.since < 1500) return;
  const ms = (now - quality.since) / quality.frames;
  quality.frames = 0;
  quality.since = now;
  if (ms > 25 && quality.dpr > 1) {
    quality.dpr = Math.max(1, quality.dpr - 0.25);
    r.setPixelRatio(quality.dpr);
    r.setSize(canvas.clientWidth, canvas.clientHeight, false);
  }
}
const tmpEuler = new THREE.Euler();
const qFace = new THREE.Quaternion();
const qView = new THREE.Quaternion();
const qEnv = new THREE.Quaternion();
const qSweep = new THREE.Quaternion();
const qIdentity = new THREE.Quaternion();
const autoSpin = { start: -1, angle: 0, next: 0 };
requestAnimationFrame(frame);

function onIntroDone() {
  controls.state.enabled = true;
  autoSpin.next = performance.now() + 5500; // la primera vuelta, cuando ya se ha encogido y asentado
  hint.classList.add("show");
  setTimeout(() => { if (!document.body.classList.contains("exploring")) hint.classList.remove("show"); }, 5000);
}

/* Coloca cada etiqueta sobre su escaparate. Se ocultan si el escaparate
   no está de frente o si quedarían encima del logo. */
const fwd = new THREE.Vector3();
const toA = new THREE.Vector3();
const corner = new THREE.Vector3();
function logoRect(cam, w, h) {
  const box = three.logo.userData.box;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
      .applyMatrix4(three.logo.matrixWorld).project(cam);
    const x = (corner.x * 0.5 + 0.5) * w;
    const y = (-corner.y * 0.5 + 0.5) * h;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x0: x0 - 16, y0: y0 - 16, x1: x1 + 16, y1: y1 + 16 };
}
function placeLabels() {
  if (!labels.length) return;
  const cam = three.camera;
  cam.getWorldDirection(fwd);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  three.logo.updateMatrixWorld();
  const lr = logoRect(cam, w, h);
  if (grip.isConnected) {
    // Solo arriba del todo: en cuanto se baja, el dedo sobre el símbolo vuelve a hacer scroll.
    const on = three.logo.visible && heroP < 0.03 && document.body.classList.contains("revealed");
    grip.classList.toggle("show", on);
    if (on) Object.assign(grip.style, {
      left: `${Math.round(lr.x0 + 16)}px`, top: `${Math.round(lr.y0 + 16)}px`,
      width: `${Math.round(lr.x1 - lr.x0 - 32)}px`, height: `${Math.round(lr.y1 - lr.y0 - 32)}px`,
    });
  }
  for (const L2 of labels) {
    toA.subVectors(L2.anchor, cam.position).normalize();
    const facing = toA.dot(fwd);
    tmp.copy(L2.anchor).project(cam);
    const x = (tmp.x * 0.5 + 0.5) * w;
    const y = (-tmp.y * 0.5 + 0.5) * h;
    const elW = L2.el.offsetWidth || 160;
    const elH = L2.el.offsetHeight || 32;
    const overLogo = x + elW / 2 > lr.x0 && x - elW / 2 < lr.x1 && y > lr.y0 && y - elH < lr.y1;
    const visible = facing > 0.7 && x > elW / 2 + 8 && x < w - elW / 2 - 8 && y > 80 && y < h - 40 && !overLogo && heroP < 0.45;
    L2.el.classList.toggle("show", visible && document.body.classList.contains("revealed"));
    L2.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
    L2.el.tabIndex = visible ? 0 : -1;
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
    introStart = performance.now();
    document.body.classList.remove("is-loading");
    document.body.classList.add("revealed");
    setupReveal();
    requestAnimationFrame(() => document.body.classList.add("entered"));
    if (!three) controls.state.enabled = true;
  },
});
