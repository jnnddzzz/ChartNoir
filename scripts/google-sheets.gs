/**
 * Chart Noir — recibir pujas y opiniones en Google Sheets.
 *
 * Cómo activarlo (5 minutos, una sola vez):
 *  1. Crea una hoja nueva en Google Sheets (por ejemplo "Chart Noir · Respuestas").
 *  2. Menú Extensiones → Apps Script. Borra lo que haya y pega este archivo entero.
 *  3. Pulsa "Implementar" → "Nueva implementación" → tipo "Aplicación web".
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario
 *     Acepta los permisos que te pida Google.
 *  4. Copia la "URL de la aplicación web" (acaba en /exec) y pégala en
 *     src/config.js → FEEDBACK_ENDPOINT. Sube el cambio.
 * Las pujas aparecen en la pestaña "Pujas" y las opiniones en "Opiniones".
 */

const COLUMNAS = {
  Pujas: ["fecha", "obra", "cantidad", "nombre", "contacto", "pagina"],
  Opiniones: ["fecha", "obra", "nota", "texto", "nombre", "pagina"],
};

function doPost(e) {
  const data = JSON.parse(e.postData.contents || "{}");
  const pestaña = data.tipo === "puja" ? "Pujas" : "Opiniones";
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = libro.getSheetByName(pestaña) || libro.insertSheet(pestaña);
  const columnas = COLUMNAS[pestaña];
  if (hoja.getLastRow() === 0) hoja.appendRow(columnas);

  // Lo que escribe la gente se guarda como texto (nunca como fórmula).
  const seguro = (v) => {
    const s = String(v == null ? "" : v).slice(0, 1000);
    return /^[=+\-@]/.test(s) ? "'" + s : s;
  };
  hoja.appendRow(columnas.map((c) => (c === "cantidad" || c === "nota" ? Number(data[c]) || "" : seguro(data[c]))));

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
