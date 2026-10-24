/* =========================================================
   Escenario 3D: renderizador, cámara, sombras y reflejos.
   Todo nítido: sin niebla, sin desenfoques, sin postprocesado.
   ========================================================= */
import * as THREE from "three";
import { MAX_PIXEL_RATIO } from "../config.js";

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Tone mapping neutro: el plateado brilla sin quemarse y los negros siguen siendo negros.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  // Sombras suaves de verdad (solo las proyecta el foco del escaparate).
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);

  const studio = createStudioReflections(renderer);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 56 : 38; // en móvil vertical, algo más angular
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  return { renderer, scene, camera, studio };
}

/* Reflejos de estudio para el logo: plató negro con softboxes blancas
   potentes (cara plateada luminosa, como en la primera versión) y filos
   blancos que recortan el contorno. Sin paneles de color. */
function createStudioReflections(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x060606);

  const mat = (c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
  const white = mat(0xffffff);
  const soft = mat(0x9a9da3);
  const dark = mat(0x18181a);

  const panels = [
    // [material, ancho, alto, x, y, z]
    [white, 14, 1.2, 0, 7, 3],       // tira cenital: brillo principal
    [white, 18, 3.2, 0, 1.2, 9],     // panel frontal: la cara plateada brilla de frente
    [soft, 22, 4, 0, -2.5, 8],       // relleno bajo: degradado metálico
    [white, 0.5, 9, -7, 2, 2],       // tiras verticales laterales: filos nítidos
    [white, 0.5, 9, 7, 2, 2],
    [soft, 6, 10, -9, 0, -2],        // rellenos laterales neutros
    [soft, 6, 10, 9, 0, -2],
    [dark, 20, 6, 0, -6, 2],         // suelo oscuro: contraste en la parte baja
  ];
  for (const [m, w, h, x, y, z] of panels) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(x, y, z);
    p.lookAt(0, 0, 0);
    env.add(p);
  }

  const texture = pmrem.fromScene(env, 0.015).texture;
  env.traverse((o) => o.geometry?.dispose());
  [white, soft, dark].forEach((m) => m.dispose());
  pmrem.dispose();
  return texture;
}
