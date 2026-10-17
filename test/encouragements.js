// Les encouragements des proches : messages vocaux enregistrés (ou importés, ex. un vocal WhatsApp),
// joués pendant les séances au moment le plus dur. Tout reste sur le téléphone.
window.Encouragements = (() => {
  const Base = (() => { let p = null;
    const ouvrir = () => p || (p = new Promise((ok, ko) => { const r = indexedDB.open(Compte.env + "-encouragements", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("messages", { keyPath: "id" }); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }));
    const tx = async (mode, f) => { const db = await ouvrir(); return new Promise((ok, ko) => { const t = db.transaction("messages", mode), r = f(t.objectStore("messages"));
      t.oncomplete = () => ok(r && r.result); t.onerror = () => ko(t.error); }); };
    return { tous: () => tx("readonly", s => s.getAll()), ajouter: (m) => tx("readwrite", s => s.put(m)), supprimer: (id) => tx("readwrite", s => s.delete(id)) }; })();
  let messages = [], charge = false, dernier = 0, lecteur = null;
  const actif = () => Compte.donnees.reglages.encouragements !== false;
  async function charger() {
    if (charge) return messages;
    try { messages = ((await Base.tous()) || []).map(m => ({ ...m, url: URL.createObjectURL(m.blob) })).sort((a, b) => a.date - b.date); } catch { messages = []; }
    charge = true; return messages;
  }
  async function ajouter(blob, de) {
    const m = { id: "e" + Date.now(), de: (de || "").trim() || "Un proche", date: Date.now(), blob };
    await Base.ajouter(m); messages.push({ ...m, url: URL.createObjectURL(blob) });
  }
  // Joue un encouragement au hasard (pas deux fois de suite le même, pas plus d'un toutes les 75 s)
  function jouer(force) {
    if (!messages.length || (!force && (!actif() || Date.now() - dernier < 75000))) return null;
    dernier = Date.now();
    const choix = messages.length > 1 ? messages.filter(m => m.id !== jouer.dernierId) : messages;
    const m = choix[Math.floor(Math.random() * choix.length)]; jouer.dernierId = m.id;
    try { lecteur?.pause(); } catch {}
    lecteur = new Audio(m.url); lecteur.volume = 1; lecteur.play().catch(() => {});
    return lecteur;
  }

  // ---------- Écran « Mes encouragements » (dans le Profil) ----------
  let enreg = null;
  async function dessiner(z) {
    await charger();
    z.innerHTML = `<p class="total">Demandez à un proche (votre enfant, un ami, votre coach…) d'enregistrer quelques mots : « Allez, plus que 10 secondes ! ». L'appli les joue pendant vos séances, au moment le plus dur.</p>
      <label class="champ">C'est le message de…<input id="enc-de" placeholder="ex. Léa, Papa, Coach Sam" maxlength="30"></label>
      <div class="enc-boutons"><button class="principal" type="button" id="enc-rec">🎙️ Enregistrer (10 s max)</button>
      <label class="secondaire enc-import">📎 Importer un message vocal<input type="file" accept="audio/*" id="enc-fichier" hidden></label></div>
      <p class="total">Vocal reçu sur WhatsApp ? Enregistrez-le sur le téléphone, puis « Importer un message vocal ».</p>
      <div class="liste-enc">${messages.map(m => `<div class="enc"><button type="button" class="mini" data-enc-ecouter="${m.id}">▶</button><span><b>${esc(m.de)}</b><small>${new Date(m.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</small></span><button type="button" class="lien danger" data-enc-suppr="${m.id}">Retirer</button></div>`).join("") || `<p class="total">Aucun message pour l'instant.</p>`}</div>
      <label class="case"><input type="checkbox" id="enc-actif" ${actif() ? "checked" : ""}> Jouer mes encouragements pendant les séances</label>`;
    const de = () => z.querySelector("#enc-de").value;
    z.querySelector("#enc-actif").onchange = (e) => { Compte.donnees.reglages.encouragements = e.target.checked; Compte.sauver(); };
    z.querySelector("#enc-fichier").onchange = async (e) => { const f = e.target.files[0]; if (!f) return;
      if (f.size > 3e6) return toast("Message trop long (3 Mo maximum)");
      await ajouter(f, de() || f.name.replace(/\.[^.]+$/, "")); toast("Message ajouté 💬"); dessiner(z); };
    z.querySelectorAll("[data-enc-ecouter]").forEach(b => b.onclick = () => { const m = messages.find(x => x.id === b.dataset.encEcouter); try { lecteur?.pause(); } catch {} lecteur = new Audio(m.url); lecteur.play().catch(() => {}); });
    z.querySelectorAll("[data-enc-suppr]").forEach(b => deuxClics(b, "Sûr ?", async () => { await Base.supprimer(b.dataset.encSuppr).catch(() => {}); messages = messages.filter(x => x.id !== b.dataset.encSuppr); dessiner(z); }));
    z.querySelector("#enc-rec").onclick = async (ev) => {
      const b = ev.currentTarget;
      if (enreg) { enreg.stop(); return; }
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Enregistrement impossible sur ce téléphone : importez un fichier");
      let flux; try { flux = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return toast("Micro refusé : autorisez-le dans les réglages du téléphone"); }
      const morceaux = []; enreg = new MediaRecorder(flux); enreg.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
      let reste = 10; b.textContent = `⏹ Arrêter (${reste} s)`; b.classList.add("rec");
      const t = setInterval(() => { reste--; b.textContent = `⏹ Arrêter (${reste} s)`; if (reste <= 0) enreg && enreg.stop(); }, 1000);
      enreg.onstop = async () => { clearInterval(t); flux.getTracks().forEach(x => x.stop()); enreg = null;
        const blob = new Blob(morceaux, { type: morceaux[0]?.type || "audio/webm" });
        if (blob.size > 2000) { await ajouter(blob, de()); toast("Message enregistré 💬"); } dessiner(z); };
      enreg.start();
    };
  }

  // ---------- Pendant le minuteur : 8 secondes avant la fin d'un effort, de temps en temps ----------
  let derniereVerif = "";
  setInterval(() => {
    if (!charge || !messages.length || !actif() || !window.Minuteur || !Minuteur.occupe()) return;
    if (document.documentElement.dataset.phase !== "travail") return;
    const t = (document.getElementById("temps") || {}).textContent || "";
    if (t === "00:08" && derniereVerif !== t && Math.random() < 0.7) jouer();
    derniereVerif = t;
  }, 400);

  return { charger, jouer, dessiner, nombre: () => messages.length };
})();
