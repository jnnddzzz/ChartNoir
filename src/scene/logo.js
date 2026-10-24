/* =========================================================
   Logo 3D: convierte el trazado de assets/logo-shapes.json
   en piezas con volumen (extrusión).

   Formato de cada forma del JSON:
     o = contorno exterior  [[x, y], ...]
     h = agujeros (lista de contornos)
     t = 1 letras "CHART NOIR"  ·  t = 0 monograma
   El trazado mide 10 unidades de ancho; el grupo se escala
   desde fuera (ver main.js) para que quepa en cada pantalla.

   Acabado: plata pulida con reflejos de estudio limpios.
   El granate queda en los cantos de las letras, satinado y
   sin reflejos de color.
   ========================================================= */
import * as THREE from "three";
import shapes from "../../assets/logo-shapes.json";

const DEPTH_TEXT = 0.7;
const DEPTH_MONOGRAM = 0.75;

export function createLogo(envMap) {
  // Cara: plata pulida. Poca rugosidad = reflejo nítido, nada borroso.
  const silver = new THREE.MeshPhysicalMaterial({
    color: 0xf2f3f5, metalness: 1, roughness: 0.16,
    clearcoat: 1, clearcoatRoughness: 0.04,
    envMap, envMapIntensity: 1.7,
  });
  // Cantos del monograma: plata cepillada, para que el volumen se lea.
  const silverSide = new THREE.MeshStandardMaterial({
    color: 0xaeb1b6, metalness: 1, roughness: 0.32,
    envMap, envMapIntensity: 1,
  });
  // Cantos de "CHART NOIR": granate satinado, profundo y limpio.
  const granate = new THREE.MeshStandardMaterial({
    color: 0x6e1020, metalness: 0.15, roughness: 0.55,
    envMap, envMapIntensity: 0.35,
  });

  const inner = new THREE.Group();
  for (const s of shapes) {
    const shape = new THREE.Shape(s.o.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const hole of s.h) {
      shape.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))));
    }
    const isText = s.t === 1;
    const depth = isText ? DEPTH_TEXT : DEPTH_MONOGRAM;
    // Las letras son trazos finos: bisel mínimo para que la cara plateada se vea entera.
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: isText ? 0.02 : 0.05,
      bevelSize: isText ? 0.006 : 0.022,
      bevelSegments: isText ? 1 : 3,
      curveSegments: 1,
    });
    geometry.translate(0, 0, -depth / 2);
    // Material 0 = caras, material 1 = cantos.
    inner.add(new THREE.Mesh(geometry, [silver, isText ? granate : silverSide]));
  }
  // El trazado no está centrado en vertical: lo centramos para que gire sobre su eje.
  const box = new THREE.Box3().setFromObject(inner);
  inner.position.y = -(box.min.y + box.max.y) / 2;

  const logo = new THREE.Group();
  logo.name = "logo";
  logo.add(inner);
  // Los reflejos de estudio giran con el logo: se ve igual de plateado mire hacia donde mire.
  logo.userData.materials = [silver, silverSide, granate];
  return logo;
}
