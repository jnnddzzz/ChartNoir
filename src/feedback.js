/* =========================================================
   Pujas y opiniones: dónde se guardan.

   1. Vista previa de Claude (artifact): base de datos privada.
      Cada persona escribe solo lo suyo; solo el dueño (Jano)
      lo lee todo, y ve un panel con las respuestas.
   2. Web publicada: se envían a FEEDBACK_ENDPOINT (Google Apps
      Script → una hoja de Google Sheets de Jano).
   3. Sin ninguna de las dos: los formularios avisan de que
      estarán disponibles muy pronto. Nunca se finge un envío.
   ========================================================= */

export async function createFeedbackStore({ endpoint }) {
  const viaArtifact = await artifactStore();
  if (viaArtifact) return viaArtifact;
  if (endpoint) return endpointStore(endpoint);
  return { mode: "off" };
}

/* ---------- Vista previa de Claude ---------- */
async function artifactStore() {
  if (!window.claude?.use) return null;
  try {
    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    if (!db || !user) return null;
    const uid = await user.id();
    if (!uid) return null;
    const isOwner = await Promise.resolve(user.isOwner()).catch(() => false);
    const bidRef = db.doc(`pujas/${uid}`);
    const opinionRef = db.doc(`opiniones/${uid}`);

    return {
      mode: "artifact",
      isOwner,
      async saveBid(obraId, bid) {
        const snap = await bidRef.get();
        const body = snap.exists ? structuredClone(snap.data()) : { obras: {} };
        body.obras = body.obras || {};
        body.obras[obraId] = { ...bid, fecha: new Date().toISOString() };
        await bidRef.set(body);
      },
      async saveOpinion(opinion) {
        const snap = await opinionRef.get();
        const items = snap.exists ? [...(snap.data().items || [])] : [];
        items.push({ ...opinion, fecha: new Date().toISOString() });
        await opinionRef.set({ items: items.slice(-20) });
      },
      // Solo el dueño: escucha todas las respuestas en directo.
      watchAll(onChange) {
        if (!isOwner) return () => {};
        let bids = [];
        let opinions = [];
        const emit = () => onChange({ bids, opinions });
        const u1 = db.collection("pujas").onSnapshot((s) => {
          bids = s.docs.flatMap((d) => Object.entries(d.data().obras || {}).map(([obra, b]) => ({ obra, ...b })));
          emit();
        }, () => {});
        const u2 = db.collection("opiniones").onSnapshot((s) => {
          opinions = s.docs.flatMap((d) => d.data().items || []);
          emit();
        }, () => {});
        return () => { u1(); u2(); };
      },
    };
  } catch {
    return null;
  }
}

/* ---------- Web publicada (Google Sheets) ---------- */
function endpointStore(endpoint) {
  const send = async (payload) => {
    // text/plain evita la comprobación previa del navegador; Apps Script lo lee igual.
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, fecha: new Date().toISOString(), pagina: location.href }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  };
  return {
    mode: "endpoint",
    isOwner: false,
    saveBid: (obraId, bid) => send({ tipo: "puja", obra: obraId, ...bid }),
    saveOpinion: (opinion) => send({ tipo: "opinion", ...opinion }),
    watchAll: () => () => {},
  };
}
