/* =========================================================
   AJUSTES DE CHART NOIR
   Lo que más vas a querer cambiar está aquí.
   ========================================================= */

// Fecha y hora del primer drop (hora de España).
// "+01:00" = horario de invierno (CET). En verano sería "+02:00".
export const DROP_DATE = new Date("2026-12-01T00:00:00+01:00");

// Redes. Si dejas un enlace vacío, la web muestra "Muy pronto".
export const REDES = {
  instagram: "https://www.instagram.com/jjn.dzz/",
  tiktok: "https://www.tiktok.com/@jjn.dzz",
};

// Dónde se guardan las pujas y opiniones en la web publicada (Vercel/Netlify).
// Pega aquí la dirección de tu Google Apps Script (ver scripts/google-sheets.gs).
// Vacío = los formularios avisan de que estarán disponibles muy pronto.
// (En la vista previa de Claude se guardan solas, sin configurar nada.)
export const FEEDBACK_ENDPOINT = "";

/* ---------------------------------------------------------
   OBRAS (prendas)
   Cada obra es un conjunto con una o varias piezas. Para añadir
   una nueva:
     1. Fotos sin fondo, rectas y simétricas en public/productos/<id>/
        (Claude las prepara si se las pasas).
     2. Copia el bloque de la obra 001 y cambia los datos.
   Cada pieza se cuelga sola en su hornacina del vestidor 3D.

   caja   = dónde cae la pieza dentro del conjunto, en % (x, y, ancho, alto).
   ancho  = ancho real de la pieza en metros (para colgarla a escala).
   percha = "hombros" (chalecos, camisetas…) o "pinza" (pantalones, faldas…).
   --------------------------------------------------------- */
export const OBRAS = [
  {
    id: "obra-001",
    numero: "001",
    nombre: "Génesis", // el nombre de la obra: la primera, el origen de todo
    edicion: "1/1",
    talla: "M",
    titular: "Mi primera obra de arte.",
    texto:
      "Una sola pieza en el mundo. Patrón, corte y costura a mano, sobre una tela toile granate elegida para esta obra y para ninguna otra.",
    proporcion: 0.5113, // ancho / alto del conjunto montado
    tela: "productos/obra-001/tela.webp", // la tela de cerca (muestra repetible): viste los costados en 3D
    precio: "", // vacío = no se muestra
    piezas: [
      {
        id: "chaleco",
        nombre: "Chaleco",
        imagen: "productos/obra-001/chaleco.webp",
        caja: { x: 14, y: 0, w: 72, h: 45.49 },
        ancho: 0.53,
        percha: "hombros",
        resumen: "Chaleco cropped de cuello alto cruzado. Doble forro: guarda la forma por sí solo.",
        detalles: [
          "Corte cropped",
          "Cuello alto cruzado, sin mangas",
          "Doblemente forrado: mantiene la estructura",
          "Cortado y cosido a mano",
        ],
        // Medidas provisionales en plano (talla M).
        medidas: [
          ["Largo total", "50 cm"],
          ["Ancho de pecho", "53 cm"],
          ["Hombro a hombro", "38 cm"],
          ["Sisa", "24 cm"],
          ["Ancho de bajo", "52 cm"],
        ],
      },
      {
        id: "pantalon",
        nombre: "Pantalón",
        imagen: "productos/obra-001/pantalon.webp",
        caja: { x: 0, y: 47.54, w: 100, h: 52.46 },
        ancho: 0.6,
        percha: "pinza",
        resumen:
          "Pantalón baggy de tiro alto. Dobles bolsillos delanteros y tiras de pantalón carpintero que sostienen su estructura.",
        detalles: [
          "Corte baggy, tiro alto",
          "Dobles bolsillos delanteros",
          "Tiras tipo carpintero que guardan la forma",
          "Doblemente forrado",
        ],
        // Medidas provisionales en plano (talla M).
        medidas: [
          ["Cintura", "40 cm"],
          ["Cadera", "60 cm"],
          ["Tiro delantero", "34 cm"],
          ["Largo exterior", "62 cm"],
          ["Ancho de bajo", "36 cm"],
        ],
      },
    ],
  },
];

// Fotos del taller (proceso), en public/productos/.
export const TALLER_FOTOS = [
  { src: "productos/obra-001/proceso-patron.webp", texto: "El patrón del pantalón, recién cortado." },
  { src: "productos/obra-001/proceso-panel.webp", texto: "La espalda del chaleco, antes de forrarla." },
];

// Duración mínima de la cuenta 0 → 100 de la pantalla de carga (milisegundos).
export const LOADER_MS = 2600;

// Pixel ratio máximo: más alto = más nítido pero más trabajo para el móvil.
export const MAX_PIXEL_RATIO = 2;
