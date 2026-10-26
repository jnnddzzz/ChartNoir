/* =========================================================
   Texturas generadas por código (sin descargas extra):
   - mármol negro con vetas finas (suelo y peanas);
   - acanalado vertical (relieve de las puertas de laca);
   - madera ahumada con veta (fondo de las hornacinas);
   - placa de acero con texto grabado (Nº de cada obra).
   Todo nítido: líneas finas, nada desenfocado.
   ========================================================= */
import * as THREE from "three";

// Generador pseudoaleatorio con semilla: el mármol sale igual en cada visita.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvasTexture(c, { srgb = true, repeat = [1, 1] } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

/** Mármol Nero Marquina: negro profundo con vetas blancas finas. */
export function marbleTexture(size = 1024, seed = 7) {
  const r = rng(seed);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  g.fillStyle = "#121214";
  g.fillRect(0, 0, size, size);
  // Nubes de tono muy sutiles (variación de la piedra).
  for (let i = 0; i < 60; i++) {
    const x = r() * size, y = r() * size, rad = 60 + r() * 220;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, `rgba(40,40,44,${0.05 + r() * 0.06})`);
    grad.addColorStop(1, "rgba(40,40,44,0)");
    g.fillStyle = grad;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // Vetas: trazos largos que serpentean, con ramificaciones finas.
  const vein = (x, y, ang, len, width, alpha) => {
    g.beginPath();
    g.moveTo(x, y);
    for (let i = 0; i < len; i++) {
      ang += (r() - 0.5) * 0.35;
      x += Math.cos(ang) * 6;
      y += Math.sin(ang) * 6;
      g.lineTo(x, y);
      if (r() < 0.02 && width > 0.6) vein(x, y, ang + (r() - 0.5) * 1.6, len * 0.35, width * 0.5, alpha * 0.7);
    }
    g.strokeStyle = `rgba(225,226,230,${alpha})`;
    g.lineWidth = width;
    g.stroke();
  };
  for (let i = 0; i < 16; i++) vein(r() * size, r() * size, r() * Math.PI * 2, 120 + r() * 160, 0.7 + r() * 1.8, 0.28 + r() * 0.35);
  for (let i = 0; i < 40; i++) vein(r() * size, r() * size, r() * Math.PI * 2, 30 + r() * 60, 0.4 + r() * 0.5, 0.08 + r() * 0.12);
  // Grano fino de la piedra.
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 6;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  return canvasTexture(c);
}

/** Relieve acanalado vertical (mapa de normales) para puertas de laca. */
export function flutedNormal(flutes = 12, size = 256) {
  const data = new Uint8Array(size * 4);
  for (let x = 0; x < size; x++) {
    const u = (x / size) * flutes; // posición dentro de cada canal
    const f = u - Math.floor(u);
    // Perfil redondeado de cada canal: pendiente = derivada del semicírculo.
    const s = (f - 0.5) * 2;
    const slope = -s / Math.sqrt(Math.max(0.02, 1 - s * s)) * 0.6;
    const len = Math.hypot(slope, 1);
    data[x * 4] = ((slope / len) * 0.5 + 0.5) * 255;
    data[x * 4 + 1] = 128;
    data[x * 4 + 2] = ((1 / len) * 0.5 + 0.5) * 255;
    data[x * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/** Madera de roble ahumado, casi negra, con veta vertical fina. */
export function smokedOakTexture(size = 512, seed = 3) {
  const r = rng(seed);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  g.fillStyle = "#16120f";
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) {
    const x = r() * size;
    g.strokeStyle = r() < 0.5 ? `rgba(60,48,38,${0.15 + r() * 0.25})` : `rgba(5,4,3,${0.2 + r() * 0.3})`;
    g.lineWidth = 0.5 + r() * 1.8;
    g.beginPath();
    let xx = x;
    g.moveTo(xx, 0);
    for (let y = 0; y <= size; y += 16) {
      xx += (r() - 0.5) * 1.6;
      g.lineTo(xx, y);
    }
    g.stroke();
  }
  return canvasTexture(c);
}

/** Placa de acero cepillado con texto grabado. */
export function plaqueTexture(lines) {
  const W = 512, H = 128;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#9a9da2"); grad.addColorStop(0.5, "#c9ccd1"); grad.addColorStop(1, "#8d9095");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  // Cepillado horizontal.
  const r = rng(11);
  for (let y = 0; y < H; y++) {
    g.fillStyle = `rgba(255,255,255,${r() * 0.08})`;
    g.fillRect(0, y, W, 1);
  }
  g.fillStyle = "#1a1a1c";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "600 34px 'Archivo', 'Helvetica Neue', Arial, sans-serif";
  g.fillText(lines[0], W / 2, H * 0.4);
  g.font = "400 20px 'Archivo', 'Helvetica Neue', Arial, sans-serif";
  g.fillText(lines[1] || "", W / 2, H * 0.74);
  const t = canvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Panel retroiluminado: blanco suave en el centro que se apaga hacia los bordes.
    Es la luz que hay detrás del conjunto, como en una caja de luz de museo. */
export function haloTexture(size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size * 0.46, 0, size / 2, size * 0.5, size * 0.52);
  grad.addColorStop(0, "#f4f4f6");
  grad.addColorStop(0.35, "#8d8f94");
  grad.addColorStop(0.7, "#1c1d20");
  grad.addColorStop(1, "#000000");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Friso con letras grabadas en acero, como en la entrada de un museo. */
export function friezeTexture(text) {
  const W = 1024, H = 96;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#0b0b0c";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#3a3b3f";
  g.fillRect(0, 6, W, 1);
  g.fillRect(0, H - 7, W, 1);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "500 46px 'Archivo', 'Helvetica Neue', Arial, sans-serif";
  if ("fontStretch" in g) g.fontStretch = "extra-condensed";
  if ("letterSpacing" in g) g.letterSpacing = "16px";
  // Sombra fina debajo y luz arriba: letras rehundidas en el metal.
  g.fillStyle = "#000";
  g.fillText(text, W / 2, H / 2 + 2);
  const grad = g.createLinearGradient(0, H * 0.25, 0, H * 0.75);
  grad.addColorStop(0, "#e6e8ec"); grad.addColorStop(1, "#8f9297");
  g.fillStyle = grad;
  g.fillText(text, W / 2, H / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Cartela de museo (tarjeta clara) o texto de pared (oscuro): líneas de
    [texto, tamaño, peso, espacio después]; los textos largos se parten solos. */
export function cardTexture(lines, { w = 512, h = 640, bg = "#efece6", fg = "#16161a", pad = 50, top = 70, align = "left" } = {}) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.textAlign = align;
  if ("fontStretch" in g) g.fontStretch = "normal";
  const x = align === "center" ? w / 2 : pad;
  let y = top;
  for (const [text, size, weight, gap, opts = {}] of lines) {
    g.font = `${weight} ${size}px 'Archivo', 'Helvetica Neue', Arial, sans-serif`;
    if ("fontStretch" in g) g.fontStretch = opts.narrow ? "extra-condensed" : "normal";
    if ("letterSpacing" in g) g.letterSpacing = opts.track ? `${opts.track}px` : "0px";
    g.fillStyle = opts.color || fg;
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (g.measureText(test).width > w - pad * 2 && line) {
        g.fillText(line, x, y); y += size * 1.3; line = word;
      } else line = test;
    }
    g.fillText(line, x, y);
    y += size * 1.3 + gap;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Anillo de letras grabadas en el suelo, alrededor del símbolo (para un RingGeometry
    de radio exterior `outer`: el texto va en el radio `radius`). */
export function ringTextTexture(text, radius, outer) {
  const S = 2048;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  g.clearRect(0, 0, S, S);
  const R = (radius / outer) * (S / 2);
  g.font = "500 46px 'Archivo', 'Helvetica Neue', Arial, sans-serif";
  if ("fontStretch" in g) g.fontStretch = "extra-condensed";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#e6e8ec";
  // Repartimos las letras por toda la vuelta, con aire entre ellas.
  const chars = [...text];
  const widths = chars.map((ch) => g.measureText(ch).width + 14);
  const total = widths.reduce((a, b) => a + b, 0);
  const scale = (2 * Math.PI * R) / total;
  let a = -Math.PI / 2;
  chars.forEach((ch, i) => {
    const w = widths[i] * scale;
    const mid = a + w / (2 * R);
    g.save();
    g.translate(S / 2 + Math.cos(mid) * R, S / 2 + Math.sin(mid) * R);
    g.rotate(mid + Math.PI / 2);
    g.fillText(ch, 0, 0);
    g.restore();
    a += w / R;
  });
  // Dos filetes finos que enmarcan el texto.
  g.strokeStyle = "rgba(201,204,209,0.55)";
  g.lineWidth = 2;
  for (const dr of [-44, 44]) { g.beginPath(); g.arc(S / 2, S / 2, R + dr, 0, Math.PI * 2); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
