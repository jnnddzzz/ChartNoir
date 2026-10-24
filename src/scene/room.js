/* =========================================================
   El vestidor circular. El logo flota en el centro y la sala
   gira a su alrededor; se puede mirar en todas direcciones,
   con suelo y techo trabajados.

   12 módulos de pared (30° cada uno):
   - módulo 0: el ESCAPARATE de la Obra 001, con el conjunto
     completo (chaleco arriba, pantalón debajo), foco con
     sombras reales, fondo de roble acanalado, tiras de luz
     laterales, peana de mármol y placa grabada;
   - resto de pares: escaparates de las siguientes obras o,
     mientras no las hay, la biblioteca de telas (baldas con
     telas dobladas);
   - impares: armarios de laca acanalada con tiradores cromados.
   Suelo de mármol negro con incrustaciones de acero; techo
   artesonado con anillo de luz indirecta y focos.

   Medidas en metros. Suelo en y = 0, centro en el origen.
   ========================================================= */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createGarment, HOOK_CENTER } from "./garment.js";
import { marbleTexture, flutedNormal, smokedOakTexture, plaqueTexture } from "./textures.js";

export const ROOM = { radius: 4.4, height: 3.6, bays: 12 };

const BAY = (Math.PI * 2) / ROOM.bays;
const APOTHEM = ROOM.radius * Math.cos(BAY / 2);
const BAY_W = 2 * ROOM.radius * Math.sin(BAY / 2);

const SHOWCASE = { w: 1.6, h: 2.8, y0: 0.3, depth: 0.82 };
const NICHE = { w: 1.45, h: 2.55, y0: 0.3, depth: 0.62 };

/** El ángulo (en radianes) en el que está cada módulo de pared. */
export const bayAngle = (i) => i * BAY;

export function createRoom({ obras, pieces }) {
  const group = new THREE.Group();
  const reflective = [];

  /* ---------- Materiales ---------- */
  const fluteN = flutedNormal(14);
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.08 });
  const fluted = lacquer.clone();
  fluted.normalMap = fluteN;
  fluted.normalScale = new THREE.Vector2(0.9, 0.9);
  const matte = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.92 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe8eaed, roughness: 0.08, metalness: 1 });
  const brushed = new THREE.MeshStandardMaterial({ color: 0xbfc2c7, roughness: 0.32, metalness: 1 });
  const led = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ledSoft = new THREE.MeshBasicMaterial({ color: 0xa9abaf });
  const marble = marbleTexture();
  const marbleMat = new THREE.MeshPhysicalMaterial({ map: marble, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04 });
  const oakTex = smokedOakTexture();
  const oak = new THREE.MeshStandardMaterial({ map: oakTex, normalMap: fluteN, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.62 });
  reflective.push(lacquer, fluted, chrome, brushed, marbleMat);

  /* ---------- Suelo: mármol negro con incrustaciones de acero ---------- */
  const floorTex = marble.clone();
  floorTex.repeat.set(3, 3);
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
  flat(new THREE.RingGeometry(1.32, 1.35, 160), chrome);           // aro bajo el logo
  flat(new THREE.RingGeometry(0.62, 0.635, 120), chrome);
  flat(new THREE.RingGeometry(APOTHEM - 0.16, APOTHEM - 0.145, 160), chrome); // aro junto a la pared
  for (let i = 0; i < ROOM.bays; i++) {
    // Líneas radiales de acero hacia cada junta de la pared.
    const a = (i + 0.5) * BAY;
    const len = APOTHEM - 0.16 - 1.35;
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.012, len), chrome);
    strip.rotation.x = -Math.PI / 2;
    strip.rotation.z = -a;
    const mid = 1.35 + len / 2;
    strip.position.set(Math.sin(a) * mid, 0.002, -Math.cos(a) * mid);
    group.add(strip);
  }

  /* ---------- Techo artesonado con anillo de luz indirecta ---------- */
  const H = ROOM.height;
  const ceiling = new THREE.Mesh(new THREE.RingGeometry(2.05, ROOM.radius + 0.2, 128), matte);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  group.add(ceiling);
  // Hueco central más alto, bañado por la luz del anillo.
  const recess = new THREE.Mesh(new THREE.CircleGeometry(2.05, 128), new THREE.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.9, emissive: 0x1d1e21 }));
  recess.rotation.x = Math.PI / 2;
  recess.position.y = H + 0.22;
  group.add(recess);
  const recessWall = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 0.22, 128, 1, true), new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.9, emissive: 0x0d0d0f, side: THREE.BackSide }));
  recessWall.position.y = H + 0.11;
  group.add(recessWall);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.98, 0.018, 10, 200), led);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = H + 0.03;
  group.add(ring);
  // Lámpara del centro: anillos de luz y de acero concéntricos, a distintas alturas.
  for (const [r, y, mat, tube] of [[1.4, H + 0.2, ledSoft, 0.008], [1.2, H + 0.12, chrome, 0.01], [0.75, H + 0.05, led, 0.012], [0.55, H - 0.04, chrome, 0.01], [0.3, H - 0.12, ledSoft, 0.008]]) {
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 160), mat);
    r2.rotation.x = Math.PI / 2;
    r2.position.y = y;
    group.add(r2);
  }
  // Varillas finas que cuelgan los anillos del techo.
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.34, 6), chrome);
    rod.position.set(Math.sin(a) * 0.55, H + 0.05, Math.cos(a) * 0.55);
    group.add(rod);
  }
  // Haz de luz desde el centro del techo: un charco de luz en el mármol bajo el logo.
  const pool = new THREE.SpotLight(0xffffff, 30, 7, 0.55, 0.9, 1.4);
  pool.position.set(0, H + 0.1, 0);
  pool.target.position.set(0, 0, 0);
  group.add(pool, pool.target);
  for (let i = 0; i < ROOM.bays; i++) {
    // Vigas radiales y un foco empotrado sobre cada módulo.
    const a = (i + 0.5) * BAY;
    const len = APOTHEM - 2.1;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, len), lacquer);
    const mid = 2.1 + len / 2;
    beam.position.set(Math.sin(a) * mid, H - 0.045, -Math.cos(a) * mid);
    beam.rotation.y = -a;
    group.add(beam);
    const c = i * BAY;
    const dl = new THREE.Mesh(new THREE.CircleGeometry(0.045, 32), ledSoft);
    dl.rotation.x = Math.PI / 2;
    dl.position.set(Math.sin(c) * 3.35, H - 0.002, -Math.cos(c) * 3.35);
    group.add(dl);
  }

  /* ---------- Cornisa y zócalo continuos ---------- */
  for (let i = 0; i < ROOM.bays; i++) {
    const bay = makeBay(group, i);
    box(bay, matte, BAY_W + 0.02, 0.28, 0.12, 0, H - 0.14, -APOTHEM + 0.06);              // cornisa
    const cove = new THREE.Mesh(new THREE.BoxGeometry(BAY_W - 0.04, 0.008, 0.008), ledSoft); // línea de luz bajo la cornisa
    cove.position.set(0, H - 0.285, -APOTHEM + 0.115);
    bay.add(cove);
    box(bay, matte, BAY_W + 0.02, 0.12, 0.1, 0, 0.06, -APOTHEM + 0.05);                   // zócalo
    box(bay, chrome, BAY_W, 0.006, 0.006, 0, 0.122, -APOTHEM + 0.1);                       // filo de acero
    // Junta vertical de luz entre módulos.
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.008, H - 0.42, 0.008), ledSoft);
    seam.position.set(BAY_W / 2, (H - 0.42) / 2 + 0.13, -APOTHEM + 0.07);
    bay.add(seam);
  }

  /* ---------- Módulos ---------- */
  const displays = [];
  const M = { lacquer, fluted, matte, chrome, brushed, led, ledSoft, marbleMat, oak };
  const evenBays = [0, 2, 10, 4, 8, 6]; // orden de ocupación: el escaparate principal, luego a los lados
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
      buildWardrobe(bay, M);
    } else if (used.has(i)) {
      const obra = used.get(i);
      const d = buildShowcase(bay, M, obra, piecesByObra.get(obra.id) || [], i === 0);
      displays.push({ ...d, obra, angle: bayAngle(i), bay });
    } else {
      buildFabricLibrary(bay, M, i);
    }
  }

  /* ---------- Luz general ---------- */
  group.add(new THREE.HemisphereLight(0xffffff, 0x0a0a0a, 0.35));

  function update(t) {
    for (const d of displays) d.garments.forEach((g, k) => { g.userData.swing.rotation.z = Math.sin(t * 0.6 + k * 1.9) * 0.005; });
  }

  return { group, displays, reflective, update };
}

/* Grupo de un módulo: su pared local está en z = -APOTHEM, mirando al centro. */
function makeBay(group, i) {
  const bay = new THREE.Group();
  bay.rotation.y = -bayAngle(i);
  group.add(bay);
  return bay;
}

/* Hueco enmarcado en la pared, con interior trabajado. Devuelve medidas útiles. */
function buildNicheShell(bay, m, size, { coves = true } = {}) {
  const zWall = -APOTHEM;
  const zBack = zWall - size.depth;
  const side = (BAY_W - size.w) / 2;
  const top = size.y0 + size.h;
  const H = ROOM.height;

  // Pared alrededor del hueco (laca lisa).
  box(bay, m.lacquer, side, H - 0.4, 0.08, -(size.w / 2 + side / 2), (H - 0.4) / 2 + 0.12, zWall);
  box(bay, m.lacquer, side, H - 0.4, 0.08, size.w / 2 + side / 2, (H - 0.4) / 2 + 0.12, zWall);
  box(bay, m.lacquer, size.w, H - 0.28 - top, 0.08, 0, top + (H - 0.28 - top) / 2, zWall);
  box(bay, m.lacquer, size.w, size.y0 - 0.12, 0.08, 0, 0.12 + (size.y0 - 0.12) / 2, zWall);

  // Marco fino de acero alrededor del hueco.
  const f = 0.012;
  box(bay, m.chrome, size.w + f * 2, f, f, 0, top + f / 2, zWall + 0.045);
  box(bay, m.chrome, size.w + f * 2, f, f, 0, size.y0 - f / 2, zWall + 0.045);
  box(bay, m.chrome, f, size.h, f, -size.w / 2 - f / 2, size.y0 + size.h / 2, zWall + 0.045);
  box(bay, m.chrome, f, size.h, f, size.w / 2 + f / 2, size.y0 + size.h / 2, zWall + 0.045);

  // Interior: fondo de roble ahumado acanalado, laterales y techo negros.
  const back = box(bay, m.oak, size.w, size.h, 0.02, 0, size.y0 + size.h / 2, zBack);
  back.receiveShadow = true;
  box(bay, m.matte, 0.02, size.h, size.depth, -size.w / 2, size.y0 + size.h / 2, zWall - size.depth / 2);
  box(bay, m.matte, 0.02, size.h, size.depth, size.w / 2, size.y0 + size.h / 2, zWall - size.depth / 2);
  box(bay, m.matte, size.w, 0.02, size.depth, 0, top, zWall - size.depth / 2);

  // Peana de mármol con filo de acero.
  const plinth = box(bay, m.marbleMat, size.w, 0.05, size.depth, 0, size.y0 + 0.025, zWall - size.depth / 2);
  plinth.receiveShadow = true;
  box(bay, m.chrome, size.w, 0.006, 0.006, 0, size.y0 + 0.05, zWall - 0.01);

  if (coves) {
    // Tiras de luz verticales escondidas en los cantos interiores.
    for (const s of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.006, size.h - 0.1, 0.006), m.ledSoft);
      strip.position.set(s * (size.w / 2 - 0.02), size.y0 + size.h / 2, zWall - 0.05);
      bay.add(strip);
    }
  }
  // Foco empotrado en el techo del hueco.
  const dl = new THREE.Mesh(new THREE.CircleGeometry(0.04, 32), m.led);
  dl.rotation.x = Math.PI / 2;
  dl.position.set(0, top - 0.011, zWall - size.depth * 0.35);
  bay.add(dl);
  return { zWall, zBack, top };
}

/* Escaparate de una obra: todas sus piezas colgadas como un conjunto. */
function buildShowcase(bay, m, obra, pieces, main) {
  const size = main ? SHOWCASE : NICHE;
  const { zWall, zBack, top } = buildNicheShell(bay, m, size);
  const garments = [];

  // Las piezas cuelgan una encima de otra (como se llevan puestas),
  // cada una de su soporte cromado. Si hay más de dos, se reparten a lo ancho.
  const rodLen = 0.38;
  const rodZ = zBack + rodLen - 0.05;
  const CENTER_Y = 1.62; // el conjunto queda centrado a la altura de los ojos
  const columns = pieces.length > 2 ? Math.ceil(pieces.length / 2) : 1;
  const stack = pieces.slice(0, columns > 1 ? columns : pieces.length);
  const total = stack.reduce((sum, p) => sum + p.height + 0.13, 0);
  let rodY = CENTER_Y + total / 2;
  pieces.forEach((piece, k) => {
    const col = columns > 1 ? (k % columns) - (columns - 1) / 2 : 0;
    if (columns > 1 && k === columns) rodY = CENTER_Y + total / 2 - 1.05;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, rodLen, 16), m.chrome);
    rod.rotation.x = Math.PI / 2;
    rod.position.set(col * 0.55, rodY, zBack + rodLen / 2);
    bay.add(rod);
    const g = createGarment(piece, m.chrome);
    g.position.set(col * 0.55 - HOOK_CENTER.x, rodY - HOOK_CENTER.y, rodZ);
    bay.add(g);
    garments.push(g);
    // La siguiente pieza cuelga justo por debajo de esta (como se lleva puesta).
    if (columns === 1) rodY = rodY - HOOK_CENTER.y - 0.03 - piece.height;
  });

  // Foco principal con sombras reales.
  const target = new THREE.Object3D();
  const centerY = CENTER_Y;
  target.position.set(0, centerY, rodZ);
  const spot = new THREE.SpotLight(0xffffff, main ? 15 : 10, 5, 0.55, 0.55, 1.6);
  spot.position.set(0, top - 0.03, zWall + 0.35);
  spot.target = target;
  if (main) {
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0004;
    spot.shadow.normalBias = 0.02;
    spot.shadow.camera.near = 0.2;
    spot.shadow.camera.far = 4;
  }
  bay.add(spot, target);

  // Placa grabada en la peana.
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.085),
    new THREE.MeshStandardMaterial({ map: plaqueTexture([`OBRA ${obra.numero}`, `${obra.edicion} · TALLA ${obra.talla}`]), metalness: 0.9, roughness: 0.35 }),
  );
  plaque.position.set(0, size.y0 - 0.08, zWall + 0.05);
  bay.add(plaque);

  bay.updateMatrixWorld(true);
  const toWorld = (v) => bay.localToWorld(v);
  return {
    garments,
    spot,
    focus: toWorld(new THREE.Vector3(0, centerY, rodZ)),
    anchor: toWorld(new THREE.Vector3(0, top + 0.12, zWall + 0.1)),
  };
}

/* Biblioteca de telas: baldas con telas dobladas, a la espera de nuevas obras. */
const FOLD_COLORS = [0x4c0a18, 0xe9e3d7, 0x141414, 0x8e1426, 0x5f5d5b, 0xb9bcc2, 0x2a2420];
const foldMats = new Map();
const foldMat = (c) => {
  if (!foldMats.has(c)) foldMats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.88 }));
  return foldMats.get(c);
};
const foldGeo = new RoundedBoxGeometry(0.34, 0.045, 0.26, 3, 0.018);

function buildFabricLibrary(bay, m, seed) {
  const size = NICHE;
  const { zWall, zBack, top } = buildNicheShell(bay, m, size);
  const shelves = [0.95, 1.6, 2.25];
  shelves.forEach((sy, si) => {
    // Balda de roble con canto de acero.
    box(bay, m.oak, size.w - 0.04, 0.03, size.depth - 0.06, 0, sy, zWall - size.depth / 2 - 0.02);
    box(bay, m.chrome, size.w - 0.04, 0.006, 0.006, 0, sy + 0.012, zWall - 0.05);
    // Dos montones de telas dobladas.
    for (const sx of [-0.33, 0.33]) {
      const n = 3 + ((seed + si + (sx > 0 ? 1 : 0)) % 3);
      for (let k = 0; k < n; k++) {
        const c = FOLD_COLORS[(seed * 3 + si * 2 + k + (sx > 0 ? 4 : 0)) % FOLD_COLORS.length];
        const f = new THREE.Mesh(foldGeo, foldMat(c));
        f.position.set(sx + Math.sin(k * 2.1 + seed) * 0.01, sy + 0.04 + k * 0.047, zWall - size.depth / 2 - 0.02);
        f.rotation.y = Math.sin(k * 1.3 + seed) * 0.03;
        bay.add(f);
      }
    }
  });
  const target = new THREE.Object3D();
  target.position.set(0, 1.5, zBack + 0.3);
  const spot = new THREE.SpotLight(0xffffff, 9, 4.5, 0.6, 0.7, 1.6);
  spot.position.set(0, top - 0.03, zWall + 0.3);
  spot.target = target;
  bay.add(spot, target);
}

/* Armario cerrado: dos puertas de laca acanalada, tiradores largos y haz de luz. */
function buildWardrobe(bay, m) {
  const z = -APOTHEM;
  const H = ROOM.height;
  const doorH = H - 0.42;
  const doorW = BAY_W / 2 - 0.012;
  for (const s of [-1, 1]) {
    const door = box(bay, m.fluted, doorW, doorH, 0.06, s * (doorW / 2 + 0.006), 0.13 + doorH / 2, z);
    door.material = m.fluted.clone();
    door.material.normalMap = m.fluted.normalMap.clone();
    door.material.normalMap.repeat.set(doorW * 9, 1);
    door.material.normalMap.needsUpdate = true;
    // Tirador cromado vertical, largo.
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.1, 16), m.chrome);
    handle.position.set(s * 0.05, 1.35, z + 0.075);
    bay.add(handle);
    for (const dy of [-0.52, 0.52]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 10), m.chrome);
      post.rotation.x = Math.PI / 2;
      post.position.set(s * 0.05, 1.35 + dy, z + 0.055);
      bay.add(post);
    }
  }
  // Haz de luz que cae desde la cornisa y se degrada.
  const wash = new THREE.SpotLight(0xffffff, 40, 5, 0.6, 1, 1.6);
  wash.position.set(0, H - 0.3, z + 0.45);
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
