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

/** Contorno de la foto fila a fila, con precisión de subpíxel: en cada fila, los
    tramos de tela [x0, x1] en coordenadas de 0 a 1 (ancho de la foto). */
function scanRows(image, rows) {
  const SW = 640; // resolución horizontal del escaneo
  const c = document.createElement("canvas");
  c.width = SW;
  c.height = rows + 1;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(image, 0, 0, SW, rows + 1);
  const a = g.getImageData(0, 0, SW, rows + 1).data;
  const T = 128;
  const out = [];
  for (let y = 0; y <= rows; y++) {
    const al = (x) => a[(y * SW + x) * 4 + 3];
    const spans = [];
    let x = 0;
    while (x < SW) {
      if (al(x) < T) { x++; continue; }
      // Borde izquierdo: punto exacto donde el alfa cruza el umbral.
      const l = x > 0 ? x - 1 + (T - al(x - 1)) / Math.max(1, al(x) - al(x - 1)) : 0;
      while (x < SW && al(x) >= T) x++;
      const r = x < SW ? x - 1 + (al(x - 1) - T) / Math.max(1, al(x - 1) - al(x)) : SW - 1;
      // Un pelo hacia dentro: sin el halo del recorte.
      if (r - l > SW * 0.015) spans.push([(l + 0.8) / SW, (r - 0.8) / SW]);
    }
    out.push(spans);
  }
  return out;
}

/** Media móvil de los bordes a lo largo de las filas: contorno limpio, sin temblores. */
function smoothEdges(rows, radius = 2) {
  return rows.map((_, i) => {
    const [l, r] = rows[i];
    let sl = 0, sr = 0, n = 0;
    for (let k = -radius; k <= radius; k++) {
      const q = rows[i + k];
      if (!q) continue;
      sl += q[0]; sr += q[1]; n++;
    }
    return i === 0 || i === rows.length - 1 ? [l, r] : [sl / n, sr / n];
  });
}

/** Malla "puesta" que sigue el contorno de la foto: cada tubo (el cuerpo; en el
    pantalón, la cintura y luego cada pernera) es una sección redondeada por fila,
    con la costura exactamente en el borde. Abierta donde la prenda está abierta:
    bajos, cintura, cuello y sisas del chaleco. */
function wornGeometry(image, w, h, kind) {
  const ROWS = Math.min(200, Math.max(80, Math.round(130 * (h / w))));
  const COLS = 56;
  const scan = scanRows(image, ROWS);
  const legs = kind === "pinza";
  const shoulders = !legs;
  // Primera fila a partir de la cual el pantalón ya son dos perneras hasta abajo.
  let split = ROWS + 1, last = ROWS;
  if (legs) {
    // (Las últimas filas pueden venir sueltas: buscamos el tramo largo de dos perneras.)
    let yb = ROWS;
    while (yb > ROWS * 0.6 && scan[yb].length < 2) yb--;
    let y = yb;
    while (y > 0 && scan[y - 1].length >= 2) y--;
    if (yb - y >= 4) { split = y; last = yb; }
  }
  // Cada tubo: filas { l, r, y, depth(u) }. El chaleco es un solo tubo; el pantalón,
  // dos mitades de la cintura al bajo que se separan suave en la entrepierna.
  const cap = 0.17 * w;
  const SISA = [0.07, 0.4];
  const openAt = (v) => (shoulders && v > SISA[0] && v < SISA[1] ? Math.sin(((v - SISA[0]) / (SISA[1] - SISA[0])) * Math.PI) : 0);
  const ellipse = (u, l, r, reach = 1) => {
    const hw = ((r - l) / 2) * w;
    const D = Math.min(hw * 0.9, cap);
    const t = (2 * (u - l)) / Math.max(1e-6, r - l) - 1;
    return D * Math.sqrt(Math.max(0, 1 - (t * reach) ** 2));
  };
  // Bordes exteriores suavizados a lo largo de las filas (los mismos para la malla y el volumen).
  const raw = [];
  for (let y = 0; y <= last; y++) if (scan[y].length) raw.push([scan[y][0][0], scan[y][scan[y].length - 1][1], y]);
  const sm = smoothEdges(raw.map(([l, r]) => [l, r]), shoulders ? 7 : 4);
  const outer = new Map(raw.map((q, i) => [q[2], sm[i]]));
  const rowsOf = (y) => outer.get(y) || null;
  // Primera fila con tela en cada columna: desde ahí bajan los hombros.
  const BINS = 200;
  const topRow = new Array(BINS + 1).fill(ROWS);
  for (const [y, [l, r]] of outer) {
    for (let b = Math.ceil(l * BINS); b <= Math.floor(r * BINS); b++) if (y < topRow[b]) topRow[b] = y;
  }
  const seamCurve = (d) => { const e = Math.min(1, Math.max(0, d / 9)); return Math.sqrt(e * (2 - e)); };
  const tubes = [];
  if (legs && split <= last) {
    // Centro de la entrepierna: el centro del hueco entre perneras.
    let mid = 0, nm = 0;
    const gapOf = (sp) => {
      let gi = 0, gw = -1;
      for (let k = 0; k < sp.length - 1; k++) if (sp[k + 1][0] - sp[k][1] > gw) { gw = sp[k + 1][0] - sp[k][1]; gi = k; }
      return [sp[gi][1], sp[gi + 1][0]];
    };
    const gaps = [];
    for (let y = split; y <= last; y++) { const g = gapOf(scan[y]); gaps.push(g); mid += (g[0] + g[1]) / 2; nm++; }
    mid /= nm;
    const gsm = smoothEdges(gaps, 3);
    const L = [], Rt = [];
    for (let y = 0; y <= last; y++) {
      const span = rowsOf(y);
      if (!span) continue;
      const [gl, gr] = y >= split ? gsm[y - split] : [mid, mid];
      const s0 = Math.min(1, Math.max(0, (y - (split - 1)) / 7));
      const sLeg = s0 * s0 * (3 - 2 * s0);
      const mk = (l, r) => ({ l, r, y, depth: (u) => ellipse(u, span[0], span[1]) * (1 - sLeg) + ellipse(u, l, r) * sLeg });
      L.push(mk(span[0], gl));
      Rt.push(mk(gr, span[1]));
    }
    tubes.push(L, Rt);
  } else {
    const T = [];
    for (let y = 0; y <= last; y++) {
      const span = rowsOf(y);
      if (!span) continue;
      const reach = 1 - 0.3 * openAt(y / ROWS);
      T.push({ l: span[0], r: span[1], y, depth: (u, l, r) => {
        // Hombros cosidos (fuera del cuello, que queda abierto en el centro).
        const t = Math.abs((2 * (u - l)) / (r - l) - 1);
        const k = Math.min(1, Math.max(0, (t - 0.3) / 0.3));
        const sh = seamCurve(y - topRow[Math.round(u * BINS)]);
        return ellipse(u, l, r, reach) * (1 - k * (1 - sh));
      } });
    }
    tubes.push(T);
  }

  const pos = [], uv = [], index = [];
  const rims = []; // bordes abiertos: [[x, y, z], …] para el ribete
  for (const tube of tubes) {
    if (tube.length < 2) continue;
    const base = pos.length / 3;
    const n = tube.length;
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < n; i++) {
        const { l, r } = tube[i];
        const v = tube[i].y / ROWS;
        for (let j = 0; j <= COLS; j++) {
          const t = (j / COLS) * 2 - 1;
          // Columnas más juntas cerca del borde: la curva del costado sale redonda.
          const u = l + (r - l) * (Math.sin((t * Math.PI) / 2) * 0.5 + 0.5);
          const d = tube[i].depth(u, l, r);
          pos.push((u - 0.5) * w, (0.5 - v) * h, side === 0 ? d : -d);
          uv.push(u, 1 - v);
        }
      }
    }
    const R = COLS + 1;
    const P = (side, i, j) => { const k = (base + side * n * R + i * R + j) * 3; return [pos[k], pos[k + 1], pos[k + 2]]; };
    // Bajo y parte de arriba (cintura o cuello): de costado a costado, por delante y por detrás.
    for (const i of [0, n - 1]) {
      const ring = [];
      for (let j = 0; j <= COLS; j++) ring.push(P(0, i, j));
      for (let j = COLS; j >= 0; j--) ring.push(P(1, i, j));
      rims.push(ring);
    }
    // Sisas: el borde abierto del costado, por delante y por detrás.
    if (shoulders) {
      for (const j of [0, COLS]) {
        const idx = [];
        for (let i = 0; i < n; i++) if (openAt(tube[i].y / ROWS) > 0.004) idx.push(i);
        if (idx.length < 3) continue;
        const ring = idx.map((i) => P(0, i, j)).concat(idx.slice().reverse().map((i) => P(1, i, j)));
        rims.push(ring);
      }
    }
    for (let side = 0; side < 2; side++) {
      const o = base + side * n * R;
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < COLS; j++) {
          const a = o + i * R + j, b = a + 1, c = a + R, d = c + 1;
          if (side === 0) index.push(a, c, b, b, c, d);
          else index.push(a, b, c, b, d, c);
        }
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  geo.userData.rims = rims;
  return geo;
}

/** Una pieza "puesta": volumen de tela por fuera y forro negro por dentro. */
function createWornPiece(piece, w, h, fabric) {
  const g = new THREE.Group();
  const kind = piece.percha === "pinza" ? "pinza" : "hombros";
  const geo = wornGeometry(piece.texture.image, w, h, kind);
  const normal = getWeaveNormal().clone();
  normal.repeat.set(w * 70, h * 70);
  normal.needsUpdate = true;
  const outer = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
    map: piece.texture,
    color: 0xe6e3df,
    side: THREE.FrontSide,
    roughness: 0.86,
    sheen: 0.35,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xfff6ea),
    normalMap: normal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    envMapIntensity: 0.25,
  }));
  if (fabric) useFabricOnSides(outer.material, fabric, kind === "pinza" ? 0.34 : 0.4);
  outer.castShadow = true;
  // Forro liso por dentro (polygonOffset: en las costuras, donde las caras se tocan, gana la tela).
  const lining = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x1f1f20, roughness: 0.75, side: THREE.BackSide,
    polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 8,
  }));
  g.add(outer, lining);
  // Ribete: cada borde abierto (sisas, cuello, cintura, bajos) acaba en un canto de tela
  // con grosor, como una prenda doblemente forrada; nada de bordes de papel.
  const rimMat = rimMaterial(fabric);
  for (const ring of geo.userData.rims) {
    const pts = ring.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    // Fuera los puntos repetidos (donde delante y detrás se tocan).
    const clean = pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 1e-4);
    if (clean.length < 4) continue;
    const curve = new THREE.CatmullRomCurve3(clean, true, "centripetal");
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(400, clean.length * 3), 0.0055, 8, true), rimMat);
    tube.castShadow = true;
    g.add(tube);
  }
  g.userData.cloth = outer;
  return g;
}

const rimMats = new Map();
function rimMaterial(fabric) {
  const key = fabric || "none";
  if (!rimMats.has(key)) {
    const map = fabric ? fabric.clone() : null;
    if (map) { map.repeat.set(6, 1); map.needsUpdate = true; }
    rimMats.set(key, new THREE.MeshStandardMaterial({ color: 0xe6e3df, map, roughness: 0.85 }));
  }
  return rimMats.get(key);
}

/* Costados con la tela de verdad: donde la superficie mira hacia un lado, la
   foto (que ahí se estiraría) se cambia por la muestra de tela fotografiada de
   cerca, proyectada sobre el costado a su tamaño real. Fundido suave, sin corte. */
function useFabricOnSides(material, fabric, tileWidth) {
  const ratio = fabric.image.height / fabric.image.width;
  material.onBeforeCompile = (sh) => {
    sh.uniforms.fabricMap = { value: fabric };
    sh.uniforms.fabricScale = { value: new THREE.Vector2(1 / tileWidth, 1 / (tileWidth * ratio)) };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;\nvObjNormal = normal;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D fabricMap;\nuniform vec2 fabricScale;\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;")
      .replace("#include <map_fragment>", `#include <map_fragment>
        {
          float sideW = smoothstep(0.45, 0.8, abs(normalize(vObjNormal).x));
          vec3 fab = texture2D(fabricMap, vec2(vObjPos.z * sign(vObjNormal.x), vObjPos.y) * fabricScale).rgb;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuse * fab, sideW);
        }`);
  };
  material.customProgramCacheKey = () => "fabric-sides";
}

/**
 * El conjunto completo, montado como en la foto del conjunto (cada pieza en su "caja"),
 * con una altura total `height`. Devuelve un grupo centrado en su origen.
 * @param {Array} pieces  [{ texture, pieza: { caja }, obra: { proporcion } }]
 */
export function createWornOutfit(pieces, height, fabric = null) {
  const group = new THREE.Group();
  const parts = [];
  const prop = pieces[0]?.obra.proporcion || 0.5;
  const setH = height;
  const setW = setH * prop;
  for (const p of pieces) {
    const box = p.pieza.caja || { x: 0, y: 0, w: 100, h: 100 };
    const w = (box.w / 100) * setW;
    const h = w * (p.texture.image.height / p.texture.image.width);
    const part = createWornPiece(p, w, h, fabric);
    part.position.set(((box.x + box.w / 2) / 100 - 0.5) * setW, (0.5 - (box.y + box.h / 2) / 100) * setH, 0);
    part.userData.piece = p;
    group.add(part);
    parts.push(part);
  }
  return { group, parts, width: setW, height: setH };
}
