// Le minuteur : circuit (effort / repos / rounds), chrono, compte à rebours, et séances en séries avec repos automatique.
// Sons fabriqués par le téléphone : bips, sifflet d'arbitre, « one, two, three », voix qui annonce les exercices, rythme intégré.
window.Minuteur = (() => {
  const R = 90, TOUR = 2 * Math.PI * R;
  $("arc").style.strokeDasharray = TOUR;
  $("corps-carte").innerHTML = CORPS_SVG;
  const prenom = () => (Compte.utilisateur && Compte.utilisateur.prenom) || "";

  let exos = [];               // circuit : [{ nom, muscle }]
  let titreSeance = "";
  let mode = "intervalles";
  const lireNb = (id, def) => { const v = parseInt($(id).value, 10); return Number.isFinite(v) ? v : def; };
  const reglages = () => ({ travail: Math.max(5, lireNb("travail", 40)), repos: Math.max(0, lireNb("repos", 20)), tours: Math.max(1, lireNb("tours", 3)),
                            pause: Math.max(0, lireNb("pause", 0)), prepa: Math.max(0, lireNb("prepa", 10)) });
  const CHAMPS = ["travail", "repos", "tours", "pause", "prepa", "rmin", "rsec", "source", "style", "tempo", "volume", "volvoix"];
  const COCHES = ["voix", "depart-sifflet", "bips", "baisse", "enchainer"];
  let sauverAttente = null;
  const sauver = () => { clearTimeout(sauverAttente); sauverAttente = setTimeout(() => {
    const r = Compte.donnees.reglages; CHAMPS.forEach(k => r[k] = $(k).value); COCHES.forEach(k => r[k] = $(k).checked); r.morceau = morceauNom;
    r.exos = exos; r.titre = titreSeance; r.ficheId = ficheId; Compte.sauver(); }, 400); };
  function chargerReglages() {
    const r = Compte.donnees.reglages || {};
    CHAMPS.forEach(k => { if (r[k] != null) $(k).value = r[k]; }); COCHES.forEach(k => { if (r[k] != null) $(k).checked = !!r[k]; });
    exos = Array.isArray(r.exos) ? r.exos.filter(e => e && typeof e.nom === "string") : [{ nom: "Squats" }, { nom: "Pompes" }, { nom: "Fentes alternées" }, { nom: "Planche" }, { nom: "Jumping jacks" }];
    titreSeance = r.titre || ""; ficheId = r.ficheId || null;
    if (r.morceau == null && (r.source == null || r.source === "aucune")) $("source").value = "fichier";  // nouveauté : les musiques de l'appli par défaut
  }
  const exoInfo = (e) => e ? infoExo(e.nom, e.muscle) : null;

  // Le programme complet : préparation, efforts, repos, pauses
  function programme() {
    const r = reglages(), etapes = [];
    if (r.prepa > 0) etapes.push({ phase: "prepa", duree: r.prepa, round: 1, exo: exos[0] || null, i: 0 });
    for (let t = 1; t <= r.tours; t++) {
      if (!exos.length) {
        etapes.push({ phase: "travail", duree: r.travail, round: t, exo: null, i: 0 });
        if (t < r.tours && r.repos > 0) etapes.push({ phase: "repos", duree: r.repos, round: t, exo: null, i: 0 });
        continue;
      }
      exos.forEach((e, i) => {
        etapes.push({ phase: "travail", duree: +e.duree || r.travail, round: t, exo: e, i });
        const dernier = i === exos.length - 1;
        if (!dernier && r.repos > 0) etapes.push({ phase: "repos", duree: r.repos, round: t, exo: exos[i + 1], i: i + 1 });
        if (dernier && t < r.tours) { const p = r.pause || r.repos; if (p > 0) etapes.push({ phase: "pause", duree: p, round: t + 1, exo: exos[0], i: 0 }); }
      });
    }
    return etapes;
  }

  const optionsMuscles = (m) => Object.entries(MUSCLES).map(([k, n]) => `<option value="${k}" ${k === m ? "selected" : ""}>${n}</option>`).join("");
  function dessinerExos() {
    const z = $("liste-exos");
    z.innerHTML = exos.map((e, i) => `<div class="ligne-exo">
        <span class="num">${i + 1}</span>
        <input data-i="${i}" data-k="nom" value="${esc(e.nom)}" aria-label="Nom de l'exercice ${i + 1}">
        ${e.duree ? `<span class="total">${dureeTexte(+e.duree)}</span>` : `<select data-i="${i}" data-k="muscle" aria-label="Muscle de l'exercice ${i + 1}">${optionsMuscles(exoInfo(e).muscle)}</select>`}
        <button class="x" type="button" data-suppr="${i}" aria-label="Retirer l'exercice ${i + 1}">×</button></div>`).join("")
      || '<div class="total">Aucun exercice : intervalles simples.</div>';
    z.querySelectorAll("[data-k]").forEach(el => el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
      exos[+el.dataset.i][el.dataset.k] = el.value; sauver(); resumeSeance(); }));
    z.querySelectorAll("[data-suppr]").forEach(b => b.addEventListener("click", () => { exos.splice(+b.dataset.suppr, 1); dessinerExos(); sauver(); resumeSeance(); }));
  }
  $("ajout-exo").addEventListener("click", () => { exos.push({ nom: "Nouvel exercice", muscle: "cardio" }); dessinerExos(); sauver(); resumeSeance();
    const champs = $("liste-exos").querySelectorAll("input"); const d = champs[champs.length - 1]; if (d) { d.focus(); d.select(); } });

  function montrerExo(e, attenue) {
    $("carte-exo").hidden = mode !== "intervalles" && !series;
    const ex = exoInfo(e);
    $("nom-exo").textContent = ex ? ex.nom : (mode === "intervalles" ? "Intervalles" : "");
    $("grp-exo").textContent = ex ? nomMuscles(ex) + materiel(ex) : "Effort / repos";
    $("pose-exo").innerHTML = ex ? animMouvement(ex) + (blocExplication(ex) ? `<button class="lien comment-btn" type="button" data-comment>📖 Comment faire</button>` : "") : "";
    const cb = $("pose-exo").querySelector("[data-comment]"); if (cb) cb.onclick = () => window.ouvrirExo && window.ouvrirExo(ex);
    if (ex) brancherZoom($("pose-exo"), ex);
    colorerCorps($("corps-carte"), ex);
    $("carte-exo").style.opacity = attenue ? .8 : 1;
  }

  function resumeSeance() {
    const et = programme(), total = et.reduce((a, e) => a + e.duree, 0), r = reglages();
    $("total").innerHTML = `Durée totale : <b>${fmt(total)}</b> · ${r.tours} round${r.tours > 1 ? "s" : ""}` + (exos.length ? ` · ${exos.length} exercices` : "");
    $("seance-titre").hidden = !(series || (mode === "intervalles" && titreSeance)); $("seance-titre").textContent = series ? series.titre : titreSeance;
    if (etat === "arret" && mode === "intervalles") {
      $("temps").textContent = fmt((exos[0] && +exos[0].duree) || r.travail);
      $("round").innerHTML = `Round 1 <small>/ ${r.tours}</small>`;
      $("info").textContent = exos.length ? `Exercice 1 / ${exos.length}` : `${r.travail} s / ${r.repos} s`;
      montrerExo(exos[0] || null);
      $("suivant").innerHTML = exos.length > 1 ? `Ensuite : <b>${esc(exos[1].nom)}</b>` : "";
    }
    if (etat === "arret" && mode === "rebours" && !series) $("temps").textContent = fmt(lireNb("rmin", 5) * 60 + lireNb("rsec", 0));
  }
  document.querySelectorAll("[data-pas]").forEach(b => b.addEventListener("click", (e) => {
    e.preventDefault(); const [id, d] = b.dataset.pas.split(","); const el = $(id);
    el.value = Math.min(+el.max, Math.max(+el.min, lireNb(id, 0) + +d)); resumeSeance(); sauver();
  }));
  ["travail", "repos", "tours", "pause", "prepa", "rmin", "rsec"].forEach(id => $(id).addEventListener("input", () => { resumeSeance(); sauver(); }));
  const PRESETS = { tabata: [20, 10, 8, 10, 10], hiit: [40, 20, 10, 20, 10], emom: [60, 60, 6, 60, 10] };
  document.querySelectorAll("#presets button").forEach(b => b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset]; ["travail", "repos", "tours", "pause", "prepa"].forEach((k, i) => $(k).value = p[i]); resumeSeance(); sauver(); toast("Réglages appliqués");
  }));
  COCHES.forEach(k => $(k).addEventListener("change", sauver));

  let etat = "arret", phase = "pret";
  // ---------- Son : bips, sifflet, voix, musique ----------
  let ctx = null, gainMusique = null;
  let busSeance = null;   // tous les sons programmés d'une séance passent par ici (on coupe tout d'un coup à la remise à zéro)
  const audioCtx = () => { if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); gainMusique = ctx.createGain(); gainMusique.connect(ctx.destination); }
    if (ctx.state !== "running" && etat !== "pause") ctx.resume(); return ctx; };
  const nouveauBus = () => { try { busSeance && busSeance.disconnect(); } catch {} const c = audioCtx(); busSeance = c.createGain(); busSeance.connect(c.destination); return busSeance; };
  function bip(freq = 880, duree = 0.12, fort = 0.35, quand, sortieSon) {
    if (!$("bips").checked) return; const c = audioCtx(), o = c.createOscillator(), g = c.createGain(), t = quand ?? c.currentTime;
    o.type = "square"; o.frequency.value = freq; g.gain.setValueAtTime(fort, t); g.gain.exponentialRampToValueAtTime(0.001, t + duree);
    o.connect(g).connect(sortieSon || c.destination); o.start(t); o.stop(t + duree);
  }
  // Coup de sifflet d'arbitre (fabriqué par le téléphone, pas besoin de fichier son)
  function sifflet(duree = 0.7, quand, sortieSon) {
    if (!$("bips").checked) return; const c = audioCtx(), t = quand ?? c.currentTime;
    const sortie = c.createGain(); sortie.gain.setValueAtTime(0.0001, t); sortie.gain.exponentialRampToValueAtTime(0.32, t + 0.03);
    sortie.gain.setValueAtTime(0.32, t + duree - 0.08); sortie.gain.exponentialRampToValueAtTime(0.0001, t + duree); sortie.connect(sortieSon || c.destination);
    const roulement = c.createOscillator(), prof = c.createGain(); roulement.frequency.value = 28; prof.gain.value = 180;
    roulement.connect(prof);
    [2850, 3250].forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = f; prof.connect(o.frequency);
      g.gain.value = i ? 0.35 : 0.65; o.connect(g).connect(sortie); o.start(t); o.stop(t + duree); });
    roulement.start(t); roulement.stop(t + duree);
  }
  let voixFr = null, voixEn = null;
  const chargerVoix = () => { const v = speechSynthesis.getVoices();
    voixFr = v.find(x => /^fr/i.test(x.lang) && /thomas|paul|henri|male|homme/i.test(x.name)) || v.find(x => /^fr-FR/i.test(x.lang)) || v.find(x => /^fr/i.test(x.lang)) || null;
    voixEn = v.find(x => /^en-(US|GB)/i.test(x.lang)) || v.find(x => /^en/i.test(x.lang)) || null; };
  if ("speechSynthesis" in window) { chargerVoix(); speechSynthesis.addEventListener?.("voiceschanged", chargerVoix); }
  let voixParle = false, voixSecours = null, voixRemonte = null;
  function dire(texte, langue) {
    if (!$("voix").checked || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(texte);
      if (langue === "en") { u.lang = "en-US"; if (voixEn) u.voice = voixEn; } else { u.lang = "fr-FR"; if (voixFr) u.voice = voixFr; }
      u.rate = 1.05; u.volume = Math.max(0.05, +$("volvoix").value / 100);
      // La musique baisse pendant que la voix parle, puis remonte après un petit moment de silence
      const fin = () => { clearTimeout(voixSecours); clearTimeout(voixRemonte); voixRemonte = setTimeout(() => { voixParle = false; try { appliquerVolume(); } catch {} }, 1300); };
      u.onend = fin; u.onerror = fin;
      clearTimeout(voixRemonte); if (!voixParle) { voixParle = true; try { appliquerVolume(); } catch {} }
      clearTimeout(voixSecours); voixSecours = setTimeout(fin, 4000 + texte.length * 90);
      speechSynthesis.speak(u);
    } catch {}
  }
  const direEn = (t) => { const k = { one: ["en-one"], two: ["en-two"], three: ["en-three"], "three, two, one": ["en-three", "en-two", "en-one"] }[t];
    if (k && clipsPrets(k)) return jouerClips(k); dire(t, "en"); };

  // ---------- Annonces enregistrées (fichiers MP3 de l'appli) : programmables à l'avance, marchent écran verrouillé ----------
  const tampons = {};
  const parle = (nom) => (nom || "").replace(/\s*\(.*?\)\s*/g, " ").trim();
  const clipNom = (nom) => VOIX.noms[parle(nom)] || null;
  const clipsPrets = (k) => k.every(f => tampons[f]);
  function prechargerClips(liste) {
    const c = audioCtx();
    return Promise.all([...new Set(liste.filter(Boolean))].filter(f => !tampons[f]).map(f => fetch("voix/" + f + ".mp3").then(r => r.arrayBuffer())
      .then(b => new Promise((ok, ko) => c.decodeAudioData(b, ok, ko))).then(buf => { tampons[f] = buf; }).catch(() => {})));
  }
  const clipsFixes = () => [...Object.values(VOIX.fr), ...Object.values(VOIX.en)];
  let gainVoixNode = null;
  function sortieVoix(bus) { const c = audioCtx(), g = c.createGain(); g.gain.value = 0.25 + 1.5 * (+$("volvoix").value / 100); g.connect(bus || c.destination); return g; }
  // Joue une suite d'annonces à partir de « quand » ; renvoie l'heure de fin
  function jouerClips(liste, quand, bus) {
    const c = audioCtx(); let t = quand ?? c.currentTime + 0.02; if (!$("voix").checked) return t;
    const g = sortieVoix(bus);
    for (const f of liste) { const b = tampons[f]; if (!b) continue; const src = c.createBufferSource(); src.buffer = b; src.connect(g); src.start(t); t += b.duration + 0.08; }
    if (quand == null) { voixParle = true; appliquerVolume(); clearTimeout(voixRemonte); voixRemonte = setTimeout(() => { voixParle = false; appliquerVolume(); }, (t - c.currentTime) * 1000 + 1000); }
    return t;
  }

  // Rythmes intégrés : grille de 16 pas (grosse caisse, caisse claire, charleston…) + basse, joués par le téléphone (aucun droit d'auteur)
  const STYLES = {
    popfit:     { bpm: 124, k: "x...x...x...x...", s: "", h: "..x...x...x...x.", t: "", c: "....x.......x...", basse: [55, 0, 55, 0, 0, 0, 55, 0, 49, 0, 49, 0, 0, 0, 49, 0], forme: "sawtooth", filtre: 650,
                  accords: [[220, 277.2, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]] },
    afro:       { bpm: 120, k: "x...x...x...x...", s: "", h: "xxxxxxxxxxxxxxxx", t: "...x..x....x.x..", c: "", basse: [55, 0, 0, 55, 0, 0, 65.4, 0, 0, 0, 55, 0, 0, 49, 0, 0], forme: "sine", filtre: 320,
                  accords: [[220, 261.6, 329.6], [220, 261.6, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6]], doux: true },
    techhouse:  { bpm: 126, k: "x...x...x...x...", s: "", h: "..x...x...x...x.", t: "", c: "....x.......x...", basse: [0, 0, 55, 55, 0, 0, 55, 0, 0, 0, 55, 55, 0, 65.4, 0, 0], forme: "sawtooth", filtre: 380 },
    deephouse:  { bpm: 122, k: "x...x...x...x...", s: "", h: "..x...x...x...x.", t: "", c: "....x.......x...", basse: [49, 0, 0, 49, 0, 0, 0, 58.3, 0, 0, 49, 0, 0, 0, 43.7, 0], forme: "sine", filtre: 280,
                  accords: [[196, 233.1, 293.7, 349.2], [174.6, 207.7, 261.6, 311.1], [155.6, 196, 233.1, 293.7], [174.6, 220, 261.6, 329.6]], doux: true },
    discohouse: { bpm: 124, k: "x...x...x...x...", s: "....x.......x...", h: "..x...x...x...x.", t: "", c: "", basse: [55, 110, 55, 110, 55, 110, 55, 110, 49, 98, 49, 98, 58.3, 116.5, 58.3, 116.5], forme: "square", filtre: 900,
                  accords: [[220, 277.2, 329.6], [196, 246.9, 293.7], [233.1, 293.7, 349.2], [196, 246.9, 293.7]] },
    tropical:   { bpm: 110, k: "x...x...x...x...", s: "", h: "..x...x...x...x.", t: "", c: "....x.......x...", basse: [49, 0, 0, 0, 0, 0, 49, 0, 41.2, 0, 0, 0, 0, 0, 43.7, 0], forme: "sine", filtre: 300,
                  mel: [784, 0, 659, 0, 587, 659, 0, 523, 0, 587, 0, 659, 0, 0, 523, 0], doux: true },
    latinpop:   { bpm: 100, k: "x...x...x...x...", s: "...x..x....x..x.", h: "x.x.x.x.x.x.x.x.", t: "", c: "", basse: [55, 0, 0, 55, 0, 0, 55, 0, 49, 0, 0, 49, 0, 0, 49, 0], forme: "sine", filtre: 350,
                  mel: [440, 0, 0, 523, 0, 0, 587, 0, 659, 0, 0, 587, 0, 0, 523, 0] },
    edm:        { bpm: 128, k: "x...x...x...x...", s: "", h: "..x...x...x...x.", t: "", c: "....x.......x...", basse: [55, 55, 55, 55, 55, 55, 55, 55, 43.7, 43.7, 43.7, 43.7, 49, 49, 49, 49], forme: "sawtooth", filtre: 520,
                  accords: [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 207.7, 246.9]], mel: [880, 0, 880, 0, 784, 0, 659, 0, 880, 0, 880, 0, 988, 0, 784, 0] }
  };
  let rythme = null;
  function bruit(c, duree) { const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * duree)), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function demarrerRythme() {
    arreterRythme();
    const c = audioCtx(), st = STYLES[$("style").value] || STYLES.popfit, bpm = +$("tempo").value, double = 60 / bpm / 4;
    let pas = 0, prochain = c.currentTime + 0.05;
    const sortie = c.createGain(); sortie.gain.value = st.doux ? 0.7 : 1; sortie.connect(gainMusique);
    const kick = (t) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); o.connect(g).connect(sortie); o.start(t); o.stop(t + 0.4); };
    const snare = (t) => { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = bruit(c, 0.2); f.type = "bandpass"; f.frequency.value = st.doux ? 1500 : 1900;
      g.gain.setValueAtTime(st.doux ? 0.25 : 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); s.connect(f).connect(g).connect(sortie); s.start(t);
      const o = c.createOscillator(), go = c.createGain(); o.frequency.value = 190; go.gain.setValueAtTime(0.25, t); go.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.connect(go).connect(sortie); o.start(t); o.stop(t + 0.12); };
    const clap = (t) => { for (let i = 0; i < 3; i++) { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), u = t + i * 0.011;
      s.buffer = bruit(c, 0.12); f.type = "bandpass"; f.frequency.value = 1200; g.gain.setValueAtTime(0.35, u); g.gain.exponentialRampToValueAtTime(0.001, u + 0.1); s.connect(f).connect(g).connect(sortie); s.start(u); } };
    const hat = (t, fort) => { const s = c.createBufferSource(), h = c.createBiquadFilter(), g = c.createGain(); s.buffer = bruit(c, 0.05); h.type = "highpass"; h.frequency.value = 7000;
      g.gain.setValueAtTime(fort, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.045); s.connect(h).connect(g).connect(sortie); s.start(t); };
    const tom = (t, n) => { const o = c.createOscillator(), g = c.createGain(), f0 = [110, 150, 200][n % 3]; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 0.2);
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); o.connect(g).connect(sortie); o.start(t); o.stop(t + 0.3); };
    const accord = (t, notes) => { const g = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 0.08); g.gain.exponentialRampToValueAtTime(0.001, t + double * 15);
      for (const f of notes) for (const d of [-4, 4]) { const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = d; o.connect(lp); o.start(t); o.stop(t + double * 15.5); }
      lp.connect(g).connect(sortie); };
    const pluck = (t, f) => { const o = c.createOscillator(), g = c.createGain(); o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28); o.connect(g).connect(sortie); o.start(t); o.stop(t + 0.3); };
    const bass = (t, f) => { const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = st.forme; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = st.filtre;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + double * 1.8); o.connect(lp).connect(g).connect(sortie); o.start(t); o.stop(t + double * 2); };
    const jouer = (motif, i) => motif && motif[i % motif.length] === "x";
    const boucle = () => {
      while (prochain < c.currentTime + 0.2) {
        const i = pas % 16;
        if (jouer(st.k, i)) kick(prochain);
        if (jouer(st.s, i)) snare(prochain);
        if (jouer(st.c, i)) clap(prochain);
        if (jouer(st.h, i)) hat(prochain, i % 4 === 2 ? 0.2 : 0.09);
        if (jouer(st.t, i)) tom(prochain, i);
        const note = st.basse[pas % st.basse.length]; if (note) bass(prochain, note * (Math.floor(pas / 64) % 2 ? 1.122 : 1));
        if (st.mel && st.mel[i] && Math.floor(pas / 32) % 2 === 1) pluck(prochain, st.mel[i]);
        if (st.accords && i === 0) accord(prochain, st.accords[Math.floor(pas / 16) % st.accords.length]);
        prochain += double; pas++;
      }
    };
    boucle(); rythme = { minuterie: setInterval(boucle, 40), sortie };
  }
  function arreterRythme() { if (rythme) { clearInterval(rythme.minuterie); try { rythme.sortie.disconnect(); } catch {} rythme = null; } }

  // ---------- Musiques : celles de l'appli + celles que chacun ajoute (gardées sur son téléphone) ----------
  const MUSIQUES_APPLI = [
    { id: "app-workout", nom: "Workout", auteur: "Gr0za", url: "musique/workout-gr0za.mp3", bpm: 141 },
    { id: "app-pop", nom: "Background Pop", auteur: "Kulakovka", url: "musique/background-pop-kulakovka.mp3", bpm: 118 }
  ];
  // Petite base sur le téléphone (IndexedDB) pour garder les MP3 ajoutés
  const Base = (() => { let p = null;
    const ouvrir = () => p || (p = new Promise((ok, ko) => { const r = indexedDB.open(Compte.env + "-musiques", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("morceaux", { keyPath: "id" }); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }));
    const tx = async (mode, f) => { const db = await ouvrir(); return new Promise((ok, ko) => { const t = db.transaction("morceaux", mode), r = f(t.objectStore("morceaux"));
      t.oncomplete = () => ok(r && r.result); t.onerror = () => ko(t.error); }); };
    return { tous: () => tx("readonly", s => s.getAll()), ajouter: (m) => tx("readwrite", s => s.put(m)), supprimer: (id) => tx("readwrite", s => s.delete(id)) }; })();
  let mesMorceaux = [];   // [{ id, nom, blob, url }]
  const tousMorceaux = () => [...MUSIQUES_APPLI, ...mesMorceaux];
  const morceauChoisi = () => tousMorceaux().find(m => m.id === morceauNom) || tousMorceaux()[0];

  const lecteur = new Audio(); lecteur.loop = false; lecteur.preload = "auto"; let morceauNom = "", apercu = false;
  let decoupes = {}; try { decoupes = JSON.parse(localStorage.getItem(Compte.env + "-decoupes") || "{}") || {}; } catch {}
  const dec = () => decoupes[morceauNom] || { debut: 0, fin: 0 };
  const mn = (t) => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
  function majDecoupe() {
    const d = dec(), duree = lecteur.duration || 0;
    $("val-debut").textContent = mn(d.debut); $("val-fin").textContent = d.fin > d.debut ? mn(d.fin) : "fin du morceau";
    $("extrait").textContent = `Passage joué : ${mn(d.debut)} → ${d.fin > d.debut ? mn(d.fin) : mn(duree)}` + (duree ? ` (${mn((d.fin > d.debut ? d.fin : duree) - d.debut)})` : "");
  }
  function chargerMorceau(id, jouer) {
    const m = tousMorceaux().find(x => x.id === id) || tousMorceaux()[0]; if (!m) return;
    morceauNom = m.id; if (!lecteur.src.endsWith(m.url)) lecteur.src = m.url;
    $("nomfichier").textContent = "♪ " + m.nom; majDecoupe(); dessinerMusiques(); majMusiqueActuelle(); appliquerTempo(); verifierBpm();
    if (jouer) { const go = () => { lecteur.currentTime = dec().debut; lecteur.play().catch(() => {}); };
      if (lecteur.readyState >= 1) go(); else lecteur.addEventListener("loadedmetadata", go, { once: true }); }
  }
  // Fin du passage : on enchaîne sur la musique suivante, ou on repart au début
  function finDuPassage() {
    const enMarche = etat === "marche" || etat === "decompte" || apercu;
    if ($("enchainer").checked && !apercu && tousMorceaux().length > 1) {
      const l = tousMorceaux(), i = l.findIndex(x => x.id === morceauNom); chargerMorceau(l[(i + 1) % l.length].id, enMarche); sauver();
    } else { lecteur.currentTime = dec().debut; if (enMarche) lecteur.play().catch(() => {}); }
  }
  lecteur.addEventListener("loadedmetadata", () => { $("position").max = lecteur.duration || 0; if (lecteur.currentTime < dec().debut) lecteur.currentTime = dec().debut; majDecoupe(); });
  lecteur.addEventListener("ended", finDuPassage);
  setInterval(() => {
    const d = dec();
    if (!lecteur.paused && d.fin > d.debut && lecteur.currentTime >= d.fin) finDuPassage();
    if ($("decoupe-details").open) { if (document.activeElement !== $("position")) $("position").value = lecteur.currentTime; $("pos").textContent = `${mn(lecteur.currentTime)} / ${mn(lecteur.duration)}`; }
  }, 150);
  function dessinerMusiques() {
    const z = $("liste-musiques"); if (!z) return;
    z.innerHTML = tousMorceaux().map(m => { const choisi = m.id === morceauNom, joue = choisi && !lecteur.paused;
      return `<div class="musique-ligne${choisi ? " choisie" : ""}">
        <button class="musique-nom" type="button" data-mus-choisir="${esc(m.id)}" aria-pressed="${choisi}"><b>${esc(m.nom)}</b><span>${m.auteur ? esc(m.auteur) + " · musique de l'appli" : "ma musique"}</span></button>
        <button class="mini" type="button" data-mus-ecouter="${esc(m.id)}" aria-label="${joue ? "Arrêter" : "Écouter"} ${esc(m.nom)}">${joue && apercu ? "■" : "▶"}</button>
        ${m.blob ? `<button class="x" type="button" data-mus-suppr="${esc(m.id)}" aria-label="Retirer ${esc(m.nom)}">×</button>` : ""}</div>`; }).join("");
    z.querySelectorAll("[data-mus-choisir]").forEach(b => b.addEventListener("click", () => { const enCours = !lecteur.paused; chargerMorceau(b.dataset.musChoisir, enCours); sauver(); }));
    z.querySelectorAll("[data-mus-ecouter]").forEach(b => b.addEventListener("click", () => { audioCtx();
      if (apercu && b.dataset.musEcouter === morceauNom) { apercu = false; lecteur.pause(); return dessinerMusiques(); }
      if (etat === "marche") return chargerMorceau(b.dataset.musEcouter, true);
      apercu = true; lecteur.volume = $("volume").value / 100; chargerMorceau(b.dataset.musEcouter, true); sauver(); }));
    z.querySelectorAll("[data-mus-suppr]").forEach(b => deuxClics(b, "Sûr ?", async () => {
      const id = b.dataset.musSuppr; await Base.supprimer(id).catch(() => {}); const m = mesMorceaux.find(x => x.id === id); if (m) URL.revokeObjectURL(m.url);
      mesMorceaux = mesMorceaux.filter(x => x.id !== id); if (morceauNom === id) { lecteur.pause(); chargerMorceau(MUSIQUES_APPLI[0].id); } dessinerMusiques(); toast("Musique retirée"); }));
  }
  lecteur.addEventListener("play", dessinerMusiques); lecteur.addEventListener("pause", dessinerMusiques);

  // ---------- Tempo de la musique : vitesse réglable et tempo (BPM) détecté automatiquement ----------
  const tempos = () => Compte.donnees.reglages.tempos || (Compte.donnees.reglages.tempos = {});   // { idMusique: { bpm, cible, vitesse } }
  const regTempo = () => tempos()[morceauNom] || (tempos()[morceauNom] = {});
  const bpmDe = () => regTempo().bpm || (morceauChoisi() || {}).bpm || 0;
  try { lecteur.preservesPitch = true; lecteur.webkitPreservesPitch = true; } catch {}
  // Détection du tempo : on écoute 30 s au milieu du morceau, on garde les basses, et on cherche la pulsation qui revient le plus
  async function detecterBpm(url) {
    const brut = await (await fetch(url)).arrayBuffer();
    const tmp = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
    const son = await new Promise((ok, ko) => tmp.decodeAudioData(brut, ok, ko));
    const sr = son.sampleRate, duree = son.duration, debut = Math.min(duree * 0.3, Math.max(0, duree - 40)), long = Math.min(30, duree - debut);
    const off = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, Math.floor(long * sr), sr);
    const src = off.createBufferSource(), lp = off.createBiquadFilter(); src.buffer = son; lp.type = "lowpass"; lp.frequency.value = 180;
    src.connect(lp).connect(off.destination); src.start(0, debut, long);
    const x = (await off.startRendering()).getChannelData(0), pas = Math.round(sr * 0.005), n = Math.floor(x.length / pas), env = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (let j = i * pas; j < (i + 1) * pas; j++) s += x[j] * x[j]; env[i] = Math.sqrt(s / pas); }
    const on = new Float32Array(n); let moy = 0; for (let i = 1; i < n; i++) { on[i] = Math.max(0, env[i] - env[i - 1]); moy += on[i]; } moy /= n; for (let i = 0; i < n; i++) on[i] -= moy;
    const lo = Math.floor(60 / 180 / 0.005), hi = Math.ceil(60 / 70 / 0.005), r = [];
    for (let l = lo; l <= hi; l++) { let s = 0; for (let i = 0; i + l < n; i++) s += on[i] * on[i + l]; r.push(s); }
    let k = 0; r.forEach((v, i) => { if (v > r[k]) k = i; }); let lag = lo + k;
    if (k > 0 && k < r.length - 1) { const a = r[k - 1], b = r[k], c = r[k + 1]; lag += 0.5 * (a - c) / (a - 2 * b + c); }
    let bpm = 60 / (lag * 0.005); while (bpm < 80) bpm *= 2; while (bpm > 170) bpm /= 2;
    return Math.round(bpm);
  }
  // Vitesse pour atteindre le tempo voulu (on accepte aussi la moitié ou le double du tempo, pour rester entre 75 et 135 %)
  function vitessePour(cible, bpm) {
    if (!cible || !bpm) return 1;
    // On va toujours dans le bon sens : un tempo plus rapide accélère la musique, un tempo plus lent la ralentit
    const plusVite = cible >= bpm, ok = [bpm, bpm * 2, bpm / 2].map(b => cible / b).filter(r => r >= 0.75 && r <= 1.35 && (plusVite ? r >= 1 : r <= 1));
    if (ok.length) return ok.sort((a, b) => Math.abs(Math.log(a)) - Math.abs(Math.log(b)))[0];
    return Math.min(1.35, Math.max(0.75, cible / bpm));
  }
  function appliquerTempo() {
    const t = regTempo(), v = t.cible ? vitessePour(t.cible, bpmDe()) : (t.vitesse || 1);
    lecteur.playbackRate = v; lecteur.defaultPlaybackRate = v;
    $("vitesse-musique").value = Math.round(v * 100); $("vitesse-val").textContent = Math.round(v * 100) + " %";
    const b = bpmDe(); $("bpm-musique").textContent = b ? `${b} BPM` : "calcul…";
    $("cibles-tempo").querySelectorAll("[data-cible]").forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.cible ? +x.dataset.cible === t.cible : !t.cible && Math.abs(v - 1) < 0.01)));
    $("tempo-info").textContent = b ? (Math.abs(v - 1) < 0.01 ? `Joue à son tempo d'origine : ${b} BPM.` : `Joue à ${Math.round(b * v)} BPM (vitesse ${Math.round(v * 100)} %).` + (t.cible && Math.abs(vitessePour(t.cible, b) * b - t.cible) > 3 && Math.abs(vitessePour(t.cible, b) * b * 2 - t.cible) > 3 && Math.abs(vitessePour(t.cible, b) * b / 2 - t.cible) > 3 ? " Le tempo voulu est trop loin de cette musique : on s'en approche au mieux." : ""))
      : "Calcul du tempo de la musique…";
    try { majMusiqueActuelle(); } catch {}
  }
  async function verifierBpm(forcer) {
    const m = morceauChoisi(); if (!m) return; const t = regTempo();
    if (!forcer && (t.bpm || m.bpm)) return appliquerTempo();
    $("bpm-musique").textContent = "calcul…";
    try { const id = m.id, b = await detecterBpm(m.url); tempos()[id] = { ...(tempos()[id] || {}), bpm: b }; sauver(); if (id === morceauNom) appliquerTempo(); }
    catch { $("bpm-musique").textContent = "inconnu"; $("tempo-info").textContent = "Impossible de calculer le tempo de ce fichier : réglez la vitesse à la main."; }
  }
  $("cibles-tempo").querySelectorAll("[data-cible]").forEach(b => b.addEventListener("click", () => { const t = regTempo(); t.cible = +b.dataset.cible || 0; if (!t.cible) t.vitesse = 1; sauver(); appliquerTempo();
    if (t.cible) toast(`Musique réglée sur ${t.cible} BPM`); }));
  $("vitesse-musique").addEventListener("input", () => { const t = regTempo(); t.cible = 0; t.vitesse = +$("vitesse-musique").value / 100; appliquerTempo(); });
  $("vitesse-musique").addEventListener("change", sauver);
  $("bpm-detecter").addEventListener("click", () => verifierBpm(true));
  $("bpm-moitie").addEventListener("click", () => { const t = regTempo(), b = bpmDe(); if (b) { t.bpm = Math.round(b / 2); sauver(); appliquerTempo(); } });
  $("bpm-double").addEventListener("click", () => { const t = regTempo(), b = bpmDe(); if (b) { t.bpm = Math.round(b * 2); sauver(); appliquerTempo(); } });
  // Raccourci bien visible dans le Minuteur : ajouter ses musiques du téléphone
  $("ajout-mp3-rapide").addEventListener("click", () => { if ($("source").value !== "fichier") { $("source").value = "fichier"; majSource(); } $("morceau").click(); });
  $("voir-musiques").addEventListener("click", () => { if ($("source").value !== "fichier") { $("source").value = "fichier"; majSource(); }
    const d = document.querySelector("details.musique"); d.open = true; $("liste-musiques").scrollIntoView({ behavior: "smooth", block: "center" }); });
  function majMusiqueActuelle() { const m = morceauChoisi(), s = $("source").value;
    const tp = m && tempos()[m.id], bp = m && ((tp && tp.bpm) || m.bpm), vv = lecteur.playbackRate || 1;
    $("musique-actuelle").innerHTML = s === "fichier" && m ? `Musique choisie : <b>♪ ${esc(m.nom)}</b>${bp ? ` · ${Math.round(bp * vv)} BPM` : ""}${mesMorceaux.length ? ` · ${mesMorceaux.length} musique${mesMorceaux.length > 1 ? "s" : ""} à vous` : ""}`
      : s === "rythme" ? "Musique choisie : <b>rythme intégré</b>" : "Pas de musique de l'appli (vous pouvez garder la vôtre ou Spotify)."; }
  $("morceau").addEventListener("change", async () => {
    const fichiers = [...$("morceau").files]; if (!fichiers.length) return; let dernier = null;
    for (const f of fichiers) {
      const m = { id: "perso-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), nom: f.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 60), blob: f };
      try { await Base.ajouter(m); } catch { toast("Impossible de garder cette musique sur le téléphone"); }
      m.url = URL.createObjectURL(f); mesMorceaux.push(m); dernier = m;
    }
    $("morceau").value = ""; if (dernier) chargerMorceau(dernier.id); sauver();
    toast(fichiers.length > 1 ? `${fichiers.length} musiques ajoutées` : "Musique ajoutée");
  });
  async function chargerMesMorceaux() {
    try { mesMorceaux = ((await Base.tous()) || []).map(m => ({ ...m, url: URL.createObjectURL(m.blob) })); } catch { mesMorceaux = []; }
    chargerMorceau(Compte.donnees.reglages.morceau || MUSIQUES_APPLI[0].id);
  }
  $("position").addEventListener("input", () => { lecteur.currentTime = +$("position").value; });
  $("ecoute-extrait").addEventListener("click", () => {
    if (!lecteur.src) return; audioCtx();
    if (apercu) { apercu = false; lecteur.pause(); $("ecoute-extrait").textContent = "▶ Écouter le passage"; return; }
    apercu = true; lecteur.volume = $("volume").value / 100; const d = dec();
    if (lecteur.currentTime < d.debut || (d.fin > d.debut && lecteur.currentTime >= d.fin)) lecteur.currentTime = d.debut;
    lecteur.play().catch(() => {}); $("ecoute-extrait").textContent = "■ Arrêter";
  });
  const sauverDecoupes = () => { try { localStorage.setItem(Compte.env + "-decoupes", JSON.stringify(decoupes)); } catch {} };
  const poserBorne = (k) => { const d = { ...dec() }; d[k] = Math.round(lecteur.currentTime * 10) / 10;
    if (d.fin && d.fin <= d.debut) { if (k === "debut") d.fin = 0; else return; } decoupes[morceauNom] = d; sauverDecoupes(); majDecoupe(); };
  $("mettre-debut").addEventListener("click", () => poserBorne("debut"));
  $("mettre-fin").addEventListener("click", () => poserBorne("fin"));
  $("raz-decoupe").addEventListener("click", () => { delete decoupes[morceauNom]; sauverDecoupes(); majDecoupe(); });
  $("enchainer").addEventListener("change", sauver);

  function majSource() { const s = $("source").value;
    $("ecouter").hidden = s !== "rythme"; $("bloc-fichier").hidden = s !== "fichier"; $("style").hidden = s !== "rythme"; $("ligne-tempo").hidden = s !== "rythme";
    $("ligne-volume").hidden = s === "aucune"; $("info-musique").hidden = s !== "aucune"; try { majMusiqueActuelle(); } catch {}
    sauver(); if (etat === "marche") { arreterMusique(); lancerMusique(); } }
  $("source").addEventListener("change", majSource);
  const relancerRythme = () => { $("bpm").textContent = $("tempo").value + " bpm"; sauver(); if ((etat === "marche" || rythme) && $("source").value === "rythme") demarrerRythme(); };
  $("tempo").addEventListener("change", relancerRythme); $("tempo").addEventListener("input", () => { $("bpm").textContent = $("tempo").value + " bpm"; });
  $("style").addEventListener("change", () => { $("tempo").value = (STYLES[$("style").value] || STYLES.popfit).bpm; relancerRythme(); });
  $("ecouter").addEventListener("click", () => { audioCtx(); if (rythme && etat !== "marche") { arreterRythme(); $("ecouter").textContent = "▶ Écouter"; return; }
    if (etat !== "marche") { appliquerVolume(); demarrerRythme(); $("ecouter").textContent = "■ Arrêter"; } });
  function volumeCible() { const v = $("volume").value / 100; const base = ((phase === "repos" || phase === "pause") && $("baisse").checked) ? v * 0.35 : v;
    return voixParle ? Math.min(base, v * Math.max(0.12, 0.45 - 0.33 * (+$("volvoix").value / 100))) : base; }
  let fonduVol = null;
  function fondreVolume(cible) { clearInterval(fonduVol); const depart = lecteur.volume, t0 = performance.now(), duree = 350;
    fonduVol = setInterval(() => { const x = Math.min(1, (performance.now() - t0) / duree); lecteur.volume = Math.max(0, Math.min(1, depart + (cible - depart) * x)); if (x >= 1) clearInterval(fonduVol); }, 30); }
  function appliquerVolume() { const v = volumeCible(); fondreVolume(v); if (gainMusique) gainMusique.gain.setTargetAtTime(v * 0.6, ctx.currentTime, 0.15); }
  $("volume").addEventListener("input", () => { appliquerVolume(); sauver(); });
  $("volvoix").addEventListener("change", sauver);
  $("test-voix").addEventListener("click", () => { audioCtx(); direEn("three, two, one"); setTimeout(() => sifflet(0.6), 1600); });
  function lancerMusique() { const s = $("source").value; appliquerVolume();
    if (s === "rythme") demarrerRythme();
    else if (s === "fichier") { if (!lecteur.src) chargerMorceau(morceauNom); const d = dec(); apercu = false; $("ecoute-extrait").textContent = "▶ Écouter le passage";
      if (lecteur.currentTime < d.debut || (d.fin > d.debut && lecteur.currentTime >= d.fin)) lecteur.currentTime = d.debut; lecteur.play().catch(() => {}); } }
  function arreterMusique() { arreterRythme(); apercu = false; lecteur.pause(); }

  // ---------- Moteur ----------
  let etapes = [], k = 0, reste = 0, dureePhase = 1, ecoule = 0, dernier = 0, minuterie = null, debut = 0, dernierEntier = null, verrou = null;
  const couleurs = { pret: "--prepa", prepa: "--prepa", travail: "--travail", repos: "--repos", pause: "--repos", fini: "--fini", chrono: "--travail", rebours: "--travail" };
  const NOMS = { pret: "Prêt", prepa: "Préparez-vous", travail: "Effort", repos: "Repos", pause: "Pause", fini: "Terminé", chrono: "Chrono", rebours: "Minuteur" };
  function setPhase(p, duree) {
    phase = p; dureePhase = duree || 1; reste = duree; dernierEntier = null;
    document.documentElement.style.setProperty("--phase", `var(${couleurs[p]})`);
    document.documentElement.dataset.phase = p;
    $("phase").textContent = NOMS[p]; appliquerVolume();
  }
  // Toutes les annonces, bips et sifflets d'une séance en circuit, programmés d'un coup (ils continuent écran verrouillé)
  let t0 = 0, plages = [], aDire = {};
  function annoncesEtape(e, n) {
    const nom = e.exo ? e.exo.nom : "", cn = nom ? clipNom(nom) : null;
    if (e.phase === "travail") { const debutRound = e.i === 0 && e.round > 1 && VOIX.fr["round" + e.round];
      return { delai: 0, clips: [debutRound ? VOIX.fr["round" + e.round] : null, cn || (n === etapes.length - 1 ? VOIX.fr.dernier : VOIX.fr.effort)].filter(Boolean),
        secours: (e.i === 0 && e.round > 1 ? `Round ${e.round}. ` : "") + (nom ? nom + " !" : "Effort !"), parfait: !nom || !!cn }; }
    if (e.phase === "repos") return { delai: 0.85, clips: nom ? [VOIX.fr.rep, VOIX.fr.prochain, cn].filter(Boolean) : [VOIX.fr.rep], secours: nom ? `Repos. Prochain exercice : ${nom}` : "Repos", parfait: !nom || !!cn };
    if (e.phase === "pause") return { delai: 0.85, clips: [VOIX.fr.pause], secours: "Bravo, round terminé. Pause.", parfait: true };
    if (e.phase === "prepa") return { delai: 0, clips: nom ? [VOIX.fr.prepa, VOIX.fr.premier, cn].filter(Boolean) : [VOIX.fr.prepa], secours: nom ? `Préparez-vous. Premier exercice : ${nom}` : "Préparez-vous", parfait: !nom || !!cn };
    return { delai: 0, clips: [], secours: "", parfait: true };
  }
  function programmerSeance(depart) {
    const bus = nouveauBus(); plages = []; aDire = {}; let t = 0;
    etapes.forEach((e, n) => { e.debut = t; t += e.duree; });
    etapes.forEach((e, n) => {
      if (n < depart) return;
      const S = t0 + e.debut - (etapes[depart].debut), D = e.duree;
      if (e.phase === "travail" && n > depart) sifflet(0.4, S, bus);
      if (e.phase === "repos" || e.phase === "pause") sifflet(0.8, S, bus);
      const a = annoncesEtape(e, n);
      if (a.clips.length && clipsPrets(a.clips) && a.parfait) { const fin = jouerClips(a.clips, S + a.delai, bus); plages.push([S + a.delai, fin]); }
      else if (a.secours) aDire[n] = a.secours;   // pas enregistré (exercice libre) : la voix du téléphone le dira, écran allumé
      if (D > 4) [3, 2, 1].forEach(x => { bip(x === 1 ? 990 : 660, .08, .2, S + D - x, bus);
        const f = VOIX.en[["one", "two", "three"][x - 1]]; if (tampons[f]) plages.push([S + D - x, jouerClips([f], S + D - x + 0.02, bus)]); });
    });
    const fin = t0 + t - etapes[depart].debut;
    sifflet(1.1, fin, bus); if (tampons[VOIX.fr.fin]) plages.push([fin + 1.2, jouerClips([VOIX.fr.fin], fin + 1.2, bus)]);
    return fin;
  }
  function majEcranVerrouille(e) {
    if (!("mediaSession" in navigator) || !e) return;
    try { navigator.mediaSession.metadata = new MediaMetadata({ title: (e.phase === "travail" && e.exo ? e.exo.nom : NOMS[e.phase]) || "Rythmo Sport",
      artist: `${titreSeance || "Circuit"} · round ${e.round} / ${reglages().tours}`, album: "Rythmo Sport", artwork: [{ src: "icones/icone-512.png", sizes: "512x512", type: "image/png" }] }); } catch {}
  }
  // Petit son quasi inaudible qui garde l'appli éveillée quand l'écran est verrouillé (et affiche le minuteur sur l'écran verrouillé)
  let veille = null;
  function demarrerVeille() {
    if (!veille) { const n = 8000, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
      w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round((Math.random() * 2 - 1) * 20), true);
      veille = new Audio(URL.createObjectURL(new Blob([b], { type: "audio/wav" }))); veille.loop = true;
      if ("mediaSession" in navigator) { try { navigator.mediaSession.setActionHandler("pause", () => { if (etat === "marche") lancer(); });
        navigator.mediaSession.setActionHandler("play", () => { if (etat === "pause") lancer(); }); } catch {} } }
    veille.play().catch(() => {});
  }
  const arreterVeille = () => { try { veille && veille.pause(); } catch {} };

  function entrerEtape(n, silencieux) {
    k = n; const e = etapes[k], r = reglages(); setPhase(e.phase, e.duree);
    majEcranVerrouille(e);
    if (mode === "intervalles" && etapesProgrammees) { $("round").innerHTML = `Round ${e.round} <small>/ ${r.tours}</small>`; montrerExo(e.exo, e.phase !== "travail");
      if (aDire[k] && !silencieux) dire(aDire[k]); return; }
    $("round").innerHTML = `Round ${e.round} <small>/ ${r.tours}</small>`;
    montrerExo(e.exo, e.phase !== "travail");
    const nomExo = e.exo ? e.exo.nom : "";
    if (e.phase === "travail") {
      if (k > 0) sifflet(0.4);
      const premierDuRound = e.i === 0 && e.round > 1;
      dire((premierDuRound ? `Round ${e.round}. ` : "") + (nomExo ? nomExo + " !" : (k === etapes.length - 1 ? "Dernier effort !" : "Effort !")));
    } else if (e.phase === "repos") { sifflet(0.8); setTimeout(() => dire(nomExo ? `Repos. Prochain exercice : ${nomExo}` : "Repos"), 850); }
    else if (e.phase === "pause") { sifflet(0.8); setTimeout(() => dire(`Bravo, round terminé. Pause. Round ${e.round} ensuite`), 850); }
    else if (e.phase === "prepa") dire(nomExo ? `Préparez-vous. Premier exercice : ${nomExo}` : "Préparez-vous");
  }
  function dessiner() {
    if (mode === "chrono") { $("temps").textContent = fmt(Math.floor(ecoule)); $("arc").style.strokeDashoffset = TOUR * (1 - (ecoule % 60) / 60); $("info").textContent = ""; return; }
    $("temps").textContent = fmt(reste);
    $("arc").style.strokeDashoffset = TOUR * (1 - Math.max(0, reste) / dureePhase);
    if (mode !== "intervalles") { $("info").textContent = ""; return; }
    const e = etapes[k]; if (!e) return;
    $("info").textContent = phase === "fini" ? "Séance terminée" : exos.length ? `Exercice ${e.i + 1} / ${exos.length}` : (e.phase === "travail" ? "Effort" : "Récupération");
    const suiv = etapes.slice(k + 1).find(x => x.phase === "travail");
    $("suivant").innerHTML = phase === "fini" ? "" : !suiv ? "Dernier effort, à fond !"
      : e.phase === "travail" ? (suiv.exo ? `Ensuite : <b>${esc(suiv.exo.nom)}</b>` + (suiv.round !== e.round ? ` (round ${suiv.round})` : "") : `Ensuite : repos`)
      : `Prochain : <b>${esc(suiv.exo ? suiv.exo.nom : "effort")}</b>`;
  }
  let etapesProgrammees = false, finSeance = 0, departEtape = 0;
  function compteARebours() {
    if (mode === "intervalles" && etapesProgrammees) return;   // déjà programmé sur l'horloge du son
    const entier = Math.ceil(reste);
    if (entier !== dernierEntier) { dernierEntier = entier; if (entier <= 3 && entier >= 1 && dureePhase > 4) {
      bip(entier === 1 ? 990 : 660, .08, .2); direEn(["one", "two", "three"][entier - 1]); } }
  }
  let ficheId = null, surFinCb = null;
  function noterHistorique(titre, duree, detail, id) {
    const h = Compte.donnees.historique; h.unshift({ date: new Date().toISOString(), titre: titre || "Séance libre", duree: Math.round(duree), detail: detail || "", id: id || null });
    if (h.length > 200) h.length = 200; Compte.sauver();
  }
  function finRepos() {
    { // fin du repos entre deux séries : on repart
      const r = reposFiche; reposFiche = null; etat = "arret"; clearInterval(minuterie); libererEcran(); setPhase("travail", 1); reste = 0;
      $("temps").textContent = "GO"; $("arc").style.strokeDashoffset = 0; $("info").textContent = "Repos terminé"; $("go").textContent = "Démarrer";
      montrerExo(r.exo); $("suivant").innerHTML = `À vous : <b>${esc(r.exo.nom)}</b> · ${esc(r.texte)}`;
      sifflet(0.45); const cn = clipNom(r.exo.nom);
      setTimeout(() => cn && tampons[cn] && tampons[VOIX.fr.reparti] ? jouerClips([VOIX.fr.reparti, cn]) : dire("C'est reparti ! " + r.exo.nom), 500); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); return;
    }
  }
  function terminer(dejaProgramme) {
    if (reposFiche) return finRepos();
    etat = "fini"; clearInterval(minuterie); setPhase("fini", 1); reste = 0; finirMusiqueEnDouceur(); etapesProgrammees = false; setTimeout(arreterVeille, 4000);
    $("temps").textContent = "00:00"; $("arc").style.strokeDashoffset = 0; $("suivant").textContent = ""; $("info").textContent = "Séance terminée";
    if (!dejaProgramme) { sifflet(1.1); setTimeout(() => tampons[VOIX.fr.fin] ? jouerClips([VOIX.fr.fin]) : dire(`Séance terminée, bravo ${prenom()} !`), 1200); }
    $("go").textContent = "Recommencer"; libererEcran();
    const duree = (performance.now() - debut) / 1000, reps = +$("nreps").textContent;
    $("bilan").innerHTML = `Séance terminée en <b>${fmt(duree)}</b>` + (mode === "intervalles" ? ` · <b>${reglages().tours}</b> round${reglages().tours > 1 ? "s" : ""}` : "") + (reps ? ` · <b>${reps}</b> répétitions` : "");
    if (mode === "intervalles") noterHistorique(titreSeance || "Circuit", duree, `${reglages().tours} rounds · ${exos.length} exercices`, ficheId);
    if (mode === "intervalles" && surFinCb) { try { surFinCb(ficheId); } catch {} }
  }
  function tic() {
    const maintenant = performance.now(), dt = (maintenant - dernier) / 1000; dernier = maintenant;
    if (mode === "chrono") { ecoule += dt; dessiner(); return; }
    if (mode === "intervalles" && etapesProgrammees) {
      const el = ctx.currentTime - t0 + etapes[departEtape].debut;
      voixParle = plages.some(([a, b]) => ctx.currentTime >= a - 0.1 && ctx.currentTime <= b + 0.8);
      if (ctx.currentTime >= finSeance) return terminer(true);
      let n = k; while (n < etapes.length - 1 && el >= etapes[n + 1].debut) n++;
      if (n !== k) entrerEtape(n, n - k > 1); else appliquerVolume();
      reste = etapes[k].debut + etapes[k].duree - el; if (etat === "marche") dessiner(); return;
    }
    reste -= dt; compteARebours();
    while (reste <= 0) {   // si le téléphone a mis le minuteur en veille, on rattrape les étapes passées
      if (mode === "rebours" || k >= etapes.length - 1) return terminer();
      const retard = -reste; entrerEtape(k + 1); reste -= retard;
    }
    if (etat === "marche") dessiner();
  }
  async function garderEcran() { try { verrou = await navigator.wakeLock?.request("screen"); } catch { verrou = null; } }
  function libererEcran() { try { verrou?.release(); } catch {} verrou = null; }

  let decompte = null, musiqueDejaLancee = false, seance = 0;
  function finirMusiqueEnDouceur() {
    const s = seance; setTimeout(() => { if (s !== seance || etat === "marche") return; fondreVolume(0);
      if (gainMusique) gainMusique.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(() => { if (s === seance && etat !== "marche") arreterMusique(); }, 1200); }, 3500); }
  function demarrer() {
    audioCtx();
    // Sur iPhone, la voix ne marche qu'après un premier appui : on la « réveille » ici
    if ("speechSynthesis" in window && !demarrer.voixOk) { try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch {} demarrer.voixOk = true; }
    prechargerClips([...clipsFixes(), ...exos.map(e => clipNom(e.nom))]);
    if (etat === "decompte") { clearTimeout(decompte); musiqueDejaLancee = false; arreterMusique(); etat = "arret"; $("go").textContent = "Démarrer"; $("temps").textContent = "GO"; try { speechSynthesis.cancel(); } catch {} return; }
    if ((etat === "arret" || etat === "fini") && !reposFiche && $("depart-sifflet").checked) {
      etat = "decompte"; $("go").textContent = "Annuler"; seance++; lancerMusique(); musiqueDejaLancee = true;
      const mots = ["one", "two", "three"]; let i = 0;
      const pas = () => {
        if (etat !== "decompte") return;
        if (i < 3) { $("temps").textContent = String(i + 1); direEn(mots[i]); i++; decompte = setTimeout(pas, 900); return; }
        $("temps").textContent = "GO"; sifflet(0.75); etat = "arret"; decompte = setTimeout(() => lancer(true), 650);
      };
      pas(); return;
    }
    lancer();
  }
  function lancer(apresSifflet) {
    if (etat === "marche") { etat = "pause"; clearInterval(minuterie); arreterMusique(); $("go").textContent = "Reprendre"; libererEcran();
      if (etapesProgrammees && ctx) ctx.suspend(); arreterVeille(); try { navigator.mediaSession.playbackState = "paused"; } catch {} return; }
    if (etat === "pause" && etapesProgrammees) { etat = "marche"; ctx.resume(); }
    if (etat === "arret" || etat === "fini") {
      ecoule = 0; debut = performance.now(); $("bilan").textContent = "";
      if (mode === "intervalles") { etapes = programme(); if (!etapes.length) return;
        departEtape = apresSifflet && etapes[0].phase === "prepa" && etapes.length > 1 ? 1 : 0;
        t0 = audioCtx().currentTime + 0.05; finSeance = programmerSeance(departEtape); etapesProgrammees = true; k = departEtape; entrerEtape(departEtape); }
      else if (mode === "rebours" && reposFiche) { setPhase("repos", reposFiche.duree); montrerExo(reposFiche.exo, true); $("suivant").innerHTML = esc(reposFiche.texte); sifflet(0.8); const t = "Repos. " + reposFiche.texte; setTimeout(() => dire(t), 850); }
      else if (mode === "rebours") { const t = lireNb("rmin", 5) * 60 + lireNb("rsec", 0); if (t <= 0) return; setPhase("rebours", t); if (!apresSifflet) dire("C'est parti"); }
      else { setPhase("chrono", 60); if (!apresSifflet) dire("C'est parti"); }
    }
    etat = "marche"; dernier = performance.now(); $("go").textContent = "Pause"; $("ecouter").textContent = "▶ Écouter";
    if (!reposFiche && !musiqueDejaLancee) lancerMusique(); musiqueDejaLancee = false; garderEcran();
    if (mode === "intervalles") { demarrerVeille(); try { navigator.mediaSession.playbackState = "playing"; } catch {} }
    clearInterval(minuterie); minuterie = setInterval(tic, 100); dessiner();
  }
  function remiseAZero() {
    clearInterval(minuterie); clearTimeout(decompte); arreterMusique(); libererEcran(); etat = "arret"; ecoule = 0; k = 0;
    etapesProgrammees = false; arreterVeille(); if (ctx) { try { busSeance && busSeance.disconnect(); } catch {} busSeance = null; if (ctx.state !== "running") ctx.resume(); }
    try { speechSynthesis.cancel(); } catch {}
    setPhase(mode === "chrono" ? "chrono" : mode === "rebours" ? "rebours" : "pret", 1); reste = 1;
    $("arc").style.strokeDashoffset = 0; $("go").textContent = "Démarrer"; $("bilan").textContent = "";
    $("round").hidden = mode !== "intervalles"; $("carte-exo").hidden = mode !== "intervalles" && !series;
    if (mode === "chrono") { $("temps").textContent = "00:00"; $("info").textContent = ""; $("suivant").textContent = "Chronomètre libre"; }
    else if (mode === "rebours") { $("info").textContent = ""; $("suivant").textContent = series ? "Touchez une série quand elle est finie : le repos se lance" : "Compte à rebours simple";
      if (series) { $("temps").textContent = "GO"; const e = series.exos.find(x => (x.fait || 0) < +x.series) || series.exos[0]; if (e) montrerSerie(e); } }
    resumeSeance();
  }
  $("go").addEventListener("click", demarrer);
  $("stop").addEventListener("click", () => { reposFiche = null; remiseAZero(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && etat === "marche") garderEcran(); });
  const majReps = (d) => { const n = Math.max(0, +$("nreps").textContent + d); $("nreps").textContent = n; if (d > 0) bip(1200, .05, .2); };
  $("plus").addEventListener("click", () => majReps(1)); $("moins").addEventListener("click", () => majReps(-1));

  const boutonsModes = { intervalles: $("m-intervalles"), chrono: $("m-chrono"), rebours: $("m-rebours") };
  function choisirMode(m) {
    mode = m; Object.entries(boutonsModes).forEach(([kk, x]) => x.setAttribute("aria-pressed", String(kk === m)));
    $("reglages").hidden = m !== "intervalles"; $("reglages-rebours").hidden = m !== "rebours" || !!series; remiseAZero();
  }
  Object.entries(boutonsModes).forEach(([m, b]) => b.addEventListener("click", () => { clearInterval(minuterie); reposFiche = null; choisirMode(m); }));

  // ---------- Séance en séries (muscu) : on coche chaque série, le repos se lance tout seul ----------
  let series = null, reposFiche = null;   // series = { id, titre, exos: [{ nom, series, reps, repos, fait }] }
  const charges = () => Compte.donnees.charges || (Compte.donnees.charges = {});
  function dessinerSeries() {
    $("bloc-series").hidden = !series; if (!series) return;
    const f = series, total = f.exos.reduce((a, e) => a + (+e.series || 0), 0), faites = f.exos.reduce((a, e) => a + Math.min(e.fait || 0, +e.series || 0), 0);
    const actuel = f.exos.find(x => (x.fait || 0) < +x.series);
    $("series-titre").textContent = `${f.titre} · ${faites} / ${total} séries`;
    $("series-corps").innerHTML = f.exos.map((e, i) => { const n = +e.series || 0, fait = Math.min(e.fait || 0, n), ex = infoExo(e.nom, e.muscle);
      return `<div class="exo-serie${fait >= n && n ? " fini" : e === actuel ? " actuel" : ""}"><span class="vign">${vignette(ex)}</span>
        <div class="l1"><button class="nom-serie" data-voir="${i}" type="button">${esc(e.nom)}</button>
          <label class="charge"><input data-charge="${i}" value="${esc(charges()[e.nom] || "")}" inputmode="decimal" placeholder="—" aria-label="Charge pour ${esc(e.nom)}"> kg</label></div>
        ${conseilCharge(e.nom, i)}
        <div class="l2"><span>${n} × ${esc(e.reps)} · repos ${dureeTexte(+e.repos || 0)}</span>
          <span class="points">${Array.from({ length: n }, (_, s) => `<button class="point${s < fait ? " on" : ""}" data-serie="${i},${s}" type="button" aria-pressed="${s < fait}" aria-label="Série ${s + 1} de ${esc(e.nom)}">${s + 1}</button>`).join("")}</span></div>
      </div>`; }).join("");
    $("series-corps").querySelectorAll("[data-voir]").forEach(b => b.addEventListener("click", () => { montrerSerie(f.exos[+b.dataset.voir]); window.scrollTo({ top: 0, behavior: "smooth" }); }));
    $("series-corps").querySelectorAll("[data-plus-lourd]").forEach(b => b.addEventListener("click", () => { const nom = f.exos[+b.dataset.plusLourd].nom;
      charges()[nom] = b.dataset.kg; (Compte.donnees.chargesOk || {})[nom] = 0; Compte.sauver(); dessinerSeries(); toast(`C'est noté : ${b.dataset.kg} kg`); }));
    $("series-corps").querySelectorAll("[data-charge]").forEach(inp => inp.addEventListener("input", () => { charges()[f.exos[+inp.dataset.charge].nom] = inp.value.trim(); Compte.sauver(); }));
    $("series-corps").querySelectorAll("[data-serie]").forEach(b => b.addEventListener("click", () => {
      const [i, s] = b.dataset.serie.split(",").map(Number), e = f.exos[i];
      if (s < (e.fait || 0)) { e.fait = s; garderSeries(); return dessinerSeries(); }
      e.fait = s + 1; garderSeries(); dessinerSeries(); serieFaite(i);
    }));
  }
  // Après 2 séances réussies au même poids : on propose un peu plus lourd
  function conseilCharge(nom, i) {
    const kg = parseFloat(String(charges()[nom] || "").replace(",", ".")), ok = (Compte.donnees.chargesOk || {})[nom] || 0;
    if (!kg || ok < 2) return "";
    const nouveau = Math.round((kg + (kg < 20 ? 1 : 2.5)) * 10) / 10, txt = String(nouveau).replace(".", ",");
    return `<div class="l2 conseil"><span>💪 Réussi ${ok} fois à ${String(kg).replace(".", ",")} kg</span><button class="mini" type="button" data-plus-lourd="${i}" data-kg="${txt}">Passer à ${txt} kg</button></div>`;
  }
  const garderSeries = () => { Compte.donnees.encours = series; Compte.sauver(); };
  function montrerSerie(e) {
    $("carte-exo").hidden = false; montrerExo({ nom: e.nom, muscle: e.muscle });
    const ch = charges()[e.nom];
    if (etat !== "marche") $("suivant").innerHTML = `<b>${esc(e.nom)}</b> · ${+e.series || 0} × ${esc(e.reps)}` + (ch ? ` · ${esc(ch)} kg` : "");
  }
  function serieFaite(i) {
    const f = series, e = f.exos[i], finiExo = (e.fait || 0) >= +e.series;
    const restants = f.exos.filter(x => (x.fait || 0) < +x.series);
    if (!restants.length) { // toute la séance est faite
      clearInterval(minuterie); reposFiche = null; etat = "arret"; setPhase("fini", 1); reste = 0;
      $("temps").textContent = "00:00"; $("info").textContent = "Séance terminée"; $("suivant").textContent = ""; $("go").textContent = "Démarrer";
      const total = f.exos.reduce((a, x) => a + (+x.series || 0), 0);
      $("bilan").innerHTML = `Bravo ! <b>${total}</b> séries faites` + (f.debut ? ` en <b>${fmt((Date.now() - f.debut) / 1000)}</b>` : "");
      noterHistorique(f.titre, f.debut ? (Date.now() - f.debut) / 1000 : 0, `${total} séries`, f.id);
      // Progression des charges : chaque exercice fini avec un poids compte une réussite
      const ok = Compte.donnees.chargesOk || (Compte.donnees.chargesOk = {}); f.exos.forEach(x => { if (parseFloat(charges()[x.nom])) ok[x.nom] = (ok[x.nom] || 0) + 1; });
      f.terminee = true; garderSeries();
      sifflet(1.1); setTimeout(() => dire(`Séance terminée, bravo ${prenom()} !`), 1200); return;
    }
    const prochain = finiExo ? (f.exos.slice(i + 1).find(x => (x.fait || 0) < +x.series) || restants[0]) : e;
    const t = +e.repos || 0;
    if (t <= 0) { montrerSerie(prochain); return; }
    const ch = charges()[prochain.nom];
    reposFiche = { exo: { nom: prochain.nom, muscle: prochain.muscle }, duree: t,
      texte: finiExo ? `Exercice suivant : ${prochain.nom}` : `Série ${(e.fait || 0) + 1} sur ${e.series}` + (ch ? `, ${ch} kilos` : "") };
    clearInterval(minuterie); etat = "arret";
    if (mode !== "rebours") { const r = reposFiche; choisirMode("rebours"); reposFiche = r; }
    demarrer();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("series-raz").addEventListener("click", () => { if (!series) return; series.exos.forEach(e => e.fait = 0); series.debut = Date.now(); series.terminee = false; garderSeries(); dessinerSeries(); remiseAZero(); });
  deuxClics($("series-fermer"), "Sûr ? Touchez encore", () => {
    if (series && !series.terminee) { const faites = series.exos.reduce((a, e) => a + Math.min(e.fait || 0, +e.series || 0), 0);
      if (faites) noterHistorique(series.titre, series.debut ? (Date.now() - series.debut) / 1000 : 0, `${faites} séries (pas finie)`, series.id); }
    series = null; reposFiche = null; Compte.donnees.encours = null; Compte.sauver(); dessinerSeries(); choisirMode("intervalles"); });

  // ---------- Ce que le reste de l'appli utilise ----------
  return {
    init() {
      chargerReglages(); $("bpm").textContent = $("tempo").value + " bpm"; dessinerExos(); majSource(); chargerMesMorceaux();
      const enc = Compte.donnees.encours;
      if (enc && Array.isArray(enc.exos) && !enc.terminee) { series = enc; dessinerSeries(); choisirMode("rebours"); }
      else { series = null; dessinerSeries(); choisirMode("intervalles"); }
    },
    surFin(f) { surFinCb = f; },
    // pour la « séance musique » : la liste des morceaux, leur tempo, l'historique, et la musique du minuteur à couper
    morceaux: () => tousMorceaux().map(m => ({ id: m.id, nom: m.nom, url: m.url, bpm: m.bpm || ((Compte.donnees.reglages.tempos || {})[m.id] || {}).bpm || 0 })),
    detecterBpm, noterHistorique,
    couperMusique() { try { arreterMusique(); } catch {} },
    occupe: () => etat === "marche" || etat === "decompte",
    chargerCircuit(f) {
      clearInterval(minuterie); reposFiche = null; series = null; dessinerSeries(); Compte.donnees.encours = null;
      ["travail", "repos", "tours", "pause", "prepa"].forEach(kk => { if (f[kk] != null) $(kk).value = f[kk]; else if (kk === "prepa") $(kk).value = 10; });
      exos = f.exos.map(e => e.duree ? { nom: e.nom, muscle: e.muscle, duree: e.duree } : { nom: e.nom, muscle: e.muscle }); titreSeance = f.titre; ficheId = f.id;
      choisirMode("intervalles"); dessinerExos(); resumeSeance(); sauver();
    },
    chargerSeries(f) {
      clearInterval(minuterie); reposFiche = null;
      series = { id: f.id, titre: f.titre, debut: Date.now(), exos: f.exos.map(e => ({ nom: e.nom, muscle: e.muscle, series: +e.series || 3, reps: e.reps || "10", repos: +e.repos || 0, fait: 0 })) };
      garderSeries(); dessinerSeries(); choisirMode("rebours");
    }
  };
})();
