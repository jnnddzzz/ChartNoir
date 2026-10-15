/* =========================================================
   Escenario 3D: renderizador, cámara, luces y encuadre.
   Fondo negro puro. Sin niebla, sin suelo, sin paredes,
   sin postprocesado. Solo el logo.
   ========================================================= */
import * as THREE from "three";
import { MAX_PIXEL_RATIO } from "../config.js";

// El prototipo aprobado se hizo con Three.js r128, que trataba los colores
// hex tal cual y multiplicaba las luces por PI. Las versiones actuales lo
// hacen "físicamente correcto", lo que oscurece el logo. Estas dos líneas
// reproducen exactamente el brillo aprobado:
THREE.ColorManagement.enabled = false;
const LEGACY = Math.PI;

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // nada que apague el blanco hueso

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);

  // Reflejo solo para el logo: tres paneles blancos invisibles que dan brillo
  // a la superficie. No iluminan nada más porque solo existen en este mapa.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x000000);
  const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  for (const [w, h, x, y, z] of [[16, 2.5, 0, 8, 5], [2.5, 12, -10, 1, 5], [2.5, 12, 10, 1, 5]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), panelMat);
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    envScene.add(panel);
  }
  const envMap = pmrem.fromScene(envScene, 0.02).texture;
  envScene.traverse((o) => o.geometry?.dispose());
  panelMat.dispose();
  pmrem.dispose();

  // Luces limpias, blancas.
  scene.add(new THREE.AmbientLight(0xffffff, 0.55 * LEGACY));
  const key = new THREE.DirectionalLight(0xffffff, 1.1 * LEGACY);
  key.position.set(0, 3, 10);
  scene.add(key);
  const side = new THREE.DirectionalLight(0xffffff, 0.5 * LEGACY);
  side.position.set(-8, 4, 2);
  scene.add(side);

  // La luz que sigue al cursor por la superficie del logo.
  const cursorLight = new THREE.PointLight(0xffffff, 1.4 * LEGACY, 20, 2);
  cursorLight.position.set(0, 0, 5);
  scene.add(cursorLight);

  // Encuadre: calcula a qué distancia poner la cámara para que el logo
  // (10 de ancho) quepa siempre en la portada, en horizontal y en vertical.
  const view = { dist: 30, baseY: 1 };
  function fit() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    view.dist = Math.max(6.2 / Math.tan(hFov / 2), 7.6 / Math.tan(vFov / 2));
    const visibleHeight = 2 * view.dist * Math.tan(vFov / 2);
    // El logo sube un poco para dejar sitio al mensaje de abajo.
    view.baseY = visibleHeight * (w < 600 ? 0.13 : 0.12);
    camera.updateProjectionMatrix();
  }
  fit();
  new ResizeObserver(fit).observe(canvas);

  return { renderer, scene, camera, envMap, cursorLight, view };
}
