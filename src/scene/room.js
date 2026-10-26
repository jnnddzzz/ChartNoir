/* =========================================================
   El vestidor circular. El símbolo flota en el centro de la
   sala y gira; la sala gira a su alrededor y se puede mirar
   en todas direcciones, con suelo y techo trabajados.

   12 módulos de pared (30° cada uno), separados por pilastras
   acanaladas con una línea de luz empotrada:
   - módulo 0: el ESCAPARATE de la Obra 001. El conjunto flota
     en 3D como si alguien lo llevara puesto, delante de un
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
import { createWornOutfit } from "./garment.js";
import { marbleTexture, flutedNormal, smokedOakTexture, plaqueTexture, haloTexture, friezeTexture, cardTexture, ringTextTexture } from "./textures.js";

export const ROOM = { radius: 5, height: 4.2, bays: 12 };

const BAY = (Math.PI * 2) / ROOM.bays;
const APOTHEM = ROOM.radius * Math.cos(BAY / 2);
const BAY_W = 2 * ROOM.radius * Math.sin(BAY / 2);
const PILASTER = 0.22; // ancho de cada pilastra entre módulos

const SHOWCASE = { w: 1.85, h: 3.2, y0: 0.32, depth: 0.95 };
const NICHE = { w: 1.6, h: 2.9, y0: 0.32, depth: 0.66 };

/** El ángulo (en radianes) en el que está cada módulo de pared. */
export const bayAngle = (i) => i * BAY;

/* Friso del museo: lo que se lee en lo alto de cada módulo, empezando por el escaparate. */
const FRIEZE = [
  "MUSEO DE ARTE", "SALA I · GÉNESIS", "COLECCIÓN PERMANENTE", "HECHO A MANO",
  "TELAS ELEGIDAS UNA A UNA", "MUSEO DE MODA", "CHART NOIR · MUSEO DE ARTE", "UNA SOLA VEZ",
  "OBRAS ÚNICAS · 1/1", "LOS QUE ESTABAN, LO SABEN", "NO ES PARA TODOS", "CHART NOIR",
];

export function createRoom({ obras, pieces, photos = [], fabrics = new Map() }) {
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
  const recessMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.9, emissive: 0x040405 });
  power.push({ delay: 0.2, set: (v) => recessMat.emissive.setScalar((0x04 / 255) * v) });
  const recess = new THREE.Mesh(new THREE.CircleGeometry(2.45, 128), recessMat);
  recess.rotation.x = Math.PI / 2;
  recess.position.y = H + 0.32;
  group.add(recess);
  const recessWall = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.32, 128, 1, true), new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.9, side: THREE.BackSide }));
  recessWall.position.y = H + 0.16;
  group.add(recessWall);
  // Artesonado de la cúpula: aros y radios de acero sobre la lámpara.
  for (const r of [0.9, 1.5, 2.1]) {
    const c = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 160), chrome);
    c.rotation.x = Math.PI / 2;
    c.position.y = H + 0.31;
    group.add(c);
  }
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 1.5), lacquer);
    rib.position.set(Math.sin(a) * 1.65, H + 0.31, Math.cos(a) * 1.65);
    rib.rotation.y = a;
    group.add(rib);
  }
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
    // Friso con letras de museo, retroiluminadas, en la cornisa.
    const fm = new THREE.MeshStandardMaterial({ map: friezeTexture(FRIEZE[i]), roughness: 0.4, metalness: 0.5, emissive: 0xffffff });
    fm.emissiveMap = fm.map;
    const lit = i === 0 || i === 6 ? 0.85 : 0.55;
    power.push({ delay: 0.5 + i * 0.075, set: (v) => { fm.emissiveIntensity = lit * v; } });
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(BAY_W - 0.12, (BAY_W - 0.12) * (96 / 1024)), fm);
    fr.position.set(0, H - 0.17, z + 0.141);
    bay.add(fr);
  }

  /* ---------- Raíl de focos de museo, colgado bajo las vigas ---------- */
  const track = new THREE.Mesh(new THREE.TorusGeometry(3.55, 0.016, 8, 240), chrome);
  track.rotation.x = Math.PI / 2;
  track.position.y = H - 0.2;
  group.add(track);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.35, metalness: 0.6 });
  const headGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.15, 24);
  const lensGeo = new THREE.CircleGeometry(0.03, 24);
  for (let k = 0; k < ROOM.bays * 2; k++) {
    const a = (k + 0.5) * (BAY / 2);
    const head = new THREE.Group();
    head.position.set(Math.sin(a) * 3.55, H - 0.25, -Math.cos(a) * 3.55);
    // Cada foco apunta a la pared que tiene delante, a media altura.
    head.lookAt(Math.sin(a) * APOTHEM, 1.6, -Math.cos(a) * APOTHEM);
    const body = new THREE.Mesh(headGeo, headMat);
    body.rotation.x = Math.PI / 2;
    head.add(body);
    const lens = new THREE.Mesh(lensGeo, glow(0.9, 1.0 + k * 0.035));
    lens.position.z = 0.076;
    head.add(lens);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.05, 6), chrome);
    stem.position.set(head.position.x, H - 0.2 - 0.025, head.position.z);
    group.add(head, stem);
  }
  for (let k = 0; k < 6; k++) {
    const a = k * (Math.PI / 3) + BAY / 2;
    const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 6), chrome);
    hanger.position.set(Math.sin(a) * 3.55, H - 0.125, -Math.cos(a) * 3.55);
    group.add(hanger);
  }

  /* ---------- Módulos ---------- */
  const displays = [];
  const reg = (delay, set) => power.push({ delay, set });
  const M = { lacquer, fluted, matte, chrome, marbleMat, oak, glow, lamp, reg, power };
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
      const d = buildShowcase(bay, M, obra, piecesByObra.get(obra.id) || [], i === 0, fabrics);
      displays.push({ ...d, obra, angle: bayAngle(i), bay });
      if (i === 0) buildMuseumFront(bay, M, obra);
    } else if (i === 6 && photos.length) {
      buildGalleryWall(bay, M, obras[0], photos);
    } else {
      buildFabricLibrary(bay, M, i);
    }
  }

  /* ---------- Bancos de museo frente al escaparate y frente a la pared del taller ---------- */
  for (const k of [0, 6]) {
    const bench = makeBench(chrome);
    const a = bayAngle(k);
    bench.position.set(Math.sin(a) * 2.75, 0, -Math.cos(a) * 2.75);
    bench.rotation.y = -a;
    group.add(bench);
  }

  /* ---------- Aura: lo que hace la sala majestuosa ---------- */
  // Medallón en el suelo, bajo el símbolo: estrella de acero, aro de luz empotrado
  // y un anillo de letras grabadas, como en la rotonda de un gran museo.
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const len = k % 2 ? 0.42 : 0.6;
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(k % 2 ? 0.008 : 0.012, len), chrome);
    ray.rotation.x = -Math.PI / 2;
    ray.rotation.z = -a;
    const mid = 0.18 + len / 2;
    ray.position.set(Math.sin(a) * mid, 0.003, -Math.cos(a) * mid);
    group.add(ray);
  }
  flat(new THREE.RingGeometry(0.16, 0.172, 96), chrome, 0.003);
  const inlay = new THREE.Mesh(new THREE.RingGeometry(1.565, 1.578, 220), glow(0.95, 1.9));
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.003;
  group.add(inlay);
  const TEXT_IN = 0.95, TEXT_OUT = 1.45;
  const ringTex = ringTextTexture("CHART NOIR · MUSEO DE ARTE · SALA I · HECHO A MANO · UNA SOLA VEZ · COLECCIÓN PERMANENTE · ", 1.2, TEXT_OUT);
  const ringMat = new THREE.MeshStandardMaterial({ map: ringTex, transparent: true, depthWrite: false, metalness: 0.6, roughness: 0.35, emissive: 0xffffff, emissiveMap: ringTex });
  power.push({ delay: 1.95, set: (v) => { ringMat.emissiveIntensity = 0.45 * v; } });
  const ringText = new THREE.Mesh(new THREE.RingGeometry(TEXT_IN, TEXT_OUT, 220, 1), ringMat);
  ringText.rotation.x = -Math.PI / 2;
  ringText.position.y = 0.004;
  group.add(ringText);

  // Línea de luz a ras de suelo, al pie de las paredes: la sala entera "flota".
  for (let i = 0; i < ROOM.bays; i++) {
    const bay = makeBay(group, i);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(BAY_W - 0.02, 0.006, 0.006), glow(0.7, 0.3 + i * 0.075));
    strip.position.set(0, 0.008, -APOTHEM + 0.14);
    bay.add(strip);
  }

  // Cúpula estrellada: puntos de luz en el techo (club privado de noche).
  {
    const N = 150;
    const r = rng(41);
    const starMat = glow(1, 2.2);
    const stars = new THREE.InstancedMesh(new THREE.CircleGeometry(0.0055, 8), starMat, N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    const sc = new THREE.Vector3();
    for (let k = 0; k < N; k++) {
      const rad = 0.25 + Math.sqrt(r()) * 2.1;
      const a = r() * Math.PI * 2;
      const size = 0.5 + r() * r() * 1.4;
      sc.setScalar(size);
      m4.compose(new THREE.Vector3(Math.sin(a) * rad, H + 0.316, Math.cos(a) * rad), q, sc);
      stars.setMatrixAt(k, m4);
    }
    group.add(stars);
  }

  // Cascada de cristales: varillas de acero con punta de luz colgando de la lámpara.
  {
    const rows = [[1.6, H + 0.28, 40, 0.42], [1.25, H + 0.22, 30, 0.34], [0.95, H + 0.04, 24, 0.22], [0.42, H - 0.2, 12, 0.1]];
    const total = rows.reduce((n, [, , c]) => n + c, 0);
    const rodGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 1, 5);
    rodGeo.translate(0, -0.5, 0);
    const rods = new THREE.InstancedMesh(rodGeo, chrome, total);
    const tips = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.011, 0), glow(1, 2.0), total);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    let n = 0;
    rows.forEach(([rad, y, count, len]) => {
      for (let k = 0; k < count; k++) {
        const a = ((k + (rad > 1 ? 0.5 : 0)) / count) * Math.PI * 2;
        const l = len * (0.75 + 0.25 * Math.sin(k * 2.399));
        const x = Math.sin(a) * rad, z = Math.cos(a) * rad;
        m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, l, 1));
        rods.setMatrixAt(n, m4);
        m4.compose(new THREE.Vector3(x, y - l - 0.01, z), q, new THREE.Vector3(1, 1.6, 1));
        tips.setMatrixAt(n, m4);
        n++;
      }
    });
    group.add(rods, tips);
  }

  // Portal de luz alrededor del escaparate principal: una línea fina que lo enmarca
  // por arriba y baja por los lados, por delante de las columnas.
  {
    const bay = makeBay(group, 0);
    const z = -APOTHEM + 0.17;
    const w = SHOWCASE.w + 0.52, top = SHOWCASE.y0 + SHOWCASE.h + 0.16;
    const mat = glow(1, 1.2);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(w, 0.008, 0.008), mat);
    lintel.position.set(0, top, z);
    bay.add(lintel);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.008, top - 0.02, 0.008), mat);
      post.position.set(sx * w / 2, (top - 0.02) / 2 + 0.02, z);
      bay.add(post);
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
    // Flota: sube y baja muy despacio y se balancea un poco; el scroll le da la vuelta entera.
    displays.forEach((d, k) => {
      d.float.position.y = d.floatY + Math.sin(t * 0.8 + k) * 0.018;
      d.float.rotation.y = d.spin + Math.sin(t * 0.35 + k) * 0.08 * (1 - Math.min(1, d.spin * 4));
    });
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

/* Escaparate de una obra: el conjunto en 3D, "puesto" (maniquí invisible),
   flotando delante de un halo retroiluminado. Puede girar 360° (spin). */
function buildShowcase(bay, m, obra, pieces, main, fabrics) {
  const size = main ? SHOWCASE : NICHE;
  const delay = main ? 1.3 : 1.6;
  // El escaparate principal no lleva tiras en los cantos: ya tiene halo y columnas de luz.
  const { zWall, zBack, top } = buildNicheShell(bay, m, size, delay, { coves: !main });
  // El conjunto "puesto", flotando en mitad de la vitrina (más grande que en la vida real).
  const CENTER_Y = size.y0 + size.h / 2 + 0.04;
  const rodZ = zWall - size.depth * 0.5;

  // Halo: panel retroiluminado detrás del conjunto (luz propia, nítida).
  const haloMat = new THREE.MeshBasicMaterial({ map: haloTexture(), color: 0xffffff });
  const haloBase = main ? 0.9 : 0.6;
  haloMat.color.setScalar(haloBase);
  m.reg(delay + 0.1, (v) => haloMat.color.setScalar(haloBase * v));
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(size.w - 0.06, size.h - 0.1), haloMat);
  halo.position.set(0, size.y0 + size.h / 2 + 0.05, zBack + 0.012);
  bay.add(halo);

  const outfit = createWornOutfit(pieces, main ? 1.9 : 1.6, fabrics?.get(obra.id));
  const float = new THREE.Group(); // sube y baja despacio
  float.position.set(0, CENTER_Y, rodZ);
  float.add(outfit.group);
  bay.add(float);
  const garments = outfit.parts;

  // Línea de luz en la peana, bajo el conjunto: refuerza que flota.
  const floorGlow = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.352, 96), m.glow(0.8, delay + 0.05));
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.set(0, size.y0 + 0.063, rodZ);
  bay.add(floorGlow);

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
    float,
    floatY: CENTER_Y,
    spin: 0,          // vuelta que le da el scroll (main.js)
    focus: toWorld(new THREE.Vector3(0, CENTER_Y, rodZ)),
    labelAt: toWorld(new THREE.Vector3(0, CENTER_Y + outfit.height / 2 + 0.12, rodZ)),
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
const rollGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.5, 40);
const coreGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.52, 16);

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
  // Rollos de tela tumbados en la parte baja (burdeos, hueso, negro…).
  const rollColors = [0x4c0a18, 0xe9e3d7, 0x141414, 0x5f5d5b];
  [[-0.42, 0.485], [0.0, 0.485], [0.42, 0.485], [-0.21, 0.67], [0.21, 0.67]].forEach(([x, y], k) => {
    const c = rollColors[(k + seed) % rollColors.length];
    const roll = new THREE.Mesh(rollGeo, foldMat(c));
    roll.rotation.x = Math.PI / 2;
    roll.position.set(x, y, zWall - size.depth / 2 - 0.02);
    bay.add(roll);
    const core = new THREE.Mesh(coreGeo, m.chrome);
    core.rotation.x = Math.PI / 2;
    core.position.copy(roll.position);
    bay.add(core);
  });
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.1),
    new THREE.MeshStandardMaterial({ map: plaqueTexture(["ARCHIVO DE TELAS", "SELECCIONADAS A MANO"]), metalness: 0.9, roughness: 0.35 }),
  );
  plaque.position.set(0, size.y0 - 0.1, zWall + 0.05);
  bay.add(plaque);

  const target = new THREE.Object3D();
  target.position.set(0, 1.6, zBack + 0.3);
  const spot = m.lamp(new THREE.SpotLight(0xffffff, 9, 5, 0.6, 0.7, 1.6), delay + 0.1);
  spot.position.set(0, top - 0.03, zWall + 0.3);
  spot.target = target;
  bay.add(spot, target);
}

/* Delante del escaparate principal, como en un museo: cordón de terciopelo
   entre dos postes de acero y un atril con la cartela de la obra. */
function buildMuseumFront(bay, m, obra) {
  const z = -APOTHEM + 0.85;
  const velvet = new THREE.MeshPhysicalMaterial({ color: 0x4c0a18, roughness: 0.75, sheen: 1, sheenColor: new THREE.Color(0x8e1426), sheenRoughness: 0.5 });
  const posts = [-0.72, 0.72];
  for (const x of posts) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.03, 48), m.chrome);
    base.position.set(x, 0.015, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.9, 24), m.chrome);
    pole.position.set(x, 0.48, z);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 24, 16), m.chrome);
    ball.position.set(x, 0.95, z);
    bay.add(base, pole, ball);
  }
  // Cordón con su caída natural (catenaria).
  const pts = [];
  for (let k = 0; k <= 24; k++) {
    const u = k / 24;
    pts.push(new THREE.Vector3(-0.72 + u * 1.44, 0.89 - Math.sin(u * Math.PI) * 0.17, z));
  }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.019, 12), velvet);
  bay.add(rope);

  // Atril con la cartela, a la derecha del cordón.
  const x = 1.12, lz = z + 0.05;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.025, 40), m.chrome);
  base.position.set(x, 0.0125, lz);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.0, 16), m.chrome);
  pole.position.set(x, 0.5, lz);
  bay.add(base, pole);
  const nombres = obra.piezas.map((p) => p.nombre.toLowerCase());
  const tex = cardTexture([
    [`OBRA ${obra.numero}`, 22, 600, 10, { track: 5 }],
    [obra.nombre, 62, 600, 2, { narrow: true }],
    ["Chart Noir · 2026", 22, 400, 26],
    [`${nombres.join(" y ").replace(/^./, (c) => c.toUpperCase())}. Hecho a mano con telas seleccionadas una a una, doble forro.`, 23, 400, 22],
    [`Pieza única ${obra.edicion} · Talla ${obra.talla}`, 21, 500, 12],
    ["Colección permanente · Sala I", 19, 400, 0, { color: "#6d6966" }],
  ]);
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.3),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.22 }),
  );
  const holder = new THREE.Group();
  holder.position.set(x, 1.04, lz);
  holder.rotation.x = -0.6; // inclinada hacia quien la lee
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.33, 0.012), m.lacquer);
  plate.position.z = -0.008;
  card.position.z = 0.0005;
  holder.add(plate, card);
  bay.add(holder);
}

/* Pared del taller: texto de sala de museo y las fotos del proceso
   enmarcadas como obras, cada una con su luz de cuadro. */
function buildGalleryWall(bay, m, obra, photos) {
  const size = SHOWCASE;
  const delay = 1.55;
  const { zWall, zBack, top } = buildNicheShell(bay, m, { ...size, depth: 0.32 }, delay, { coves: false });
  const board = box(bay, new THREE.MeshStandardMaterial({ color: 0x0e0e10, roughness: 0.88 }), size.w - 0.16, size.h - 0.2, 0.012, 0, size.y0 + size.h / 2, zBack + 0.016);
  board.receiveShadow = true;
  const zf = zBack + 0.03;

  // Texto de sala, en plata sobre negro.
  const wallTex = cardTexture([
    ["CHART NOIR", 34, 500, 14, { track: 14, color: "#8a8784" }],
    ["MUSEO DE ARTE", 118, 600, 6, { narrow: true, color: "#e2e4e8" }],
    ["SALA I · EL TALLER", 30, 500, 34, { track: 10, color: "#8a8784" }],
    ["Cada prenda es una obra. Se corta, se cose y se forra a mano, con telas elegidas una a una. Se hace una sola vez.", 32, 400, 0, { color: "#a9a6a2" }],
  ], { w: 1024, h: 560, bg: "#0e0e10", pad: 60, top: 90 });
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.6, emissive: 0xffffff, emissiveMap: wallTex });
  m.reg(delay + 0.2, (v) => { wallMat.emissiveIntensity = 0.5 * v; });
  const text = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5 * (560 / 1024)), wallMat);
  text.position.set(0, 2.92, zf);
  bay.add(text);

  // Las fotos del proceso, con marco negro, paspartú y luz de cuadro.
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.35, metalness: 0.3 });
  const matMat = new THREE.MeshStandardMaterial({ color: 0xe9e5de, roughness: 0.9 });
  const n = Math.min(2, photos.length);
  photos.slice(0, n).forEach((ph, k) => {
    const x = n === 1 ? 0 : (k - 0.5) * 0.8;
    const pw = 0.5;
    const phH = Math.min(0.9, pw * (ph.texture.image.height / ph.texture.image.width));
    const fw = pw + 0.16, fh = phH + 0.16, cy = 1.5;
    box(bay, frameMat, fw + 0.04, fh + 0.04, 0.04, x, cy, zf + 0.02);
    box(bay, matMat, fw, fh, 0.004, x, cy, zf + 0.042);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(pw, phH), new THREE.MeshStandardMaterial({ map: ph.texture, roughness: 0.7 }));
    pic.position.set(x, cy, zf + 0.0445);
    bay.add(pic);
    // Luz de cuadro: barra de acero con línea de luz encima del marco.
    const lampY = cy + fh / 2 + 0.12;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, fw * 0.75, 16), m.chrome);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(x, lampY, zf + 0.14);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.12, 8), m.chrome);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(x, lampY, zf + 0.08);
    const line = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.7, 0.004, 0.006), m.glow(1, delay + 0.1 + k * 0.08));
    line.position.set(x, lampY - 0.014, zf + 0.14);
    bay.add(bar, arm, line);
    const t = new THREE.Object3D();
    t.position.set(x, cy - 0.1, zf);
    const light = m.lamp(new THREE.SpotLight(0xffffff, 5, 2.2, 0.75, 0.6, 1.6), delay + 0.1 + k * 0.08);
    light.position.set(x, lampY - 0.03, zf + 0.22);
    light.target = t;
    bay.add(light, t);
    // Cartela pequeña bajo cada foto.
    const ctex = cardTexture([
      [`${String(k + 1).padStart(2, "0")} · PROCESO`, 30, 600, 14, { track: 6 }],
      [ph.texto, 30, 400, 0],
    ], { w: 512, h: 220, top: 60, pad: 36 });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.086), new THREE.MeshStandardMaterial({ map: ctex, roughness: 0.85, emissive: 0xffffff, emissiveMap: ctex, emissiveIntensity: 0.2 }));
    card.position.set(x + fw / 2 - 0.1, cy - fh / 2 - 0.12, zf + 0.004);
    bay.add(card);
  });

  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.1),
    new THREE.MeshStandardMaterial({ map: plaqueTexture(["SALA I · EL TALLER", `OBRA ${obra.numero} · ${obra.nombre.toUpperCase()}`]), metalness: 0.9, roughness: 0.35 }),
  );
  plaque.position.set(0, size.y0 - 0.1, zWall + 0.05);
  bay.add(plaque);
  const wash = m.lamp(new THREE.SpotLight(0xffffff, 6, 5, 0.55, 0.8, 1.6), delay);
  wash.position.set(0, top - 0.03, zWall + 0.4);
  const wt = new THREE.Object3D();
  wt.position.set(0, 2.6, zBack);
  wash.target = wt;
  bay.add(wash, wt);
}

/* Banco de museo: asiento de piel negra sobre patas de acero. */
function makeBench(chrome) {
  const g = new THREE.Group();
  const leather = new THREE.MeshPhysicalMaterial({ color: 0x101012, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color(0x303034) });
  const seat = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.1, 0.44, 4, 0.04), leather);
  seat.position.y = 0.42;
  g.add(seat);
  for (const x of [-0.6, 0.6]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.37, 0.38), chrome);
    leg.position.set(x, 0.185, 0);
    g.add(leg);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.02), chrome);
  bar.position.y = 0.08;
  g.add(bar);
  return g;
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
  // Luz que se escapa entre las dos puertas: algo se guarda dentro.
  const leak = new THREE.Mesh(new THREE.BoxGeometry(0.004, doorH - 0.04, 0.004), m.glow(0.85, 1.65 + i * 0.03));
  leak.position.set(0, 0.15 + doorH / 2, z + 0.031);
  bay.add(leak);
  const wash = m.lamp(new THREE.SpotLight(0xffffff, 42, 6, 0.6, 1, 1.6), 1.7 + i * 0.03);
  wash.position.set(0, H - 0.35, z + 0.5);
  const target = new THREE.Object3D();
  target.position.set(0, 0.6, z);
  wash.target = target;
  bay.add(wash, target);
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function box(parent, mat, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
