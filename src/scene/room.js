/* =========================================================
   El vestidor circular. El logo queda fijo en el centro y la
   sala gira a su alrededor (como en la referencia de Jano).

   La pared tiene 12 módulos (30° cada uno), alternando:
   - armarios cerrados de laca negra con tiradores cromados;
   - hornacinas iluminadas donde cuelga cada prenda, con su
     foco cenital, soporte cromado y sombra en el fondo.
   Las prendas ocupan las hornacinas en orden; las que quedan
   libres esperan las próximas obras con una percha vacía.

   Medidas en metros. Suelo en y = 0, centro de la sala en el origen.
   Ángulo 0 = de frente a la cámara al empezar.
   ========================================================= */
import * as THREE from "three";
import { createGarment, HOOK_CENTER } from "./garment.js";

export const ROOM = { radius: 3.4, height: 3.4, bays: 12 };

const BAY_ANGLE = (Math.PI * 2) / ROOM.bays;
const APOTHEM = ROOM.radius * Math.cos(BAY_ANGLE / 2);
const BAY_W = 2 * ROOM.radius * Math.sin(BAY_ANGLE / 2);
const NICHE = { w: 1.2, h: 2.3, y0: 0.35, depth: 0.62 };
const ROD_Y = 2.08;

// Orden en que las prendas ocupan las hornacinas (módulos pares).
// Las dos primeras quedan a cada lado del logo en la vista inicial.
const NICHE_ORDER = [0, 2, 10, 4, 8, 6];

export function createRoom({ pieces }) {
  const group = new THREE.Group();
  const reflective = []; // materiales que reciben el reflejo real de la sala

  /* ---------- Materiales ---------- */
  const lacquer = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a1d, roughness: 0.32, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.1,
  });
  reflective.push(lacquer);
  const matte = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9 });
  const velvet = new THREE.MeshStandardMaterial({ color: 0x1b1a19, roughness: 0.96 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x1f1e1d, roughness: 0.55 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe6e8eb, roughness: 0.1, metalness: 1 });
  reflective.push(chrome);
  const led = new THREE.MeshBasicMaterial({ color: 0xffffff });

  /* ---------- Suelo y techo ---------- */
  const floorMat = new THREE.MeshPhysicalMaterial({
    color: 0x090909, roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
  });
  reflective.push(floorMat);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(ROOM.radius + 0.1, 96), floorMat);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);
  // Aro de acero en el suelo, alrededor del centro.
  const inlay = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.52, 128), chrome);
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.002;
  group.add(inlay);

  const ceiling = new THREE.Mesh(new THREE.CircleGeometry(ROOM.radius + 0.1, 96), matte);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM.height;
  group.add(ceiling);
  // Anillo de luz en el techo: la firma del espacio.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.014, 8, 160), led);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = ROOM.height - 0.03;
  group.add(ring);

  /* ---------- Módulos de pared ---------- */
  const garments = [];
  const nicheBays = NICHE_ORDER.slice();
  const usedBays = new Map(); // módulo → prenda
  pieces.forEach((piece, i) => {
    if (i < nicheBays.length) usedBays.set(nicheBays[i], piece);
  });

  for (let i = 0; i < ROOM.bays; i++) {
    const angle = i * BAY_ANGLE;
    const bay = new THREE.Group();
    bay.rotation.y = -angle; // la pared local (z = -APOTHEM) mira al centro
    group.add(bay);

    if (i % 2 === 0) {
      const piece = usedBays.get(i) || null;
      const g = buildNiche(bay, { lacquer, velvet, stone, chrome, led }, piece);
      if (g) garments.push({ group: g, cloth: g.userData.cloth, piece, angle, bay });
    } else {
      buildWardrobe(bay, { lacquer, matte, chrome });
    }
  }

  /* ---------- Líneas de luz verticales entre módulos ---------- */
  // Enmarcan cada hornacina y cada armario: la sala se lee aunque sea negra.
  for (let i = 0; i < ROOM.bays; i++) {
    const a = (i + 0.5) * BAY_ANGLE;
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.012, ROOM.height - 0.5, 0.012), led);
    const r = ROOM.radius - 0.02;
    line.position.set(Math.sin(a) * r, ROOM.height / 2, -Math.cos(a) * r);
    group.add(line);
  }

  /* ---------- Luz general ---------- */
  // Luz ambiente suave desde el techo (sin focos que dejen manchas en la laca).
  group.add(new THREE.HemisphereLight(0xffffff, 0x0a0a0a, 0.4));

  function update(t) {
    garments.forEach((g, k) => {
      g.group.userData.swing.rotation.z = Math.sin(t * 0.6 + k * 1.9) * 0.006;
    });
  }

  return { group, garments, reflective, update, bayAngle: BAY_ANGLE };
}

/* Hornacina iluminada. Devuelve la prenda colgada (o null si está libre). */
function buildNiche(bay, m, piece) {
  const zWall = -APOTHEM;
  const zBack = zWall - NICHE.depth;
  const side = (BAY_W - NICHE.w) / 2;
  const top = NICHE.y0 + NICHE.h;

  // Marco de laca alrededor del hueco.
  box(bay, m.lacquer, side, ROOM.height, 0.06, -(NICHE.w / 2 + side / 2), ROOM.height / 2, zWall);
  box(bay, m.lacquer, side, ROOM.height, 0.06, NICHE.w / 2 + side / 2, ROOM.height / 2, zWall);
  box(bay, m.lacquer, NICHE.w, ROOM.height - top, 0.06, 0, top + (ROOM.height - top) / 2, zWall);
  box(bay, m.lacquer, NICHE.w, NICHE.y0, 0.06, 0, NICHE.y0 / 2, zWall);

  // Interior: fondo y laterales aterciopelados, base de piedra.
  box(bay, m.velvet, NICHE.w, NICHE.h, 0.02, 0, NICHE.y0 + NICHE.h / 2, zBack);
  box(bay, m.velvet, 0.02, NICHE.h, NICHE.depth, -NICHE.w / 2, NICHE.y0 + NICHE.h / 2, zWall - NICHE.depth / 2);
  box(bay, m.velvet, 0.02, NICHE.h, NICHE.depth, NICHE.w / 2, NICHE.y0 + NICHE.h / 2, zWall - NICHE.depth / 2);
  box(bay, m.velvet, NICHE.w, 0.02, NICHE.depth, 0, top, zWall - NICHE.depth / 2);
  box(bay, m.stone, NICHE.w, 0.04, NICHE.depth, 0, NICHE.y0, zWall - NICHE.depth / 2);

  // Tira de luz en el borde superior interior.
  const strip = new THREE.Mesh(new THREE.BoxGeometry(NICHE.w - 0.1, 0.01, 0.012), m.led);
  strip.position.set(0, top - 0.025, zWall - 0.05);
  bay.add(strip);

  // Soporte cromado que sale del fondo (las prendas cuelgan de frente).
  const rodLen = 0.34;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, rodLen, 16), m.chrome);
  rod.rotation.x = Math.PI / 2;
  rod.position.set(0, ROD_Y, zBack + rodLen / 2);
  bay.add(rod);
  const rodZ = zBack + rodLen - 0.05;

  // Foco cenital sobre la prenda.
  const target = new THREE.Object3D();
  target.position.set(0, 1.35, rodZ);
  const spot = new THREE.SpotLight(0xffffff, piece ? 9 : 4, 4, 0.5, 0.7, 2);
  spot.position.set(0, top - 0.05, zWall + 0.25);
  spot.target = target;
  bay.add(spot, target);

  if (!piece) {
    // Hornacina libre: percha vacía esperando la próxima obra.
    const empty = createGarment({ ...EMPTY, texture: emptyTexture() }, m.chrome);
    empty.userData.cloth.visible = false;
    empty.position.set(-HOOK_CENTER.x, ROD_Y - HOOK_CENTER.y, rodZ);
    bay.add(empty);
    return null;
  }

  const g = createGarment(piece, m.chrome);
  g.position.set(-HOOK_CENTER.x, ROD_Y - HOOK_CENTER.y, rodZ);
  bay.add(g);
  const shadow = g.userData.shadow;
  shadow.position.x = g.position.x + 0.02;
  shadow.position.y += g.position.y;
  shadow.position.z = zBack + 0.012;
  bay.add(shadow);
  g.userData.spot = spot;
  return g;
}

const EMPTY = { width: 0.5, height: 0.6, percha: "hombros" };
let emptyTex = null;
function emptyTexture() {
  if (emptyTex) return emptyTex;
  const c = document.createElement("canvas");
  c.width = c.height = 4;
  emptyTex = new THREE.CanvasTexture(c);
  return emptyTex;
}

/* Armario cerrado: dos puertas de laca con tiradores verticales. */
function buildWardrobe(bay, m) {
  const z = -APOTHEM;
  // Bañador de luz: cae desde el techo y se degrada hacia el suelo.
  const wash = new THREE.SpotLight(0xffffff, 45, 5, 0.6, 1, 1.6);
  wash.position.set(0, ROOM.height - 0.05, z + 0.5);
  const target = new THREE.Object3D();
  target.position.set(0, 0.6, z);
  wash.target = target;
  bay.add(wash, target);
  box(bay, m.lacquer, BAY_W, ROOM.height - 0.12, 0.06, 0, (ROOM.height - 0.12) / 2 + 0.12, z);
  box(bay, m.matte, BAY_W, 0.12, 0.04, 0, 0.06, z - 0.02); // zócalo retranqueado
  // Junta entre puertas.
  box(bay, m.matte, 0.006, ROOM.height - 0.3, 0.01, 0, ROOM.height / 2 + 0.06, z + 0.031);
  // Tiradores cromados.
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.9, 12), m.chrome);
    h.position.set(s * 0.06, 1.25, z + 0.065);
    bay.add(h);
    for (const dy of [-0.42, 0.42]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.035, 8), m.chrome);
      post.rotation.x = Math.PI / 2;
      post.position.set(s * 0.06, 1.25 + dy, z + 0.048);
      bay.add(post);
    }
  }
}

function box(parent, mat, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
