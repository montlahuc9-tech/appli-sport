// Suivi GPS pour la course et la marche : distance, durée, allure, tracé sur la carte, temps au kilomètre, historique.
// Carte : Leaflet + OpenStreetMap. Tout reste sur le téléphone (rien n'est envoyé).
window.GPS = (() => {
  const D = () => Compte.donnees;
  const parcours = () => D().parcours || (D().parcours = []);
  let suivi = null;        // { type, debut, points: [[lat, lng, t]], distance, duree, enPause, depuis, kms: [] }
  let veille = null, carte = null, trace = null, point = null, minuterie = null, idGeo = null;
  let parler = true, onglet = "parcours", routeChoisie = null, traceRoute = null;
  const routes = () => D().routes || (D().routes = []);
  const CLE_ENCOURS = ((window.CONFIG && CONFIG.environnement === "test") ? "ms-test" : "ms") + "-gps-encours";

  // ---------- Calculs ----------
  const R = 6371000, rad = (d) => d * Math.PI / 180;
  function ecart(a, b) {
    const dl = rad(b[0] - a[0]), dg = rad(b[1] - a[1]);
    const h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dg / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const km = (m) => (m / 1000).toFixed(2).replace(".", ",");
  const duree = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : String(m).padStart(2, "0")) + ":" + String(x).padStart(2, "0"); };
  const allure = (s, m) => { if (m < 30 || !s) return "--:--"; const p = s / (m / 1000); if (p > 3600) return "--:--";
    return Math.floor(p / 60) + ":" + String(Math.round(p % 60)).padStart(2, "0"); };
  const tempsPasse = () => suivi ? suivi.duree + (suivi.enPause ? 0 : (Date.now() - suivi.depuis) / 1000) : 0;
  // allure des 30 dernières secondes
  function allureActuelle() {
    const p = suivi.points; if (p.length < 2) return "--:--";
    const fin = p[p.length - 1]; let i = p.length - 1, m = 0;
    while (i > 0 && fin[2] - p[i - 1][2] < 30000) { m += ecart(p[i - 1], p[i]); i--; }
    return allure((fin[2] - p[i][2]) / 1000, m);
  }

  // ---------- Parcours à suivre (importé en GPX) ----------
  // distance (m) d'un point au parcours, et distance déjà faite le long du parcours (pour « il reste X km »)
  function surRoute(route, p) {
    const pts = route.points, kx = 111320 * Math.cos(rad(p[0])), ky = 110540; let best = Infinity, fait = 0, cumul = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = (pts[i][1] - p[1]) * kx, ay = (pts[i][0] - p[0]) * ky, bx = (pts[i + 1][1] - p[1]) * kx, by = (pts[i + 1][0] - p[0]) * ky;
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2)) : 0;
      const d = Math.hypot(ax + t * dx, ay + t * dy), seg = Math.sqrt(l2);
      if (d < best) { best = d; fait = cumul + t * seg; } cumul += seg;
    }
    return { ecart: best, fait, total: cumul };
  }
  function suivreRoute(p) {
    const route = suivi.route && routes().find(r => r.id === suivi.route); if (!route) return;
    const s = surRoute(route, p); suivi.reste = Math.max(0, s.total - s.fait); suivi.ecartRoute = Math.round(s.ecart);
    if (s.ecart > 60) { suivi.hors = (suivi.hors || 0) + 1; if (suivi.hors === 3 && !suivi.horsDit) { suivi.horsDit = true; dire("Attention, vous quittez le parcours."); } }
    else if (s.ecart < 30) { if (suivi.horsDit) dire("Vous êtes de retour sur le parcours."); suivi.hors = 0; suivi.horsDit = false; }
  }
  // lecture d'un fichier GPX : traces (trkpt), itinéraires (rtept) ou points (wpt)
  function lireGpx(texte, nomFichier) {
    const doc = new DOMParser().parseFromString(texte, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("Ce fichier n'est pas un GPX valide.");
    let n = [...doc.getElementsByTagName("trkpt")]; if (n.length < 2) n = [...doc.getElementsByTagName("rtept")]; if (n.length < 2) n = [...doc.getElementsByTagName("wpt")];
    let pts = n.map(x => [+(+x.getAttribute("lat")).toFixed(5), +(+x.getAttribute("lon")).toFixed(5)]).filter(p => isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) <= 90);
    if (pts.length < 2) throw new Error("Aucun tracé trouvé dans ce fichier.");
    const pas = Math.ceil(pts.length / 1500); if (pas > 1) pts = pts.filter((_, i) => i % pas === 0 || i === pts.length - 1);
    let distance = 0; for (let i = 1; i < pts.length; i++) distance += ecart(pts[i - 1], pts[i]);
    const nomGpx = (doc.querySelector("trk > name, rte > name, metadata > name")?.textContent || "").trim();
    const nom = (nomGpx || nomFichier.replace(/\.gpx$/i, "").replace(/[-_]+/g, " ")).slice(0, 60);
    return { id: "r" + Date.now(), nom, distance: Math.round(distance), points: pts, ajoute: Date.now() };
  }
  async function importer(fichier, type) {
    try { const r = lireGpx(await fichier.text(), fichier.name);
      routes().unshift(r); D().routes = routes().slice(0, 20); Compte.sauver(); routeChoisie = r.id;
      toast(`Parcours importé : ${km(r.distance)} km`); dessiner(type);
    } catch (e) { toast(e.message || "Impossible de lire ce fichier", 4000); }
  }

  // ---------- Voix : un message à chaque kilomètre ----------
  function dire(t) {
    if (!parler || !("speechSynthesis" in window)) return;
    try { const u = new SpeechSynthesisUtterance(t); u.lang = "fr-FR"; u.rate = 1; speechSynthesis.speak(u); } catch {}
  }
  const allureParlee = (s) => { const [m, x] = s.split(":"); return `${+m} minutes ${+x ? x : ""}`; };

  // ---------- Positions ----------
  function nouvellePosition(pos) {
    if (!suivi) return;
    const c = pos.coords, p = [c.latitude, c.longitude, pos.timestamp || Date.now()];
    suivi.precision = Math.round(c.accuracy);
    majEtat();
    if (suivi.enPause || c.accuracy > 35) return;          // position trop imprécise : on l'ignore
    const der = suivi.points[suivi.points.length - 1];
    if (der && suivi.saut) suivi.saut = false;
    else if (der) {
      const d = ecart(der, p), dt = (p[2] - der[2]) / 1000;
      if (d < 4) return;                                   // on n'a presque pas bougé
      if (dt > 0 && d / dt > 11) return;                   // saut impossible (> 40 km/h) : erreur du GPS
      suivi.distance += d;
      const k = Math.floor(suivi.distance / 1000);
      if (k > suivi.kms.length) {                          // un kilomètre de plus !
        const t = tempsPasse(), avant = suivi.kms.reduce((a, x) => a + x, 0); suivi.kms.push(t - avant);
        dire(`${k} kilomètre${k > 1 ? "s" : ""}. Temps ${duree(t).replace(":", " minutes ")}. Allure moyenne ${allureParlee(allure(t, suivi.distance))} au kilomètre.`);
        setTimeout(() => window.Coach && Coach.dire("km", { ecart: 0 }), 7000);
      }
    }
    suivi.points.push(p);
    if (suivi.route) suivreRoute(p);
    if (trace) { trace.addLatLng([p[0], p[1]]); point.setLatLng([p[0], p[1]]); if (carte.getZoom() < 14) carte.setView([p[0], p[1]], 16); else carte.panTo([p[0], p[1]], { animate: false }); }
    garder();
  }
  function erreurGeo(e) {
    const t = e.code === 1 ? "La localisation est refusée : autorisez-la pour l'appli dans les réglages du téléphone."
      : "Pas de signal GPS pour l'instant : allez dehors, à découvert.";
    const z = document.getElementById("gps-alerte"); if (z) { z.textContent = t; z.hidden = false; }
  }
  // garde la séance en cours (si l'appli se ferme, on la retrouve)
  function garder() { try { localStorage.setItem(CLE_ENCOURS, JSON.stringify(suivi)); } catch {} }

  async function garderEcranAllume() { try { veille = await navigator.wakeLock?.request("screen"); } catch {} }
  document.addEventListener("visibilitychange", () => { if (suivi && !suivi.enPause && document.visibilityState === "visible") garderEcranAllume(); });

  // ---------- Démarrer / pause / fin ----------
  function demarrer(type, route) {
    suivi = { type, debut: Date.now(), points: [], distance: 0, duree: 0, enPause: false, depuis: Date.now(), kms: [], route: route || null };
    if (!("geolocation" in navigator)) { erreurGeo({ code: 2 }); return; }
    idGeo = navigator.geolocation.watchPosition(nouvellePosition, erreurGeo, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    garderEcranAllume(); clearInterval(minuterie); minuterie = setInterval(majEtat, 1000);
    dire(type === "marche" ? "C'est parti pour la marche !" : "C'est parti !");
    dessiner(); garder();
  }
  function pause() {
    if (!suivi) return;
    if (suivi.enPause) { suivi.enPause = false; suivi.depuis = Date.now(); dire("On repart !"); garderEcranAllume();
      suivi.saut = true; }   // la distance parcourue pendant la pause ne compte pas
    else { suivi.duree = tempsPasse(); suivi.enPause = true; dire("Pause"); }
    majEtat(); garder();
  }
  function terminer() {
    if (!suivi) return;
    if (!suivi.enPause) suivi.duree = tempsPasse();
    if (idGeo != null) navigator.geolocation.clearWatch(idGeo); idGeo = null;
    clearInterval(minuterie); try { veille?.release(); } catch {} veille = null;
    const s = suivi; suivi = null; try { localStorage.removeItem(CLE_ENCOURS); } catch {}
    if (s.distance < 50 && s.duree < 60) { toast("Parcours trop court : rien n'est enregistré"); return dessiner(); }
    // on allège le tracé pour ne pas remplir le téléphone (600 points maximum)
    let pts = s.points.map(p => [+p[0].toFixed(5), +p[1].toFixed(5), Math.max(0, Math.round((p[2] - s.debut) / 1000))]); const pas = Math.ceil(pts.length / 600);
    if (pas > 1) pts = pts.filter((_, i) => i % pas === 0 || i === pts.length - 1);
    const r = { id: "p" + s.debut, type: s.type, debut: s.debut, duree: Math.round(s.duree), distance: Math.round(s.distance), kms: s.kms.map(Math.round), points: pts, route: s.route || undefined };
    parcours().unshift(r); D().parcours = parcours().slice(0, 20); Compte.sauver();
    const nouveaux = window.Entrainement ? Entrainement.ajouterSortie(r) : [];
    dire(`Terminé ! ${km(r.distance).replace(",", " virgule ")} kilomètres.` + (nouveaux.length ? ` Nouveau record : ${nouveaux.join(", ")} !` : ""));
    r.records = nouveaux; Compte.sauver();
    resume(r.id);
  }

  // ---------- Écrans ----------
  const $z = () => document.getElementById("gps-corps");
  const NOM = { running: "Course", marche: "Marche" };
  function nouvelleCarte(el, pts) {
    if (carte) { carte.remove(); carte = null; }
    if (!window.L) { el.innerHTML = `<p class="total">Carte indisponible.</p>`; return null; }
    const m = L.map(el, { zoomControl: false, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    if (pts && pts.length) m.fitBounds(L.latLngBounds(pts), { padding: [24, 24] }); else m.setView([46.6, 2.4], 5);
    carte = m; setTimeout(() => m.invalidateSize(), 50); return m;
  }
  function dessiner(type) {
    const z = $z(); if (!z) return;
    if (!suivi) {
      const t = type || (D().reglages.univers === "marche" ? "marche" : "running");
      const liste = parcours().filter(r => r.type === t);
      z.innerHTML = `<div class="gps-choix lieux" role="group" aria-label="Activité">
          <button type="button" data-gps-type="running" aria-pressed="${t === "running"}">🏃 Course</button>
          <button type="button" data-gps-type="marche" aria-pressed="${t === "marche"}">🚶 Marche</button></div>
        <div class="gps-carte" id="gps-carte"></div>
        ${(() => { const rc = routes().find(r => r.id === routeChoisie); return rc ? `<p class="gps-route-choisie">🗺️ Parcours à suivre : <b>${esc(rc.nom)}</b> · ${km(rc.distance)} km <button class="lien" type="button" id="gps-sans-route">Sans parcours</button></p>` : ""; })()}
        <button class="principal" type="button" id="gps-go">▶ Démarrer le suivi GPS${routeChoisie && routes().some(r => r.id === routeChoisie) ? " avec ce parcours" : ""}</button>
        <div class="lieux quatre gps-onglets" role="group" aria-label="Afficher"><button type="button" data-gps-ong="parcours" aria-pressed="${onglet === "parcours"}">Parcours</button><button type="button" data-gps-ong="stats" aria-pressed="${onglet === "stats"}">📊 Stats</button><button type="button" data-gps-ong="records" aria-pressed="${onglet === "records"}">🏆 Records</button><button type="button" data-gps-ong="routes" aria-pressed="${onglet === "routes"}">🗺️ À suivre</button></div>
        <p class="total">Distance, temps, allure et tracé de votre parcours, avec une annonce à chaque kilomètre. Gardez l'appli ouverte : l'écran reste allumé tout seul (touchez « Écran noir » pour économiser la batterie).</p>
        <p class="gps-alerte" id="gps-alerte" hidden></p>
        ${onglet === "stats" && window.Entrainement ? `<h2>Mes statistiques · ${NOM[t]}</h2>${Entrainement.blocStats(t)}`
          : onglet === "records" && window.Entrainement ? `<h2>Mes records · ${NOM[t]}</h2>${Entrainement.blocRecords(t)}`
          : onglet === "routes" ? `<h2>Parcours à suivre</h2>
            <p class="total">Un ami vous envoie un parcours, ou vous en trouvez un sur internet (Komoot, Strava, Visorando…) : récupérez le fichier GPX (bouton « Télécharger GPX » ou « Exporter » sur le site), enregistrez-le sur le téléphone, puis importez-le ici. Pendant la sortie, le tracé à suivre s'affiche sur la carte et la voix vous prévient si vous vous en éloignez.</p>
            <label class="ajout gps-import">📥 Importer un parcours (fichier GPX)<input type="file" id="gps-fichier" accept=".gpx,application/gpx+xml,application/octet-stream,text/xml" hidden></label>
            ${routes().length ? `<div class="liste-fiches">${routes().map(r => `<div class="plan-seance"><button class="fiche" type="button" data-route="${r.id}" aria-pressed="${r.id === routeChoisie}">
              <span class="gps-ico" aria-hidden="true">${r.id === routeChoisie ? "✅" : "🗺️"}</span><span><b>${esc(r.nom)}</b><span class="res">${km(r.distance)} km · ${r.id === routeChoisie ? "choisi : touchez « Démarrer » en haut" : "touchez pour le choisir"}</span></span><span class="fleche" aria-hidden="true">›</span></button>
              <button class="lien danger" type="button" data-route-suppr="${r.id}">Supprimer</button></div>`).join("")}</div>` : `<p class="total">Aucun parcours importé pour l'instant.</p>`}`
          : liste.length ? `<h2>Mes parcours</h2><div class="liste-fiches">${liste.map(r => `<button class="fiche" type="button" data-parcours="${r.id}">
          <span class="gps-ico" aria-hidden="true">${r.type === "marche" ? "🚶" : "🏃"}</span>
          <span><b>${km(r.distance)} km · ${duree(r.duree)}</b><span class="res">${new Date(r.debut).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${allure(r.duree, r.distance)} min/km</span></span><span class="fleche" aria-hidden="true">›</span></button>`).join("")}</div>` : ""}`;
      z.querySelectorAll("[data-gps-type]").forEach(b => b.onclick = () => dessiner(b.dataset.gpsType));
      z.querySelectorAll("[data-gps-ong]").forEach(b => b.onclick = () => { onglet = b.dataset.gpsOng; dessiner(t); });
      const rc = routes().find(r => r.id === routeChoisie) || null; if (!rc) routeChoisie = null;
      z.querySelector("#gps-go").onclick = () => demarrer(t, routeChoisie);
      const sr = z.querySelector("#gps-sans-route"); if (sr) sr.onclick = () => { routeChoisie = null; dessiner(t); };
      const fi = z.querySelector("#gps-fichier"); if (fi) fi.onchange = () => { if (fi.files[0]) importer(fi.files[0], t); };
      z.querySelectorAll("[data-route]").forEach(b => b.onclick = () => { routeChoisie = routeChoisie === b.dataset.route ? null : b.dataset.route; dessiner(t); if (routeChoisie) scrollTo({ top: 0, behavior: "smooth" }); });
      z.querySelectorAll("[data-route-suppr]").forEach(b => deuxClics(b, "Sûr ?", () => { D().routes = routes().filter(r => r.id !== b.dataset.routeSuppr); if (routeChoisie === b.dataset.routeSuppr) routeChoisie = null; Compte.sauver(); dessiner(t); }));
      z.querySelectorAll("[data-parcours]").forEach(b => b.onclick = () => resume(b.dataset.parcours));
      const m = nouvelleCarte(z.querySelector("#gps-carte"), rc ? rc.points : null);
      if (m && rc) L.polyline(rc.points, { color: "#26c6b0", weight: 6, opacity: .85, dashArray: "8 8" }).addTo(m);
      if (m && !rc) navigator.geolocation?.getCurrentPosition((p) => { if (carte === m) { m.setView([p.coords.latitude, p.coords.longitude], 16); L.circleMarker([p.coords.latitude, p.coords.longitude], { radius: 8, color: "#fff", weight: 3, fillColor: "#26c6b0", fillOpacity: 1 }).addTo(m); } }, () => {}, { enableHighAccuracy: true, timeout: 15000 });
      return;
    }
    z.innerHTML = `<div class="gps-direct">
        <div class="gps-gros"><span id="gps-dist">0,00</span><small>km</small></div>
        <div class="gps-stats"><div><b id="gps-temps">00:00</b><small>Durée</small></div><div><b id="gps-moy">--:--</b><small>Allure moy. /km</small></div><div><b id="gps-act">--:--</b><small>Allure actuelle</small></div></div>
        <div class="gps-carte" id="gps-carte"></div>
        <p class="gps-precision" id="gps-prec">Recherche du GPS…</p>
        ${suivi.route ? `<p class="gps-route-etat" id="gps-route"></p>` : ""}
        <p class="gps-alerte" id="gps-alerte" hidden></p>
        <div class="commandes"><button class="gros go" type="button" id="gps-pause">Pause</button><button class="gros sec" type="button" id="gps-fin">Terminer</button></div>
        <div class="tv-ligne"><button class="mini" type="button" id="gps-noir">🌙 Écran noir (batterie)</button><label class="case"><input type="checkbox" id="gps-voix" ${parler ? "checked" : ""}> Annonce à chaque km</label></div></div>`;
    const m = nouvelleCarte(z.querySelector("#gps-carte"), suivi.points.map(p => [p[0], p[1]]));
    const rs = suivi.route && routes().find(r => r.id === suivi.route);
    if (m && rs) { L.polyline(rs.points, { color: "#26c6b0", weight: 7, opacity: .8, dashArray: "8 8" }).addTo(m); if (!suivi.points.length) m.fitBounds(L.latLngBounds(rs.points), { padding: [24, 24] }); }
    if (m) { trace = L.polyline(suivi.points.map(p => [p[0], p[1]]), { color: "#ff4b2b", weight: 5 }).addTo(m);
      const d = suivi.points[suivi.points.length - 1];
      point = L.circleMarker(d ? [d[0], d[1]] : [0, 0], { radius: 8, color: "#fff", weight: 3, fillColor: "#ff4b2b", fillOpacity: 1 }).addTo(m);
      if (d) m.setView([d[0], d[1]], 16); else if (rs) point.setLatLng(rs.points[0]); }
    z.querySelector("#gps-pause").onclick = pause;
    deuxClics(z.querySelector("#gps-fin"), "Sûr ? Touchez encore", terminer);
    z.querySelector("#gps-voix").onchange = (e) => { parler = e.target.checked; };
    z.querySelector("#gps-noir").onclick = () => { const n = document.createElement("div"); n.className = "ecran-noir";
      n.innerHTML = `<p id="noir-txt"></p><small>Touchez 2 fois pour revenir</small>`; let dernier = 0;
      n.onclick = () => { if (Date.now() - dernier < 500) n.remove(); dernier = Date.now(); };
      document.body.appendChild(n); const maj = () => { if (!n.isConnected) return; n.querySelector("#noir-txt").textContent = suivi ? `${km(suivi.distance)} km · ${duree(tempsPasse())}` : ""; setTimeout(maj, 1000); }; maj(); };
    majEtat();
  }
  function majEtat() {
    if (!suivi) return; const el = (i) => document.getElementById(i);
    if (!el("gps-dist")) return;
    const t = tempsPasse();
    el("gps-dist").textContent = km(suivi.distance); el("gps-temps").textContent = duree(t);
    el("gps-moy").textContent = allure(t, suivi.distance); el("gps-act").textContent = suivi.enPause ? "pause" : allureActuelle();
    el("gps-pause").textContent = suivi.enPause ? "Reprendre" : "Pause";
    if (el("gps-route")) el("gps-route").textContent = suivi.reste == null ? "🗺️ Rejoignez le départ du parcours (tracé en pointillés)" : suivi.horsDit ? `⚠️ Hors du parcours (${suivi.ecartRoute} m) · reste ${km(suivi.reste)} km` : `🗺️ Sur le parcours · reste ${km(suivi.reste)} km`;
    el("gps-prec").textContent = suivi.precision == null ? "Recherche du GPS…" : suivi.precision <= 35 ? `GPS ✓ (précision ${suivi.precision} m)` : `GPS faible (${suivi.precision} m) : à découvert, ça ira mieux`;
  }
  function resume(id) {
    const r = parcours().find(x => x.id === id); const z = $z(); if (!r || !z) return dessiner();
    const date = new Date(r.debut).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    z.innerHTML = `<div class="gps-resume">
        <p class="doux">${NOM[r.type] || "Parcours"} · ${date}</p>
        <div class="gps-carte grande" id="gps-carte"></div>
        <div class="gps-gros"><span>${km(r.distance)}</span><small>km</small></div>
        ${r.records && r.records.length ? `<p class="gps-record">🏆 Nouveau record : ${r.records.join(" · ")}</p>` : ""}
        <div class="gps-stats"><div><b>${duree(r.duree)}</b><small>Durée</small></div><div><b>${allure(r.duree, r.distance)}</b><small>min/km</small></div><div><b>${(r.distance / 1000 / (r.duree / 3600 || 1)).toFixed(1).replace(".", ",")}</b><small>km/h</small></div></div>
        <p class="gps-kcal">≈ <b>${Math.round((r.type === "marche" ? 0.55 : 1) * (window.Decouverte && Decouverte.poidsActuel() || 70) * r.distance / 1000)}</b> kcal dépensées${window.Decouverte && Decouverte.poidsActuel() ? "" : " (estimation pour 70 kg : indiquez votre poids dans le Profil)"}</p>
        ${r.kms && r.kms.length ? `<h2>Temps au kilomètre</h2><div class="gps-kms">${r.kms.map((s, i) => { const max = Math.max(...r.kms);
          return `<div><span>${i + 1}</span><i style="width:${Math.round(s / max * 100)}%"></i><b>${duree(s)}</b></div>`; }).join("")}</div>` : ""}
        <button class="principal" type="button" id="gps-partager">Partager</button>
        ${r.points && r.points.length > 1 ? `<button class="ajout" type="button" id="gps-gpx">📤 Exporter la trace (fichier GPX)</button>
        <p class="total">Le fichier GPX s'ouvre dans Strava, Garmin Connect, Suunto, Coros, Komoot… ou se garde dans vos fichiers. Avec une montre : importez-le dans l'appli de la montre (Garmin Connect, Suunto…) pour l'envoyer dessus.</p>` : ""}
        <button class="lien" type="button" id="gps-retour">← Mes parcours</button>
        <button class="lien danger" type="button" id="gps-suppr">Supprimer ce parcours</button></div>`;
    const m = nouvelleCarte(z.querySelector("#gps-carte"), r.points);
    const rr = r.route && routes().find(x => x.id === r.route); if (m && rr) L.polyline(rr.points, { color: "#26c6b0", weight: 6, opacity: .6, dashArray: "8 8" }).addTo(m);
    if (m && r.points.length) { L.polyline(r.points, { color: "#ff4b2b", weight: 5 }).addTo(m);
      L.circleMarker(r.points[0], { radius: 7, color: "#fff", weight: 3, fillColor: "#26c6b0", fillOpacity: 1 }).addTo(m);
      L.circleMarker(r.points[r.points.length - 1], { radius: 7, color: "#fff", weight: 3, fillColor: "#ff4b2b", fillOpacity: 1 }).addTo(m); }
    z.querySelector("#gps-retour").onclick = () => dessiner(r.type);
    const bg = z.querySelector("#gps-gpx"); if (bg) bg.onclick = () => exporterGpx(r);
    z.querySelector("#gps-partager").onclick = async () => {
      const t = `${r.type === "marche" ? "🚶 Marche" : "🏃 Course"} : ${km(r.distance)} km en ${duree(r.duree)} (${allure(r.duree, r.distance)} min/km) avec Rythmo Sport 💪`;
      try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); toast("Texte copié"); } } catch {} };
    deuxClics(z.querySelector("#gps-suppr"), "Sûr ? Touchez encore", () => { D().parcours = parcours().filter(x => x.id !== id); if (window.Entrainement) Entrainement.supprimerSortie(id); Compte.sauver(); dessiner(r.type); });
  }

  // ---------- Export GPX (format standard des traces GPS) ----------
  function texteGpx(r) {
    const nom = `${r.type === "marche" ? "Marche" : "Course"} Rythmo Sport ${new Date(r.debut).toLocaleDateString("fr-FR")}`;
    const avecHeure = r.points.some(p => p.length > 2);
    const pts = r.points.map((p, i) => {
      // anciens parcours sans l'heure : on la répartit sur la durée (pour que Strava accepte le fichier)
      const t = avecHeure ? p[2] : Math.round(r.duree * i / Math.max(1, r.points.length - 1));
      return `      <trkpt lat="${p[0]}" lon="${p[1]}"><time>${new Date(r.debut + t * 1000).toISOString()}</time></trkpt>`; }).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Rythmo Sport" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${nom}</name><time>${new Date(r.debut).toISOString()}</time></metadata>
  <trk><name>${nom}</name><type>${r.type === "marche" ? "walking" : "running"}</type>
    <trkseg>
${pts}
    </trkseg>
  </trk>
</gpx>
`;
  }
  async function exporterGpx(r) {
    const d = new Date(r.debut), nomFichier = `rythmo-${r.type === "marche" ? "marche" : "course"}-${d.toISOString().slice(0, 10)}-${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}.gpx`;
    const blob = new Blob([texteGpx(r)], { type: "application/gpx+xml" });
    try { const f = new File([blob], nomFichier, { type: "application/gpx+xml" });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: nomFichier }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nomFichier; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast("Fichier GPX enregistré dans vos téléchargements");
  }

  return {
    texteGpx,
    actif: () => !!suivi,
    afficher(type) { dessiner(type); },
    resume,
    resumeTexte: () => suivi ? `${km(suivi.distance)} km · ${duree(tempsPasse())}` : "",
    // si l'appli a été fermée pendant un suivi, on le reprend
    reprendre() {
      try { const s = JSON.parse(localStorage.getItem(CLE_ENCOURS) || "null");
        if (s && Date.now() - (s.points.at(-1)?.[2] || s.debut) < 3 * 3600 * 1000) {
          if (!s.enPause) { s.duree = s.duree + (Date.now() - s.depuis) / 1000; s.depuis = Date.now(); }
          suivi = s; idGeo = navigator.geolocation?.watchPosition(nouvellePosition, erreurGeo, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
          clearInterval(minuterie); minuterie = setInterval(majEtat, 1000); garderEcranAllume(); return true; }
      } catch {}
      return false;
    }
  };
})();
