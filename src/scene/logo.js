/* =========================================================
   Logo 3D: convierte el trazado de assets/logo-shapes.json
   en piezas con volumen (extrusión).

   Formato de cada forma del JSON:
     o = contorno exterior  [[x, y], ...]
     h = agujeros (lista de contornos)
     t = 1 letras "CHART NOIR"  ·  t = 0 monograma
   El logo mide 10 unidades de ancho (de x = -5 a x = 5).

   Si algún día hay un SVG vectorizado profesional, se puede
   cambiar este trazado por SVGLoader de Three.js sin tocar
   el resto de la escena: basta con devolver el mismo Group.
   ========================================================= */
import * as THREE from "three";
import shapes from "../../assets/logo-shapes.json";
import { COLORS } from "../config.js";

const DEPTH_TEXT = 0.7;      // grosor de las letras
const DEPTH_MONOGRAM = 0.75; // el monograma un pelo más grueso

export function createLogo(envMap) {
  // Cara frontal: hueso, brillante. El emissive evita que se apague en las zonas sin luz directa.
  const matFace = new THREE.MeshStandardMaterial({
    color: COLORS.hueso, emissive: 0x4a4744, roughness: 0.28, metalness: 0.2,
    envMap, envMapIntensity: 0.7,
  });
  // Cantos del monograma: gris metálico.
  const matMonogramSide = new THREE.MeshStandardMaterial({
    color: COLORS.metal, roughness: 0.35, metalness: 0.5,
    envMap, envMapIntensity: 0.6,
  });
  // Cantos de "CHART NOIR": rojo sangre.
  const matTextSide = new THREE.MeshStandardMaterial({
    color: COLORS.sangre, emissive: 0x24040a, roughness: 0.35, metalness: 0.3,
    envMap, envMapIntensity: 0.5,
  });

  const group = new THREE.Group();
  group.name = "logo";

  for (const s of shapes) {
    const shape = new THREE.Shape(s.o.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const hole of s.h) {
      shape.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))));
    }

    const isText = s.t === 1;
    const depth = isText ? DEPTH_TEXT : DEPTH_MONOGRAM;
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.02,
      bevelSegments: 2,
      curveSegments: 1,
    });
    geometry.translate(0, 0, -depth / 2); // centrado en profundidad para girar sobre su eje

    // ExtrudeGeometry usa el material 0 para las caras y el 1 para los cantos.
    group.add(new THREE.Mesh(geometry, [matFace, isText ? matTextSide : matMonogramSide]));
  }

  return group;
}
