/* =========================================================
   Una prenda colgada, lo más real posible:
   - la foto de estudio sobre una malla curvada (pecho, caída,
     pliegues suaves), no un cartón plano;
   - textura de tejido en relieve que reacciona a la luz;
   - brillo de tela (sheen) en los bordes;
   - percha de madera negra con gancho cromado, o percha de
     pinzas para pantalones;
   - sombra suave proyectada sobre el fondo de la hornacina.
   ========================================================= */
import * as THREE from "three";

let weaveNormal = null;

/** Mapa de relieve de un tejido de algodón (trama y urdimbre), generado una vez. */
function getWeaveNormal() {
  if (weaveNormal) return weaveNormal;
  const N = 128;
  const h = new Float32Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = (x / N) * Math.PI * 2 * 16;
      const v = (y / N) * Math.PI * 2 * 16;
      // Hilos que pasan por encima y por debajo, alternando.
      const warp = Math.sin(u) * 0.5 + 0.5;
      const weft = Math.sin(v) * 0.5 + 0.5;
      const over = Math.sin(u / 2) * Math.sin(v / 2) > 0 ? warp : weft;
      h[y * N + x] = over + (Math.random() - 0.5) * 0.08;
    }
  }
  const data = new Uint8Array(N * N * 4);
  const at = (x, y) => h[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 1.2;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 1.2;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * N + x) * 4;
      data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  weaveNormal = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  weaveNormal.wrapS = weaveNormal.wrapT = THREE.RepeatWrapping;
  weaveNormal.generateMipmaps = true;
  weaveNormal.minFilter = THREE.LinearMipmapLinearFilter;
  weaveNormal.magFilter = THREE.LinearFilter;
  weaveNormal.needsUpdate = true;
  return weaveNormal;
}

/** Malla de tela: curvada hacia delante en el centro, con caída y pliegues. */
function clothGeometry(w, h, kind) {
  const geo = new THREE.PlaneGeometry(w, h, 48, 64);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = x / (w / 2);          // -1 izquierda … 1 derecha
    const v = 0.5 - y / h;          // 0 arriba … 1 abajo
    const across = Math.pow(Math.max(0, Math.cos((u * Math.PI) / 2)), 0.7);
    let z;
    if (kind === "pinza") {
      // Pantalón: la cintura plana entre pinzas, las perneras con volumen.
      const leg = Math.pow(Math.abs(Math.sin(u * Math.PI)), 0.8);
      z = 0.05 * across * Math.min(1, v * 3) + 0.03 * leg * v;
    } else {
      // Prenda de hombros: volumen de pecho que se suaviza hacia el bajo.
      z = 0.08 * across * (0.55 + 0.45 * Math.sin(Math.min(1, v * 1.4) * Math.PI));
    }
    z -= 0.03 * Math.pow(Math.abs(u), 6);                 // los bordes se van hacia atrás
    z += 0.006 * Math.sin(u * 13 + v * 3) * v;             // pliegues de caída, más abajo
    pos.setZ(i, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Sombra suave con la silueta de la prenda (para el fondo de la hornacina). */
function shadowTexture(image) {
  const S = 256;
  const ratio = image.width / image.height;
  const cw = ratio >= 1 ? S : Math.round(S * ratio);
  const ch = ratio >= 1 ? Math.round(S / ratio) : S;
  const pad = 40;
  const c = document.createElement("canvas");
  c.width = cw + pad * 2;
  c.height = ch + pad * 2;
  const ctx = c.getContext("2d");
  ctx.filter = "blur(14px)";
  ctx.drawImage(image, pad, pad, cw, ch);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { texture: t, scale: c.width / cw };
}

// El gancho abraza el soporte cromado: centro del arco y radio (relativos a la percha).
export const HOOK_R = 0.024;
export const HOOK_CENTER = { x: -HOOK_R, y: 0.08 };

const hangerWood =new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.42, metalness: 0.05 });

/** Percha de madera negra (hombros) o de pinzas (pantalón), con gancho cromado. */
function createHanger(kind, chrome, width) {
  const g = new THREE.Group();
  // Gancho: sube del centro y se curva sobre el soporte (que pasa por HOOK_CENTER).
  const hook = [new THREE.Vector3(0, -0.01, 0), new THREE.Vector3(0, 0.04, 0), new THREE.Vector3(0, HOOK_CENTER.y - 0.012, 0)];
  for (let a = 0; a <= Math.PI * 1.15; a += 0.15) {
    hook.push(new THREE.Vector3(HOOK_CENTER.x + HOOK_R * Math.cos(a), HOOK_CENTER.y + HOOK_R * Math.sin(a), 0));
  }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hook), 48, 0.0035, 8), chrome));

  if (kind === "pinza") {
    // Barra recta con dos pinzas.
    const bar = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.022, 0.014), hangerWood);
    bar.position.y = -0.015;
    g.add(bar);
    for (const s of [-1, 1]) {
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.045, 0.022), chrome);
      clip.position.set(s * (width / 2 - 0.06), -0.045, 0.004);
      g.add(clip);
    }
  } else {
    // Hombros curvos y anchos, como una percha de sastre.
    const half = width / 2 - 0.02;
    const pts = [
      new THREE.Vector3(-half, -0.075, 0),
      new THREE.Vector3(-half * 0.55, -0.035, 0),
      new THREE.Vector3(0, -0.012, 0),
      new THREE.Vector3(half * 0.55, -0.035, 0),
      new THREE.Vector3(half, -0.075, 0),
    ];
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.012, 10), hangerWood);
    tube.scale.z = 1.6; // perfil ancho, no un alambre
    g.add(tube);
  }
  return g;
}

/**
 * @param {object} piece  { texture, width, height, percha }
 * @param {THREE.Material} chrome
 * @returns {THREE.Group} con userData.cloth (para seleccionarla) y userData.shadow
 */
export function createGarment(piece, chrome) {
  const group = new THREE.Group();
  const swing = new THREE.Group(); // pivota en el gancho
  group.add(swing);

  const kind = piece.percha === "pinza" ? "pinza" : "hombros";
  const normal = getWeaveNormal().clone();
  normal.repeat.set(piece.width * 70, piece.height * 70); // hilos a escala real
  normal.needsUpdate = true;

  const material = new THREE.MeshPhysicalMaterial({
    map: piece.texture,
    alphaTest: 0.5,
    alphaToCoverage: true, // bordes limpios, sin dientes
    side: THREE.DoubleSide,
    roughness: 0.86,
    metalness: 0,
    sheen: 0.35,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xfff6ea),
    normalMap: normal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    envMapIntensity: 0.25, // la tela no es espejo: casi todo el volumen lo da el foco
  });
  const cloth = new THREE.Mesh(clothGeometry(piece.width, piece.height, kind), material);
  // La parte alta de la prenda queda en los hombros de la percha (o entre las pinzas).
  const top = kind === "pinza" ? -0.035 : -0.02;
  cloth.position.y = top - piece.height / 2;
  swing.add(cloth);

  const hanger = createHanger(kind, chrome, Math.min(0.46, piece.width * 0.9));
  // La percha de hombros queda dentro de la prenda (solo asoma el gancho);
  // la de pinzas, por delante, agarrando la cintura.
  hanger.position.z = kind === "pinza" ? 0.03 : -0.008;
  swing.add(hanger);

  // Sombra en el fondo: un poco más abajo, como si la luz viniera de arriba.
  const sh = shadowTexture(piece.texture.image);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(piece.width * sh.scale, piece.height * sh.scale),
    new THREE.MeshBasicMaterial({ map: sh.texture, transparent: true, opacity: 0.6, depthWrite: false }),
  );
  shadow.position.y = cloth.position.y - 0.06;

  group.userData = { cloth, swing, shadow, piece };
  return group;
}
