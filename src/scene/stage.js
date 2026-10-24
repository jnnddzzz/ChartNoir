/* =========================================================
   Escenario 3D: renderizador, cámara y mapa de reflejos.
   Todo nítido: sin niebla, sin desenfoques, sin postprocesado.
   ========================================================= */
import * as THREE from "three";
import { MAX_PIXEL_RATIO } from "../config.js";

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // nada que apague el plateado

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);

  const envMap = createReflections(renderer);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  return { renderer, scene, camera, envMap };
}

/* Lo que "ve" reflejado el metal: un estudio negro con tiras de luz
   blanca (el brillo plateado) y paneles granate (los reflejos de color).
   Solo existe dentro de este mapa; no ilumina la sala. */
function createReflections(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x050505);

  const white = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const soft = new THREE.MeshBasicMaterial({ color: 0x9a9da3, side: THREE.DoubleSide });
  const granate = new THREE.MeshBasicMaterial({ color: 0x8e1426, side: THREE.DoubleSide });
  const granateDeep = new THREE.MeshBasicMaterial({ color: 0x4c0a18, side: THREE.DoubleSide });

  const panels = [
    // [material, ancho, alto, x, y, z]
    [white, 14, 1.2, 0, 7, 3],     // tira cenital: brillo principal de la cara
    [white, 18, 3.2, 0, 1.2, 9],   // panel frontal: la cara plateada brilla de frente
    [soft, 22, 4, 0, -2.5, 8],     // relleno bajo
    [white, 0.5, 9, -7, 2, 2],     // tiras verticales laterales: filos nítidos
    [white, 0.5, 9, 7, 2, 2],
    [granate, 6, 10, -9, 0, -2],   // paneles granate: reflejos de color
    [granate, 6, 10, 9, 0, -2],
    [granateDeep, 20, 6, 0, -6, 2], // suelo granate oscuro
  ];
  for (const [mat, w, h, x, y, z] of panels) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    env.add(m);
  }

  const texture = pmrem.fromScene(env, 0.015).texture;
  env.traverse((o) => o.geometry?.dispose());
  [white, soft, granate, granateDeep].forEach((m) => m.dispose());
  pmrem.dispose();
  return texture;
}
