/* =========================================================
   Logo 3D: convierte el trazado de assets/logo-shapes.json
   en piezas con volumen (extrusión).

   Formato de cada forma del JSON:
     o = contorno exterior  [[x, y], ...]
     h = agujeros (lista de contornos)
     t = 1 letras "CHART NOIR"  ·  t = 0 monograma
   El trazado mide 10 unidades de ancho; el grupo se escala
   desde fuera (ver main.js) para que quepa en cada pantalla.

   Acabado (el que Jano prefiere, de la primera versión):
   plata pulida y luminosa en la cara, cantos del monograma
   en plata y cantos de "CHART NOIR" en granate intenso.
   Reflejos de estudio limpios, sin manchas de color.
   ========================================================= */
import * as THREE from "three";
import shapes from "../../assets/logo-shapes.json";

// Poca profundidad: de frente solo se ve la cara plateada con un filo granate,
// sin que los cantos asomen como "letras fantasma" detrás del logo.
const DEPTH_TEXT = 0.26;
const DEPTH_MONOGRAM = 0.4;

export function createLogo(envMap) {
  // Cara: plata pulida y luminosa. Poca rugosidad = reflejo nítido.
  const silver = new THREE.MeshPhysicalMaterial({
    // Pulido, pero no espejo perfecto: en pantallas pequeñas los reflejos finos centelleaban.
    color: 0xeef0f3, metalness: 1, roughness: 0.18,
    clearcoat: 0.35, clearcoatRoughness: 0.14,
    envMap, envMapIntensity: 2.0,
  });
  // Cantos del monograma: plata satinada, para que el volumen se lea.
  const silverSide = new THREE.MeshStandardMaterial({
    color: 0xb9bcc2, metalness: 1, roughness: 0.28,
    envMap, envMapIntensity: 1,
  });
  // Cantos de "CHART NOIR": granate intenso, el color de la marca.
  const granate = new THREE.MeshStandardMaterial({
    color: 0x8e1426, metalness: 0.75, roughness: 0.3,
    emissive: 0x2a0409,
    envMap, envMapIntensity: 1.1,
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
  // Para girar los reflejos con el logo y medir dónde cae en pantalla.
  logo.userData.materials = [silver, silverSide, granate];
  for (const m of [silver, silverSide, granate]) m.userData.baseEnv = m.envMapIntensity;
  logo.userData.box = new THREE.Box3().setFromObject(logo);
  return logo;
}
