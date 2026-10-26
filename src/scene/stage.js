/* =========================================================
   Escenario 3D: renderizador, cámara, sombras y reflejos.
   Todo nítido: sin niebla, sin desenfoques, sin postprocesado.
   ========================================================= */
import * as THREE from "three";
import { MAX_PIXEL_RATIO } from "../config.js";

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  // En móvil, 1,5 como máximo (nítido y fluido); main.js lo baja solo si hace falta.
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : MAX_PIXEL_RATIO));
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
  const dark = mat(0x26272a);

  const panels = [
    // [material, ancho, alto, x, y, z]
    [white, 14, 1.2, 0, 7, 3],       // tira cenital: brillo principal
    [white, 18, 6.5, 0, 1.6, 9],     // panel frontal grande: la cara sigue brillando al inclinarla
    [soft, 20, 5, 0, 6.2, 6.5],      // relleno alto: inclinada hacia atrás, no se apaga
    [soft, 22, 5, 0, -3.4, 8],       // relleno bajo: inclinada hacia delante, tampoco
    [white, 0.5, 9, -7, 2, 2],       // tiras verticales laterales: filos nítidos
    [white, 0.5, 9, 7, 2, 2],
    [white, 4, 10, -9, 0, -2],       // laterales blancos: brilla también cuando gira de canto
    [white, 4, 10, 9, 0, -2],
    // Detrás, lo mismo que delante: de espaldas el símbolo brilla igual.
    [white, 18, 6.5, 0, 1.6, -9],
    [white, 14, 1.2, 0, 7, -3],
    [soft, 20, 5, 0, 6.2, -6.5],
    [soft, 22, 5, 0, -3.4, -8],
    [dark, 20, 6, 0, -6.5, 1],       // suelo oscuro: contraste en la parte baja
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
