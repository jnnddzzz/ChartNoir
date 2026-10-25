/* =========================================================
   Una prenda colgada, lo más real posible:
   - la foto de estudio sobre una malla curvada (pecho, caída,
     pliegues suaves), no un cartón plano;
   - textura de tejido en relieve que reacciona a la luz;
   - brillo de tela (sheen) en los bordes;
   - percha de madera negra con gancho cromado, o percha de
     pinzas para pantalones;
   - sombra real (silueta exacta) sobre el fondo de la hornacina,
     o una sombra suave pintada donde no hay foco con sombras.
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

const hangerWood = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.42, metalness: 0.05 });

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
    // Barra fina de acero con dos pinzas.
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, width * 0.92, 16), chrome);
    bar.rotation.z = Math.PI / 2;
    bar.position.y = -0.02;
    g.add(bar);
    for (const s of [-1, 1]) {
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.034, 0.016), chrome);
      clip.position.set(s * (width * 0.46 - 0.02), -0.04, 0.004);
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
    color: 0xe6e3df, // un punto por debajo del blanco: el estampado conserva su color bajo el foco
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
  // Sombra real con la silueta exacta de la prenda (no un rectángulo).
  cloth.castShadow = true;
  cloth.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking, map: piece.texture, alphaTest: 0.5,
  });
  // La parte alta de la prenda queda en los hombros de la percha (o entre las pinzas).
  const top = kind === "pinza" ? -0.035 : -0.02;
  cloth.position.y = top - piece.height / 2;
  swing.add(cloth);

  const hanger = createHanger(kind, chrome, Math.min(0.46, piece.width * 0.9));
  // La percha de hombros queda dentro de la prenda (solo asoma el gancho);
  // la de pinzas, por delante, agarrando la cintura.
  hanger.position.z = kind === "pinza" ? 0.03 : -0.008;
  hanger.traverse((o) => { if (o.isMesh) o.castShadow = true; });
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

/* =========================================================
   El conjunto "puesto", flotando (maniquí invisible):
   cada pieza es un volumen cerrado, delante y detrás, que sale
   de la silueta de su foto: en cada altura se mide el ancho de
   la tela (y en el pantalón, cada pernera por separado) y se le
   da una sección redondeada, como un cuerpo dentro de la prenda.
   Así se puede girar 360°. Por dentro, el forro en negro.
   ========================================================= */

/** Profundidad (mitad del grosor) de la prenda en cada punto de la rejilla. */
function bodyDepth(image, GX, GY, width) {
  const c = document.createElement("canvas");
  c.width = GX + 1;
  c.height = GY + 1;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(image, 0, 0, GX + 1, GY + 1);
  const a = g.getImageData(0, 0, GX + 1, GY + 1).data;
  const W = GX + 1;
  const depth = new Float32Array(W * (GY + 1));
  const mask = new Uint8Array(W * (GY + 1));
  const cell = width / GX;
  const cap = 0.17 * width; // un torso no es más hondo que esto
  for (let y = 0; y <= GY; y++) {
    let x = 0;
    while (x <= GX) {
      if (a[(y * W + x) * 4 + 3] < 110) { x++; continue; }
      const x0 = x;
      while (x <= GX && a[(y * W + x) * 4 + 3] >= 110) x++;
      const x1 = x - 1;
      // Tramo de tela: sección redondeada de lado a lado.
      const c0 = (x0 + x1) / 2;
      const hw = Math.max(0.5, (x1 - x0) / 2 + 0.5);
      const D = Math.min(hw * cell * 0.9, cap);
      for (let k = x0; k <= x1; k++) {
        const t = Math.min(1, Math.abs(k - c0) / hw);
        depth[y * W + k] = D * Math.sqrt(1 - t * t);
        mask[y * W + k] = 1;
      }
    }
  }
  // Suavizado en vertical y horizontal (solo dentro de la tela): sin escalones.
  const tmp = new Float32Array(depth.length);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y <= GY; y++) {
      for (let x = 0; x <= GX; x++) {
        const i = y * W + x;
        if (!mask[i]) { tmp[i] = 0; continue; }
        let s = 0, n = 0;
        for (let dy = -2; dy <= 2; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy > GY) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx > GX || !mask[yy * W + xx]) continue;
            s += depth[yy * W + xx]; n++;
          }
        }
        tmp[i] = s / n;
      }
    }
    depth.set(tmp);
  }
  // Distancia (en celdas) de cada punto al borde de la tela: cerca del contorno la
  // prenda se afina hasta cero, para que delante y detrás se cierren sin huecos.
  const dist = new Float32Array(depth.length);
  for (let i = 0; i < dist.length; i++) dist[i] = mask[i] ? 1e4 : 0;
  const relax = (i, j, c) => { if (dist[j] + c < dist[i]) dist[i] = dist[j] + c; };
  for (let y = 0; y <= GY; y++) for (let x = 0; x <= GX; x++) {
    const i = y * W + x;
    if (x > 0) relax(i, i - 1, 1);
    if (y > 0) { relax(i, i - W, 1); if (x > 0) relax(i, i - W - 1, 1.41); if (x < GX) relax(i, i - W + 1, 1.41); }
  }
  for (let y = GY; y >= 0; y--) for (let x = GX; x >= 0; x--) {
    const i = y * W + x;
    if (x < GX) relax(i, i + 1, 1);
    if (y < GY) { relax(i, i + W, 1); if (x < GX) relax(i, i + W + 1, 1.41); if (x > 0) relax(i, i + W - 1, 1.41); }
  }
  for (let i = 0; i < depth.length; i++) {
    const e = Math.min(1, Math.max(0, (dist[i] - 2.5) / 5));
    depth[i] *= Math.sqrt(e * (2 - e)); // curva redonda, no un escalón
  }
  return depth;
}

/** Malla cerrada: la cara de delante (z > 0) y la de detrás (z < 0) se juntan en el contorno. */
function wornGeometry(image, w, h) {
  const GX = 110;
  const GY = Math.max(40, Math.round(GX * (h / w)));
  const depth = bodyDepth(image, GX, GY, w);
  const W = GX + 1;
  const n = W * (GY + 1);
  const pos = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  for (let side = 0; side < 2; side++) {
    for (let y = 0; y <= GY; y++) {
      for (let x = 0; x <= GX; x++) {
        const i = y * W + x;
        const o = side * n + i;
        const v = y / GY;
        // Caída suave: la tela se mete un poco hacia dentro en el bajo.
        const d = depth[i] * (1 - 0.08 * v);
        pos[o * 3] = (x / GX - 0.5) * w;
        pos[o * 3 + 1] = (0.5 - v) * h;
        pos[o * 3 + 2] = side === 0 ? d : -d;
        uv[o * 2] = x / GX;
        uv[o * 2 + 1] = 1 - v;
      }
    }
  }
  const index = [];
  for (let side = 0; side < 2; side++) {
    for (let y = 0; y < GY; y++) {
      for (let x = 0; x < GX; x++) {
        const a = side * n + y * W + x, b = a + 1, c = a + W, d = c + 1;
        if (side === 0) index.push(a, c, b, b, c, d);
        else index.push(a, b, c, b, d, c);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

/** Una pieza "puesta": volumen de tela por fuera y forro negro por dentro. */
function createWornPiece(piece, w, h) {
  const g = new THREE.Group();
  const geo = wornGeometry(piece.texture.image, w, h);
  const normal = getWeaveNormal().clone();
  normal.repeat.set(w * 70, h * 70);
  normal.needsUpdate = true;
  const outer = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
    map: piece.texture,
    color: 0xe6e3df,
    alphaTest: 0.5,
    alphaToCoverage: true,
    side: THREE.FrontSide,
    roughness: 0.86,
    sheen: 0.35,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xfff6ea),
    normalMap: normal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    envMapIntensity: 0.25,
  }));
  outer.castShadow = true;
  outer.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: piece.texture, alphaTest: 0.5 });
  // (polygonOffset: en el contorno, donde las dos caras se tocan, siempre gana la tela.)
  const lining = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x1a1819, roughness: 0.7, map: piece.texture, alphaTest: 0.5, side: THREE.BackSide,
    polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 8,
  }));
  lining.material.onBeforeCompile = (s) => {
    // Forro liso: del mapa solo nos interesa el recorte (alfa), no el estampado.
    s.fragmentShader = s.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n diffuseColor.rgb = diffuse;");
  };
  g.add(outer, lining);
  g.userData.cloth = outer;
  return g;
}

/**
 * El conjunto completo, montado como en la foto del conjunto (cada pieza en su "caja"),
 * con una altura total `height`. Devuelve un grupo centrado en su origen.
 * @param {Array} pieces  [{ texture, pieza: { caja }, obra: { proporcion } }]
 */
export function createWornOutfit(pieces, height) {
  const group = new THREE.Group();
  const parts = [];
  const prop = pieces[0]?.obra.proporcion || 0.5;
  const setH = height;
  const setW = setH * prop;
  for (const p of pieces) {
    const box = p.pieza.caja || { x: 0, y: 0, w: 100, h: 100 };
    const w = (box.w / 100) * setW;
    const h = w * (p.texture.image.height / p.texture.image.width);
    const part = createWornPiece(p, w, h);
    part.position.set(((box.x + box.w / 2) / 100 - 0.5) * setW, (0.5 - (box.y + box.h / 2) / 100) * setH, 0);
    part.userData.piece = p;
    group.add(part);
    parts.push(part);
  }
  return { group, parts, width: setW, height: setH };
}
