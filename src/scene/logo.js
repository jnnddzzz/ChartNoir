/* =========================================================
   Logo 3D: convierte el trazado de assets/logo-shapes.json
   en piezas con volumen (extrusión).

   Formato de cada forma del JSON:
     o = contorno exterior  [[x, y], ...]
     h = agujeros (lista de contornos)
     t = 1 letras "CHART NOIR"  ·  t = 0 monograma
   El trazado mide 10 unidades de ancho; aquí se escala al
   tamaño que ocupa dentro del vestidor.

   Acabado: plata pulida en la cara, cantos granate metálico
   y reflejos granate del mapa de entorno.
   ========================================================= */
import * as THREE from "three";
import shapes from "../../assets/logo-shapes.json";

export const LOGO_WIDTH = 3.6; // ancho final del logo dentro de la sala

const DEPTH_TEXT = 0.7;
const DEPTH_MONOGRAM = 0.75;

export function createLogo(envMap) {
  // Cara: plata pulida. Muy poca rugosidad = reflejo nítido, nada borroso.
  const silver = new THREE.MeshPhysicalMaterial({
    color: 0xeef0f3, metalness: 1, roughness: 0.12,
    clearcoat: 0.5, clearcoatRoughness: 0.06,
    envMap, envMapIntensity: 1.6,
  });
  // Cantos del monograma: plata algo más satinada, para que el volumen se lea.
  const silverSide = new THREE.MeshStandardMaterial({
    color: 0xb9bcc2, metalness: 1, roughness: 0.28,
    envMap, envMapIntensity: 1,
  });
  // Cantos de "CHART NOIR": granate metálico.
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
  logo.scale.setScalar(LOGO_WIDTH / 10);
  return logo;
}
