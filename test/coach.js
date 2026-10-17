// La voix du coach : des phrases enregistrées par Alex, jouées au bon moment de la séance.
// Studio (pour Alex seulement) : enregistrer chaque phrase, réécouter, refaire, puis exporter un fichier .zip.
// Une fois le .zip intégré à l'appli (dossier voix/coach), tout le monde entend la voix du coach.
window.Coach = (() => {
  // Les phrases à dire, rangées par moment. Formulées pour convenir aux hommes comme aux femmes.
  const PHRASES = [
    ["debut", "Allez, on y va !"], ["debut", "C'est l'heure, on se lance !"], ["debut", "Tout est prêt ? Alors c'est parti !"],
    ["effort", "Allez, à fond !"], ["effort", "On envoie !"], ["effort", "Go, go, go !"],
    ["milieu", "Continue comme ça !"], ["milieu", "Respire, garde le rythme !"], ["milieu", "Très bien, on ne lâche rien !"], ["milieu", "Pense à bien faire le mouvement."],
    ["fin_effort", "Encore un petit effort !"], ["fin_effort", "Plus que dix secondes, on tient !"], ["fin_effort", "Allez, jusqu'au bout !"], ["fin_effort", "Les dernières, ce sont celles qui comptent !"],
    ["repos", "Bien joué, souffle un peu."], ["repos", "Récupère, bois une gorgée d'eau."], ["repos", "Relâche les épaules et respire."],
    ["reprise", "Prépare-toi, ça repart !"], ["reprise", "On y retourne !"],
    ["dernier_tour", "Dernier tour, on donne tout !"], ["dernier_tour", "C'est le dernier, tout ce qu'il te reste !"],
    ["fin", "Bravo, séance terminée !"], ["fin", "Énorme ! À la prochaine !"], ["fin", "Je suis fier de toi, beau travail !"],
    ["km", "Un kilomètre de plus, bravo !"], ["km", "Belle allure, continue !"]
  ].map(([moment, texte], i) => ({ id: "c" + String(i + 1).padStart(2, "0"), moment, texte }));
  const MOMENTS = { debut: "Au début de la séance", effort: "Au départ d'un effort", milieu: "Au milieu d'un effort", fin_effort: "Les 10 dernières secondes",
    repos: "Pendant le repos", reprise: "Juste avant de repartir", dernier_tour: "Au dernier tour", fin: "À la fin de la séance", km: "Course : à chaque kilomètre" };

  // ---------- Enregistrements du studio (gardés sur le téléphone d'Alex) ----------
  const Base = (() => { let p = null;
    const ouvrir = () => p || (p = new Promise((ok, ko) => { const r = indexedDB.open(Compte.env + "-coach-studio", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("phrases", { keyPath: "id" }); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }));
    const tx = async (mode, f) => { const db = await ouvrir(); return new Promise((ok, ko) => { const t = db.transaction("phrases", mode), r = f(t.objectStore("phrases"));
      t.oncomplete = () => ok(r && r.result); t.onerror = () => ko(t.error); }); };
    return { tous: () => tx("readonly", s => s.getAll()), mettre: (m) => tx("readwrite", s => s.put(m)), supprimer: (id) => tx("readwrite", s => s.delete(id)) }; })();
  let studio = {};   // id -> { blob, url }
  async function chargerStudio() {
    try { for (const m of (await Base.tous()) || []) studio[m.id] = { blob: m.blob, url: URL.createObjectURL(m.blob), type: m.blob.type }; } catch {}
  }

  // ---------- Lecture ----------
  // Priorité : les enregistrements du studio (Alex entend sa voix tout de suite), sinon ceux intégrés à l'appli
  const publies = () => (typeof VOIX !== "undefined" && VOIX.coach) || {};
  const dispo = (moment) => {
    const loc = peutEnregistrer() ? PHRASES.filter(p => p.moment === moment && studio[p.id]).map(p => studio[p.id].url) : [];
    return loc.length ? loc : (publies()[moment] || []).map(f => "voix/coach/" + f + ".mp3");
  };
  const actif = () => Compte.donnees.reglages.voixCoach !== false;
  let dernier = 0, derniereUrl = "", lecteur = null;
  function dire(moment, { force, ecart = 12000 } = {}) {
    if (!actif() && !force) return null;
    const l = dispo(moment); if (!l.length) return null;
    if (!force && Date.now() - dernier < ecart) return null;
    const choix = l.length > 1 ? l.filter(u => u !== derniereUrl) : l, u = choix[Math.floor(Math.random() * choix.length)];
    dernier = Date.now(); derniereUrl = u;
    try { lecteur?.pause(); } catch {}
    lecteur = new Audio(u); lecteur.volume = 1; lecteur.play().catch(() => {});
    return lecteur;
  }
  const aDesPhrases = () => (peutEnregistrer() && PHRASES.some(p => studio[p.id])) || Object.keys(publies()).length > 0;

  // ---------- Pendant le minuteur (séances en circuit) : on suit l'écran du minuteur ----------
  const secondes = (t) => { const m = /^(\d+):(\d+)$/.exec(t || ""); return m ? +m[1] * 60 + +m[2] : null; };
  let vu = { phase: "", debutPhase: 0, duree: 0, faits: {} };
  setInterval(() => {
    const ph = document.documentElement.dataset.phase;
    if (ph === "fini" && vu.phase && vu.phase !== "fini") { vu.phase = "fini"; if (aDesPhrases() && actif()) setTimeout(() => dire("fin", { ecart: 0 }), 2800); return; }
    if (!window.Minuteur || !Minuteur.occupe() || !aDesPhrases() || !actif()) { if (ph !== "fini") vu.phase = ""; return; }
    const s = secondes((document.getElementById("temps") || {}).textContent);
    if (s == null) return;
    if (ph !== vu.phase) { vu = { phase: ph, duree: s, faits: {} };
      const r = (document.getElementById("round") || {}).textContent || "", m = /(\d+)\s*\/\s*(\d+)/.exec(r);
      if (ph === "travail" && m && +m[1] === +m[2] && +m[2] > 1 && !vu.faits.dt && Math.random() < 0.5) { vu.faits.dt = 1; setTimeout(() => dire("dernier_tour"), 2600); }
      return; }
    if (ph === "travail") {
      if (vu.duree >= 30 && s === Math.round(vu.duree / 2) && !vu.faits.mi && Math.random() < 0.6) { vu.faits.mi = 1; dire("milieu"); }
      if (vu.duree >= 20 && s === 10 && !vu.faits.fe) { vu.faits.fe = 1; if (Math.random() < 0.75) dire("fin_effort", { ecart: 6000 }); }
    }
    if ((ph === "repos" || ph === "pause") && vu.duree >= 15 && s === Math.round(vu.duree / 2) && !vu.faits.re) { vu.faits.re = 1; if (Math.random() < 0.6) dire("repos"); }
    if ((ph === "repos" || ph === "pause") && vu.duree >= 12 && s === 5 && !vu.faits.rp) { vu.faits.rp = 1; if (Math.random() < 0.5) dire("reprise", { ecart: 4000 }); }
  }, 300);

  // ---------- Studio d'enregistrement ----------
  // Studio masqué : la voix du coach est une voix de synthèse (Piper « gilles »). Remettre la condition pour le réactiver.
  const peutEnregistrer = () => false;
  let enreg = null;
  async function dessinerStudio(z) {
    await pret;
    const n = PHRASES.filter(p => studio[p.id]).length;
    z.innerHTML = `<p class="total">Lisez chaque phrase avec énergie, comme un vrai coach, téléphone à 20 cm de la bouche, dans une pièce calme. Touchez 🎙️, parlez, touchez ⏹. Vous entendez votre voix tout de suite dans vos séances.</p>
      <p class="studio-compte"><b>${n}</b> / ${PHRASES.length} phrases enregistrées</p>
      ${Object.entries(MOMENTS).map(([m, nom]) => `<h3 class="studio-moment">${nom}</h3>${PHRASES.filter(p => p.moment === m).map(p => `
        <div class="studio-ligne ${studio[p.id] ? "fait" : ""}"><span>« ${esc(p.texte)} »</span>
          <button type="button" class="mini" data-st-rec="${p.id}">${studio[p.id] ? "🔁" : "🎙️"}</button>
          ${studio[p.id] ? `<button type="button" class="mini" data-st-ecoute="${p.id}">▶</button>` : ""}</div>`).join("")}`).join("")}
      <button class="principal" type="button" id="st-export" ${n ? "" : "disabled"}>📦 Exporter mes ${n} phrases (fichier .zip)</button>
      <p class="total">Envoyez ensuite ce fichier .zip à Claude dans la conversation : il l'ajoute à l'appli pour que tout le monde entende votre voix.</p>`;
    z.querySelectorAll("[data-st-ecoute]").forEach(b => b.onclick = () => { try { lecteur?.pause(); } catch {} lecteur = new Audio(studio[b.dataset.stEcoute].url); lecteur.play().catch(() => {}); });
    z.querySelectorAll("[data-st-rec]").forEach(b => b.onclick = () => enregistrer(b.dataset.stRec, b, z));
    z.querySelector("#st-export").onclick = exporter;
  }
  async function enregistrer(id, b, z) {
    if (enreg) { enreg.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Enregistrement impossible sur ce téléphone");
    let flux; try { flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } }); } catch { return toast("Micro refusé : autorisez-le dans les réglages du téléphone"); }
    const morceaux = []; enreg = new MediaRecorder(flux); enreg.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
    b.textContent = "⏹"; b.classList.add("rec"); const limite = setTimeout(() => enreg && enreg.stop(), 8000);
    enreg.onstop = async () => { clearTimeout(limite); flux.getTracks().forEach(x => x.stop()); enreg = null;
      const blob = new Blob(morceaux, { type: morceaux[0]?.type || "audio/webm" });
      if (blob.size > 1500) { await Base.mettre({ id, blob }); if (studio[id]) URL.revokeObjectURL(studio[id].url); studio[id] = { blob, url: URL.createObjectURL(blob), type: blob.type };
        new Audio(studio[id].url).play().catch(() => {}); }
      dessinerStudio(z); };
    enreg.start();
  }
  // Petit fichier .zip (sans compression) fait maison : un fichier audio par phrase + la liste des textes
  function crc32(u8) { let c, t = crc32.t || (crc32.t = Array.from({ length: 256 }, (_, n) => { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; }));
    let crc = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) crc = t[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8); return (crc ^ 0xFFFFFFFF) >>> 0; }
  async function zip(fichiers) {
    const enc = new TextEncoder(), parts = [], centre = []; let pos = 0;
    for (const f of fichiers) {
      const nom = enc.encode(f.nom), data = new Uint8Array(await f.blob.arrayBuffer()), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nom.length, true);
      parts.push(h.buffer, nom, data);
      const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nom.length, true); c.setUint32(42, pos, true);
      centre.push(c.buffer, nom); pos += 30 + nom.length + data.length;
    }
    const tc = centre.reduce((a, x) => a + x.byteLength, 0), fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, fichiers.length, true); fin.setUint16(10, fichiers.length, true); fin.setUint32(12, tc, true); fin.setUint32(16, pos, true);
    return new Blob([...parts, ...centre, fin.buffer], { type: "application/zip" });
  }
  async function exporter() {
    const ext = (t) => /mp4|aac|m4a/.test(t) ? "m4a" : /ogg/.test(t) ? "ogg" : "webm";
    const fichiers = PHRASES.filter(p => studio[p.id]).map(p => ({ nom: `${p.id}-${p.moment}.${ext(studio[p.id].type)}`, blob: studio[p.id].blob }));
    fichiers.push({ nom: "phrases.txt", blob: new Blob([PHRASES.map(p => `${p.id}\t${p.moment}\t${p.texte}`).join("\n")], { type: "text/plain" }) });
    const z = await zip(fichiers), nom = "voix-du-coach-rythmo.zip";
    try { const f = new File([z], nom, { type: "application/zip" }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: "Voix du coach" }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(z); a.download = nom; document.body.appendChild(a); a.click(); a.remove(); toast("Fichier enregistré dans vos Téléchargements");
  }

  const pret = chargerStudio();
  return { PHRASES, MOMENTS, dire, dessinerStudio, peutEnregistrer, aDesPhrases, zip };
})();
