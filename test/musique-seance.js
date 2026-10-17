// « 1 chanson = 1 exercice » : la musique EST le minuteur.
// Chaque chanson porte un exercice. L'appli écoute la chanson à l'avance (tempo + énergie) et découpe des efforts
// quand la musique est forte, des repos quand elle retombe, toujours sur des phrases musicales (16 temps).
window.SeanceMusique = (() => {
  const $id = (i) => document.getElementById(i);
  const plans = {};          // analyses déjà faites : clé = id du morceau + durée max
  let S = null;              // la séance en cours
  let ctx = null, veille = null;
  const audioCtx = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state !== "running") ctx.resume(); return ctx; };

  // ---------- Écouter une chanson à l'avance ----------
  async function analyser(m, cap) {
    const cle = m.id + "|" + cap; if (plans[cle]) return plans[cle];
    if (enCours[cle]) return enCours[cle];
    return (enCours[cle] = analyserVraiment(m, cap, cle).finally(() => { delete enCours[cle]; }));
  }
  const enCours = {};
  async function analyserVraiment(m, cap, cle) {
    let bpm = m.bpm; if (!bpm) { try { bpm = await Minuteur.detecterBpm(m.url); } catch { bpm = 120; } }
    const brut = await (await fetch(m.url)).arrayBuffer();
    const off = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 11025);
    const son = await new Promise((ok, ko) => off.decodeAudioData(brut, ok, ko));
    const x = son.getChannelData(0), sr = son.sampleRate, duree = son.duration;
    // énergie toutes les 0,25 s
    const pas = Math.floor(sr / 4), nrj = [];
    for (let i = 0; i + pas <= x.length; i += pas) { let s = 0; for (let j = i; j < i + pas; j += 4) s += x[j] * x[j]; nrj.push(Math.sqrt(s / (pas / 4))); }
    // une « phrase » = 16 temps (4 mesures), ramenée entre 5 et 10 s
    let unite = 16 * 60 / bpm; while (unite < 5) unite *= 2; while (unite > 10) unite /= 2;
    // on démarre la grille sur le premier vrai son (on saute le silence du début)
    const max = Math.max(...nrj), debutSon = Math.max(0, nrj.findIndex(v => v > max * 0.08)) / 4;
    const fin = Math.min(duree - 0.5, cap || duree);
    const n = Math.floor((fin - debutSon) / unite);
    const e = []; for (let k = 0; k < n; k++) { const a = Math.floor((debutSon + k * unite) * 4), b = Math.floor((debutSon + (k + 1) * unite) * 4);
      let s = 0; for (let i = a; i < b && i < nrj.length; i++) s += nrj[i]; e.push(s / Math.max(1, b - a)); }
    const med = [...e].sort((a, b) => a - b)[Math.floor(e.length / 2)] || 0;
    // Découpage : préparation (intro), puis effort tant que la musique est forte (4 phrases max), repos quand elle retombe
    const types = []; let k = 0;
    types.push("prepa"); k = 1; if (n > 6 && e[1] < med * 0.75) { types.push("prepa"); k = 2; }
    let course = 0;
    while (k < n) {
      types.push("effort"); course++; k++;
      const suivanteFaible = k < n && e[k] < med * 0.85;
      if (course >= 4 || (course >= 2 && suivanteFaible)) { // repos : 2 phrases si l'effort a été long, sinon 1
        const r = course >= 4 || unite < 6.5 ? 2 : 1; for (let j = 0; j < r && k < n - 1; j++) { types.push("repos"); k++; } course = 0; }
    }
    if (types[types.length - 1] === "repos") types[types.length - 1] = "effort";
    const phases = []; types.forEach((t, i) => { const d = debutSon + i * unite, f = d + unite, der = phases[phases.length - 1];
      if (der && der.type === t) der.fin = f; else phases.push({ type: t, debut: i === 0 ? 0 : d, fin: f }); });
    // un tout petit effort à la fin ne sert à rien : on finit sur la récupération
    const der = phases[phases.length - 1];
    if (phases.length > 3 && der.type === "effort" && der.fin - der.debut < unite * 1.5) phases.pop();
    const p = { bpm, unite, fin: phases[phases.length - 1].fin, coupe: !!cap && duree > cap + 1, phases };
    plans[cle] = p; return p;
  }

  // ---------- Sons : sifflet, bips, annonces enregistrées ----------
  function sifflet(duree = 0.6) {
    const c = audioCtx(), t = c.currentTime, sortie = c.createGain();
    sortie.gain.setValueAtTime(0.0001, t); sortie.gain.exponentialRampToValueAtTime(0.3, t + 0.03); sortie.gain.setValueAtTime(0.3, t + duree - 0.08); sortie.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    sortie.connect(c.destination); const r = c.createOscillator(), prof = c.createGain(); r.frequency.value = 28; prof.gain.value = 180; r.connect(prof);
    [2850, 3250].forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; prof.connect(o.frequency); g.gain.value = i ? 0.35 : 0.65; o.connect(g).connect(sortie); o.start(t); o.stop(t + duree); });
    r.start(t); r.stop(t + duree);
  }
  function bip(f = 880) { const c = audioCtx(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = "square"; o.frequency.value = f;
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.13); }
  const clipNom = (nom) => VOIX.noms[(nom || "").replace(/\s*\(.*?\)\s*/g, " ").trim()] || null;
  function annoncer(liste) {
    liste = liste.filter(Boolean); if (!liste.length || !S) return;
    S.lecteur.volume = 0.3; let i = 0;
    const suivant = () => { if (i >= liste.length) { if (S) S.lecteur.volume = 1; return; }
      const a = new Audio("voix/" + liste[i++] + ".mp3"); a.onended = suivant; a.onerror = suivant; a.play().catch(suivant); };
    suivant();
  }

  // ---------- Déroulé ----------
  const phaseA = (pl, t) => pl.phases.find(p => t >= p.debut && t < p.fin) || pl.phases[pl.phases.length - 1];
  function tic() {
    if (!S || S.pause) return;
    const it = S.items[S.i], pl = it.plan, t = S.lecteur.currentTime;
    if (t >= pl.fin - 0.05 || S.lecteur.ended) return chansonSuivante();
    // fondu de fin si la chanson est coupée
    if (pl.coupe && pl.fin - t < 2) S.lecteur.volume = Math.max(0.05, (pl.fin - t) / 2);
    const ph = phaseA(pl, t), idx = pl.phases.indexOf(ph), reste = Math.max(0, ph.fin - t);
    if (idx !== S.phase) {
      S.phase = idx;
      if (ph.type === "effort") { sifflet(0.45); annoncer([S.premierEffort !== S.i ? VOIX.fr.parti : VOIX.fr.effort]); S.premierEffort = S.i; }
      else if (ph.type === "repos") { sifflet(0.8); annoncer([VOIX.fr.rep]); }
    }
    // 3 bips avant la reprise
    const r = Math.ceil(reste); if (ph.type !== "effort" && r <= 3 && r !== S.dernierBip) { S.dernierBip = r; if (r > 0) bip(r === 1 ? 1320 : 880); }
    // la voix du coach (Alex) aux bons moments
    const lg = ph.fin - ph.debut, k = idx + "|" + S.i, dit = S.dit || (S.dit = {});
    if (window.Coach) {
      if (ph.type === "effort" && lg >= 20 && reste < 10.4 && reste > 9.6 && !dit["f" + k]) { dit["f" + k] = 1; if (Math.random() < 0.75) Coach.dire("fin_effort", { ecart: 6000 }); }
      if (ph.type === "effort" && lg >= 30 && Math.abs(reste - lg / 2) < 0.4 && !dit["m" + k]) { dit["m" + k] = 1; if (Math.random() < 0.5) Coach.dire("milieu"); }
      if (ph.type === "repos" && lg >= 12 && Math.abs(reste - lg / 2) < 0.4 && !dit["r" + k]) { dit["r" + k] = 1; if (Math.random() < 0.6) Coach.dire("repos"); }
      if (ph.type === "prepa" && S.i === 0 && t > 3 && !dit.debut) { dit.debut = 1; Coach.dire("debut", { ecart: 0 }); }
    }
    afficher(it, ph, reste, t);
  }
  function afficher(it, ph, reste, t) {
    const nom = { prepa: "Préparez-vous", effort: "Effort", repos: "Repos" }[ph.type];
    document.documentElement.style.setProperty("--phase", `var(${ph.type === "effort" ? "--travail" : ph.type === "repos" ? "--repos" : "--prepa"})`);
    $id("sm-phase").textContent = nom; $id("sm-temps").textContent = fmt(Math.ceil(reste));
    $id("sm-barre").style.width = Math.min(100, t / it.plan.fin * 100) + "%";
    $id("sm-morceau").innerHTML = `♪ <b>${esc(it.morceau.nom)}</b> · exercice ${S.i + 1} / ${S.items.length}`;
    const suiv = S.items[S.i + 1]; $id("sm-ensuite").innerHTML = suiv ? `Chanson suivante : <b>${esc(suiv.exo.nom)}</b>` : "Dernière chanson !";
    $id("sm-pause").textContent = S.pause ? "Reprendre" : "Pause";
  }
  function dessinerExo() {
    const it = S.items[S.i], ex = infoExo(it.exo.nom, it.exo.muscle);
    $id("sm-exo").textContent = it.exo.nom; $id("sm-muscles").textContent = nomMuscles(ex) + materiel(ex);
    $id("sm-pose").innerHTML = animMouvement(ex); $id("sm-corps").innerHTML = CORPS_SVG; colorerCorps($id("sm-corps"), ex);
  }
  function jouerChanson() {
    const it = S.items[S.i]; S.phase = -1; S.dernierBip = null;
    S.lecteur.src = it.morceau.url; S.lecteur.currentTime = 0; S.lecteur.volume = 1;
    S.lecteur.play().catch(() => {}); dessinerExo();
    annoncer([S.i === 0 ? VOIX.fr.premier : VOIX.fr.prochain, clipNom(it.exo.nom)]);
    try { navigator.mediaSession.metadata = new MediaMetadata({ title: it.exo.nom, artist: "Rythmo Sport · " + it.morceau.nom }); } catch {}
  }
  function chansonSuivante() {
    if (!S) return; if (S.i + 1 >= S.items.length) return terminer(true);
    S.i++; jouerChanson();
  }
  function terminer(complet) {
    if (!S) return; const s = S; S = null; clearInterval(s.minuterie); s.lecteur.pause(); try { veille?.release(); } catch {} veille = null;
    const duree = (Date.now() - s.debut - s.tempsPause) / 1000;
    if (duree > 60) Minuteur.noterHistorique(s.titre + " 🎵", duree, complet ? "séance musique" : "séance musique (pas finie)", s.id);
    if (complet) { sifflet(1.1); annoncer([VOIX.fr.fin]); if (window.Coach) setTimeout(() => Coach.dire("fin", { ecart: 0 }), 2800); }
    $id("sm-phase").textContent = complet ? "Bravo !" : "Arrêtée"; $id("sm-temps").textContent = complet ? "FINI" : "--:--";
    $id("sm-pause").hidden = true; $id("sm-suivante").hidden = true; $id("sm-stop").textContent = "← Retour";
  }

  // ---------- Démarrer ----------
  async function lancer(f, morceaux, cap) {
    if (Minuteur.occupe()) { toast("Le minuteur tourne déjà : remettez-le à zéro d'abord."); return false; }
    Minuteur.couperMusique(); audioCtx();
    const exos = f.exos;
    const z = $id("sm-prep"); z.hidden = false; $id("sm-jeu").hidden = true;
    const items = [];
    for (let i = 0; i < exos.length; i++) {
      const m = morceaux[i % morceaux.length];
      z.textContent = `L'appli écoute vos musiques pour caler la séance dessus… ${i + 1} / ${exos.length}`;
      try { items.push({ exo: exos[i], morceau: m, plan: await analyser(m, cap) }); }
      catch { toast(`Impossible de lire « ${m.nom} »`); }
    }
    z.hidden = true; $id("sm-jeu").hidden = false;
    if (!items.length) return false;
    const lecteur = S?.lecteur || new Audio(); lecteur.preload = "auto"; try { lecteur.preservesPitch = true; } catch {}
    S = { id: f.id, titre: f.titre, items, i: 0, lecteur, pause: false, debut: Date.now(), tempsPause: 0, phase: -1 };
    lecteur.onended = () => chansonSuivante();
    $id("sm-titre").textContent = f.titre; $id("sm-pause").hidden = false; $id("sm-suivante").hidden = false; $id("sm-stop").textContent = "Arrêter";
    const total = items.reduce((a, it) => a + it.plan.fin, 0);
    $id("sm-total").textContent = `${items.length} chansons · ≈ ${Math.round(total / 60)} min`;
    jouerChanson(); S.minuterie = setInterval(tic, 100);
    try { veille = await navigator.wakeLock?.request("screen"); } catch {}
    try { navigator.mediaSession.setActionHandler("pause", () => basculerPause()); navigator.mediaSession.setActionHandler("play", () => basculerPause()); navigator.mediaSession.setActionHandler("nexttrack", () => chansonSuivante()); } catch {}
    return true;
  }
  function basculerPause() {
    if (!S) return; S.pause = !S.pause;
    if (S.pause) { S.lecteur.pause(); S.debutPause = Date.now(); } else { S.tempsPause += Date.now() - S.debutPause; S.lecteur.play().catch(() => {}); }
    $id("sm-pause").textContent = S.pause ? "Reprendre" : "Pause";
  }
  function brancher() {
    $id("sm-pause").onclick = basculerPause;
    $id("sm-suivante").onclick = () => chansonSuivante();
    let arme = 0;
    $id("sm-stop").onclick = () => { if (!S) return history.back();
      if (Date.now() - arme < 2500) { arme = 0; terminer(false); } else { arme = Date.now(); $id("sm-stop").textContent = "Sûr ? Touchez encore"; setTimeout(() => { if (S) $id("sm-stop").textContent = "Arrêter"; }, 2500); } };
  }

  return {
    actif: () => !!S,
    brancher, lancer, analyser,
    // pour l'aperçu : le découpage d'une chanson
    resume: (p) => p.phases.map(x => `${x.type} ${Math.round(x.fin - x.debut)}s`).join(" · ")
  };
})();
