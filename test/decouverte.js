// La découverte : un petit questionnaire au départ, puis « Mon programme de la semaine » construit avec les séances de l'appli.
window.Decouverte = (() => {
  const $id = (i) => document.getElementById(i);
  const R = () => Compte.donnees.reglages;
  const P = () => R().profilSport || (R().profilSport = {});

  const OBJECTIFS = {
    perdre:  { nom: "Perdre du poids",      ico: "🔥", detail: "Brûler des calories, s'affiner" },
    muscle:  { nom: "Prendre du muscle",    ico: "💪", detail: "Devenir plus fort, se dessiner" },
    forme:   { nom: "Être en forme",        ico: "⚡", detail: "Bouger, avoir de l'énergie" },
    courir:  { nom: "Courir mieux",         ico: "🏃", detail: "Plus vite, plus longtemps" },
    reprise: { nom: "Me remettre au sport", ico: "🌱", detail: "Doucement, sans me blesser" }
  };
  // L'ordre des séances dans la semaine pour chaque objectif (zones, ou « run: » / « marche: »)
  const PLANS = {
    perdre:  ["cardio", "complet", "marche:marche", "cardio", "bas"],
    muscle:  ["haut", "bas", "bras", "haut", "bas"],
    forme:   ["complet", "abdos", "marche:marche", "haut", "bas"],
    courir:  ["run:fractionne", "run:fractionne", "run:renfo", "abdos", "bas"],
    reprise: ["complet", "marche:marche", "abdos", "bas", "haut"]
  };
  const SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const JOURS = { 2: ["Lundi", "Jeudi"], 3: ["Lundi", "Mercredi", "Vendredi"], 4: ["Lundi", "Mardi", "Jeudi", "Samedi"], 5: ["Lundi", "Mardi", "Mercredi", "Vendredi", "Samedi"] };
  const DOULEURS = { genoux: "Genoux", dos: "Dos", epaules: "Épaules" };
  // Exercices à éviter selon la douleur
  const RISQUES = {
    genoux: /sauté|sautés|sautées|burpee|jumping|pistol|skipping|corde à sauter/i,
    dos: /soulevé de terre|good morning|rowing barre|squat barre|hip thrust à la barre|presse/i,
    epaules: /développé|dips|pompes déclinées|tractions|élévations frontales|pull-over|militaire/i
  };
  const NOM_LIEUX = { maison: "🏠 À la maison", salle: "🏋️ À la salle", exterieur: "🌳 Dehors (course, marche)" };

  // ---------- Durée approximative d'une séance (en minutes) ----------
  function minutesFiche(f) {
    if (f.type === "circuit") { const t = f.tours || 1, n = f.exos.length || 1;
      const eff = f.exos.some(e => e.duree) ? f.exos.reduce((a, e) => a + (+e.duree || f.travail || 40), 0) : n * (f.travail || 40);
      return Math.round((t * eff + t * (n - 1) * (f.repos || 0) + (t - 1) * (f.pause || 0)) / 60); }
    return Math.round(f.exos.reduce((a, e) => a + (+e.series || 3) * (40 + (+e.repos || 60)), 0) / 60);
  }
  const pourMoi = (f) => R().public === "femme" ? f.public === "femmes" : !f.public;
  const materielOk = (f) => { const m = R().materiel; return !Array.isArray(m) || f.lieu !== "maison" || materielFiche(f).every(k => m.includes(k)); };
  const sansDouleur = (f, d) => !(d || []).some(k => f.exos.some(e => RISQUES[k].test(e.nom)));

  // ---------- Construire le programme ----------
  function construire() {
    const p = P(), plan = PLANS[p.objectif || "forme"];
    // les jours choisis par la personne (sinon, une répartition par défaut)
    const jours = (p.jours && p.jours.length ? [...p.jours].sort((a, b) => a - b).map(i => SEMAINE[i]) : JOURS[p.frequence || 3]);
    p.frequence = jours.length;
    const lieux = p.lieux && p.lieux.length ? p.lieux : ["maison"], dehors = lieux.includes("exterieur");
    const lieuxMuscu = lieux.filter(l => l !== "exterieur"); if (!lieuxMuscu.length) lieuxMuscu.push("maison");
    const niveau = p.objectif === "reprise" ? 1 : (+R().niveau || 1), duree = p.duree || 30;
    const deja = new Set(); let alt = 0;
    const seances = jours.map((jour, i) => {
      let slot = plan[i % plan.length];
      if (!dehors && /^(run|marche):/.test(slot)) slot = slot === "run:renfo" ? "bas" : "cardio";
      let c;
      if (/^(run|marche):/.test(slot)) { const [u, cat] = slot.split(":"); c = FICHES.filter(f => f.univers === (u === "run" ? "running" : "marche") && f.cat === cat); }
      else { const lieu = lieuxMuscu[alt++ % lieuxMuscu.length];
        c = FICHES.filter(f => !f.univers && !f.echauffement && f.lieu === lieu && zoneDe(f) === slot && pourMoi(f) && materielOk(f));
        if (!c.length) c = FICHES.filter(f => !f.univers && !f.echauffement && f.lieu === lieu && pourMoi(f) && materielOk(f) && (slot === "complet" ? zoneDe(f) === "cardio" : true)); }
      let sans = c.filter(f => sansDouleur(f, p.douleurs));
      // toutes les séances de cette zone sollicitent la douleur : on prend une autre zone, sans risque
      if (!sans.length && (p.douleurs || []).length && !/^(run|marche):/.test(slot))
        sans = FICHES.filter(f => !f.univers && !f.echauffement && lieuxMuscu.includes(f.lieu) && pourMoi(f) && materielOk(f) && sansDouleur(f, p.douleurs) && !deja.has(f.id));
      if (sans.length) c = sans;
      const neuves = c.filter(f => !deja.has(f.id)); if (neuves.length) c = neuves;
      // le plus proche du niveau, puis de la durée voulue
      c.sort((a, b) => Math.abs((a.niveau || 2) - niveau) - Math.abs((b.niveau || 2) - niveau) || Math.abs(minutesFiche(a) - duree) - Math.abs(minutesFiche(b) - duree));
      const f = c[0]; if (f) deja.add(f.id);
      return f ? { jour, id: f.id } : null;
    }).filter(Boolean);
    p.programme = seances; p.cree = Date.now(); Compte.sauver();
    return seances;
  }

  // ---------- Choix des jours (questionnaire et « Changer mes jours ») ----------
  const choixJours = (sel) => `<div class="dc-jours">${SEMAINE.map((j, i) => `<button type="button" class="dc-btn jour" data-jour="${i}" aria-pressed="${(sel || []).includes(i)}"><b>${j.slice(0, 3)}</b><small>${j}</small></button>`).join("")}</div>
    <p class="total" id="dc-nb-jours">${(sel || []).length ? `${sel.length} séance${sel.length > 1 ? "s" : ""} par semaine${sel.length >= 6 ? " : pense à garder au moins un jour de repos !" : ""}` : "Aucun jour choisi"}</p>`;
  function brancherJours(z, apres) {
    z.querySelectorAll("[data-jour]").forEach(b => b.onclick = () => { const s = new Set(P().jours || []), i = +b.dataset.jour;
      if (s.has(i)) s.delete(i); else { if (s.size >= 6) return toast("6 jours maximum : le repos fait aussi progresser"); s.add(i); }
      P().jours = [...s].sort((a, b) => a - b); Compte.sauver(); apres(); });
  }
  // Depuis l'accueil : changer ses jours sans refaire tout le questionnaire
  function changerJours(apres) {
    const avant = [...(P().jours || [])];
    const dessinerFeuille = () => window.ouvrirFeuilleRecette(`<div class="fiche-exo"><h2>📅 Mes jours d'entraînement</h2>
      <p class="total">Touche les jours où tu veux t'entraîner. Ton programme se réorganise tout seul.</p>${choixJours(P().jours)}
      <button class="principal" type="button" id="dc-jours-ok">Valider</button></div>`);
    const brancher = () => { const fe = document.getElementById("feuille");
      brancherJours(fe, () => { dessinerFeuille(); brancher(); });
      fe.querySelector("#dc-jours-ok").onclick = () => { if (!(P().jours || []).length) { P().jours = avant; return toast("Choisis au moins un jour"); }
        construire(); document.getElementById("feuille").hidden = true; toast("Programme mis à jour"); apres && apres(); }; };
    dessinerFeuille(); brancher();
  }

  // ---------- Le questionnaire ----------
  const ETAPES = ["objectif", "niveau", "jours", "duree", "lieux", "materiel", "douleurs", "corps", "fin"];
  let etape = 0, apresFin = null;
  function lancer(apres) { apresFin = apres; etape = 0; dessiner(); }
  function suivant() { do { etape++; } while (ETAPES[etape] === "materiel" && !(P().lieux || []).includes("maison")); dessiner(); }
  function precedent() { do { etape--; } while (etape > 0 && ETAPES[etape] === "materiel" && !(P().lieux || []).includes("maison")); dessiner(); }
  const choix = (liste, cle, multi) => `<div class="dc-choix">${liste.map(([k, t, s, ico]) => {
      const v = P()[cle], on = multi ? (v || []).includes(k) : String(v) === String(k);
      return `<button type="button" class="dc-btn" data-v="${k}" aria-pressed="${on}">${ico ? `<span class="ico">${ico}</span>` : ""}<span><b>${t}</b>${s ? `<small>${s}</small>` : ""}</span></button>`; }).join("")}</div>`;
  function dessiner() {
    const z = $id("decouverte-corps"), e = ETAPES[etape], p = P(), total = ETAPES.length - 1;
    const tete = (q, aide) => `<div class="dc-progres"><i style="width:${Math.round(etape / total * 100)}%"></i></div><p class="dc-etape">Question ${etape + 1} sur ${total}</p><h2 class="dc-question">${q}</h2>${aide ? `<p class="total">${aide}</p>` : ""}`;
    const bas = (ok = true, texte = "Suivant") => `<div class="dc-bas">${etape ? `<button class="lien" type="button" id="dc-prec">← Retour</button>` : `<button class="lien" type="button" id="dc-plus-tard">Plus tard</button>`}<button class="principal" type="button" id="dc-suiv" ${ok ? "" : "disabled"}>${texte}</button></div>`;
    let h = "", multi = false, cle = e;
    if (e === "objectif") h = tete(`${esc(Compte.utilisateur.prenom)}, quel est ton objectif ?`, "Ton programme sera construit pour ça.") + choix(Object.entries(OBJECTIFS).map(([k, o]) => [k, o.nom, o.detail, o.ico]), "objectif") + bas(!!p.objectif);
    if (e === "niveau") { cle = null; h = tete("Quel est ton niveau ?") + `<div class="dc-choix">${[[1, "Débutant", "Je commence ou je reprends"], [2, "Intermédiaire", "Je fais du sport de temps en temps"], [3, "Confirmé", "Je m'entraîne régulièrement"]].map(([k, t, s]) => `<button type="button" class="dc-btn" data-niv="${k}" aria-pressed="${+R().niveau === k}"><span><b>${t}</b><small>${s}</small></span></button>`).join("")}</div>` + bas(!!+R().niveau); }
    if (e === "jours") { cle = null; h = tete("Quels jours veux-tu t'entraîner ?", "Touche les jours qui t'arrangent. Conseil : 3 jours, avec un jour de repos entre deux.") + choixJours(p.jours) + bas((p.jours || []).length > 0); }
    if (e === "duree") h = tete("Combien de temps par séance ?") + choix([[15, "15 minutes", "Express"], [30, "30 minutes"], [45, "45 minutes et plus"]], "duree") + bas(!!p.duree);
    if (e === "lieux") { multi = true; h = tete("Où veux-tu t'entraîner ?", "Plusieurs choix possibles.") + choix(Object.entries(NOM_LIEUX).map(([k, t]) => [k, t]), "lieux", true) + bas((p.lieux || []).length > 0); }
    if (e === "materiel") { cle = null; const m = new Set(R().materiel || []);
      h = tete("Qu'as-tu chez toi ?", "Rien du tout ? Ne coche rien : il y a plein de séances sans matériel.") + `<div class="dc-choix">${Object.entries(MATERIELS).map(([k, t]) => `<button type="button" class="dc-btn" data-mat="${k}" aria-pressed="${m.has(k)}"><span><b>${t}</b></span></button>`).join("")}</div>` + bas(true); }
    if (e === "douleurs") { multi = true; h = tete("Une douleur à ménager ?", "On évitera les exercices qui la sollicitent. Rien ? Touche « Suivant ».") + choix(Object.entries(DOULEURS).map(([k, t]) => [k, t]), "douleurs", true) + bas(true); }
    if (e === "corps") { cle = null; h = tete("Pour finir (facultatif)", "Ton poids sert à estimer les calories dépensées. Tu peux le changer dans le Profil, ou passer cette question.") + `
      <div class="dc-corps"><label class="champ">Âge<input id="dc-age" type="number" inputmode="numeric" min="12" max="100" value="${p.age || ""}" placeholder="ans"></label>
      <label class="champ">Taille<input id="dc-taille" type="number" inputmode="numeric" min="120" max="230" value="${p.taille || ""}" placeholder="cm"></label>
      <label class="champ">Poids<input id="dc-poids" type="text" inputmode="decimal" autocomplete="off" value="${String(poidsActuel() || "").replace(".", ",")}" placeholder="kg"></label></div>` + bas(true, "Créer mon programme"); }
    if (e === "fin") { const prog = construire();
      h = `<div class="dc-fin"><p class="dc-ico">${OBJECTIFS[p.objectif].ico}</p><h2 class="dc-question">Ton programme est prêt !</h2>
        <p class="total">Objectif : <b>${OBJECTIFS[p.objectif].nom}</b> · ${p.frequence} séance${p.frequence > 1 ? "s" : ""} par semaine · environ ${p.duree} min</p>
        <div class="liste-fiches">${prog.map(s => { const f = FICHES.find(x => x.id === s.id); return `<div class="dc-jour"><b>${s.jour}</b><span>${esc(f.titre)}</span><small>≈ ${minutesFiche(f)} min</small></div>`; }).join("")}</div>
        <p class="total">Il s'affiche en haut de l'accueil. Coche tes séances au fil de la semaine. Tu peux refaire ce questionnaire dans le Profil.</p>
        <button class="principal" type="button" id="dc-go">C'est parti !</button></div>`; }
    z.innerHTML = h;
    // réponses
    if (cle) z.querySelectorAll(".dc-btn[data-v]").forEach(b => b.onclick = () => { const v = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v;
      if (multi) { const s = new Set(p[cle] || []); s.has(v) ? s.delete(v) : s.add(v); p[cle] = [...s]; } else p[cle] = v;
      Compte.sauver(); if (!multi) setTimeout(suivant, 180); dessiner(); });
    brancherJours(z, () => dessiner());
    z.querySelectorAll("[data-niv]").forEach(b => b.onclick = () => { R().niveau = +b.dataset.niv; Compte.sauver(); dessiner(); setTimeout(suivant, 180); });
    z.querySelectorAll("[data-mat]").forEach(b => b.onclick = () => { const s = new Set(R().materiel || []); s.has(b.dataset.mat) ? s.delete(b.dataset.mat) : s.add(b.dataset.mat); R().materiel = [...s]; Compte.sauver(); dessiner(); });
    if (e === "materiel" && !Array.isArray(R().materiel)) { R().materiel = []; Compte.sauver(); }
    if ($id("dc-prec")) $id("dc-prec").onclick = precedent;
    if ($id("dc-plus-tard")) $id("dc-plus-tard").onclick = () => { R().decouverteVue = true; Compte.sauver(); apresFin && apresFin(); };
    if ($id("dc-suiv")) $id("dc-suiv").onclick = () => {
      if (e === "corps") { const a = +$id("dc-age").value, t = +$id("dc-taille").value, w = parseFloat(String($id("dc-poids").value).replace(",", "."));
        p.age = a >= 12 && a <= 100 ? a : null; p.taille = t >= 120 && t <= 230 ? t : null; if (w >= 30 && w <= 250) noterPoids(w); Compte.sauver(); }
      suivant(); };
    if ($id("dc-go")) $id("dc-go").onclick = () => { R().decouverteVue = true; Compte.sauver(); apresFin && apresFin(); };
    window.scrollTo(0, 0);
  }

  // ---------- Poids (donné une fois, réutilisé partout) ----------
  const poids = () => Compte.donnees.poids || (Compte.donnees.poids = []);   // [{ date, kg }]
  const poidsActuel = () => { const l = poids(); return l.length ? l[l.length - 1].kg : null; };
  function noterPoids(kg) { const l = poids(), auj = new Date().toISOString().slice(0, 10);
    if (l.length && l[l.length - 1].date === auj) l[l.length - 1].kg = kg; else l.push({ date: auj, kg }); if (l.length > 120) l.shift(); Compte.sauver(); }
  // Calories estimées : MET × poids × heures (poids inconnu : 70 kg)
  const calories = (met, secondes) => Math.round(met * (poidsActuel() || 70) * secondes / 3600);

  // ---------- « Mon programme de la semaine » (accueil) ----------
  const debutSemaine = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
  function blocProgramme() {
    const p = P(); if (!p.programme || !p.programme.length) return R().decouverteVue ? `<button class="lien" type="button" id="dc-refaire-acc">🎯 Créer mon programme personnalisé →</button>` : "";
    const faites = (Compte.donnees.historique || []).filter(h => new Date(h.date) >= debutSemaine()).map(h => h.id);
    const reste = [...faites]; let n = 0;
    const lignes = p.programme.map(s => { const f = FICHES.find(x => x.id === s.id); if (!f) return "";
      const i = reste.indexOf(s.id), ok = i >= 0; if (ok) { reste.splice(i, 1); n++; }
      const auj = s.jour === SEMAINE[(new Date().getDay() + 6) % 7];
      return `<button type="button" class="dc-jour ${ok ? "fait" : ""} ${auj && !ok ? "aujourdhui" : ""}" data-prog="${s.id}"><b>${ok ? "✅" : "○"} ${auj ? "Aujourd'hui" : s.jour}</b><span>${esc(f.titre)}</span><small>≈ ${minutesFiche(f)} min</small></button>`; }).join("");
    return `<section class="bloc programme"><div class="prog-tete"><h2>${OBJECTIFS[p.objectif].ico} Mon programme de la semaine</h2><span>${n} / ${p.programme.length}</span></div>
      <div class="dc-progres"><i style="width:${Math.round(n / p.programme.length * 100)}%"></i></div>
      <div class="liste-fiches">${lignes}</div><button class="lien" type="button" id="dc-changer-jours">📅 Changer mes jours</button>${n >= p.programme.length ? `<p class="total">🎉 Semaine terminée, bravo ! Le programme repart lundi.</p>` : ""}</section>`;
  }

  return { lancer, construire, blocProgramme, changerJours, SEMAINE, OBJECTIFS, DOULEURS, noterPoids, poidsActuel, poids, calories, minutesFiche, aFaire: () => !R().decouverteVue && !(P().programme || []).length };
})();
