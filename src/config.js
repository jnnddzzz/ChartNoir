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

/* ---------------------------------------------------------
   OBRAS (prendas)
   Cada obra es un conjunto con una o varias piezas. Para añadir
   una nueva:
     1. Crea la carpeta public/productos/<id>/ con las fotos sin
        fondo en .webp o .png (una por pieza).
     2. Copia el bloque de abajo y cambia los datos.
   Todas las piezas se cuelgan solas en el vestidor 3D.

   "caja" = dónde cae cada pieza dentro de la foto del conjunto,
   en % (x, y, ancho, alto). Sirve para montar el conjunto y
   separarlo al hacer scroll.
   --------------------------------------------------------- */
export const OBRAS = [
  {
    id: "obra-001",
    numero: "001",
    nombre: "Toile",
    edicion: "1/1",
    titular: "Mi primera obra de arte.",
    texto:
      "Una sola pieza en el mundo. Patrón, corte y costura a mano, sobre una tela toile granate elegida para esta obra y para ninguna otra.",
    proporcion: 0.52, // ancho / alto de la foto del conjunto
    anchoReal: 0.8,   // ancho del conjunto en metros, para colgarlo a escala en el vestidor
    piezas: [
      {
        id: "chaleco",
        nombre: "Chaleco",
        imagen: "productos/obra-001/chaleco.webp",
        caja: { x: 21.06, y: 0, w: 71.75, h: 45.46 },
        percha: "hombros", // "hombros" (cuelga del cuello) o "pinza" (cuelga de la cintura)
        detalle: "Sin mangas, cuello alto y cruzado. Caída recta.",
      },
      {
        id: "pantalon",
        nombre: "Pantalón",
        imagen: "productos/obra-001/pantalon.webp",
        caja: { x: 0, y: 47.55, w: 100, h: 52.45 },
        percha: "pinza",
        detalle: "Tiro alto y pernera ancha hasta la rodilla.",
      },
    ],
    precio: "", // vacío = no se muestra
  },
];

// Duración mínima de la cuenta 0 → 100 de la pantalla de carga (milisegundos).
export const LOADER_MS = 2600;

// Pixel ratio máximo: más alto = más nítido pero más trabajo para el móvil.
export const MAX_PIXEL_RATIO = 2;
