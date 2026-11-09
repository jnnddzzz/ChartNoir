/* =========================================================
   Génesis en 3D: el maniquí con el conjunto puesto, modelado y
   simulado en Blender (scripts/genesis3d/build.py) y guardado
   en public/productos/obra-001/genesis.glb.

   Aquí se viste: tela toile a su escala real (la muestra de
   tela de la obra), relieve de tejido, brillo de algodón, forro
   por dentro y las sombras de contacto que vienen horneadas en
   los vértices. Al girar, la tela tiene inercia: los bajos del
   pantalón se quedan un poco atrás, se abren con el giro y se
   asientan con un leve vaivén al pararse.
   ========================================================= */
import * as THREE from "three";
import { weaveTexture } from "./garment.js";

// Altura real del modelo (persona de 1,80 m) y zonas que se mueven con el giro.
export const MODEL = { height: 1.8, pantsTop: 1.045, pantsHem: 0.355, vestTop: 1.36, vestHem: 1.03 };

/** Inercia de la tela: un muelle amortiguado que sigue la velocidad de giro. */
function swayShader(material, uniforms, { top, bottom, amount }) {
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uTwist = uniforms.twist;
    sh.uniforms.uFlare = uniforms.flare;
    const head = `
      uniform float uTwist;
      uniform float uFlare;
      float swayW(float y) { float w = clamp((${top.toFixed(3)} - y) / ${(top - bottom).toFixed(3)}, 0.0, 1.0); return w * w * ${amount.toFixed(2)}; }
      vec3 swayP(vec3 p) {
        float w = swayW(p.y);
        float a = uTwist * w;
        float c = cos(a), s = sin(a);
        vec3 q = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
        q.xz *= 1.0 + uFlare * w;
        return q;
      }
      vec3 swayN(vec3 p, vec3 n) {
        float a = uTwist * swayW(p.y);
        float c = cos(a), s = sin(a);
        return vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
      }
    `;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\n" + head)
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nobjectNormal = swayN(position, objectNormal);")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed = swayP(transformed);");
  };
  material.customProgramCacheKey = () => `sway-${top}-${amount}`;
}

/**
 * @param {THREE.Group} scene  la escena del GLB
 * @param {THREE.Texture} toile muestra de tela repetible (UV del modelo en unidades de muestra)
 * @param {THREE.Material[]} reflective  se añade la laca del maniquí (refleja la sala)
 */
export function dressGenesis(scene, toile, reflective = []) {
  const root = scene.clone(true);
  const uniforms = { twist: { value: 0 }, flare: { value: 0 } };
  const normal = weaveTexture();
  const n2 = normal.clone();
  n2.repeat.set(26, 26); // hilos a escala real sobre la muestra
  n2.needsUpdate = true;

  const fabric = (zone, ao) => {
    const m = new THREE.MeshPhysicalMaterial({
      map: toile,
      color: 0xf2eee8,
      vertexColors: ao,         // sombras de contacto horneadas
      roughness: 0.82,
      sheen: 0.5,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color(0xfff4e6),
      normalMap: n2,
      normalScale: new THREE.Vector2(0.35, 0.35),
      envMapIntensity: 0.3,
    });
    swayShader(m, uniforms, zone);
    return m;
  };
  const lining = (zone, ao) => {
    const m = new THREE.MeshStandardMaterial({ color: 0xd8d0c4, vertexColors: ao, roughness: 0.9 });
    swayShader(m, uniforms, zone);
    return m;
  };
  const lacquerFor = (ao) => {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0x1d1e22, metalness: 0.45, roughness: 0.2,
      clearcoat: 1, clearcoatRoughness: 0.07, vertexColors: ao,
    });
    reflective.push(m);
    return m;
  };

  const pantsZone = { top: MODEL.pantsTop, bottom: MODEL.pantsHem, amount: 1 };
  const vestZone = { top: MODEL.vestTop, bottom: MODEL.vestHem, amount: 0.25 };
  const cloths = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    // Cada pieza se reconoce por su material (Tela_chaleco, Forro_pantalon…).
    const name = String(o.material?.name || "").toLowerCase();
    const zone = name.includes("chaleco") ? vestZone : name.includes("pantalon") ? pantsZone : null;
    const outer = !name.includes("forro");
    o.name = zone ? (zone === vestZone ? "chaleco" : "pantalon") + (outer ? "" : "_forro") : "maniqui";
    const ao = !!o.geometry.attributes.color; // (sin sombras horneadas, sin teñir)
    if (!zone) o.material = lacquerFor(ao);
    else if (outer) { o.material = fabric(zone, ao); cloths.push(o); }
    else o.material = lining(zone, ao);
    o.castShadow = true;
    o.receiveShadow = false;   // las sombras finas vienen horneadas: sin manchas raras
  });

  // Muelle de la tela: la velocidad de giro empuja, la tela sigue y se asienta.
  let twist = 0, tv = 0, last = null, lastSpin = 0;
  function update(spin, t) {
    const now = t;
    const dt = last === null ? 1 / 60 : Math.min(0.05, Math.max(1 / 240, now - last));
    last = now;
    const vel = (spin - lastSpin) / dt;     // rad/s
    lastSpin = spin;
    const target = THREE.MathUtils.clamp(-vel * 0.09, -0.22, 0.22);
    // Muelle con poca amortiguación: se pasa un poco y vuelve (vaivén natural).
    tv += ((target - twist) * 38 - tv * 6.5) * dt;
    twist += tv * dt;
    uniforms.twist.value = twist;
    uniforms.flare.value = Math.min(0.06, Math.abs(vel) * 0.012);
  }
  return { root, cloths, update, height: MODEL.height };
}
