// L'appli : inscription, séances (maison / salle, par groupe), détail d'une fiche, création de séance, bibliothèque, profil.
(() => {
  const VUES = ["auth", "acces", "mdp", "guide", "seances", "fiche", "edition", "minuteur", "exercices", "profil", "gps", "musique", "recettes"];
  const ONGLET = { gps: "seances", musique: "minuteur", recettes: "recettes", guide: "profil", seances: "seances", fiche: "seances", edition: "seances", minuteur: "minuteur", exercices: "exercices", profil: "profil" };
  let lieu = "maison";
  let biblio = { groupe: "tout", muscle: "tout" };
  const D = () => Compte.donnees;
  const mesSeances = () => D().seances || (D().seances = []);
  const trouverFiche = (id) => FICHES.find(f => f.id === id) || mesSeances().find(f => f.id === id);
  const estPerso = (f) => !FICHES.includes(f);

  // ---------- Navigation (le bouton « retour » du téléphone marche) ----------
  function montrer(vue) {
    VUES.forEach(v => $("v-" + v).hidden = v !== vue);
    $("barre").hidden = ["auth", "acces", "mdp"].includes(vue);
    document.querySelectorAll("#barre button").forEach(b => { if (b.dataset.vue === ONGLET[vue]) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  }
  function aller(vue, param, remplacer) {
    const etat = { vue, param: param ?? null };
    if (remplacer) history.replaceState(etat, ""); else history.pushState(etat, "");
    afficher(etat); window.scrollTo(0, 0);
  }
  function afficher({ vue, param }) {
    if (vue === "mdp") return montrer("mdp");
    if (!Compte.utilisateur) vue = "auth";
    else if (!Compte.acces.ok) { dessinerAcces(); vue = "acces"; }
    if (vue === "seances") dessinerSeances(param);
    if (vue === "fiche") { if (!trouverFiche(param)) vue = "seances", dessinerSeances(); else dessinerFiche(param); }
    if (vue === "edition") { if (!brouillon) { vue = "seances"; dessinerSeances(); } }
    if (vue === "exercices") dessinerBiblio();
    if (vue === "profil") dessinerProfil();
    if (vue === "guide") dessinerGuide();
    if (vue === "recettes") Recettes.dessiner();
    montrer(vue);
    if (vue === "gps") GPS.afficher(param);
    if (vue === "musique" && !SeanceMusique.actif() && !musiqueEnPrep) { return aller("seances", null, true); }
  }
  window.addEventListener("popstate", (e) => { fermerFeuille(); afficher(e.state || { vue: "seances" }); });
  document.querySelectorAll("#barre button").forEach(b => b.addEventListener("click", () => aller(b.dataset.vue)));
  document.querySelectorAll("[data-retour]").forEach(b => b.addEventListener("click", () => history.length > 1 ? history.back() : aller("seances")));

  // ---------- Inscription / connexion ----------
  let modeAuth = "inscription", authPublic = "homme";
  document.querySelectorAll("[data-auth-public]").forEach(b => b.addEventListener("click", () => { authPublic = b.dataset.authPublic;
    document.querySelectorAll("[data-auth-public]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); }));
  function majAuth() {
    document.querySelectorAll("#auth-onglets button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.auth === modeAuth)));
    $("auth-l-prenom").hidden = modeAuth !== "inscription"; $("auth-l-public").hidden = modeAuth !== "inscription";
    $("auth-l-mdp").hidden = !Compte.enLigne;
    $("auth-mdp").autocomplete = modeAuth === "inscription" ? "new-password" : "current-password";
    $("auth-ok").textContent = modeAuth === "inscription" ? "Créer mon compte" : "Me connecter";
    $("auth-onglets").hidden = !Compte.enLigne;
    $("mdp-oublie").hidden = !Compte.enLigne || modeAuth !== "connexion";
    $("auth-erreur").textContent = "";
    $("auth-info").textContent = Compte.enLigne ? "Votre compte garde vos séances : vous les retrouvez sur n'importe quel téléphone."
      : "Version de test : votre compte et vos séances restent sur ce téléphone.";
    if (Compte.enLigne && modeAuth === "inscription") $("auth-info").textContent = "Après l'inscription, Alex active votre compte. Vos séances sont ensuite gardées en ligne.";
  }
  document.querySelectorAll("#auth-onglets button").forEach(b => b.addEventListener("click", () => { modeAuth = b.dataset.auth; majAuth(); }));
  $("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault(); const bouton = $("auth-ok"), avant = bouton.textContent; $("auth-erreur").textContent = "";
    bouton.disabled = true; bouton.textContent = "Un instant…";
    try {
      const r = modeAuth === "inscription"
        ? await Compte.inscrire({ prenom: $("auth-prenom").value, email: $("auth-email").value, mdp: $("auth-mdp").value })
        : await Compte.connecter({ email: $("auth-email").value, mdp: $("auth-mdp").value });
      if (r.confirmer) { $("auth-erreur").textContent = ""; $("auth-info").textContent = "Presque fini : ouvrez le mail reçu pour confirmer votre adresse, puis revenez ici et connectez-vous."; modeAuth = "connexion"; majAuth(); return; }
      if (modeAuth === "inscription" && !D().reglages.public) { D().reglages.public = authPublic; Compte.sauver(); }
      entrer(true);
    } catch (err) { $("auth-erreur").textContent = err.message || "Ça n'a pas marché. Réessayez."; }
    finally { bouton.disabled = false; if (bouton.textContent === "Un instant…") bouton.textContent = avant; }
  });
  $("mdp-oublie").addEventListener("click", async () => {
    const email = $("auth-email").value.trim();
    if (!email) { $("auth-erreur").textContent = "Écrivez d'abord votre e-mail, puis touchez « Mot de passe oublié »."; return; }
    try { await Compte.motDePasseOublie(email); $("auth-erreur").textContent = ""; $("auth-info").textContent = "C'est envoyé : ouvrez le mail reçu et suivez le lien pour choisir un nouveau mot de passe."; }
    catch (e) { $("auth-erreur").textContent = e.message; }
  });
  Compte.surRecuperation(() => { aller("mdp", null, true); });
  $("mdp-form").addEventListener("submit", async (e) => {
    e.preventDefault(); $("mdp-erreur").textContent = "";
    try { await Compte.nouveauMdp($("mdp-nouveau").value); toast("Mot de passe changé"); history.replaceState(null, "", location.pathname); entrer(false); }
    catch (err) { $("mdp-erreur").textContent = err.message; }
  });

  // ---------- Accès en attente, bloqué, ou appli fermée ----------
  function dessinerAcces() {
    const a = Compte.acces, p = Compte.utilisateur ? Compte.utilisateur.prenom : "";
    const T = {
      attente: ["Presque prêt", `Merci ${p} ! Votre compte est créé. Alex doit maintenant l'activer : dès que c'est fait, touchez « Réessayer ».`],
      bloque: ["Accès suspendu", "Votre accès à l'appli n'est pas actif pour le moment. Pour en savoir plus, contactez Alex."],
      ferme: ["Appli fermée", a.message || "L'appli est fermée pour le moment. Merci d'avoir participé au test !"],
      fin: ["Fin de la période de test", "Merci pour votre aide ! La période d'essai gratuite est terminée. Alex vous dira comment continuer à utiliser l'appli."],
      test: ["Version de test", "Cette adresse est réservée aux tests d'Alex. Utilisez le lien normal de l'appli."]
    }[a.raison] || ["Accès", ""];
    $("acces-titre").textContent = T[0]; $("acces-texte").textContent = T[1];
  }
  $("acces-reessayer").addEventListener("click", async () => {
    const b = $("acces-reessayer"); b.disabled = true; b.textContent = "Vérification…";
    await Compte.reverifier(); b.disabled = false; b.textContent = "Réessayer";
    if (Compte.acces.ok) entrer(true); else { dessinerAcces(); toast("Pas encore activé"); }
  });
  $("acces-deconnexion").addEventListener("click", async () => { await Compte.deconnecter(); modeAuth = "connexion"; majAuth(); aller("auth", null, true); });

  function entrer(nouveau) {
    if (!Compte.acces.ok) { dessinerAcces(); return aller("acces", null, true); }
    Minuteur.init(); dessinerPlaylists(); SeanceMusique.brancher();
    if (GPS.reprendre()) setTimeout(() => { aller("gps"); toast("Suivi GPS repris"); }, 300);
    aller(D().encours && !D().encours.terminee ? "minuteur" : "seances", null, true);
    if (nouveau) toast(`Bienvenue ${Compte.utilisateur.prenom} !`);
  }

  // ---------- Choix Maison / Salle (partagé entre les écrans) ----------
  function brancherLieux(racine, apres) {
    racine.querySelectorAll(".lieux button").forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.lieu === lieu));
      b.onclick = () => { lieu = b.dataset.lieu; D().reglages.lieu = lieu; Compte.sauver(); apres(); };
    });
  }

  const NOM_LIEU = { maison: "Maison", salle: "Salle", exterieur: "Dehors", partout: "Partout" };
  const dureesDifferentes = (f) => f.exos.some(e => e.duree);

  // ---------- Écran Séances ----------
  const resumeFiche = (f) => f.type === "circuit" && dureesDifferentes(f)
    ? `${f.exos.map(e => dureeTexte(+e.duree || f.travail)).join(" / ")} × ${f.tours}`
    : f.type === "circuit"
    ? `Circuit · ${f.exos.length} exercices · ${f.travail} s / ${f.repos} s × ${f.tours}`
    : `Séries · ${f.exos.length} exercices`;
  function dureeFiche(f) {
    if (f.type === "circuit" && dureesDifferentes(f)) { const t = f.tours || 1;
      return 10 + t * f.exos.reduce((a, e) => a + (+e.duree || f.travail || 40), 0) + t * (f.exos.length - 1) * (f.repos || 0) + (t - 1) * (f.pause || 0); }
    if (f.type === "circuit") { const n = f.exos.length || 1, t = f.tours || 1;
      return (10 + t * n * (f.travail || 40) + t * (n - 1) * (f.repos || 0) + (t - 1) * (f.pause || f.repos || 0)); }
    return f.exos.reduce((a, e) => a + (+e.series || 3) * (40 + (+e.repos || 60)), 0);
  }
  const badgeNiveau = (n) => `<span class="niveau n${n}" title="${NIVEAUX[n]}"><i></i><i></i><i></i> ${NIVEAUX[n]}</span>`;
  const niveauChoisi = () => +D().reglages.niveau || 0;
  const bonNiveau = (f) => !niveauChoisi() || f.niveau === niveauChoisi();
  function dessinerFiltreNiveau(apres) {
    const z = $("filtre-niveau"), n = niveauChoisi();
    z.innerHTML = [[0, "Tous les niveaux"], [1, NIVEAUX[1]], [2, NIVEAUX[2]], [3, NIVEAUX[3]]].map(([k, t]) => `<button type="button" data-niveau="${k}" aria-pressed="${n === k}">${k ? badgeNiveau(k).replace(/ [A-Za-zéÉ]+<\/span>$/, "</span>") + " " : ""}${t}</button>`).join("");
    z.querySelectorAll("[data-niveau]").forEach(b => b.onclick = () => { D().reglages.niveau = +b.dataset.niveau; Compte.sauver(); apres(); });
  }
  const minutes = (s) => `≈ ${Math.max(1, Math.round(s / 60))} min`;
  // « Mon matériel » : undefined = tout voir ; sinon la liste de ce que la personne possède
  const monMateriel = () => Array.isArray(D().reglages.materiel) ? D().reglages.materiel : null;
  const jaiLeMateriel = (f) => { const m = monMateriel(); return !m || f.lieu !== "maison" || materielFiche(f).every(k => m.includes(k)); };
  const badgeMateriel = (f) => { if (f.lieu !== "maison" || f.univers || f.perso) return ""; const m = materielFiche(f);
    return m.length ? `<span class="badge mat">${m.map(k => MATERIELS[k]).join(" + ")}</span>` : `<span class="badge mat sans">Sans matériel</span>`; };
  function dessinerMateriel(apres) {
    const z = $("filtre-materiel"); if (!z) return;
    const m = monMateriel();
    z.innerHTML = `<span class="etiquette">Mon matériel :</span>` + [["tout", "Tout voir"], ["rien", "Rien"], ...Object.entries(MATERIELS)].map(([k, t]) =>
      `<button type="button" data-mat="${k}" aria-pressed="${k === "tout" ? !m : k === "rien" ? !!m && !m.length : !!m && m.includes(k)}">${t}</button>`).join("");
    z.querySelectorAll("[data-mat]").forEach(b => b.onclick = () => { const k = b.dataset.mat, r = D().reglages;
      if (k === "tout") delete r.materiel; else if (k === "rien") r.materiel = [];
      else { const l = new Set(monMateriel() || []); l.has(k) ? l.delete(k) : l.add(k); r.materiel = [...l]; }
      Compte.sauver(); apres(); });
  }
  const carteFiche = (f) => { const ex = infoExo(f.exos[0] ? f.exos[0].nom : "", f.exos[0] && f.exos[0].muscle);
    return `<button class="fiche" type="button" data-ouvrir="${esc(f.id)}">${f.exos[0] ? vignette(ex) : svgSilhouette({ nom: "", p: [], s: [] })}
      <span><b>${esc(f.titre)}</b><span class="res">${badgeMateriel(f)}${f.niveau ? badgeNiveau(f.niveau) + " " : ""}${esc(resumeFiche(f))} · ${minutes(dureeFiche(f))}</span></span><span class="fleche" aria-hidden="true">›</span></button>`; };
  // ---------- Accueil (4 tuiles) puis un espace : Maison, Salle, Course ou Marche ----------
  const pubChoisi = () => D().reglages.public === "femme" ? "femme" : "homme";
  const pourMoi = (f) => pubChoisi() === "femme" ? f.public === "femmes" : !f.public;
  const NOM_ESPACE = { maison: "🏠 Maison", salle: "🏋️ Salle", running: "🏃 Course", marche: "🚶 Marche" };
  const ficheEspace = (f, e) => !f.echauffement && (e === "running" || e === "marche" ? f.univers === e : !f.univers && f.lieu === e && pourMoi(f));
  // le niveau choisi (Profil) : les séances de ce niveau d'abord
  const triNiveau = (a, b) => { const n = niveauChoisi(); return n ? Math.abs(a.niveau - n) - Math.abs(b.niveau - n) : a.niveau - b.niveau; };
  function dessinerSeances(param) {
    $("bonjour").textContent = `Bonjour ${Compte.utilisateur.prenom}`;
    const [e, zone] = (param || "").split(":");
    if (!NOM_ESPACE[e]) return dessinerAccueil();
    $("accueil").hidden = true; $("espace").hidden = false;
    $("titre-seances").innerHTML = NOM_ESPACE[e].replace(/ (\S+)$/, " <span>$1</span>");
    // garde les anciens réglages à jour (création de séance, exercices…)
    if (e === "maison" || e === "salle") { lieu = e; D().reglages.lieu = e; D().reglages.univers = "fitness"; } else D().reglages.univers = e;
    Compte.sauver();
    $("espace-retour").onclick = () => aller("seances");
    $("bloc-gps").hidden = e === "maison" || e === "salle";
    $("espace-materiel").innerHTML = ""; $("zones").innerHTML = "";
    $("pour-moi").onclick = () => seancePourMoi(e);
    if (e === "running" || e === "marche") return dessinerUnivers(e);
    // Maison : le matériel qu'on a chez soi
    if (e === "maison") {
      const m = monMateriel();
      if (!m) setTimeout(() => demanderMateriel(() => dessinerSeances(param)), 250);
      $("espace-materiel").innerHTML = `<button class="mon-materiel" type="button" id="changer-materiel"><span>Chez moi : <b>${m && m.length ? m.map(k => MATERIELS[k]).join(", ") : "aucun accessoire"}</b></span><span class="lien-txt">Modifier</span></button>`;
      $("changer-materiel").onclick = () => demanderMateriel(() => dessinerSeances(param));
    }
    const toutes = FICHES.filter(f => ficheEspace(f, e) && jaiLeMateriel(f));
    $("zones").innerHTML = `<p class="question">Que voulez-vous travailler ?</p><div class="tuiles petites">${Object.entries(ZONES).map(([z, Z]) => {
      const n = toutes.filter(f => zoneDe(f) === z).length; if (!n) return "";
      return `<button type="button" class="tuile zone" data-zone="${z}" aria-pressed="${z === zone}"><span class="ico" aria-hidden="true">${Z.ico}</span><b>${Z.nom}</b><span>${n} séance${n > 1 ? "s" : ""}</span></button>`; }).join("")}</div>`;
    $("zones").querySelectorAll("[data-zone]").forEach(b => b.onclick = () => aller("seances", e + ":" + b.dataset.zone, true));
    if (zone && ZONES[zone]) {
      const fiches = toutes.filter(f => zoneDe(f) === zone).sort((a, b) => (materielFiche(a).length > 0) - (materielFiche(b).length > 0) || triNiveau(a, b));
      $("groupes-fiches").innerHTML = `<section class="groupe" id="liste-zone"><div class="groupe-tete"><h2>${ZONES[zone].nom}</h2><span class="muscles-liste">${ZONES[zone].detail}</span></div>
        <div class="liste-fiches">${fiches.map(carteFiche).join("")}</div>
        ${zone !== "complet" ? `<button class="lien" type="button" data-voir-exos="${zone}">Voir tous les exercices « ${ZONES[zone].nom.toLowerCase()} » ${e === "salle" ? "à la salle" : "à la maison"} →</button>` : ""}</section>`;
      setTimeout(() => $("liste-zone")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    } else $("groupes-fiches").innerHTML = "";
    const miennes = mesSeances().filter(f => f.lieu === e && !f.univers);
    $("mes-seances").innerHTML = miennes.map(carteFiche).join("")
      || `<div class="total">Créez votre propre séance ${e === "salle" ? "de salle" : "à la maison"} : choisissez les exercices dans la liste, c'est tout.</div>`;
    $("v-seances").querySelectorAll("#espace [data-ouvrir]").forEach(b => b.addEventListener("click", () => aller("fiche", b.dataset.ouvrir)));
    $("v-seances").querySelectorAll("[data-voir-exos]").forEach(b => b.addEventListener("click", () => { biblio = { groupe: b.dataset.voirExos, muscle: "tout" }; D().reglages.lieuBiblio = e; aller("exercices"); }));
  }
  function dessinerAccueil() {
    $("accueil").hidden = false; $("espace").hidden = true;
    $("titre-seances").innerHTML = "Rythmo <span>Sport</span>";
    $("accueil").querySelectorAll("[data-espace]").forEach(b => b.onclick = () => aller("seances", b.dataset.espace));
    // reprendre la dernière séance faite
    const h = (D().historique || []).find(x => x.id && trouverFiche(x.id) && !trouverFiche(x.id).echauffement);
    $("derniere").innerHTML = h ? `<p class="question">Refaire votre dernière séance</p><div class="liste-fiches">${carteFiche(trouverFiche(h.id))}</div>` : "";
    $("derniere").querySelectorAll("[data-ouvrir]").forEach(b => b.onclick = () => aller("fiche", b.dataset.ouvrir));
  }
  // « Qu'avez-vous chez vous ? » : demandé une fois, modifiable à tout moment
  function demanderMateriel(apres) {
    const m = new Set(monMateriel() || []);
    ouvrirFeuille(`<div class="fiche-exo"><h2>🏠 Qu'avez-vous chez vous ?</h2>
      <p class="total">Cochez ce que vous avez. Rien du tout ? Ne cochez rien : il y a plein de séances sans matériel. Un tapis (ou une serviette) et une chaise suffisent.</p>
      <div class="choix-materiel">${Object.entries(MATERIELS).map(([k, t]) => `<label class="case grosse"><input type="checkbox" value="${k}" ${m.has(k) ? "checked" : ""}> ${t}</label>`).join("")}</div>
      <button class="principal" type="button" data-mat-ok>Valider</button></div>`, (fe) => {
      fe.querySelector("[data-mat-ok]").onclick = () => { D().reglages.materiel = [...fe.querySelectorAll(".choix-materiel input:checked")].map(i => i.value); Compte.sauver(); fermerFeuille(); apres && apres(); };
    });
  }
  // « Une séance pour moi » : adaptée au public, au niveau et au matériel, en variant les zones
  function seancePourMoi(e) {
    let c = FICHES.filter(f => ficheEspace(f, e) && jaiLeMateriel(f) && f.cat !== "etirements" && f.cat !== "echauffement");
    if (!c.length) return toast("Aucune séance trouvée");
    const n = niveauChoisi(); if (n && c.some(f => f.niveau === n)) c = c.filter(f => f.niveau === n);
    const recentes = (D().historique || []).slice(0, 4).map(h => h.id), zonesRecentes = recentes.map(id => trouverFiche(id)).filter(Boolean).map(zoneDe);
    const neuves = c.filter(f => !recentes.includes(f.id) && !zonesRecentes.includes(zoneDe(f)));
    const pool = neuves.length ? neuves : c.filter(f => !recentes.includes(f.id)).length ? c.filter(f => !recentes.includes(f.id)) : c;
    const f = pool[Math.floor(Math.random() * pool.length)];
    toast("Votre séance du jour : " + f.titre); aller("fiche", f.id);
  }
  function dessinerUnivers(u) {
    const U = UNIVERS[u];
    const miennes = mesSeances().filter(f => f.univers === u);
    $("mes-seances").innerHTML = miennes.map(carteFiche).join("")
      || `<div class="total">Créez votre propre séance de ${u === "running" ? "course" : "marche"} : choisissez les exercices et les durées.</div>`;
    $("bloc-gps").innerHTML = `<button class="gps-lancer" type="button" data-gps>📍 <span><b>${GPS.actif() ? "Suivi GPS en cours : " + GPS.resumeTexte() : "Suivi GPS de mon parcours"}</b><span>Distance, temps, allure et tracé sur la carte</span></span><span class="fleche" aria-hidden="true">›</span></button>`;
    $("groupes-fiches").innerHTML = U.categories.map(([cat, nom]) => {
      const fiches = FICHES.filter(f => f.univers === u && f.cat === cat).sort(triNiveau); if (!fiches.length) return "";
      return `<section class="groupe"><div class="groupe-tete"><h2>${nom}</h2></div><div class="liste-fiches">${fiches.map(carteFiche).join("")}</div></section>`; }).join("");
    $("v-seances").querySelectorAll("#espace [data-ouvrir]").forEach(b => b.addEventListener("click", () => aller("fiche", b.dataset.ouvrir)));
    $("v-seances").querySelector("[data-gps]").onclick = () => aller("gps", u);
  }
  $("creer-seance").addEventListener("click", () => ouvrirEdition(null));

  // ---------- Détail d'une fiche ----------
  function dessinerFiche(id) {
    const f = trouverFiche(id), perso = estPerso(f);
    let h = `<div class="tete-fiche">
        <div class="infos-fiche">${f.univers ? `<span class="badge univers">${UNIVERS[f.univers].nom}</span>` : ""}<span class="badge ${f.lieu}">${NOM_LIEU[f.lieu] || "Maison"}</span><span class="badge type">${f.type === "circuit" ? "Circuit chrono" : "Séries (muscu)"}</span>${f.niveau ? `<span class="badge type">${badgeNiveau(f.niveau)}</span>` : ""}${f.groupe ? `<span class="badge type">${GROUPES[f.groupe].nom}</span>` : ""}</div>
        <h2>${esc(f.titre)}</h2>
        ${f.note ? `<p class="doux">${esc(f.note)}</p>` : ""}
        ${f.lieu === "maison" && !f.univers ? `<p class="total">Matériel : <b>${materielFiche(f).map(k => MATERIELS[k]).join(", ") || "aucun"}</b></p>` : ""}
        <p class="total">${f.type === "circuit" && dureesDifferentes(f) ? `<b>${f.tours}</b> fois : ${f.exos.map(e => `${esc(e.nom)} <b>${dureeTexte(+e.duree || f.travail)}</b>`).join(" → ")}` : f.type === "circuit" ? `<b>${f.travail} s</b> d'effort · <b>${f.repos} s</b> de repos · <b>${f.tours}</b> rounds` : `<b>${f.exos.reduce((a, e) => a + (+e.series || 0), 0)}</b> séries au total`} · <b>${minutes(dureeFiche(f))}</b></p>
      </div>
      ${blocProgression(f)}
      <button class="principal" type="button" id="lancer-fiche">▶ Lancer la séance</button>
      ${f.echauffement || f.cat === "echauffement" ? "" : `<button class="secondaire bouton-musique" type="button" id="lancer-musique">🎵 Séance musique : 1 chanson = 1 exercice</button>`}
      <div class="exos-fiche">${f.exos.map((e, i) => { const ex = infoExo(e.nom, e.muscle);
        return `<button class="exo-ligne" type="button" data-exo="${i}">${vignette(ex)}<span><b>${i + 1}. ${esc(e.nom)}</b><span>${esc(nomMuscles(ex) + materiel(ex))}${f.type === "series" ? ` · ${e.series} × ${esc(e.reps)} · repos ${dureeTexte(+e.repos || 0)}` : e.duree ? ` · ${dureeTexte(+e.duree)}` : ""}</span></span><span class="fleche doux" aria-hidden="true">›</span></button>`; }).join("")}</div>
      <div class="actions">${perso
        ? `<button class="ajout" type="button" id="modifier-fiche">Modifier</button><button class="lien danger" type="button" id="supprimer-fiche">Supprimer la séance</button>`
        : `<button class="ajout" type="button" id="copier-fiche">Copier dans mes séances pour la modifier</button>`}</div>`;
    $("fiche-corps").innerHTML = h;
    $("fiche-corps").querySelectorAll("[data-exo]").forEach(b => b.addEventListener("click", () => { const e = f.exos[+b.dataset.exo]; ouvrirExo(infoExo(e.nom, e.muscle)); }));
    $("lancer-fiche").addEventListener("click", () => lancerFiche(f));
    if ($("lancer-musique")) $("lancer-musique").onclick = () => choisirMusiques(f);
    const monter = $("fiche-corps").querySelector("[data-monter]");
    if (monter) monter.addEventListener("click", () => { const c = versionPlusDure(f); mesSeances().push(c); Compte.sauver(); toast("Version plus dure créée dans vos séances"); aller("fiche", c.id, true); });
    $("fiche-corps").querySelectorAll("[data-voir-fiche]").forEach(b => b.addEventListener("click", () => aller("fiche", b.dataset.voirFiche)));
    if (perso) {
      $("modifier-fiche").addEventListener("click", () => ouvrirEdition(f));
      deuxClics($("supprimer-fiche"), "Sûr ? Touchez encore pour supprimer", () => { D().seances = mesSeances().filter(x => x.id !== f.id); Compte.sauver(); history.back(); });
    } else $("copier-fiche").addEventListener("click", () => {
      const copie = JSON.parse(JSON.stringify(f)); copie.id = "p" + Date.now(); copie.titre = f.titre + " (à moi)"; delete copie.groupe;
      mesSeances().push(copie); Compte.sauver(); toast("Copiée dans vos séances"); ouvrirEdition(copie);
    });
  }

  // ---------- Séance musique : on choisit ses chansons, une par exercice ----------
  let musiqueEnPrep = false;
  function choisirMusiques(f) {
    const ms = Minuteur.morceaux(), r = D().reglages, deja = new Set(r.musiquesSeance || ms.map(m => m.id));
    const n = f.exos.length;
    ouvrirFeuille(`<div class="fiche-exo"><h2>🎵 1 chanson = 1 exercice</h2>
      <p>La musique devient le minuteur : <b>l'effort démarre quand la musique monte, le repos arrive quand elle retombe</b>. À chaque nouvelle chanson, on change d'exercice.</p>
      <p class="total">Cette séance a <b>${n} exercices</b> : choisissez vos chansons (elles se répètent s'il y en a moins).</p>
      <div class="choix-materiel">${ms.map(m => `<label class="case grosse"><input type="checkbox" value="${esc(m.id)}" ${deja.has(m.id) ? "checked" : ""}> ♪ ${esc(m.nom)}</label>`).join("")}</div>
      <p class="total">Ajoutez vos propres MP3 dans le Minuteur → « Ma musique ».</p>
      <div class="puces" id="sm-duree">${[[150, "2 min 30 par chanson"], [0, "Chansons entières"]].map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${(r.capSeance ?? 150) === k}">${t}</button>`).join("")}</div>
      <button class="principal" type="button" data-sm-go>▶ C'est parti</button></div>`, (fe) => {
      // on commence à écouter les chansons tout de suite, pour que la séance démarre sans attendre
      const prechauffer = () => { const cap = +fe.querySelector("#sm-duree [aria-pressed=true]").dataset.v;
        [...fe.querySelectorAll(".choix-materiel input:checked")].forEach(i => SeanceMusique.analyser(ms.find(m => m.id === i.value), cap).catch(() => {})); };
      prechauffer(); fe.querySelectorAll(".choix-materiel input").forEach(i => i.addEventListener("change", prechauffer));
      fe.querySelectorAll("#sm-duree [data-v]").forEach(b => b.onclick = () => { fe.querySelectorAll("#sm-duree [data-v]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); prechauffer(); });
      fe.querySelector("[data-sm-go]").onclick = async () => {
        const ids = [...fe.querySelectorAll(".choix-materiel input:checked")].map(i => i.value);
        if (!ids.length) return toast("Choisissez au moins une chanson");
        r.musiquesSeance = ids; r.capSeance = +fe.querySelector("#sm-duree [aria-pressed=true]").dataset.v; Compte.sauver();
        fermerFeuille(); musiqueEnPrep = true; aller("musique");
        const ok = await SeanceMusique.lancer(f, ids.map(id => ms.find(m => m.id === id)), r.capSeance);
        musiqueEnPrep = false; if (!ok) history.back();
      };
    });
  }

  // ---------- Échauffement : proposé avant chaque séance pour éviter les blessures ----------
  let seanceApres = null;   // la séance à lancer une fois l'échauffement fini
  const sansEchauffement = (f) => f.echauffement || f.cat === "echauffement" || f.cat === "etirements";
  const dejaEchauffe = () => Date.now() - (D().dernierEchauffement || 0) < 45 * 60 * 1000;
  function chargerDansMinuteur(f) {
    if (f.type === "circuit") Minuteur.chargerCircuit(f); else Minuteur.chargerSeries(f);
    majPasserEch(f);
    aller("minuteur"); toast(f.type === "circuit" ? "Prêt : appuyez sur Démarrer" : "Faites votre série, puis touchez son numéro");
  }
  function lancerFiche(f, passer) {
    if (Minuteur.occupe()) { toast("Une séance tourne déjà : remettez le minuteur à zéro d'abord."); return aller("minuteur"); }
    if (passer || sansEchauffement(f) || dejaEchauffe() || D().reglages.pasDEchauffement) { seanceApres = null; return chargerDansMinuteur(f); }
    const e = trouverFiche(echauffementPour(f));
    ouvrirFeuille(`<div class="fiche-exo"><h2>🔥 Échauffement d'abord ?</h2>
      <p>Pour éviter les blessures, faites <b>5 minutes d'échauffement</b> avant « ${esc(f.titre)} ». Muscles et articulations chauds = moins de risques et de meilleures performances.</p>
      <button class="principal" type="button" data-ech-oui>🔥 Oui : ${esc(e.titre)}</button>
      <p class="total">Ensuite, votre séance se lance en un seul appui.</p>
      <button class="secondaire passer-ech" type="button" data-ech-non>⏭ Passer l'échauffement</button>
      <p class="total">Vous êtes déjà échauffé(e) : l'appli ne vous le redemande pas pendant 45 minutes.</p>
      <label class="case"><input type="checkbox" data-ech-jamais> Ne plus me proposer l'échauffement</label></div>`, (fe) => {
      fe.querySelector("[data-ech-jamais]").onchange = (ev) => { D().reglages.pasDEchauffement = ev.target.checked; Compte.sauver(); };
      fe.querySelector("[data-ech-oui]").onclick = () => { fermerFeuille(); seanceApres = f.id; chargerDansMinuteur(e); toast("Échauffement prêt : appuyez sur Démarrer"); };
      // « Déjà échauffé(e) » : on le note, l'appli ne redemande plus pendant 45 minutes
      fe.querySelector("[data-ech-non]").onclick = () => { fermerFeuille(); seanceApres = null; D().dernierEchauffement = Date.now(); Compte.sauver(); chargerDansMinuteur(f); };
    });
  }
  // Pendant l'échauffement : bouton pour le sauter et passer directement à la séance
  function majPasserEch(f) {
    const b = $("passer-ech"), suite = seanceApres && trouverFiche(seanceApres);
    b.hidden = !(f.echauffement && suite);
    if (suite) b.textContent = "⏭ Passer l'échauffement → " + suite.titre;
  }
  $("passer-ech").addEventListener("click", () => {
    const suite = seanceApres && trouverFiche(seanceApres); if (!suite) return;
    seanceApres = null; $("stop").click(); D().dernierEchauffement = Date.now(); Compte.sauver(); lancerFiche(suite, true);
  });
  // Fin d'une séance : après l'échauffement, on propose de passer à la vraie séance
  Minuteur.surFin((id) => {
    const f = trouverFiche(id); if (!f) return;
    if (f.echauffement || f.cat === "echauffement") {
      D().dernierEchauffement = Date.now(); Compte.sauver();
      const suite = seanceApres && trouverFiche(seanceApres); seanceApres = null; $("passer-ech").hidden = true;
      if (suite) { const b = document.createElement("button"); b.className = "principal"; b.type = "button"; b.textContent = "▶ Passer à ma séance : " + suite.titre;
        b.onclick = () => lancerFiche(suite, true); $("bilan").appendChild(document.createElement("br")); $("bilan").appendChild(b); }
    }
  });
  // ---------- Progression : au bout de 3 séances réussies, on propose plus dur ----------
  const fois = (f) => (D().historique || []).filter(h => h.id === f.id && !/pas finie/.test(h.detail || "")).length;
  function versionPlusDure(f) {
    const c = JSON.parse(JSON.stringify(f)); c.id = "p" + Date.now(); c.base = f.id; c.niveau = Math.min(3, (f.niveau || 1) + 1);
    c.palier = (f.palier || 0) + 1; c.titreBase = f.titreBase || f.titre; c.titre = `${c.titreBase} · niveau +${c.palier}`;
    delete c.public; delete c.groupe; delete c.cat;
    if (f.univers) c.univers = f.univers;
    if (c.type === "circuit") {
      c.tours = (c.tours || 3) + 1;
      if (!c.exos.some(e => e.duree)) { c.travail = Math.min(900, (c.travail || 40) + 5); if (c.repos > 10) c.repos = Math.max(10, c.repos - 5); }
      else c.exos.forEach(e => { if (/rapide/i.test(e.nom)) e.duree = Math.round(e.duree * 1.15); });   // la partie rapide un peu plus longue
    } else c.exos.forEach(e => { if ((+e.series || 3) < 5) e.series = (+e.series || 3) + 1; else e.repos = Math.max(30, (+e.repos || 60) - 15); });
    return c;
  }
  function blocProgression(f) {
    const n = fois(f); if (n < 3) return n ? `<p class="total">Faite <b>${n}</b> fois. Encore ${3 - n} pour débloquer le niveau supérieur 💪</p>` : "";
    const deja = mesSeances().find(x => x.base === f.id);
    const autre = FICHES.find(x => x !== f && x.niveau === (f.niveau || 1) + 1 && x.lieu === f.lieu && (x.groupe && x.groupe === f.groupe || x.cat && x.cat === f.cat) && x.public === f.public && x.univers === f.univers);
    return `<div class="progression"><b>🔥 Déjà faite ${n} fois : prêt${D().reglages.public === "femme" ? "e" : ""} à passer au niveau supérieur ?</b>
      ${deja ? `<button class="ajout" type="button" data-voir-fiche="${esc(deja.id)}">Voir ma version plus dure</button>` : `<button class="ajout" type="button" data-monter>Créer ma version plus dure</button>`}
      ${autre ? `<button class="lien" type="button" data-voir-fiche="${esc(autre.id)}">Ou essayez « ${esc(autre.titre)} » (${NIVEAUX[autre.niveau]}) →</button>` : ""}</div>`;
  }

  // ---------- Fiche d'un exercice (fenêtre du bas) ----------
  function ouvrirFeuille(html, apres) {
    const fe = $("feuille"); fe.innerHTML = `<div class="feuille-boite" role="dialog" aria-modal="true"><div class="feuille-poignee"></div>${html}<button class="ajout" type="button" data-fermer>Fermer</button></div>`;
    fe.hidden = false; fe.onclick = (e) => { if (e.target === fe || e.target.closest("[data-fermer]")) fermerFeuille(); };
    if (apres) apres(fe);
  }
  window.ouvrirFeuilleRecette = (h) => ouvrirFeuille(h);
  function fermerFeuille() { $("feuille").hidden = true; $("feuille").innerHTML = ""; }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fermerFeuille(); });
  function ouvrirExo(ex) {
    ouvrirFeuille(`<div class="fiche-exo">
      <div class="infos-fiche">${ex.libre ? "" : `<span class="badge ${ex.lieu}">${NOM_LIEU[ex.lieu] || "Maison"}</span>`}<span class="badge type">${GROUPES[groupeDuMuscle(ex.muscle)].nom}</span></div>
      <h2>${esc(ex.nom)}</h2>
      ${animMouvement(ex)}
      ${ex.photo ? `<details class="deux-photos"><summary>Voir les 2 photos (départ / arrivée)</summary>${photosGrandes(ex)}</details>` : ""}
      <a class="secondaire video" href="${lienVideo(ex)}" target="_blank" rel="noopener">▶ Voir une vidéo du mouvement (YouTube)</a>
      <div class="corps-muscles">${CORPS_SVG}</div>
      <p class="total">Muscles : <b>${esc(nomMuscles(ex))}</b>${ex.materiel ? ` · Matériel : <b>${esc(ex.materiel)}</b>` : ""}${ex.libre ? "" : ` · Conseil : <b>${ex.series} × ${esc(ex.reps)}</b>, repos ${dureeTexte(ex.repos)}`}</p>
    </div>`, (fe) => { colorerCorps(fe, ex); brancherZoom(fe, ex); });
  }

  // ---------- Bibliothèque d'exercices ----------
  function dessinerBiblio() {
    lieu = D().reglages.lieu || lieu;
    brancherLieux($("v-exercices"), dessinerBiblio);
    $("biblio-groupes").innerHTML = [["tout", "Tous"], ...Object.entries(GROUPES).map(([g, G]) => [g, G.nom])]
      .map(([g, n]) => `<button type="button" data-g="${g}" aria-pressed="${biblio.groupe === g}">${n}</button>`).join("");
    const muscles = biblio.groupe !== "tout" && GROUPES[biblio.groupe].muscles.length > 1 ? GROUPES[biblio.groupe].muscles : [];
    $("biblio-muscles").hidden = !muscles.length;
    $("biblio-muscles").innerHTML = [["tout", "Tous"], ...muscles.map(m => [m, MUSCLES[m]])]
      .map(([m, n]) => `<button type="button" data-m="${m}" aria-pressed="${biblio.muscle === m}">${n}</button>`).join("");
    const lieuBiblio = D().reglages.lieuBiblio || lieu;
    $("v-exercices").querySelectorAll(".lieux button").forEach(b => { b.setAttribute("aria-pressed", String(b.dataset.lieu === lieuBiblio));
      b.onclick = () => { D().reglages.lieuBiblio = b.dataset.lieu; if (b.dataset.lieu !== "exterieur") { lieu = b.dataset.lieu; D().reglages.lieu = lieu; } Compte.sauver(); dessinerBiblio(); }; });
    const liste = EXERCICES.filter(e => (e.lieu === lieuBiblio || e.lieu === "partout") && (biblio.groupe === "tout" || groupeDuMuscle(e.muscle) === biblio.groupe) && (biblio.muscle === "tout" || e.muscle === biblio.muscle));
    let html = "";
    for (const [g, G] of Object.entries(GROUPES)) {
      if (biblio.groupe !== "tout" && g !== biblio.groupe) continue;
      for (const m of G.muscles) { const l = liste.filter(e => e.muscle === m); if (!l.length) continue;
        html += `<h3 class="sous-titre">${G.muscles.length > 1 ? `${G.nom} · ${MUSCLES[m]}` : G.nom}</h3>` + l.map(e =>
          `<button class="exo-ligne" type="button" data-nom="${esc(e.nom)}">${vignette(e)}<span><b>${esc(e.nom)}</b><span>${esc(nomMuscles(e))} · ${e.series} × ${esc(e.reps)}${esc(materiel(e))}</span></span><span class="fleche doux" aria-hidden="true">›</span></button>`).join(""); }
    }
    $("biblio-liste").innerHTML = html || '<div class="total">Aucun exercice ici.</div>';
    $("biblio-groupes").querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => { biblio = { groupe: b.dataset.g, muscle: "tout" }; dessinerBiblio(); }));
    $("biblio-muscles").querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { biblio.muscle = b.dataset.m; dessinerBiblio(); }));
    $("biblio-liste").querySelectorAll("[data-nom]").forEach(b => b.addEventListener("click", () => ouvrirExo(infoExo(b.dataset.nom))));
  }

  // ---------- Créer / modifier une séance ----------
  let brouillon = null, nouvelle = false, choix = null;
  function ouvrirEdition(f) {
    const u = UNIVERS[D().reglages.univers] ? D().reglages.univers : null;
    brouillon = f ? JSON.parse(JSON.stringify(f)) : { id: "p" + Date.now(), titre: "", lieu: u ? "exterieur" : lieu, type: lieu === "salle" && !u ? "series" : "circuit", ...(u ? { univers: u } : {}),
      note: "", travail: 40, repos: 20, tours: 3, pause: 60, exos: [] };
    nouvelle = !f; choix = null; dessinerEdition(); aller("edition");
  }
  function lireEdition() {
    const b = brouillon; if (!$("ed-titre")) return;
    b.titre = $("ed-titre").value.trim(); b.note = $("ed-note").value.trim();
    if ($("ed-travail")) { b.travail = Math.max(5, +$("ed-travail").value || 40); b.repos = Math.max(0, +$("ed-repos").value || 0); b.tours = Math.max(1, +$("ed-tours").value || 1); b.pause = Math.max(0, +$("ed-pause").value || 0); }
    $("edition-corps").querySelectorAll("[data-ed]").forEach(el => { const e = b.exos[+el.dataset.ed], kk = el.dataset.k;
      e[kk] = ["series", "repos"].includes(kk) ? Math.max(kk === "series" ? 1 : 0, +el.value || 0) : el.value; });
  }
  function dessinerEdition() {
    if (choix) return dessinerChoix();
    const b = brouillon, lieuB = (l) => `<button type="button" data-ed-lieu="${l}" data-lieu="${l}" aria-pressed="${b.lieu === l}">${{ salle: "🏋️ Salle", maison: "🏠 Maison", exterieur: "🌳 Dehors" }[l]}</button>`;
    $("edition-corps").innerHTML = `<div class="edition ${b.type === "circuit" ? "circuit" : ""}">
      <button class="lien" type="button" data-annuler>← Annuler</button>
      <h2>${nouvelle ? "Nouvelle séance" : "Modifier la séance"}</h2>
      <label class="champ">Nom de la séance<input id="ed-titre" value="${esc(b.titre)}" placeholder="Ex. : Mon full body du lundi"></label>
      <div class="lieux trois" role="group" aria-label="Lieu">${lieuB("maison")}${lieuB("salle")}${lieuB("exterieur")}</div>
      <div class="filtres" role="group" aria-label="Type de séance">
        <button type="button" data-ed-type="series" aria-pressed="${b.type === "series"}">Séries (muscu)</button>
        <button type="button" data-ed-type="circuit" aria-pressed="${b.type === "circuit"}">Circuit chrono</button></div>
      <p class="total">${b.type === "circuit" ? "Circuit : les exercices s'enchaînent avec le minuteur (effort, repos, rounds)." : "Séries : vous cochez chaque série finie, le repos se lance tout seul."}</p>
      ${b.type === "circuit" ? `<div class="grille3">
        <label>Effort (s)<input id="ed-travail" type="number" inputmode="numeric" min="5" max="900" value="${b.travail || 40}"></label>
        <label>Repos (s)<input id="ed-repos" type="number" inputmode="numeric" min="0" max="600" value="${b.repos ?? 20}"></label>
        <label>Rounds<input id="ed-tours" type="number" inputmode="numeric" min="1" max="99" value="${b.tours || 3}"></label>
        <label>Pause rounds (s)<input id="ed-pause" type="number" inputmode="numeric" min="0" max="600" value="${b.pause ?? 60}"></label></div>` : ""}
      <label class="champ">Note (facultatif)<input id="ed-note" value="${esc(b.note || "")}" placeholder="Matériel, conseils…"></label>
      <h3 class="sous-titre">Exercices (${b.exos.length})</h3>
      ${b.exos.map((e, i) => { const ex = infoExo(e.nom, e.muscle); return `<div class="ed-exo">
        <div class="ed-l1">${vignette(ex)}
          ${ex.libre || !PAR_NOM.has(e.nom) ? `<input data-ed="${i}" data-k="nom" value="${esc(e.nom)}" aria-label="Nom de l'exercice ${i + 1}">` : `<span class="nom-ed">${i + 1}. ${esc(e.nom)}</span>`}
          <span class="boutons-ed">${i ? `<button class="mini" type="button" data-ed-monter="${i}" aria-label="Monter ${esc(e.nom)}">↑</button>` : ""}<button class="mini" type="button" data-ed-remplacer="${i}">⇄</button><button class="x" type="button" data-ed-suppr="${i}" aria-label="Retirer ${esc(e.nom)}">×</button></span></div>
        ${b.type === "circuit" && !(ex.libre || !PAR_NOM.has(e.nom)) ? "" : `<div class="ed-l2">
          ${ex.libre || !PAR_NOM.has(e.nom) ? `<label>Muscle<select data-ed="${i}" data-k="muscle">${Object.entries(MUSCLES).map(([k, n]) => `<option value="${k}" ${k === (e.muscle || ex.muscle) ? "selected" : ""}>${n}</option>`).join("")}</select></label>` : ""}
          <label class="seul-series">Séries<input data-ed="${i}" data-k="series" type="number" inputmode="numeric" min="1" max="10" value="${+e.series || 3}"></label>
          <label class="seul-series">Reps<input data-ed="${i}" data-k="reps" value="${esc(e.reps || "10")}"></label>
          <label class="seul-series">Repos (s)<input data-ed="${i}" data-k="repos" type="number" inputmode="numeric" min="0" max="600" step="15" value="${e.repos ?? 60}"></label>
        </div>`}</div>`; }).join("") || '<div class="total">Pas encore d\'exercice : touchez « Choisir des exercices » et cochez-en plusieurs d\'un coup.</div>'}
      <button class="principal" type="button" data-ed-choisir>+ Choisir des exercices</button>
      <button class="ajout" type="button" data-ed-libre>+ Exercice libre (taper le nom)</button>
      <div class="actions"><button class="gros go" type="button" data-enregistrer style="--phase: var(--repos)">Enregistrer</button>
        ${nouvelle ? "" : '<button class="lien danger" type="button" data-supprimer>Supprimer la séance</button>'}</div>
    </div>`;
    const R = $("edition-corps");
    R.querySelector("[data-annuler]").addEventListener("click", () => { brouillon = null; history.back(); });
    R.querySelectorAll("[data-ed-lieu]").forEach(x => x.addEventListener("click", () => { lireEdition(); b.lieu = x.dataset.edLieu; dessinerEdition(); }));
    R.querySelectorAll("[data-ed-type]").forEach(x => x.addEventListener("click", () => { lireEdition(); b.type = x.dataset.edType; dessinerEdition(); }));
    R.querySelector("[data-ed-libre]").addEventListener("click", () => { lireEdition(); b.exos.push({ nom: "Nouvel exercice", muscle: "cardio", series: 3, reps: "10", repos: 60 }); dessinerEdition();
      const champs = R.querySelectorAll('[data-k="nom"]'); const d = champs[champs.length - 1]; if (d) { d.focus(); d.select(); } });
    R.querySelector("[data-ed-choisir]").addEventListener("click", () => { lireEdition(); choix = { mode: "ajout", lieu: b.lieu, groupe: "tout", muscle: "tout", selection: [] }; dessinerEdition(); window.scrollTo(0, 0); });
    R.querySelectorAll("[data-ed-remplacer]").forEach(x => x.addEventListener("click", () => { lireEdition(); const i = +x.dataset.edRemplacer, ex = infoExo(b.exos[i].nom, b.exos[i].muscle);
      choix = { mode: "remplacer", index: i, lieu: b.lieu, groupe: groupeDuMuscle(ex.muscle), muscle: ex.muscle === "cardio" ? "tout" : ex.muscle, selection: [] }; dessinerEdition(); window.scrollTo(0, 0); }));
    R.querySelectorAll("[data-ed-monter]").forEach(x => x.addEventListener("click", () => { lireEdition(); const i = +x.dataset.edMonter; [b.exos[i - 1], b.exos[i]] = [b.exos[i], b.exos[i - 1]]; dessinerEdition(); }));
    R.querySelectorAll("[data-ed-suppr]").forEach(x => x.addEventListener("click", () => { lireEdition(); b.exos.splice(+x.dataset.edSuppr, 1); dessinerEdition(); }));
    R.querySelector("[data-enregistrer]").addEventListener("click", () => {
      lireEdition(); b.exos = b.exos.filter(e => (e.nom || "").trim());
      if (!b.titre) { b.titre = "Ma séance"; }
      if (!b.exos.length) { toast("Ajoutez au moins un exercice"); return; }
      const i = mesSeances().findIndex(x => x.id === b.id); if (i >= 0) mesSeances()[i] = b; else mesSeances().push(b);
      Compte.sauver(); lieu = b.lieu; D().reglages.lieu = lieu; const id = b.id; brouillon = null;
      aller("fiche", id, true); toast("Séance enregistrée");
    });
    const suppr = R.querySelector("[data-supprimer]");
    if (suppr) deuxClics(suppr, "Sûr ? Touchez encore pour supprimer", () => { D().seances = mesSeances().filter(x => x.id !== b.id); Compte.sauver(); brouillon = null; aller("seances", b.univers || b.lieu, true); });
  }
  // Choisir des exercices dans la bibliothèque : Maison / Salle, groupe, muscle, on coche
  function dessinerChoix() {
    const c = choix, b = brouillon;
    const liste = EXERCICES.filter(x => (c.lieu === "tout" || x.lieu === c.lieu || x.lieu === "partout") && (c.groupe === "tout" || groupeDuMuscle(x.muscle) === c.groupe) && (c.muscle === "tout" || x.muscle === c.muscle));
    const muscles = c.groupe !== "tout" && GROUPES[c.groupe].muscles.length > 1 ? GROUPES[c.groupe].muscles : [];
    $("edition-corps").innerHTML = `<div class="edition">
      <button class="lien" type="button" data-retour-ed>← Retour à la séance</button>
      <h2>${c.mode === "remplacer" ? `Remplacer « ${esc(b.exos[c.index].nom)} »` : "Choisir des exercices"}</h2>
      <div class="filtres" role="group" aria-label="Lieu">${[["maison", "Maison"], ["salle", "Salle"], ["exterieur", "Dehors"], ["tout", "Tout"]].map(([k, n]) =>
        `<button type="button" data-c-lieu="${k}" aria-pressed="${c.lieu === k}">${n}</button>`).join("")}</div>
      <div class="puces defilant" role="group" aria-label="Groupe">${[["tout", "Tous"], ...Object.entries(GROUPES).map(([g, G]) => [g, G.nom])].map(([g, n]) =>
        `<button type="button" data-c-groupe="${g}" aria-pressed="${c.groupe === g}">${n}</button>`).join("")}</div>
      ${muscles.length ? `<div class="puces muscles" role="group" aria-label="Muscle">${[["tout", "Tous"], ...muscles.map(m => [m, MUSCLES[m]])].map(([m, n]) =>
        `<button type="button" data-c-muscle="${m}" aria-pressed="${c.muscle === m}">${n}</button>`).join("")}</div>` : ""}
      ${c.mode === "ajout" ? '<div class="total">Cochez <b>tous</b> les exercices voulus (vous pouvez changer de filtre entre deux), puis « Ajouter ».</div>' : '<div class="total">Touchez l\'exercice qui remplace l\'ancien.</div>'}
      <div class="exos-fiche">${liste.map(x => { const coche = c.selection.includes(x.nom);
        return `<button class="exo-ligne choix${coche ? " coche" : ""}" type="button" data-c="${esc(x.nom)}" aria-pressed="${coche}">${vignette(x)}
          <span><b>${esc(x.nom)}</b><span>${esc(nomMuscles(x))} · ${x.lieu === "salle" ? "salle" : "maison"}${esc(materiel(x))}</span></span>
          ${c.mode === "ajout" ? '<span class="case-coche" aria-hidden="true"></span>' : '<span class="fleche doux">›</span>'}</button>`; }).join("")
        || '<div class="total">Aucun exercice pour ce choix : essayez « Les deux » ou « Tous ».</div>'}</div>
      ${c.mode === "ajout" ? '<div class="barre-ajout"><button class="principal" type="button" data-c-valider disabled>Choisissez des exercices</button></div>' : ""}
    </div>`;
    const R = $("edition-corps");
    const majBouton = () => { const v = R.querySelector("[data-c-valider]"); if (!v) return; const n = c.selection.length;
      v.disabled = !n; v.textContent = n ? `Ajouter ${n} exercice${n > 1 ? "s" : ""}` : "Choisissez des exercices"; };
    majBouton();
    R.querySelector("[data-retour-ed]").addEventListener("click", () => { choix = null; dessinerEdition(); });
    R.querySelectorAll("[data-c-lieu]").forEach(x => x.addEventListener("click", () => { c.lieu = x.dataset.cLieu; dessinerChoix(); }));
    R.querySelectorAll("[data-c-groupe]").forEach(x => x.addEventListener("click", () => { c.groupe = x.dataset.cGroupe; c.muscle = "tout"; dessinerChoix(); }));
    R.querySelectorAll("[data-c-muscle]").forEach(x => x.addEventListener("click", () => { c.muscle = x.dataset.cMuscle; dessinerChoix(); }));
    const versExo = (m) => ({ nom: m.nom, series: m.series, reps: m.reps, repos: m.repos });
    R.querySelectorAll("[data-c]").forEach(x => x.addEventListener("click", () => {
      const nom = x.dataset.c, ex = PAR_NOM.get(nom);
      if (c.mode === "remplacer") { b.exos[c.index] = versExo(ex); choix = null; dessinerEdition(); return; }
      const i = c.selection.indexOf(nom); if (i >= 0) c.selection.splice(i, 1); else c.selection.push(nom);
      x.classList.toggle("coche", i < 0); x.setAttribute("aria-pressed", String(i < 0)); majBouton();
    }));
    const valider = R.querySelector("[data-c-valider]");
    if (valider) valider.addEventListener("click", () => { c.selection.forEach(n => b.exos.push(versExo(PAR_NOM.get(n)))); choix = null; dessinerEdition(); });
  }

  // ---------- Profil ----------
  const debutSemaine = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
  function dessinerProfil() {
    const u = Compte.utilisateur, h = D().historique || [];
    const semaine = h.filter(x => new Date(x.date) >= debutSemaine()).length, total = h.reduce((a, x) => a + (x.duree || 0), 0);
    const jour = (iso) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    $("profil-corps").innerHTML = `
      <section class="bloc">
        <h2>Mon compte</h2>
        <label class="champ">Prénom<input id="pr-prenom" value="${esc(u.prenom)}" autocomplete="given-name"></label>
        <div class="profil-ligne"><span class="doux">E-mail</span><b>${esc(u.email)}</b></div>
        <p class="total">${Compte.enLigne ? "Vos séances sont sauvegardées en ligne : connectez-vous avec cet e-mail sur un autre téléphone pour les retrouver." : "Version de test : vos séances sont gardées sur ce téléphone."}</p>
      </section>
      <section class="bloc reglages-profil">
        <h2>Mes réglages</h2>
        <p class="etiq">Les séances proposées sont pour</p>
        <div class="puces" id="pr-public">${[["homme", "Un homme"], ["femme", "Une femme"]].map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${pubChoisi() === k}">${t}</button>`).join("")}</div>
        <p class="etiq">Mon niveau</p>
        <div class="puces" id="pr-niveau">${[[0, "Je ne sais pas"], [1, NIVEAUX[1]], [2, NIVEAUX[2]], [3, NIVEAUX[3]]].map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${niveauChoisi() === k}">${t}</button>`).join("")}</div>
        <p class="etiq">Mon matériel à la maison</p>
        <button class="mon-materiel" type="button" id="pr-materiel"><span><b>${(monMateriel() || []).map(k => MATERIELS[k]).join(", ") || "Aucun accessoire"}</b></span><span class="lien-txt">Modifier</span></button>
        <label class="case"><input type="checkbox" id="pr-ech" ${D().reglages.pasDEchauffement ? "" : "checked"}> Me proposer l'échauffement avant chaque séance</label>
      </section>
      <section class="bloc">
        <h2>Mes séances faites</h2>
        <div class="chiffres"><div><b>${h.length}</b><span>au total</span></div><div><b>${semaine}</b><span>cette semaine</span></div><div><b>${Math.round(total / 60)}</b><span>minutes</span></div></div>
        ${h.length ? `<ul class="historique">${h.slice(0, 15).map(x => `<li><b>${esc(x.titre)}</b><span>${jour(x.date)}${x.duree ? " · " + fmt(x.duree) : ""}</span></li>`).join("")}</ul>` : '<p class="total">Vos séances terminées apparaîtront ici.</p>'}
      </section>
      <section class="bloc" id="bloc-coach">
        <h2>🎙️ La voix du coach</h2>
        <p class="total">Pendant vos séances, le coach vous encourage : « Encore un petit effort ! », « Bien joué, souffle un peu »…</p>
        <label class="case"><input type="checkbox" id="pr-coach" ${D().reglages.voixCoach === false ? "" : "checked"}> Entendre la voix du coach pendant les séances</label>
        ${Coach.peutEnregistrer() ? `<details class="studio"><summary>🎚️ Studio : enregistrer la voix du coach (vous seul)</summary><div id="studio-corps"></div></details>` : ""}
      </section>
      <button class="principal" type="button" data-guide>📖 Guide de l'appli : comment s'en servir</button>
      <section class="bloc" id="bloc-installer">
        <h2>Mettre l'appli sur l'écran d'accueil</h2>
        <div id="installer-corps"></div>
      </section>
      <section class="bloc">
        <h2>Inviter un ami</h2>
        <p class="total">Montrez-lui ce QR code avec son appareil photo, ou envoyez-lui le lien.</p>
        <div class="qr" id="qr"></div>
        <button class="ajout" type="button" id="partager">Envoyer le lien</button>
      </section>
      <section class="bloc">
        <h2>Un avis sur l'appli ?</h2>
        <p class="total">C'est une version de test : dites à Alex ce qui marche, ce qui manque ou ce qui bloque.</p>
      </section>
      ${Compte.estAdmin ? `<section class="bloc" id="gestion"><h2>Gestion (vous seul)</h2><div id="gestion-corps" class="pile"><p class="total">Chargement…</p></div></section>` : ""}
      <button class="lien danger" type="button" id="deconnexion">Se déconnecter</button>
      <p class="total">Photos des exercices : Free Exercise DB (domaine public). Dessin des muscles : react-body-highlighter (licence MIT). Cartes : © OpenStreetMap.</p>`;
    $("pr-public").querySelectorAll("[data-v]").forEach(b => b.onclick = () => { D().reglages.public = b.dataset.v; Compte.sauver(); dessinerProfil(); toast("Enregistré"); });
    $("pr-niveau").querySelectorAll("[data-v]").forEach(b => b.onclick = () => { D().reglages.niveau = +b.dataset.v; Compte.sauver(); dessinerProfil(); toast("Enregistré"); });
    $("pr-materiel").onclick = () => demanderMateriel(dessinerProfil);
    $("pr-ech").onchange = (ev) => { D().reglages.pasDEchauffement = !ev.target.checked; Compte.sauver(); toast(ev.target.checked ? "L'échauffement vous sera proposé" : "L'échauffement ne vous sera plus proposé"); };
    $("pr-prenom").addEventListener("change", () => { Compte.changerPrenom($("pr-prenom").value); toast("Prénom enregistré"); });
    deuxClics($("deconnexion"), "Sûr ? Touchez encore", async () => { await Compte.deconnecter(); modeAuth = Compte.enLigne ? "connexion" : "inscription"; majAuth(); aller("auth", null, true); });
    dessinerInstall(); $("profil-corps").querySelector("[data-guide]").onclick = () => aller("guide");
    $("pr-coach").onchange = (ev) => { D().reglages.voixCoach = ev.target.checked; Compte.sauver(); };
    if ($("studio-corps")) Coach.dessinerStudio($("studio-corps"));
    if (Compte.estAdmin) dessinerGestion();
    const lien = location.origin + location.pathname.replace(/index\.html$/, "");
    try { const q = qrcode(0, "M"); q.addData(lien); q.make(); $("qr").innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch { $("qr").hidden = true; }
    $("partager").addEventListener("click", async () => {
      const texte = "Essaie Rythmo Sport, mon appli de sport (minuteur, séances maison, salle, running et marche) :";
      if (navigator.share) { try { await navigator.share({ title: "Rythmo Sport", text: texte, url: lien }); } catch {} }
      else { try { await navigator.clipboard.writeText(lien); toast("Lien copié"); } catch { toast(lien, 6000); } }
    });
  }
  // ---------- Gestion : qui entre, qui est bloqué, appli ouverte ou fermée ----------
  async function dessinerGestion() {
    const z = $("gestion-corps"); if (!z) return;
    let membres, app;
    try { [membres, app] = await Promise.all([Compte.admin.membres(), Compte.admin.etatAppli()]); }
    catch { z.innerHTML = '<p class="erreur">Impossible de charger la liste (pas de réseau ?).</p>'; return; }
    const moi = Compte.utilisateur.email;
    const attente = membres.filter(m => !m.actif && m.role !== "admin").length;
    z.innerHTML = `
      <div class="interrupteur"><span><b>Appli ouverte</b><br><span class="total">Fermée : plus personne n'entre, sauf vous.</span></span>
        <button class="bascule" type="button" role="switch" id="g-ouverte" aria-checked="${app.ouverte}" aria-label="Appli ouverte"></button></div>
      <label class="champ">Message affiché si l'appli est fermée<input id="g-message" value="${esc(app.message || "")}" placeholder="Merci d'avoir testé ! La suite arrive bientôt."></label>
      <h3 class="sous-titre">Personnes (${membres.length})${attente ? ` · ${attente} en attente` : ""}</h3>
      <p class="total">« Activer » laisse entrer la personne, « Bloquer » la met dehors (ses séances sont gardées), « Supprimer » la retire et efface ses séances. « Test » lui ouvre aussi votre version d'essai. La date de fin coupe l'accès automatiquement ce jour-là.</p>
      ${membres.map(m => { const etat = m.actif ? "ok" : (m.vu ? "bloque" : "attente"), lui = m.email === moi;
        return `<div class="membre ${m.actif ? "" : "attente"}">
          <div class="membre-tete"><b>${esc(m.prenom || m.email.split("@")[0])}${m.role === "admin" ? " (vous)" : ""}</b>
            <span class="etat ${m.actif ? "ok" : "attente"}">${m.actif ? "Actif" : "En attente / bloqué"}</span></div>
          <span class="total">${esc(m.email)} · depuis le ${new Date(m.ajoute).toLocaleDateString("fr-FR")}${m.test ? " · accès test" : ""}${m.jusqu_au ? ` · <b>accès jusqu'au ${new Date(m.jusqu_au + "T12:00").toLocaleDateString("fr-FR")}</b>` : ""}</span>
          ${lui ? "" : `<div class="membre-actions">
            <button class="mini" type="button" data-g-actif="${esc(m.email)}" data-v="${!m.actif}">${m.actif ? "Bloquer" : "Activer"}</button>
            <button class="mini" type="button" data-g-test="${esc(m.email)}" data-v="${!m.test}">${m.test ? "Retirer l'accès test" : "Donner l'accès test"}</button>
            <button class="mini" type="button" data-g-suppr="${esc(m.email)}">Supprimer</button></div>
          <label class="ligne total">Accès gratuit jusqu'au <input type="date" data-g-fin="${esc(m.email)}" value="${m.jusqu_au || ""}" style="flex:1"></label>`}
        </div>`; }).join("")}
      <h3 class="sous-titre">Inviter quelqu'un</h3>
      <div class="ligne"><input id="g-email" type="email" inputmode="email" placeholder="e-mail de la personne" style="flex:1"><button class="mini" type="button" id="g-ajouter">Ajouter</button></div>
      <p class="total">La personne ajoutée ici entre directement quand elle crée son compte avec cette adresse.</p>`;
    const agir = async (f, ok) => { try { await f(); toast(ok); dessinerGestion(); } catch (e) { toast("Erreur : " + (e.message || e)); } };
    $("g-ouverte").addEventListener("click", () => { const v = $("g-ouverte").getAttribute("aria-checked") !== "true";
      agir(() => Compte.admin.majAppli({ ouverte: v }), v ? "Appli ouverte" : "Appli fermée pour tout le monde sauf vous"); });
    $("g-message").addEventListener("change", () => agir(() => Compte.admin.majAppli({ message: $("g-message").value.trim() }), "Message enregistré"));
    z.querySelectorAll("[data-g-actif]").forEach(b => b.addEventListener("click", () => agir(() => Compte.admin.modifier(b.dataset.gActif, { actif: b.dataset.v === "true" }), b.dataset.v === "true" ? "Personne activée" : "Personne bloquée")));
    z.querySelectorAll("[data-g-test]").forEach(b => b.addEventListener("click", () => agir(() => Compte.admin.modifier(b.dataset.gTest, { test: b.dataset.v === "true" }), "C'est noté")));
    z.querySelectorAll("[data-g-fin]").forEach(i => i.addEventListener("change", () => agir(() => Compte.admin.modifier(i.dataset.gFin, { jusqu_au: i.value || null }), i.value ? "Date de fin enregistrée" : "Accès sans limite de date")));
    z.querySelectorAll("[data-g-suppr]").forEach(b => deuxClics(b, "Sûr ? Touchez encore", () => agir(() => Compte.admin.supprimer(b.dataset.gSuppr), "Personne supprimée")));
    $("g-ajouter").addEventListener("click", () => { const e = $("g-email").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return toast("Adresse e-mail incorrecte");
      agir(() => Compte.admin.ajouter(e, "", false), "Personne ajoutée"); });
  }

  // Installation : bouton direct sur Android / ordinateur, explications sur iPhone
  let invite = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); invite = e; if ($("installer-corps")) dessinerInstall(); });
  window.addEventListener("appinstalled", () => { invite = null; toast("Appli installée !"); if ($("installer-corps")) dessinerInstall(); });
  const installee = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  function dessinerInstall() {
    const z = $("installer-corps"); if (!z) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (installee()) z.innerHTML = '<p class="total">✓ L\'appli est déjà sur votre écran d\'accueil.</p>';
    else if (invite) { z.innerHTML = '<button class="principal" type="button" id="installer">Installer l\'appli</button>';
      $("installer").addEventListener("click", async () => { invite.prompt(); try { await invite.userChoice; } catch {} invite = null; dessinerInstall(); }); }
    else if (ios) z.innerHTML = `<ol class="etapes-install"><li>Ouvrez ce lien dans <b>Safari</b>.</li><li>Touchez le bouton <b>Partager</b> (le carré avec une flèche vers le haut).</li><li>Choisissez <b>« Sur l'écran d'accueil »</b>, puis <b>Ajouter</b>.</li></ol>`;
    else z.innerHTML = `<ol class="etapes-install"><li>Ouvrez ce lien dans <b>Chrome</b>.</li><li>Touchez le menu <b>⋮</b> en haut à droite.</li><li>Choisissez <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.</li></ol>`;
  }

  // ---------- Playlists Spotify : un bouton ouvre la playlist dans l'appli Spotify ----------
  const PLAYLISTS_DEPART = [["Pirates des Caraïbes", "Pirates des Caraïbes"], ["Rocky", "Rocky"], ["Eye of the Tiger", "Eye of the Tiger"], ["Workout motivation", "Workout motivation"]]
    .map(([nom, lien]) => ({ nom, lien }));
  const mesPlaylists = () => { const r = D().reglages; if (!Array.isArray(r.playlists)) r.playlists = PLAYLISTS_DEPART.map(p => ({ ...p })); return r.playlists; };
  function lienSpotify(t) {
    t = (t || "").trim();
    const uri = t.match(/^spotify:(playlist|album|track|artist|show|episode):([A-Za-z0-9]+)/);
    if (uri) return `https://open.spotify.com/${uri[1]}/${uri[2]}`;
    const url = t.match(/https?:\/\/(open\.)?spotify\.(com|link)\/[^\s]+/);
    if (url) return url[0];
    return "https://open.spotify.com/search/" + encodeURIComponent(t);
  }
  function dessinerPlaylists() {
    const z = $("playlists"); if (!z || !Compte.utilisateur) return;
    z.classList.toggle("edition-pl", $("gerer-playlists").open);
    z.innerHTML = mesPlaylists().map((p, i) => `<span class="playlist"><a href="${esc(lienSpotify(p.lien))}" target="_blank" rel="noopener">${esc(p.nom)}</a>` +
      `<button class="x" type="button" data-pl-suppr="${i}" aria-label="Retirer ${esc(p.nom)}">×</button></span>`).join("")
      || '<span class="total">Aucune playlist : ajoutez-en une ci-dessous.</span>';
    z.querySelectorAll("[data-pl-suppr]").forEach(b => b.addEventListener("click", () => { mesPlaylists().splice(+b.dataset.plSuppr, 1); Compte.sauver(); dessinerPlaylists(); }));
  }
  $("gerer-playlists").addEventListener("toggle", dessinerPlaylists);
  $("pl-ajouter").addEventListener("click", () => {
    const lien = $("pl-lien").value.trim(); let nom = $("pl-nom").value.trim();
    if (!lien) { toast("Collez un lien Spotify ou écrivez ce qu'il faut chercher"); return $("pl-lien").focus(); }
    if (!nom) nom = /spotify/i.test(lien) ? "Ma playlist " + (mesPlaylists().length + 1) : lien.slice(0, 40);
    mesPlaylists().push({ nom, lien }); Compte.sauver(); $("pl-nom").value = ""; $("pl-lien").value = ""; dessinerPlaylists(); toast("Playlist ajoutée");
  });

  // ---------- Guide ----------
  function dessinerGuide() {
    $("guide-corps").innerHTML = `<nav class="guide-sommaire">${GUIDE.map((g, i) => `<a href="#g${i}">${esc(g.titre)}</a>`).join("")}</nav>` +
      GUIDE.map((g, i) => `<section class="bloc guide-etape" id="g${i}"><h2>${esc(g.titre)}</h2>${g.texte.map(t => `<p>${esc(t)}</p>`).join("")}
        ${g.img ? `<img src="guide/${g.img}.jpg" alt="${esc(g.titre)}" loading="lazy">` : ""}</section>`).join("");
    $("guide-corps").querySelectorAll(".guide-sommaire a").forEach(a => a.onclick = (e) => { e.preventDefault(); document.querySelector(a.getAttribute("href")).scrollIntoView({ behavior: "smooth" }); });
  }
  document.querySelectorAll("[data-guide]").forEach(b => b.addEventListener("click", () => aller("guide")));

  // ---------- Mode télé : le minuteur en très grand (à afficher sur la télé en « Caster l'écran ») ----------
  function modeTele(oui) {
    document.body.classList.toggle("tv", oui); $("sortir-tv").hidden = !oui;
    if (oui) { aller("minuteur"); try { document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.("landscape").catch(() => {})).catch(() => {}); } catch {} }
    else { try { if (document.fullscreenElement) document.exitFullscreen(); screen.orientation?.unlock?.(); } catch {} }
  }
  $("sortir-tv").addEventListener("click", () => modeTele(false));
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && document.body.classList.contains("tv")) modeTele(false); });

  // ---------- Envoyer sur la télé : un seul bouton, l'appli choisit la façon la plus simple ----------
  // 1) Chromecast / Google TV : la télé affiche le minuteur en grand, le téléphone reste la télécommande.
  // 2) Sinon : recopie de l'écran, avec le nom exact du bouton selon la marque du téléphone.
  let tele = null, envoiTele = null;
  const ua = navigator.userAgent;
  const marque = /iPhone|iPad/.test(ua) ? "iphone" : /SM-|Samsung/i.test(ua) ? "samsung" : /Xiaomi|Redmi|POCO|\bMi /i.test(ua) ? "xiaomi" : /Pixel/.test(ua) ? "pixel" : /HUAWEI|Honor/i.test(ua) ? "huawei" : /OnePlus|OPPO|realme/i.test(ua) ? "oppo" : "android";
  const BOUTON_RECOPIE = { iphone: "Recopie de l'écran", samsung: "Smart View", xiaomi: "Caster", pixel: "Caster l'écran", huawei: "Projection sans fil", oppo: "Caster l'écran", android: "Caster l'écran (ou « Smart View », « Projection »)" };
  function etatMinuteur() {
    const imgs = [...$("pose-exo").querySelectorAll("img")].map(i => new URL(i.getAttribute("src"), location.href).href);
    const arc = $("arc"), tot = parseFloat(arc.style.strokeDasharray) || 0, off = parseFloat(arc.style.strokeDashoffset) || 0;
    return { round: $("round").hidden ? "" : $("round").textContent, phase: $("phase").textContent, temps: $("temps").textContent, info: $("info").textContent,
      nom: $("nom-exo").textContent === "—" ? "" : $("nom-exo").textContent, suivant: $("suivant").textContent, photos: imgs.slice(0, 2),
      couleur: getComputedStyle(arc).stroke, progres: tot ? Math.max(0, Math.min(1, 1 - off / tot)) : 0 };
  }
  function brancherTele(c) {
    tele = c; majBoutonTele(); try { sessionStorage.setItem("tv-id", c.id); } catch {}
    const envoyer = () => { try { if (tele && tele.state === "connected") tele.send(JSON.stringify(etatMinuteur())); } catch {} };
    c.onconnect = () => { envoyer(); toast("✓ Connecté à la télé"); majBoutonTele(); };
    c.onclose = c.onterminate = () => { tele = null; clearInterval(envoiTele); majBoutonTele(); };
    clearInterval(envoiTele); envoiTele = setInterval(envoyer, 250); envoyer();
  }
  function majBoutonTele() { $("mode-tv").textContent = tele ? "📺 Sur la télé ✓ (toucher pour arrêter)" : "📺 Afficher sur la télé"; }
  async function envoyerDirect() {
    try { const r = new PresentationRequest([new URL("tv.html", location.href).href]); brancherTele(await r.start()); aller("minuteur"); }
    catch (e) { if (e && e.name !== "NotAllowedError" && e.name !== "AbortError") toast("Aucune télé trouvée : utilisez « Copier l'écran »"); }
  }
  function ouvrirTele() {
    if (tele) { try { tele.terminate(); } catch {} tele = null; majBoutonTele(); return toast("Télé déconnectée"); }
    const direct = "PresentationRequest" in window && marque !== "iphone";
    ouvrirFeuille(`<div class="fiche-exo"><h2>📺 Afficher sur la télé</h2>
      <p class="total">La télé et le téléphone doivent être sur le <b>même Wi-Fi</b>.</p>
      ${direct ? `<button class="principal" type="button" data-tv="direct">📡 Chromecast / Google TV : envoyer en 1 appui</button>
      <p class="total">Le minuteur s'affiche en grand sur la télé, le téléphone reste dans votre main.</p>` : ""}
      <button class="${direct ? "secondaire" : "principal"}" type="button" data-tv="copie">📱→📺 Copier l'écran du téléphone</button>
      <div class="etape-tv" id="etape-copie" hidden>
        <p><b>1.</b> ${marque === "iphone" ? "Faites glisser depuis le coin en haut à droite de l'écran." : "Faites glisser le haut de l'écran vers le bas, <b>2 fois</b>."}</p>
        <p><b>2.</b> Touchez <b>« ${BOUTON_RECOPIE[marque]} »</b>${marque === "iphone" ? " (télé compatible AirPlay)" : ""}.</p>
        <p><b>3.</b> Choisissez votre télé, puis revenez ici.</p>
        <button class="principal" type="button" data-tv="grand">✓ C'est fait : minuteur en grand</button>
      </div>
      <button class="lien" type="button" data-tv="grand">Juste afficher en grand sur cet écran (tablette)</button></div>`, (fe) => {
      fe.querySelectorAll("[data-tv]").forEach(b => b.onclick = () => {
        const t = b.dataset.tv;
        if (t === "direct") { fermerFeuille(); envoyerDirect(); }
        else if (t === "copie") { fe.querySelector("#etape-copie").hidden = false; b.hidden = true; }
        else { fermerFeuille(); modeTele(true); }
      });
    });
  }
  $("mode-tv").addEventListener("click", ouvrirTele);
  // Si l'appli a été rechargée alors qu'une télé était connectée, on se reconnecte
  try { const id = sessionStorage.getItem("tv-id"); if (id && "PresentationRequest" in window) new PresentationRequest([new URL("tv.html", location.href).href]).reconnect(id).then(brancherTele).catch(() => {}); } catch {}

  // ---------- Mise à jour automatique ----------
  // Quand une nouvelle version est en ligne, l'appli se recharge toute seule, au bon moment :
  // jamais pendant une séance, ni pendant qu'on crée une séance. Les données sont déjà sauvegardées.
  let majPrete = false;
  const vueActuelle = () => VUES.find(v => !$("v-" + v).hidden);
  const peutRecharger = () => !Minuteur.occupe() && !GPS.actif() && !SeanceMusique.actif() && vueActuelle() !== "edition" && $("feuille").hidden && document.activeElement?.tagName !== "INPUT";
  function appliquerMaj() {
    if (!majPrete || !peutRecharger()) return;
    try { sessionStorage.setItem("ms-maj", "1"); } catch {}
    location.reload();
  }
  async function verifierMaj() {
    if (majPrete || window.VERSION_APPLI === "dev" || !navigator.onLine) return appliquerMaj();
    try {
      const r = await fetch("version.json?t=" + Date.now(), { cache: "no-store" }); if (!r.ok) return;
      const { v } = await r.json();
      if (v && v !== window.VERSION_APPLI) {
        majPrete = true;
        try { const reg = await navigator.serviceWorker?.getRegistration(); await reg?.update(); } catch {}
        appliquerMaj();
      }
    } catch {}
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") verifierMaj(); });
  setInterval(verifierMaj, 5 * 60 * 1000);
  // Si une mise à jour attend la fin d'une séance : on la fait dès qu'on change d'écran
  document.querySelectorAll("#barre button, [data-retour]").forEach(b => b.addEventListener("click", () => setTimeout(appliquerMaj, 300)));
  try { if (sessionStorage.getItem("ms-maj")) { sessionStorage.removeItem("ms-maj"); setTimeout(() => toast("✓ Appli mise à jour"), 800); } } catch {}

  // ---------- Démarrage ----------
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  if (Compte.env === "test") { $("bandeau-test").hidden = false; document.body.classList.add("test"); document.title = "Rythmo TEST"; }
  (async () => {
    majAuth();
    const u = await Compte.init();
    if (u) { lieu = D().reglages.lieu || "maison"; entrer(false); }
    else aller("auth", null, true);
    setTimeout(verifierMaj, 3000);
  })();
})();
