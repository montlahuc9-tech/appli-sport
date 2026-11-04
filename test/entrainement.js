// Course et marche, comme Strava : statistiques, records, et plans d'entraînement pour un objectif (5 km, 10 km, semi, marche 10 km).
// Toutes les sorties GPS sont gardées en résumé (sans le tracé) dans « sorties », pour les statistiques et les records.
window.Entrainement = (() => {
  const D = () => Compte.donnees;
  const km = (m) => (m / 1000).toFixed(m >= 100000 ? 0 : 1).replace(".", ",");
  const duree = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`; };
  const allure = (s, m) => { if (!m || m < 100) return "--:--"; const p = s / (m / 1000); return Math.floor(p / 60) + ":" + String(Math.round(p % 60)).padStart(2, "0"); };
  const jour = (t) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  // ---------- Les sorties (résumés) ----------
  function sorties() {
    const d = D();
    if (!Array.isArray(d.sorties)) {   // première fois : on reprend les parcours déjà enregistrés
      d.sorties = (d.parcours || []).map(r => ({ id: r.id, type: r.type, debut: r.debut, duree: r.duree, distance: r.distance, kms: r.kms || [] }));
      Compte.sauver();
    }
    return d.sorties;
  }
  function ajouterSortie(r) {
    const avant = records(r.type), l = sorties();
    if (!l.some(x => x.id === r.id)) l.unshift({ id: r.id, type: r.type, debut: r.debut, duree: r.duree, distance: r.distance, kms: r.kms || [] });
    Compte.sauver();
    // un record n'est « nouveau » que s'il bat un record qui existait déjà (pas à la toute première sortie)
    return records(r.type).filter(x => x.id === r.id && avant.find(a => a.cle === x.cle).valeur != null).map(x => x.nom);
  }
  const supprimerSortie = (id) => { D().sorties = sorties().filter(x => x.id !== id); Compte.sauver(); };

  // ---------- Records ----------
  // meilleur temps sur N km = plus petite somme de N kilomètres consécutifs
  function meilleurSur(kms, n) { if (!kms || kms.length < n) return null; let s = 0, best = Infinity;
    for (let i = 0; i < kms.length; i++) { s += kms[i]; if (i >= n) s -= kms[i - n]; if (i >= n - 1) best = Math.min(best, s); } return best; }
  function records(type) {
    const l = sorties().filter(x => x.type === type), res = [];
    const meilleur = (cle, nom, f, plusPetit = true, format = duree) => {
      let b = null; for (const x of l) { const v = f(x); if (v == null) continue; if (!b || (plusPetit ? v < b.valeur : v > b.valeur)) b = { valeur: v, id: x.id, date: x.debut }; }
      res.push({ cle, nom, valeur: b ? b.valeur : null, texte: b ? format(b.valeur) : "—", id: b && b.id, date: b && b.date }); };
    meilleur("1k", "Meilleur 1 km", x => meilleurSur(x.kms, 1));
    meilleur("5k", "Meilleur 5 km", x => meilleurSur(x.kms, 5));
    meilleur("10k", "Meilleur 10 km", x => meilleurSur(x.kms, 10));
    if (type === "running") meilleur("21k", "Meilleur semi (21 km)", x => meilleurSur(x.kms, 21));
    meilleur("long", "Plus longue sortie", x => x.distance, false, (v) => km(v) + " km");
    meilleur("temps", "Plus longue durée", x => x.duree, false);
    meilleur("allure", "Meilleure allure (sortie de 3 km ou plus)", x => x.distance >= 3000 ? x.duree / (x.distance / 1000) : null, true, (v) => allure(v, 1000) + " /km");
    return res;
  }

  // ---------- Statistiques ----------
  const debutSemaine = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); };
  function totaux(type, depuis) { const l = sorties().filter(x => x.type === type && x.debut >= depuis);
    return { n: l.length, distance: l.reduce((a, x) => a + x.distance, 0), duree: l.reduce((a, x) => a + x.duree, 0) }; }
  function blocStats(type) {
    const now = new Date(), sem = debutSemaine(now), mois = new Date(now.getFullYear(), now.getMonth(), 1).getTime(), an = new Date(now.getFullYear(), 0, 1).getTime();
    const ligne = (nom, t) => `<div><span>${nom}</span><b>${km(t.distance)} km</b><small>${t.n} sortie${t.n > 1 ? "s" : ""} · ${duree(t.duree)}</small></div>`;
    // 12 dernières semaines
    const semaines = []; for (let i = 11; i >= 0; i--) { const d = sem - i * 7 * 864e5; semaines.push([d, totaux(type, d).distance - totaux(type, d + 7 * 864e5).distance]); }
    const max = Math.max(1000, ...semaines.map(s => s[1]));
    const tout = totaux(type, 0);
    return `<div class="st-totaux">${ligne("Cette semaine", totaux(type, sem))}${ligne("Ce mois-ci", totaux(type, mois))}${ligne("Cette année", totaux(type, an))}</div>
      <h3>Kilomètres par semaine</h3>
      <div class="st-barres">${semaines.map(([d, m]) => `<div title="${km(m)} km"><i style="height:${Math.round(m / max * 100)}%"></i><small>${new Date(d).getDate()}/${new Date(d).getMonth() + 1}</small></div>`).join("")}</div>
      <p class="total">Depuis le début : <b>${km(tout.distance)} km</b> en ${tout.n} sortie${tout.n > 1 ? "s" : ""} (${duree(tout.duree)}).</p>`;
  }
  function blocRecords(type) {
    const r = records(type);
    if (!r.some(x => x.valeur != null)) return `<p class="total">Pas encore de record : faites une sortie avec le suivi GPS, vos records s'afficheront ici.</p>`;
    return `<div class="st-records">${r.map(x => `<div><span>${x.nom}</span><b>${x.texte}</b><small>${x.date ? jour(x.date) : "pas encore"}</small></div>`).join("")}</div>
      <p class="total">Les meilleurs temps sont calculés sur vos kilomètres complets (temps au kilomètre du suivi GPS). Ce sont des estimations.</p>`;
  }

  // ---------- Plans d'entraînement ----------
  // séance : { t: "footing" | "frac" | "long" | "marche" | "jourj", ... }
  const PLANS = {
    "5k": { type: "running", nom: "Courir 5 km", ico: "🏃", detail: "8 semaines · 3 séances par semaine", pour: "Pour débuter : il faut pouvoir courir 10 minutes sans s'arrêter.",
      semaines: [[20, [6, 60, 90], 3], [22, [8, 60, 90], 3.5], [25, [6, 120, 60], 4], [25, [8, 30, 30], 4], [28, [5, 180, 90], 4.5], [30, [10, 30, 30], 5], [30, [6, 120, 60], 5.5], [20, [6, 60, 60], "jourj"]], objectif: 5000 },
    "10k": { type: "running", nom: "Courir 10 km", ico: "🏃", detail: "10 semaines · 3 séances par semaine", pour: "Il faut déjà pouvoir courir 5 km.",
      semaines: [[30, [6, 60, 60], 5], [30, [8, 60, 60], 6], [35, [5, 120, 60], 6], [35, [6, 120, 60], 7], [40, [5, 180, 90], 7], [40, [10, 30, 30], 8], [45, [6, 180, 90], 8], [45, [4, 300, 120], 9], [40, [8, 60, 60], 7], [25, [6, 60, 60], "jourj"]], objectif: 10000 },
    "semi": { type: "running", nom: "Courir un semi-marathon", ico: "🏅", detail: "12 semaines · 3 séances par semaine", pour: "Il faut déjà pouvoir courir 10 km.",
      semaines: [[35, [6, 120, 60], 8], [40, [5, 180, 90], 9], [40, [6, 180, 90], 10], [45, [4, 300, 120], 11], [45, [8, 60, 60], 12], [50, [5, 300, 120], 13], [50, [6, 180, 90], 14], [45, [4, 360, 120], 15], [50, [5, 300, 120], 16], [50, [6, 180, 90], 17], [40, [8, 60, 60], 12], [30, [6, 60, 60], "jourj"]], objectif: 21097 },
    "marche10": { type: "marche", nom: "Marcher 10 km", ico: "🚶", detail: "8 semaines · 3 séances par semaine", pour: "Pour tout le monde, à son rythme.",
      semaines: [[30, [6, 120, 60], 4], [30, [6, 120, 60], 5], [35, [7, 120, 60], 5], [35, [6, 180, 60], 6], [40, [7, 180, 60], 7], [40, [8, 180, 60], 8], [45, [8, 180, 60], 8.5], [30, [6, 120, 60], "jourj"]], objectif: 10000 },
  };
  // les séances guidées (minuteur + voix) deviennent de vraies fiches
  const d_ = (nom, s) => ({ nom, duree: s });
  function fichesPlan(cle) {
    const P = PLANS[cle], marche = P.type === "marche", out = [];
    P.semaines.forEach(([foot, [n, vite, lent]], i) => {
      const base = { univers: P.type, cat: "plan", lieu: "exterieur", type: "circuit", repos: 0, pause: 0, niveau: 2 };
      out.push({ ...base, id: `plan-${cle}-${i + 1}-a`, titre: `${P.nom} · semaine ${i + 1} · ${marche ? "Marche active" : "Footing"} ${foot} min`, travail: 60, tours: 1,
        note: marche ? `${foot} minutes de marche active, à un rythme où vous pouvez encore parler.` : `${foot} minutes de footing tranquille : vous devez pouvoir parler en courant.`,
        exos: [d_(marche ? "Marche rapide" : "Footing (allure tranquille)", foot * 60)] });
      out.push({ ...base, id: `plan-${cle}-${i + 1}-b`, titre: `${P.nom} · semaine ${i + 1} · ${marche ? "Intervalles" : "Fractionné"} ${n} × ${vite >= 60 ? vite / 60 + " min" : vite + " s"}`, travail: vite, tours: n,
        note: `${marche ? "Marchez 10 minutes tranquillement avant." : "Échauffez-vous 10 minutes en footing lent avant."} Puis ${n} fois : ${vite >= 60 ? vite / 60 + " min" : vite + " s"} ${marche ? "très vite" : "vite"}, ${lent >= 60 ? lent / 60 + " min" : lent + " s"} ${marche ? "plus doucement" : "en récupération"}. La voix annonce chaque changement.`,
        exos: marche ? [d_("Marche rapide", lent), d_("Marche très rapide", vite)] : [d_("Footing lent (récupération)", lent), d_("Course rapide", vite)] });
    });
    return out;
  }
  const FICHES_PLANS = Object.keys(PLANS).flatMap(fichesPlan);
  FICHES.push(...FICHES_PLANS);

  const planActif = () => { const p = D().reglages.plan; return p && PLANS[p.cle] ? p : null; };
  function semaineEnCours(p) { return Math.min(PLANS[p.cle].semaines.length, Math.floor((Date.now() - debutSemaine(p.debut)) / (7 * 864e5)) + 1); }
  // les 3 séances d'une semaine, avec leur état
  function seances(p, s) {
    const P = PLANS[p.cle], [, , long] = P.semaines[s - 1], de = debutSemaine(p.debut) + (s - 1) * 7 * 864e5, a = de + 7 * 864e5;
    const hist = (D().historique || []).filter(h => { const t = new Date(h.date).getTime(); return t >= de && t < a; });
    const sor = sorties().filter(x => x.type === P.type && x.debut >= de && x.debut < a);
    const manuels = p.faits || {}, cle = (k) => `${s}-${k}`;
    const fiche = (k) => { const id = `plan-${p.cle}-${s}-${k}`, f = FICHES_PLANS.find(x => x.id === id);
      return { k, fiche: f, titre: f.titre.split(" · ").pop(), fait: !!manuels[cle(k)] || hist.some(h => h.id === id) }; };
    const dist = long === "jourj" ? P.objectif : long * 1000;
    const c = { k: "c", gps: dist, titre: long === "jourj" ? `🏁 Jour J : ${P.nom.toLowerCase().replace(/^courir |^marcher /, "")} (${km(dist)} km)` : `Sortie longue : ${km(dist)} km`,
      fait: !!manuels[cle("c")] || sor.some(x => x.distance >= dist * 0.95) };
    return [fiche("a"), fiche("b"), c];
  }
  function blocPlan(type) {
    const p = planActif();
    if (!p || PLANS[p.cle].type !== type) {
      const choix = Object.entries(PLANS).filter(([, P]) => P.type === type);
      return `<p class="total">Choisissez un objectif : l'appli vous donne 3 séances par semaine, qui montent petit à petit jusqu'au jour J.</p>
        <div class="liste-fiches">${choix.map(([k, P]) => `<button class="fiche" type="button" data-plan-choisir="${k}"><span class="gps-ico" aria-hidden="true">${P.ico}</span><span><b>${P.nom}</b><span class="res">${P.detail} · ${P.pour}</span></span><span class="fleche" aria-hidden="true">›</span></button>`).join("")}</div>
        ${p ? `<p class="total">Vous suivez déjà le plan « ${PLANS[p.cle].nom} » : en choisir un autre le remplace.</p>` : ""}`;
    }
    const P = PLANS[p.cle], s = semaineEnCours(p), n = P.semaines.length, l = seances(p, s), fini = s === n && l.every(x => x.fait);
    const toutes = P.semaines.map((_, i) => seances(p, i + 1)), faites = toutes.flat().filter(x => x.fait).length, total = n * 3;
    return `<div class="prog-tete"><h2>${P.ico} ${P.nom}</h2><span>${faites} / ${total}</span></div><div class="dc-progres"><i style="width:${Math.round(faites / total * 100)}%"></i></div>
      <p class="total">Semaine <b>${s} sur ${n}</b>. Faites les 3 séances dans la semaine, dans l'ordre que vous voulez, avec au moins un jour de repos entre deux.</p>
      <div class="liste-fiches">${l.map(x => `<div class="plan-seance ${x.fait ? "fait" : ""}"><button class="fiche" type="button" ${x.fiche ? `data-ouvrir="${x.fiche.id}"` : `data-plan-gps="${x.gps}"`}>
          <span class="gps-ico" aria-hidden="true">${x.fait ? "✅" : x.fiche ? "⏱️" : "📍"}</span><span><b>${esc(x.titre)}</b><span class="res">${x.fiche ? "Séance guidée par la voix" : "Avec le suivi GPS : elle se coche toute seule"}</span></span><span class="fleche" aria-hidden="true">›</span></button>
          <button class="lien" type="button" data-plan-fait="${s}-${x.k}">${x.fait ? "Décocher" : "Je l'ai fait"}</button></div>`).join("")}</div>
      ${fini ? `<p class="total">🏆 Plan terminé, bravo ! Regardez vos records juste en dessous.</p>` : ""}
      <details class="plan-tout"><summary>Voir tout le plan (${n} semaines)</summary>${toutes.map((ls, i) => `<p><b>Semaine ${i + 1}</b>${i + 1 === s ? " (en cours)" : ""} : ${ls.map(x => `${x.fait ? "✅" : "○"} ${esc(x.titre)}`).join(" · ")}</p>`).join("")}</details>
      <button class="lien danger" type="button" id="plan-arreter">Arrêter ce plan</button>`;
  }
  function brancherPlan(z, redessiner, aller) {
    z.querySelectorAll("[data-plan-choisir]").forEach(b => b.onclick = () => { D().reglages.plan = { cle: b.dataset.planChoisir, debut: Date.now(), faits: {} }; Compte.sauver(); toast("Plan lancé : bonne préparation !"); redessiner(); });
    z.querySelectorAll("[data-plan-fait]").forEach(b => b.onclick = () => { const p = planActif(); if (!p) return; p.faits = p.faits || {};
      const st = seances(p, +b.dataset.planFait.split("-")[0]).find(x => `${b.dataset.planFait.split("-")[0]}-${x.k}` === b.dataset.planFait);
      if (st && st.fait) delete p.faits[b.dataset.planFait]; else p.faits[b.dataset.planFait] = Date.now(); Compte.sauver(); redessiner(); });
    z.querySelectorAll("[data-plan-gps]").forEach(b => b.onclick = () => aller("gps", PLANS[planActif().cle].type));
    const a = z.querySelector("#plan-arreter"); if (a) deuxClics(a, "Sûr ? Touchez encore", () => { delete D().reglages.plan; Compte.sauver(); redessiner(); });
  }
  return { sorties, ajouterSortie, supprimerSortie, records, blocStats, blocRecords, blocPlan, brancherPlan, planActif, PLANS };
})();
