/* =========================================================
   El vestidor circular. El símbolo flota en el centro de la
   sala y gira; la sala gira a su alrededor y se puede mirar
   en todas direcciones, con suelo y techo trabajados.

   12 módulos de pared (30° cada uno), separados por pilastras
   acanaladas con una línea de luz empotrada:
   - módulo 0: el ESCAPARATE de la Obra 001. El conjunto cuelga
     como se lleva puesto de una barra de luz, delante de un
     panel retroiluminado (el halo), entre dos columnas de luz,
     con foco y sombras reales, peana de mármol y placa grabada;
   - resto de pares: escaparates de las siguientes obras o,
     mientras no las hay, la biblioteca de telas;
   - impares: armarios de laca acanalada con tiradores cromados.
   Suelo de mármol negro con acero; techo artesonado con anillo
   de luz y lámpara central de anillos.

   Entrada inmersiva: todas las luces empiezan apagadas y se
   encienden en secuencia, con un parpadeo seco (ver setIntro).

   Medidas en metros. Suelo en y = 0, centro en el origen.
   ========================================================= */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createGarment, HOOK_CENTER } from "./garment.js";
import { marbleTexture, flutedNormal, smokedOakTexture, plaqueTexture, haloTexture } from "./textures.js";

export const ROOM = { radius: 5, height: 4.2, bays: 12 };

const BAY = (Math.PI * 2) / ROOM.bays;
const APOTHEM = ROOM.radius * Math.cos(BAY / 2);
const BAY_W = 2 * ROOM.radius * Math.sin(BAY / 2);
const PILASTER = 0.22; // ancho de cada pilastra entre módulos

const SHOWCASE = { w: 1.85, h: 3.2, y0: 0.32, depth: 0.95 };
const NICHE = { w: 1.6, h: 2.9, y0: 0.32, depth: 0.66 };

/** El ángulo (en radianes) en el que está cada módulo de pared. */
export const bayAngle = (i) => i * BAY;

export function createRoom({ obras, pieces }) {
  const group = new THREE.Group();
  const reflective = [];
  const power = []; // luces que se encienden en la entrada: { delay, set(v) }
  const H = ROOM.height;

  /* ---------- Materiales ---------- */
  const fluteN = flutedNormal(14);
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.08 });
  const fluted = lacquer.clone();
  fluted.normalMap = fluteN;
  fluted.normalScale = new THREE.Vector2(0.9, 0.9);
  const matte = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.92 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe8eaed, roughness: 0.08, metalness: 1 });
  const marble = marbleTexture();
  const marbleMat = new THREE.MeshPhysicalMaterial({ map: marble, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04 });
  const oak = new THREE.MeshStandardMaterial({ map: smokedOakTexture(), normalMap: fluteN, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.62 });
  reflective.push(lacquer, fluted, chrome, marbleMat);

  // Cada luz visible (tira, anillo, foco empotrado) tiene su propio material
  // para poder encenderse por separado en la entrada.
  const glow = (level, delay) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(level, level, level) });
    power.push({ delay, set: (v) => m.color.setScalar(level * v) });
    return m;
  };
  const lamp = (light, delay) => {
    const base = light.intensity;
    power.push({ delay, set: (v) => { light.intensity = base * v; } });
    return light;
  };

  /* ---------- Suelo: mármol negro con incrustaciones de acero ---------- */
  const floorTex = marble.clone();
  floorTex.repeat.set(3.5, 3.5);
  floorTex.needsUpdate = true;
  const floorMat = marbleMat.clone();
  floorMat.map = floorTex;
  reflective.push(floorMat);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(ROOM.radius + 0.2, 128), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);
  const flat = (geo, mat, y = 0.002) => {
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    group.add(m);
    return m;
  };
  flat(new THREE.RingGeometry(1.6, 1.635, 180), chrome);
  flat(new THREE.RingGeometry(0.8, 0.815, 140), chrome);
  flat(new THREE.RingGeometry(APOTHEM - 0.3, APOTHEM - 0.285, 180), chrome);
  for (let i = 0; i < ROOM.bays; i++) {
    const a = (i + 0.5) * BAY;
    const len = APOTHEM - 0.3 - 1.635;
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.014, len), chrome);
    strip.rotation.x = -Math.PI / 2;
    strip.rotation.z = -a;
    const mid = 1.635 + len / 2;
    strip.position.set(Math.sin(a) * mid, 0.002, -Math.cos(a) * mid);
    group.add(strip);
  }

  /* ---------- Techo artesonado y lámpara central ---------- */
  const ceiling = new THREE.Mesh(new THREE.RingGeometry(2.45, ROOM.radius + 0.2, 128), matte);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  group.add(ceiling);
  const recessMat = new THREE.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.9, emissive: 0x1d1e21 });
  power.push({ delay: 0.2, set: (v) => recessMat.emissive.setScalar((0x1d / 255) * v) });
  const recess = new THREE.Mesh(new THREE.CircleGeometry(2.45, 128), recessMat);
  recess.rotation.x = Math.PI / 2;
  recess.position.y = H + 0.32;
  group.add(recess);
  const recessWall = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.32, 128, 1, true), new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.9, side: THREE.BackSide }));
  recessWall.position.y = H + 0.16;
  group.add(recessWall);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.02, 10, 220), glow(1, 0.15));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = H + 0.03;
  group.add(ring);
  // Lámpara: anillos de luz y de acero concéntricos, escalonados hacia abajo.
  const chandelier = [[1.6, 0.28, 0.6, 0.008], [1.35, 0.16, -1, 0.011], [0.95, 0.04, 1, 0.013], [0.7, -0.08, -1, 0.011], [0.42, -0.2, 0.75, 0.009], [0.2, -0.3, 1, 0.008]];
  chandelier.forEach(([r, dy, level, tube], k) => {
    const mat = level < 0 ? chrome : glow(level, 1.95 + k * 0.08);
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 180), mat);
    m.rotation.x = Math.PI / 2;
    m.position.y = H + dy;
    group.add(m);
  });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.62, 6), chrome);
    rod.position.set(Math.sin(a) * 0.7, H + 0.02, Math.cos(a) * 0.7);
    group.add(rod);
  }
  for (let i = 0; i < ROOM.bays; i++) {
    const a = (i + 0.5) * BAY;
    const len = APOTHEM - 2.5;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, len), lacquer);
    const mid = 2.5 + len / 2;
    beam.position.set(Math.sin(a) * mid, H - 0.055, -Math.cos(a) * mid);
    beam.rotation.y = -a;
    group.add(beam);
    const c = i * BAY;
    const dl = new THREE.Mesh(new THREE.CircleGeometry(0.05, 32), glow(0.75, 1.75 + i * 0.02));
    dl.rotation.x = Math.PI / 2;
    dl.position.set(Math.sin(c) * 3.85, H - 0.002, -Math.cos(c) * 3.85);
    group.add(dl);
  }
  // Haz de luz desde el centro del techo: un charco de luz en el mármol bajo el símbolo.
  const pool = lamp(new THREE.SpotLight(0xffffff, 34, 8, 0.5, 0.9, 1.4), 2.05);
  pool.position.set(0, H + 0.1, 0);
  pool.target.position.set(0, 0, 0);
  group.add(pool, pool.target);

  /* ---------- Pilastras, cornisa y zócalo ---------- */
  for (let i = 0; i < ROOM.bays; i++) {
    const bay = makeBay(group, i);
    const z = -APOTHEM;
    const d = 0.35 + ((i + 12) % 12) * 0.075; // las luces se encienden recorriendo la sala
    box(bay, matte, BAY_W + 0.02, 0.34, 0.14, 0, H - 0.17, z + 0.07);                     // cornisa
    const cove = new THREE.Mesh(new THREE.BoxGeometry(BAY_W - 0.06, 0.008, 0.008), glow(0.66, d));
    cove.position.set(0, H - 0.345, z + 0.135);
    bay.add(cove);
    box(bay, matte, BAY_W + 0.02, 0.14, 0.12, 0, 0.07, z + 0.06);                          // zócalo
    box(bay, chrome, BAY_W, 0.006, 0.006, 0, 0.142, z + 0.12);
    // Pilastra acanalada en la junta, con capitel y basa de acero y luz empotrada.
    const pil = box(bay, fluted, PILASTER, H - 0.48, 0.16, BAY_W / 2, (H - 0.48) / 2 + 0.14, z + 0.08);
    pil.material = fluted.clone();
    pil.material.normalMap = fluteN.clone();
    pil.material.normalMap.repeat.set(1.2, 1);
    pil.material.normalMap.needsUpdate = true;
    box(bay, chrome, PILASTER + 0.03, 0.025, 0.19, BAY_W / 2, H - 0.355, z + 0.09);
    box(bay, chrome, PILASTER + 0.03, 0.025, 0.19, BAY_W / 2, 0.155, z + 0.09);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.008, H - 0.62, 0.008), glow(0.55, d));
    seam.position.set(BAY_W / 2, (H - 0.62) / 2 + 0.2, z + 0.165);
    bay.add(seam);
  }

  /* ---------- Módulos ---------- */
  const displays = [];
  const reg = (delay, set) => power.push({ delay, set });
  const M = { lacquer, fluted, matte, chrome, marbleMat, oak, glow, lamp, reg };
  const evenBays = [0, 2, 10, 4, 8, 6]; // el escaparate principal y luego a los lados
  const piecesByObra = new Map();
  for (const p of pieces) {
    if (!piecesByObra.has(p.obra.id)) piecesByObra.set(p.obra.id, []);
    piecesByObra.get(p.obra.id).push(p);
  }
  const used = new Map();
  obras.forEach((o, k) => { if (k < evenBays.length) used.set(evenBays[k], o); });

  for (let i = 0; i < ROOM.bays; i++) {
    const bay = makeBay(group, i);
    if (i % 2 === 1) {
      buildWardrobe(bay, M, i);
    } else if (used.has(i)) {
      const obra = used.get(i);
      const d = buildShowcase(bay, M, obra, piecesByObra.get(obra.id) || [], i === 0);
      displays.push({ ...d, obra, angle: bayAngle(i), bay });
    } else {
      buildFabricLibrary(bay, M, i);
    }
  }

  /* ---------- Luz general ---------- */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x0a0a0a, 0.35);
  group.add(hemi);
  power.push({ delay: 1.5, ramp: 0.7, set: (v) => { hemi.intensity = 0.35 * v; } });

  /* Entrada: t = segundos desde que se abre la sala. Devuelve true al terminar. */
  const introEnd = Math.max(...power.map((p) => p.delay + (p.ramp || 0))) + 0.2;
  function setIntro(t) {
    for (const p of power) {
      let v;
      if (p.ramp) v = Math.min(1, Math.max(0, (t - p.delay) / p.ramp));
      else if (t < p.delay) v = 0;
      else if (t < p.delay + 0.05) v = 1;      // se enciende…
      else if (t < p.delay + 0.11) v = 0.12;   // …parpadea…
      else v = 1;                              // …y se queda.
      p.set(v);
    }
    return t >= introEnd;
  }

  function update(t) {
    for (const d of displays) d.garments.forEach((g, k) => { g.userData.swing.rotation.z = Math.sin(t * 0.6 + k * 1.9) * 0.005; });
  }

  return { group, displays, reflective, update, setIntro, introEnd };
}

/* Grupo de un módulo: su pared local está en z = -APOTHEM, mirando al centro. */
function makeBay(group, i) {
  const bay = new THREE.Group();
  bay.rotation.y = -bayAngle(i);
  group.add(bay);
  return bay;
}

/* Hueco enmarcado en la pared, con interior trabajado. */
function buildNicheShell(bay, m, size, delay, { coves = true } = {}) {
  const zWall = -APOTHEM;
  const zBack = zWall - size.depth;
  const inner = BAY_W - PILASTER;
  const side = (inner - size.w) / 2;
  const top = size.y0 + size.h;
  const H = ROOM.height;

  box(bay, m.lacquer, side, H - 0.48, 0.08, -(size.w / 2 + side / 2), (H - 0.48) / 2 + 0.14, zWall);
  box(bay, m.lacquer, side, H - 0.48, 0.08, size.w / 2 + side / 2, (H - 0.48) / 2 + 0.14, zWall);
  box(bay, m.lacquer, size.w, H - 0.34 - top, 0.08, 0, top + (H - 0.34 - top) / 2, zWall);
  box(bay, m.lacquer, size.w, size.y0 - 0.14, 0.08, 0, 0.14 + (size.y0 - 0.14) / 2, zWall);

  const f = 0.014;
  box(bay, m.chrome, size.w + f * 2, f, f, 0, top + f / 2, zWall + 0.045);
  box(bay, m.chrome, size.w + f * 2, f, f, 0, size.y0 - f / 2, zWall + 0.045);
  box(bay, m.chrome, f, size.h, f, -size.w / 2 - f / 2, size.y0 + size.h / 2, zWall + 0.045);
  box(bay, m.chrome, f, size.h, f, size.w / 2 + f / 2, size.y0 + size.h / 2, zWall + 0.045);

  const back = box(bay, m.oak, size.w, size.h, 0.02, 0, size.y0 + size.h / 2, zBack);
  back.receiveShadow = true;
  box(bay, m.matte, 0.02, size.h, size.depth, -size.w / 2, size.y0 + size.h / 2, zWall - size.depth / 2);
  box(bay, m.matte, 0.02, size.h, size.depth, size.w / 2, size.y0 + size.h / 2, zWall - size.depth / 2);
  box(bay, m.matte, size.w, 0.02, size.depth, 0, top, zWall - size.depth / 2);

  const plinth = box(bay, m.marbleMat, size.w, 0.06, size.depth, 0, size.y0 + 0.03, zWall - size.depth / 2);
  plinth.receiveShadow = true;
  box(bay, m.chrome, size.w, 0.006, 0.006, 0, size.y0 + 0.06, zWall - 0.01);

  for (const s of coves ? [-1, 1] : []) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.006, size.h - 0.12, 0.006), m.glow(0.62, delay));
    strip.position.set(s * (size.w / 2 - 0.02), size.y0 + size.h / 2, zWall - 0.05);
    bay.add(strip);
  }
  const dl = new THREE.Mesh(new THREE.CircleGeometry(0.045, 32), m.glow(1, delay));
  dl.rotation.x = Math.PI / 2;
  dl.position.set(0, top - 0.011, zWall - size.depth * 0.35);
  bay.add(dl);
  return { zWall, zBack, top };
}

/* Escaparate de una obra: el conjunto colgado como se lleva puesto,
   de una barra de luz, delante de un halo retroiluminado. */
function buildShowcase(bay, m, obra, pieces, main) {
  const size = main ? SHOWCASE : NICHE;
  const delay = main ? 1.3 : 1.6;
  // El escaparate principal no lleva tiras en los cantos: ya tiene halo y columnas de luz.
  const { zWall, zBack, top } = buildNicheShell(bay, m, size, delay, { coves: !main });
  const garments = [];
  const CENTER_Y = 1.72;

  // Halo: panel retroiluminado detrás del conjunto (luz propia, nítida).
  const haloMat = new THREE.MeshBasicMaterial({ map: haloTexture(), color: 0xffffff });
  const haloBase = main ? 0.9 : 0.6;
  haloMat.color.setScalar(haloBase);
  m.reg(delay + 0.1, (v) => haloMat.color.setScalar(haloBase * v));
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(size.w - 0.06, size.h - 0.1), haloMat);
  halo.position.set(0, size.y0 + size.h / 2 + 0.05, zBack + 0.012);
  bay.add(halo);

  // Barra de luz: tubo de acero con una línea luminosa debajo (de aquí cuelga todo).
  const rodLen = 0.42;
  const rodZ = zBack + rodLen - 0.05;
  const columns = pieces.length > 2 ? Math.ceil(pieces.length / 2) : 1;
  const stack = pieces.slice(0, columns > 1 ? columns : pieces.length);
  const total = stack.reduce((sum, p) => sum + p.height + 0.13, 0);
  let rodY = CENTER_Y + total / 2;
  const railY = rodY;
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, size.w - 0.1, 24), m.chrome);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, railY + 0.05, zBack + rodLen - 0.02);
  bay.add(rail);
  const railGlow = new THREE.Mesh(new THREE.BoxGeometry(size.w - 0.14, 0.006, 0.006), m.glow(1, delay + 0.05));
  railGlow.position.set(0, railY + 0.034, zBack + rodLen - 0.02);
  bay.add(railGlow);

  pieces.forEach((piece, k) => {
    const col = columns > 1 ? (k % columns) - (columns - 1) / 2 : 0;
    if (columns > 1 && k === columns) rodY = CENTER_Y + total / 2 - 1.05;
    // Soporte que baja de la barra (o sale del fondo, para la pieza de abajo).
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, rodLen, 16), m.chrome);
    rod.rotation.x = Math.PI / 2;
    rod.position.set(col * 0.6, rodY, zBack + rodLen / 2);
    bay.add(rod);
    const g = createGarment(piece, m.chrome);
    g.position.set(col * 0.6 - HOOK_CENTER.x, rodY - HOOK_CENTER.y, rodZ);
    bay.add(g);
    garments.push(g);
    if (columns === 1) rodY = rodY - HOOK_CENTER.y - 0.03 - piece.height;
  });

  // Foco principal con sombras reales y dos luces laterales rasantes.
  const target = new THREE.Object3D();
  target.position.set(0, CENTER_Y, rodZ);
  bay.add(target);
  const spot = m.lamp(new THREE.SpotLight(0xffffff, main ? 16 : 10, 6, 0.5, 0.55, 1.6), delay + 0.15);
  spot.position.set(0, top - 0.03, zWall + 0.45);
  spot.target = target;
  if (main) {
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0004;
    spot.shadow.normalBias = 0.02;
    spot.shadow.camera.near = 0.2;
    spot.shadow.camera.far = 5;
  }
  bay.add(spot);
  if (main) {
    for (const s of [-1, 1]) {
      const rim = m.lamp(new THREE.SpotLight(0xffffff, 5, 3, 0.45, 0.8, 1.6), delay + 0.25);
      rim.position.set(s * (size.w / 2 - 0.1), CENTER_Y + 0.2, zWall - 0.1);
      rim.target = target;
      bay.add(rim);
    }
    // Columnas de luz a cada lado del escaparate.
    for (const s of [-1, 1]) {
      const x = s * (size.w / 2 + 0.11);
      box(bay, m.chrome, 0.05, size.h + 0.1, 0.05, x, size.y0 + size.h / 2, zWall + 0.06);
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.01, size.h, 0.01), m.glow(0.9, delay - 0.08));
      col.position.set(x, size.y0 + size.h / 2, zWall + 0.09);
      bay.add(col);
    }
  }

  // Placa grabada en la peana.
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.1),
    new THREE.MeshStandardMaterial({ map: plaqueTexture([`OBRA ${obra.numero} · ${obra.nombre.toUpperCase()}`, `${obra.edicion} · TALLA ${obra.talla}`]), metalness: 0.9, roughness: 0.35 }),
  );
  plaque.position.set(0, size.y0 - 0.1, zWall + 0.05);
  bay.add(plaque);

  bay.updateMatrixWorld(true);
  const toWorld = (v) => bay.localToWorld(v);
  return {
    garments,
    spot,
    focus: toWorld(new THREE.Vector3(0, CENTER_Y, rodZ)),
  };
}

/* Biblioteca de telas: baldas con telas dobladas, a la espera de nuevas obras. */
const FOLD_COLORS = [0x4c0a18, 0xe9e3d7, 0x141414, 0x8e1426, 0x5f5d5b, 0xb9bcc2, 0x2a2420];
const foldMats = new Map();
const foldMat = (c) => {
  if (!foldMats.has(c)) foldMats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.88 }));
  return foldMats.get(c);
};
const foldGeo = new RoundedBoxGeometry(0.36, 0.046, 0.27, 3, 0.018);

function buildFabricLibrary(bay, m, seed) {
  const size = NICHE;
  const delay = 1.6 + seed * 0.02;
  const { zWall, zBack, top } = buildNicheShell(bay, m, size, delay);
  [1.0, 1.7, 2.4].forEach((sy, si) => {
    box(bay, m.oak, size.w - 0.04, 0.03, size.depth - 0.06, 0, sy, zWall - size.depth / 2 - 0.02);
    box(bay, m.chrome, size.w - 0.04, 0.006, 0.006, 0, sy + 0.012, zWall - 0.05);
    // Línea de luz bajo cada balda: las telas brillan desde arriba.
    const under = new THREE.Mesh(new THREE.BoxGeometry(size.w - 0.12, 0.004, 0.004), m.glow(0.5, delay + 0.05));
    under.position.set(0, sy - 0.018, zWall - 0.08);
    bay.add(under);
    for (const sx of [-0.36, 0.36]) {
      const n = 3 + ((seed + si + (sx > 0 ? 1 : 0)) % 3);
      for (let k = 0; k < n; k++) {
        const c = FOLD_COLORS[(seed * 3 + si * 2 + k + (sx > 0 ? 4 : 0)) % FOLD_COLORS.length];
        const f = new THREE.Mesh(foldGeo, foldMat(c));
        f.position.set(sx + Math.sin(k * 2.1 + seed) * 0.01, sy + 0.04 + k * 0.048, zWall - size.depth / 2 - 0.02);
        f.rotation.y = Math.sin(k * 1.3 + seed) * 0.03;
        bay.add(f);
      }
    }
  });
  const target = new THREE.Object3D();
  target.position.set(0, 1.6, zBack + 0.3);
  const spot = m.lamp(new THREE.SpotLight(0xffffff, 9, 5, 0.6, 0.7, 1.6), delay + 0.1);
  spot.position.set(0, top - 0.03, zWall + 0.3);
  spot.target = target;
  bay.add(spot, target);
}

/* Armario cerrado: dos puertas de laca acanalada, tiradores largos y haz de luz. */
function buildWardrobe(bay, m, i) {
  const z = -APOTHEM;
  const H = ROOM.height;
  const doorH = H - 0.52;
  const inner = BAY_W - PILASTER;
  const doorW = inner / 2 - 0.01;
  for (const s of [-1, 1]) {
    const door = box(bay, m.fluted, doorW, doorH, 0.06, s * (doorW / 2 + 0.005), 0.15 + doorH / 2, z);
    door.material = m.fluted.clone();
    door.material.normalMap = m.fluted.normalMap.clone();
    door.material.normalMap.repeat.set(doorW * 9, 1);
    door.material.normalMap.needsUpdate = true;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1.3, 16), m.chrome);
    handle.position.set(s * 0.05, 1.45, z + 0.08);
    bay.add(handle);
    for (const dy of [-0.62, 0.62]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.045, 10), m.chrome);
      post.rotation.x = Math.PI / 2;
      post.position.set(s * 0.05, 1.45 + dy, z + 0.057);
      bay.add(post);
    }
  }
  const wash = m.lamp(new THREE.SpotLight(0xffffff, 42, 6, 0.6, 1, 1.6), 1.7 + i * 0.03);
  wash.position.set(0, H - 0.35, z + 0.5);
  const target = new THREE.Object3D();
  target.position.set(0, 0.6, z);
  wash.target = target;
  bay.add(wash, target);
}

function box(parent, mat, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
