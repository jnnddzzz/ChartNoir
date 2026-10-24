/* =========================================================
   El vestidor: un pasillo de armarios negros a ambos lados,
   con barras cromadas, perchas, las prendas de Chart Noir
   colgadas de frente y rollos de tela en las baldas.
   El logo flota en el centro del pasillo.

   Medidas en metros. Suelo en y = 0. El logo está en z = 0;
   el pasillo sigue hacia el fondo (z negativo).
   Todo nítido: nada de niebla ni desenfoques.
   ========================================================= */
import * as THREE from "three";

export const ROOM = {
  halfWidth: 2.6,  // del centro a cada pared
  height: 3.2,
  front: 3,        // el pasillo empieza aquí (abierto hacia la cámara)
  back: -11,       // pared del fondo
  logoY: 1.55,
};

const MODULE = 1.3;     // ancho de cada módulo de armario (a lo largo del pasillo)
const DEPTH = 0.62;     // fondo del armario
const RAIL_Y = 2.02;    // altura de la barra
const SHELF_Y = 2.34;   // balda superior (rollos de tela)

const FIRST_Z = ROOM.front - 0.6; // borde del primer módulo
const moduleCenter = (index) => FIRST_Z - MODULE / 2 - index * MODULE;

// Huecos donde se cuelgan las prendas, en orden: cada prenda ocupa un módulo
// entero, centrada. La primera obra va a la izquierda, junto al logo.
// side: -1 izquierda, 1 derecha · module: 0 es el más cercano a la entrada.
const SLOTS = [
  { side: -1, module: 0 }, { side: -1, module: 1 },
  { side: 1, module: 0 }, { side: 1, module: 1 },
  { side: -1, module: 2 }, { side: 1, module: 2 },
  { side: -1, module: 3 }, { side: 1, module: 3 },
  { side: -1, module: 4 }, { side: 1, module: 4 },
];

export function createCloset({ pieces, envMap }) {
  const group = new THREE.Group();
  const swaying = []; // prendas que se mecen un poco

  /* ---------- Materiales ---------- */
  const lacquer = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.4, metalness: 0.1, envMap, envMapIntensity: 0.12 });
  const inside = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9 });
  const wall = new THREE.MeshStandardMaterial({ color: 0x040404, roughness: 1 });
  const floor = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.22, metalness: 0.2, envMap, envMapIntensity: 0.35 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe1e5, roughness: 0.12, metalness: 1, envMap, envMapIntensity: 1.1 });
  const led = new THREE.MeshBasicMaterial({ color: 0xffffff });

  /* ---------- Sala ---------- */
  const len = ROOM.front - ROOM.back;
  const midZ = (ROOM.front + ROOM.back) / 2;
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfWidth * 2, len), floor);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.z = midZ;
  group.add(floorMesh);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfWidth * 2, len), wall);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM.height, midZ);
  group.add(ceiling);

  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(len, ROOM.height), wall);
    w.rotation.y = -side * Math.PI / 2;
    w.position.set(side * ROOM.halfWidth, ROOM.height / 2, midZ);
    group.add(w);
  }
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfWidth * 2, ROOM.height), wall);
  backWall.position.set(0, ROOM.height / 2, ROOM.back);
  group.add(backWall);

  // Dos líneas de luz en el techo, a lo largo del pasillo: la firma del espacio.
  for (const x of [-0.9, 0.9]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, len - 0.4), led);
    strip.position.set(x, ROOM.height - 0.006, midZ);
    group.add(strip);
  }
  // Fondo: dos verticales de luz enmarcan el final del pasillo.
  for (const x of [-1.9, 1.9]) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.03, ROOM.height - 0.6, 0.01), led);
    v.position.set(x, ROOM.height / 2, ROOM.back + 0.01);
    group.add(v);
  }

  /* ---------- Armarios ---------- */
  const hangerGeo = createHangerGeometry();
  const emptyHangers = [];
  const occupied = new Set(); // módulos con prenda: sin perchas vacías
  const slotOf = (i) => SLOTS[i % SLOTS.length];
  pieces.forEach((_, i) => occupied.add(`${slotOf(i).side}:${slotOf(i).module}`));

  for (const side of [-1, 1]) {
    const railX = side * (ROOM.halfWidth - DEPTH / 2);
    let index = 0;
    for (let z = FIRST_Z; z - MODULE > ROOM.back + 0.2; z -= MODULE, index++) {
      const zc = z - MODULE / 2;
      // Carcasa: paneles laterales, techo, zócalo y fondo.
      addBox(group, lacquer, 0.04, ROOM.height - 0.2, DEPTH, side * (ROOM.halfWidth - DEPTH / 2), (ROOM.height - 0.2) / 2, z);
      addBox(group, lacquer, DEPTH, 0.04, MODULE, railX, SHELF_Y, zc);
      addBox(group, lacquer, DEPTH, 0.12, MODULE, railX, 0.06, zc);
      addBox(group, inside, 0.02, ROOM.height - 0.2, MODULE, side * (ROOM.halfWidth - 0.01), (ROOM.height - 0.2) / 2, zc);

      // Tira LED bajo la balda: ilumina la ropa desde arriba.
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, MODULE - 0.12), led);
      strip.position.set(side * (ROOM.halfWidth - DEPTH + 0.05), SHELF_Y - 0.03, zc);
      group.add(strip);

      // Barra cromada.
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, MODULE - 0.06, 16), chrome);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(railX, RAIL_Y, zc);
      group.add(rail);

      // Rollos de tela en la balda (uno de cada dos módulos, alternando).
      if ((index + (side > 0 ? 1 : 0)) % 2 === 1) addFabricRolls(group, railX, zc, index);

      // Perchas vacías esperando las próximas obras.
      const key = `${side}:${index}`;
      const count = occupied.has(key) ? 0 : 3;
      for (let k = 0; k < count; k++) {
        emptyHangers.push({ x: railX, z: zc - 0.35 + k * 0.33, side });
      }
    }
  }

  // Todas las perchas vacías en una sola pieza (rápido de dibujar).
  const hangers = new THREE.InstancedMesh(hangerGeo, chrome, emptyHangers.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  emptyHangers.forEach((h, i) => {
    // Las perchas vacías cuelgan de perfil, como en cualquier armario.
    q.setFromEuler(new THREE.Euler(0, Math.PI / 2 + (i % 2 ? 0.05 : -0.05), 0));
    m.compose(new THREE.Vector3(h.x, RAIL_Y, h.z), q, new THREE.Vector3(1, 1, 1));
    hangers.setMatrixAt(i, m);
  });
  group.add(hangers);

  /* ---------- Prendas ---------- */
  const garmentSpots = [];
  pieces.forEach((piece, i) => {
    const slot = slotOf(i);
    const z = moduleCenter(slot.module);
    const x = slot.side * (ROOM.halfWidth - DEPTH / 2);
    const g = createGarment(piece, hangerGeo, chrome);
    g.position.set(x - slot.side * 0.05, RAIL_Y, z);
    g.rotation.y = -slot.side * Math.PI / 2; // de frente al pasillo
    group.add(g);
    swaying.push({ obj: g.userData.swing, phase: i * 1.7 });
    const center = new THREE.Vector3(x, RAIL_Y - 0.19 + piece.hang - piece.height / 2, z);
    garmentSpots.push(center);

    // Cada prenda tiene su foco cenital, como una obra en un museo.
    const focus = new THREE.SpotLight(0xffffff, 14, 4, 0.38, 0.5, 2);
    focus.position.set(slot.side * 1.1, ROOM.height - 0.05, z);
    focus.target.position.copy(center);
    group.add(focus, focus.target);
  });

  /* ---------- Luces ---------- */
  group.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.22));
  for (const side of [-1, 1]) {
    for (const z of [-1.5, -5, -8.5]) {
      const p = new THREE.PointLight(0xffffff, 2.2, 3, 2);
      p.position.set(side * 1.7, 2.15, z);
      group.add(p);
    }
  }
  const spot = new THREE.SpotLight(0xffffff, 30, 7, 0.36, 0.5, 2);
  spot.position.set(0, ROOM.height - 0.05, 1.8);
  spot.target.position.set(0, ROOM.logoY, 0);
  group.add(spot, spot.target);

  function update(t) {
    for (const s of swaying) s.obj.rotation.z = Math.sin(t * 0.7 + s.phase) * 0.012;
  }

  return { group, update, garmentSpots };
}

/* Una prenda: su percha cromada y la foto recortada colgando. */
function createGarment(piece, hangerGeo, chrome) {
  const g = new THREE.Group();
  const swing = new THREE.Group(); // pivota en la barra
  g.add(swing);
  g.userData.swing = swing;

  const hanger = new THREE.Mesh(hangerGeo, chrome);
  hanger.rotation.y = Math.PI / 2; // la percha queda de frente, como la prenda
  swing.add(hanger);

  const mat = new THREE.MeshStandardMaterial({
    map: piece.texture, alphaTest: 0.5, alphaToCoverage: true, // bordes limpios, sin dientes
    side: THREE.DoubleSide, roughness: 0.92, metalness: 0,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(piece.width, piece.height), mat);
  // La parte de arriba de la prenda queda justo bajo los hombros de la percha.
  plane.position.y = -0.19 - piece.height / 2 + piece.hang;
  swing.add(plane);
  return g;
}

/* Percha de alambre: gancho arriba y triángulo de hombros. */
function createHangerGeometry() {
  const pts = [];
  // Gancho (medio círculo sobre la barra) y bajada hasta el cuello.
  for (let a = Math.PI; a >= -0.6; a -= 0.25) pts.push(new THREE.Vector3(0, 0.035 * Math.sin(a), -0.035 * Math.cos(a) + 0.035));
  pts.push(new THREE.Vector3(0, -0.07, 0));
  // Hombros y barra inferior (triángulo).
  pts.push(new THREE.Vector3(0, -0.1, 0.21));
  pts.push(new THREE.Vector3(0, -0.19, 0.22));
  pts.push(new THREE.Vector3(0, -0.19, -0.22));
  pts.push(new THREE.Vector3(0, -0.1, -0.21));
  pts.push(new THREE.Vector3(0, -0.07, 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.1);
  return new THREE.TubeGeometry(curve, 80, 0.0045, 6, false);
}

function addBox(group, mat, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  group.add(mesh);
  return mesh;
}

/* Rollos de tela apilados en la balda: las telas que se eligen una a una.
   Tumbados a lo largo de la balda, con la tela mirando al pasillo. */
const ROLL_COLORS = [0x4c0a18, 0xe9e3d7, 0x161616, 0x8e1426, 0x5f5d5b, 0xb9bcc2];
const rollMats = new Map();
const rollMaterial = (color) => {
  if (!rollMats.has(color)) rollMats.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.86 }));
  return rollMats.get(color);
};
function addFabricRolls(group, x, z, seed) {
  const r = 0.072;
  const side = Math.sign(x);
  // [desplazamiento hacia el pasillo, fila]
  const layout = [[0.17, 0], [0.02, 0], [-0.13, 0], [0.095, 1], [-0.055, 1]];
  layout.forEach(([dx, row], i) => {
    // Colores lisos: a esta distancia un estampado se lee como madera.
    const mat = rollMaterial(ROLL_COLORS[(i + seed) % ROLL_COLORS.length]);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(r, r, MODULE - 0.24 - row * 0.1, 28), mat);
    roll.rotation.x = Math.PI / 2;
    roll.position.set(x - side * dx, SHELF_Y + 0.02 + r + row * r * 1.72, z);
    group.add(roll);
  });
}
