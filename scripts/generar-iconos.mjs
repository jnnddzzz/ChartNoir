/* =========================================================
   Genera los iconos de la web a partir del trazado oficial
   (assets/logo-shapes.json):
     public/favicon.svg  → monograma hueso sobre negro
     public/logo.svg     → logo completo (plan B sin WebGL)
   Uso: npm run iconos
   ========================================================= */
import { readFileSync, writeFileSync } from "node:fs";

const shapes = JSON.parse(readFileSync(new URL("../assets/logo-shapes.json", import.meta.url)));
const HUESO = "#F2EEE8";
const SANGRE = "#8E1426";

// Contorno → trozo de path SVG (la Y del SVG va hacia abajo, por eso -y).
const ring = (pts) => "M" + pts.map(([x, y]) => `${x.toFixed(3)} ${(-y).toFixed(3)}`).join("L") + "Z";
const pathOf = (s) => ring(s.o) + s.h.map(ring).join("");

function bounds(list) {
  const xs = list.flatMap((s) => s.o.map((p) => p[0]));
  const ys = list.flatMap((s) => s.o.map((p) => -p[1]));
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

// Favicon: solo el monograma, centrado en un cuadrado negro.
const mono = shapes.filter((s) => s.t === 0);
const b = bounds(mono);
const side = Math.max(b.x1 - b.x0, b.y1 - b.y0) * 1.12;
const cx = (b.x0 + b.x1) / 2;
const cy = (b.y0 + b.y1) / 2;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(cx - side / 2).toFixed(3)} ${(cy - side / 2).toFixed(3)} ${side.toFixed(3)} ${side.toFixed(3)}">
<rect x="${(cx - side / 2).toFixed(3)}" y="${(cy - side / 2).toFixed(3)}" width="${side.toFixed(3)}" height="${side.toFixed(3)}" fill="#000"/>
<path fill="${HUESO}" fill-rule="evenodd" d="${mono.map(pathOf).join("")}"/>
</svg>
`;

// Logo completo, sin fondo. Las letras con un fino filo rojo, como los cantos del 3D.
const all = bounds(shapes);
const pad = 0.1;
const text = shapes.filter((s) => s.t === 1);
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(all.x0 - pad).toFixed(3)} ${(all.y0 - pad).toFixed(3)} ${(all.x1 - all.x0 + pad * 2).toFixed(3)} ${(all.y1 - all.y0 + pad * 2).toFixed(3)}">
<title>Chart Noir</title>
<path fill="${HUESO}" fill-rule="evenodd" d="${mono.map(pathOf).join("")}"/>
<path fill="${HUESO}" fill-rule="evenodd" stroke="${SANGRE}" stroke-width="0.012" d="${text.map(pathOf).join("")}"/>
</svg>
`;

writeFileSync(new URL("../public/favicon.svg", import.meta.url), favicon);
writeFileSync(new URL("../public/logo.svg", import.meta.url), logo);
console.log("Iconos generados en public/");
