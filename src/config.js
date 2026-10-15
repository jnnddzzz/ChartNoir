/* =========================================================
   AJUSTES DE CHART NOIR
   Lo que más vas a querer cambiar está aquí.
   ========================================================= */

// Fecha y hora del primer drop (hora de España).
// "+01:00" = horario de invierno (CET). En verano sería "+02:00".
export const DROP_DATE = new Date("2026-12-01T00:00:00+01:00");

// Datos del drop que se muestran en la web (provisionales: cámbialos cuando estén cerrados).
export const DROP = {
  numero: "001",
  unidades: 150,
  ejemploSerie: "027", // número de ejemplo de la etiqueta: Nº 027/150
  precios: [
    ["Sudaderas", "70–80 €"],
    ["Pantalones", "70–80 €"],
    ["Conjunto", "150 €"],
  ],
};

// Redes. Pon aquí los enlaces reales cuando estén las cuentas;
// mientras estén vacíos, la web muestra "Muy pronto" en vez de un enlace roto.
export const REDES = {
  instagram: "", // ej. "https://www.instagram.com/tu_usuario"
  tiktok: "",    // ej. "https://www.tiktok.com/@tu_usuario"
};

// Duración de la cuenta 0 → 100 de la pantalla de carga (milisegundos).
export const LOADER_MS = 2600;

// Pixel ratio máximo: más alto = más nítido pero más trabajo para el móvil.
export const MAX_PIXEL_RATIO = 2.5;

// Colores de marca usados dentro de la escena 3D.
export const COLORS = {
  hueso: 0xf2eee8,
  sangre: 0x8e1426,
  metal: 0x8a8580,
};
