/* =========================================================
   Chart Noir — web oficial
   Punto de entrada: monta el vestidor 3D, la pantalla de carga,
   la cuenta atrás, la obra y las animaciones de scroll.
   ========================================================= */
import "./styles.css";
import * as THREE from "three";
import { DROP_DATE, OBRAS, REDES } from "./config.js";
import { createStage } from "./scene/stage.js";
import { createLogo, LOGO_WIDTH } from "./scene/logo.js";
import { createCloset, ROOM } from "./scene/closet.js";
import { createControls } from "./interaction.js";
import { runIntro } from "./intro.js";
import { startCountdown } from "./countdown.js";
import { renderObra, createPieceDialog, renderSocial, setupReveal } from "./content.js";

document.documentElement.classList.add("js");
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

const canvas = document.getElementById("scene");
const hero = document.getElementById("inicio");
const heroCopy = document.getElementById("hero-copy");
const heroCaption = document.getElementById("hero-caption");
const hint = document.getElementById("hint");
const obraSection = document.getElementById("obra");
const set = document.getElementById("set");
const obraHelp = document.getElementById("obra-help");

if (window.matchMedia("(pointer: coarse)").matches) hint.textContent = "Desliza el logo para girarlo";

// ---------- Contenido ----------
const obra = OBRAS[0];
const dialog = createPieceDialog(REDES);
renderObra(obra, { onOpen: dialog.open });
renderSocial(REDES);
const dropDay = DROP_DATE.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", ".");
document.getElementById("drop-label").textContent = `Primer drop · ${dropDay}`;
startCountdown(document.getElementById("count"), DROP_DATE, { animated: !reduce });
startCountdown(document.getElementById("mini"), DROP_DATE);

// ---------- Escena 3D ----------
const manager = new THREE.LoadingManager();
let loadedFraction = 0;
manager.onProgress = (_, done, total) => { loadedFraction = done / total; };

let three = null;
let sceneReady = Promise.resolve();
try {
  const stage = createStage(canvas);
  const logo = createLogo(stage.envMap);
  logo.position.set(0, ROOM.logoY, 0);
  stage.scene.add(logo);
  three = { ...stage, logo, closet: null };

  sceneReady = loadPieces(manager).then(({ pieces }) => {
    const closet = createCloset({ pieces, envMap: stage.envMap });
    stage.scene.add(closet.group);
    three.closet = closet;
    three.garmentTarget = closet.garmentSpots.slice(0, obra.piezas.length)
      .reduce((acc, v) => acc.add(v), new THREE.Vector3())
      .divideScalar(Math.max(1, obra.piezas.length));
    // Prepara shaders y sube todo a la tarjeta gráfica con el lienzo aún oculto.
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

// Las fotos de cada pieza, como texturas para colgarlas en el vestidor.
function loadPieces(mgr) {
  const loader = new THREE.TextureLoader(mgr);
  const load = (url) => new Promise((res) => loader.load(url, res, undefined, () => res(null)));
  const jobs = [];
  for (const o of OBRAS) {
    for (const p of o.piezas) {
      jobs.push(load(p.imagen).then((texture) => {
        if (!texture) return null;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        const width = (p.caja.w / 100) * (o.anchoReal || 0.8);
        const height = width * (texture.image.height / texture.image.width);
        return { texture, width, height, hang: p.percha === "pinza" ? 0.03 : 0.13 };
      }));
    }
  }
  return Promise.all(jobs).then((pieces) => ({ pieces: pieces.filter(Boolean) }));
}

const controls = createControls(three ? canvas : hero, {
  onFirstDrag: () => hint.classList.remove("show"),
});

// ---------- Scroll ----------
let heroP = 0; // 0 → 1 a lo largo de la portada
function onScroll() {
  const vh = window.innerHeight;
  const hr = hero.getBoundingClientRect();
  heroP = clamp01(-hr.top / (hr.height - vh));
  controls.visible = hr.bottom > 0;

  heroCopy.style.opacity = String(1 - smooth(0.02, 0.16, heroP));
  heroCaption.classList.toggle("show", heroP > 0.82);
  if (heroP > 0.05) hint.classList.remove("show");
  document.body.classList.toggle("scrolled", hr.bottom < vh * 0.6);

  // El conjunto se separa mientras la sección está fija en pantalla.
  const or = obraSection.getBoundingClientRect();
  const op = clamp01(-or.top / (or.height - vh));
  const split = reduce ? (op > 0.2 ? 1 : 0) : smooth(0.12, 0.62, op);
  set.style.setProperty("--p", split.toFixed(3));
  obraHelp.style.opacity = String(1 - smooth(0.5, 0.7, op));
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

// ---------- Recorrido de cámara ----------
// Tres puntos: frente al logo → junto al logo mirando el pasillo → frente a la obra.
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function startDistance() {
  const cam = three.camera;
  cam.fov = cam.aspect < 0.8 ? 44 : 34; // en móvil vertical, algo más de angular
  cam.updateProjectionMatrix();
  const v = THREE.MathUtils.degToRad(cam.fov);
  const h = 2 * Math.atan(Math.tan(v / 2) * cam.aspect);
  const byWidth = (LOGO_WIDTH * 1.32) / 2 / Math.tan(h / 2);
  const byHeight = (LOGO_WIDTH * 0.56 * 2.4) / 2 / Math.tan(v / 2);
  return Math.max(byWidth, byHeight);
}

// Frente a la obra: a la distancia justa para que entren todas sus piezas
// (en móvil vertical la cámara se aleja más).
const endDir = new THREE.Vector3(0.77, 0, 0.64);
function endPosition(g) {
  const cam = three.camera;
  const v = THREE.MathUtils.degToRad(cam.fov);
  const h = 2 * Math.atan(Math.tan(v / 2) * cam.aspect);
  const span = 0.75 + obra.piezas.length * 0.55; // ancho que ocupan las piezas colgadas
  const dist = Math.max(3.9, span / 2 / Math.tan(h / 2));
  return new THREE.Vector3(g.x, 1.52, g.z).addScaledVector(endDir, dist);
}

function cameraPath(p, out, look) {
  const d0 = startDistance();
  const g = three.garmentTarget || new THREE.Vector3(-2.3, 1.4, -3.5);
  // La obra cuelga junto a la entrada: la cámara gira hacia ella sin atravesar nada.
  const K = [
    { pos: tmpA.set(0, 1.62, d0), look: new THREE.Vector3(0, 1.48, 0) },
    { pos: new THREE.Vector3(0.35, 1.62, Math.max(4.6, d0 * 0.8)), look: new THREE.Vector3(-1.1, 1.5, 0.4) },
    // En horizontal, la obra queda a la derecha y deja sitio al texto de la izquierda.
    { pos: endPosition(g), look: three.camera.aspect > 1 ? tmpB.set(g.x - 0.3, g.y, g.z + 0.35) : tmpB.copy(g) },
  ];
  const t = smooth(0, 1, p);
  if (t < 0.5) {
    const k = smooth(0, 1, t / 0.5);
    out.lerpVectors(K[0].pos, K[1].pos, k);
    look.lerpVectors(K[0].look, K[1].look, k);
  } else {
    const k = smooth(0, 1, (t - 0.5) / 0.5);
    out.lerpVectors(K[1].pos, K[2].pos, k);
    look.lerpVectors(K[1].look, K[2].look, k);
  }
}

// ---------- Animación ----------
let hitAt = -1;
let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  if (!three || hitAt < 0 || !controls.visible) { last = now; return; }
  const { renderer, scene, camera, logo, closet } = three;

  const f = Math.min(4, (now - last) / (1000 / 60)); // fotogramas de 60 Hz transcurridos
  last = now;
  const t = now / 1000;

  // Entrada: el logo llega grande y girado y frena en seco, con sacudida.
  let k = 1;
  let shake = 0;
  if (!reduce) {
    const ms = now - hitAt;
    k = easeOutExpo(Math.min(1, ms / 900));
    shake = ms < 380 ? (1 - ms / 380) * 0.08 : 0;
  }

  const c = controls;
  if (!c.dragging) {
    c.rotY += c.velY * f;
    c.rotX += c.velX * f;
    c.velY *= Math.pow(0.94, f);
    c.velX *= Math.pow(0.88, f);
    if (Math.abs(c.velY) < 0.0015) {
      const front = Math.round(c.rotY / (Math.PI * 2)) * Math.PI * 2;
      c.rotY += (front - c.rotY) * (1 - Math.pow(0.97, f));
    }
    c.rotX += (c.py * -0.08 - c.rotX) * (1 - Math.pow(0.95, f));
  }

  // Al bajar, el logo gira un poco hacia la obra, como si la presentara.
  const door = smooth(0.15, 0.7, heroP) * -0.55;
  const breathe = reduce ? 0 : Math.sin(t * 0.5) * 0.04;
  logo.rotation.y = c.rotY + door + (c.dragging ? 0 : c.px * 0.16) + breathe + (1 - k) * -0.8;
  logo.rotation.x = c.rotX + (1 - k) * 0.25;
  logo.scale.setScalar((LOGO_WIDTH / 10) * (1 + (1 - k) * 0.5));
  logo.position.y = ROOM.logoY + (reduce ? 0 : Math.sin(t * 0.9) * 0.025);

  cameraPath(heroP, camPos, camLook);
  // Paralaje suave con el ratón: el vestidor se mira, no está pegado.
  const par = reduce ? 0 : 1;
  camPos.x += c.px * 0.22 * par;
  camPos.y += c.py * 0.1 * par;
  camPos.x += (Math.random() - 0.5) * shake;
  camPos.y += (Math.random() - 0.5) * shake;
  camera.position.copy(camPos);
  camera.lookAt(camLook);

  closet?.update(t);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

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
      controls.enabled = true;
      if (three) {
        hint.classList.add("show");
        setTimeout(() => hint.classList.remove("show"), 4500);
      }
    }, reduce ? 0 : 700);
  },
});
