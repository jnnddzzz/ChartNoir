/* =========================================================
   El maniquí: una figura de museo sin cara, negro lacado con
   brillos, a escala heroica (2,25 m), que lleva la obra
   puesta. Postura del vídeo de Jano: de pie, manos en los
   bolsillos del pantalón. Calcetines blancos y zapatillas granate.
   Todo generado por código (tubos con grosor variable), sin
   modelos descargados.

   Medidas en metros. Suelo en y = 0; la figura mira hacia +z.
   ========================================================= */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/* Dónde va la ropa sobre el cuerpo (para colocar el conjunto). */
export const FIGURE = {
  height: 2.25,
  setTop: 1.88,   // borde de arriba del chaleco (cuello)
  setBottom: 0.56, // bajo del pantalón (media pierna)
};

/** Tubo que sigue una curva, con grosor que cambia a lo largo (brazos, piernas, cuello). */
function limb(points, radius, { segments = 64, radial = 28, caps = true } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const frames = curve.computeFrenetFrames(segments, false);
  const pos = [], nor = [], index = [];
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, p);
    const r = radius(t);
    const N = frames.normals[i], B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      n.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
      nor.push(n.x, n.y, n.z);
    }
  }
  const R = radial + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * R + j, b = a + 1, c = a + R, d = c + 1;
      index.push(a, b, c, b, d, c); // caras hacia fuera
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  const geos = [geo];
  if (caps) {
    // Remates redondos en los extremos: articulaciones limpias, sin bocas abiertas.
    for (const t of [0, 1]) {
      const sph = new THREE.SphereGeometry(radius(t), 24, 16);
      const c = curve.getPointAt(t);
      sph.translate(c.x, c.y, c.z);
      geos.push(sph);
    }
  }
  return geos;
}

/** Torso con secciones ovaladas que cambian con la altura: [y, ancho/2, fondo/2]. */
function torso(rings, { radial = 48, steps = 80 } = {}) {
  const ys = rings.map((r) => r[0]);
  const lerpRing = (y) => {
    let k = 0;
    while (k < rings.length - 2 && y > rings[k + 1][0]) k++;
    const [y0, a0, b0] = rings[k], [y1, a1, b1] = rings[k + 1];
    const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0)));
    const s = t * t * (3 - 2 * t); // suave entre anillos
    return [a0 + (a1 - a0) * s, b0 + (b1 - b0) * s];
  };
  const yMin = ys[0], yMax = ys[ys.length - 1];
  const pos = [], index = [];
  for (let i = 0; i <= steps; i++) {
    const y = yMin + ((yMax - yMin) * i) / steps;
    const [rx, rz] = lerpRing(y);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      pos.push(Math.sin(a) * rx, y, Math.cos(a) * rz);
    }
  }
  const R = radial + 1;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * R + j, b = a + 1, c = a + R, d = c + 1;
      index.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

/** Cabeza ovalada sin rasgos, con la barbilla un poco más estrecha. */
function head() {
  const g = new THREE.SphereGeometry(1, 48, 36);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const low = Math.max(0, -y);
    x *= 1 - 0.22 * low;              // mandíbula más estrecha
    z = z * (1 - 0.12 * low) + 0.18 * low * Math.max(0, z); // barbilla un punto adelantada
    p.setXYZ(i, x * 0.096, y * 0.142, z * 0.112);
  }
  g.computeVertexNormals();
  g.translate(0, 2.095, 0.008);
  return g;
}

/** Zapatilla granate (como las del vídeo): pala redondeada, suela y talonera. */
function shoe(side, mats) {
  const g = new THREE.Group();
  const upper = new THREE.Mesh(new RoundedBoxGeometry(0.118, 0.092, 0.3, 5, 0.042), mats.shoe);
  upper.position.set(0, 0.078, 0.045);
  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), mats.shoe);
  toe.scale.set(1, 0.62, 1.1);
  toe.position.set(0, 0.06, 0.15);
  const sole = new THREE.Mesh(new RoundedBoxGeometry(0.128, 0.04, 0.318, 4, 0.016), mats.sole);
  sole.position.set(0, 0.02, 0.045);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 10, 32), mats.shoe);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.125, -0.03);
  g.add(upper, toe, sole, collar);
  g.position.x = side * 0.115;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

/**
 * La figura completa. Devuelve un grupo con la figura de pie en y = 0.
 * @param {THREE.Material[]} reflective  lista de materiales que reflejan la sala (se añade el de la piel)
 */
export function createMannequin(reflective = []) {
  const group = new THREE.Group();
  // Negro lacado con brillos (de noche, como la sala): la tela de la obra resalta.
  const skin = new THREE.MeshPhysicalMaterial({
    color: 0x16171a, metalness: 0.55, roughness: 0.22,
    clearcoat: 1, clearcoatRoughness: 0.08,
  });
  reflective.push(skin);
  const mats = {
    shoe: new THREE.MeshPhysicalMaterial({ color: 0x4c0a18, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.18 }),
    sole: new THREE.MeshStandardMaterial({ color: 0x3a0812, roughness: 0.6 }),
    sock: new THREE.MeshStandardMaterial({ color: 0xece8e1, roughness: 0.92 }),
  };

  const geos = [];
  // Torso (casi todo queda dentro del chaleco y del pantalón; asoma por cuello y sisas).
  geos.push(torso([
    [0.98, 0.115, 0.095], [1.06, 0.172, 0.122], [1.15, 0.178, 0.128], [1.3, 0.148, 0.108],
    [1.46, 0.165, 0.118], [1.6, 0.19, 0.13], [1.72, 0.2, 0.12], [1.8, 0.155, 0.098], [1.86, 0.065, 0.058],
  ]));
  // Cuello y cabeza.
  geos.push(...limb([new THREE.Vector3(0, 1.8, -0.008), new THREE.Vector3(0, 1.9, 0), new THREE.Vector3(0, 2.0, 0.006)], (t) => 0.054 - 0.006 * t, { segments: 16 }));
  geos.push(head());
  // Hombros, brazos y manos metidas en los bolsillos del pantalón.
  for (const s of [-1, 1]) {
    const sh = new THREE.SphereGeometry(0.062, 28, 20);
    sh.translate(s * 0.232, 1.762, -0.004);
    geos.push(sh);
    // (La mano acaba dentro del bolsillo: sin remate en esa punta.)
    const arm = limb([
      new THREE.Vector3(s * 0.242, 1.765, 0),
      new THREE.Vector3(s * 0.305, 1.58, -0.022),
      new THREE.Vector3(s * 0.34, 1.385, -0.042),
      new THREE.Vector3(s * 0.285, 1.2, 0.025),
      new THREE.Vector3(s * 0.2, 1.05, 0.06),
    ], (t) => (t < 0.5 ? 0.054 - 0.024 * t : 0.042 - 0.016 * (t - 0.5)), { segments: 72 });
    geos.push(arm[0], arm[1]);
    // Piernas (asoman bajo el pantalón).
    geos.push(...limb([
      new THREE.Vector3(s * 0.095, 1.05, 0),
      new THREE.Vector3(s * 0.104, 0.82, 0.012),
      new THREE.Vector3(s * 0.11, 0.6, 0.02),
      new THREE.Vector3(s * 0.113, 0.36, -0.006),
      new THREE.Vector3(s * 0.115, 0.1, -0.012),
    ], (t) => {
      // Muslo, rodilla, gemelo y tobillo.
      if (t < 0.45) return 0.09 - 0.05 * (t / 0.45);
      if (t < 0.72) return 0.058 + 0.008 * Math.sin(((t - 0.45) / 0.27) * Math.PI);
      return 0.058 - 0.024 * ((t - 0.72) / 0.28);
    }, { segments: 72 }));
  }
  for (const g of geos) {
    const m = new THREE.Mesh(g, skin);
    m.castShadow = true;
    group.add(m);
  }
  // (Sin calcetines ni zapatos: Jano los quitó el 06/11/2026.)
  return group;
}
