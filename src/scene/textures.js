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
