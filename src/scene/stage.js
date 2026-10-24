/* =========================================================
   Escenario 3D: renderizador, cámara y reflejos.
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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 60);

  const studio = createStudioReflections(renderer);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 52 : 36; // en móvil vertical, algo más angular
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  return { renderer, scene, camera, studio };
}

/* Reflejos de estudio para el logo: un plató negro con softboxes blancas
   y grises neutros. Limpio, sin color: el plateado se ve plateado. */
function createStudioReflections(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x0a0a0a);

  const mat = (c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
  const white = mat(0xffffff);
  const grey = mat(0x5a5c60);
  const dark = mat(0x202022);

  const panels = [
    // [material, ancho, alto, x, y, z]
    [white, 12, 1.4, 0, 6, 3],      // softbox cenital: el brillo largo de arriba
    [grey, 14, 2.2, 0, 1.6, 9],     // panel frontal gris: cara plateada, no blanca plana
    [white, 14, 0.5, 0, -0.6, 9],   // línea blanca baja: el degradado metálico
    [grey, 6, 8, -8, 1, 4],         // rellenos laterales neutros
    [grey, 6, 8, 8, 1, 4],
    [white, 0.35, 7, -5.5, 1.5, -3], // filos finos: recortan el contorno
    [white, 0.35, 7, 5.5, 1.5, -3],
    [dark, 30, 10, 0, -6, 0],       // suelo oscuro: da profundidad a la parte baja
  ];
  for (const [m, w, h, x, y, z] of panels) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(x, y, z);
    p.lookAt(0, 0, 0);
    env.add(p);
  }

  const texture = pmrem.fromScene(env, 0.02).texture;
  env.traverse((o) => o.geometry?.dispose());
  [white, grey, dark].forEach((m) => m.dispose());
  pmrem.dispose();
  return texture;
}
