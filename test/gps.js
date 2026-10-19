// Suivi GPS pour la course et la marche : distance, durée, allure, tracé sur la carte, temps au kilomètre, historique.
// Carte : Leaflet + OpenStreetMap. Tout reste sur le téléphone (rien n'est envoyé).
window.GPS = (() => {
  const D = () => Compte.donnees;
  const parcours = () => D().parcours || (D().parcours = []);
  let suivi = null;        // { type, debut, points: [[lat, lng, t]], distance, duree, enPause, depuis, kms: [] }
  let veille = null, carte = null, trace = null, point = null, minuterie = null, idGeo = null;
  let parler = true;
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
  function demarrer(type) {
    suivi = { type, debut: Date.now(), points: [], distance: 0, duree: 0, enPause: false, depuis: Date.now(), kms: [] };
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
    let pts = s.points.map(p => [+p[0].toFixed(5), +p[1].toFixed(5)]); const pas = Math.ceil(pts.length / 600);
    if (pas > 1) pts = pts.filter((_, i) => i % pas === 0 || i === pts.length - 1);
    const r = { id: "p" + s.debut, type: s.type, debut: s.debut, duree: Math.round(s.duree), distance: Math.round(s.distance), kms: s.kms.map(Math.round), points: pts };
    parcours().unshift(r); D().parcours = parcours().slice(0, 20); Compte.sauver();
    dire(`Terminé ! ${km(r.distance).replace(",", " virgule ")} kilomètres.`);
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
      const liste = parcours();
      z.innerHTML = `<div class="gps-choix lieux" role="group" aria-label="Activité">
          <button type="button" data-gps-type="running" aria-pressed="${t === "running"}">🏃 Course</button>
          <button type="button" data-gps-type="marche" aria-pressed="${t === "marche"}">🚶 Marche</button></div>
        <div class="gps-carte" id="gps-carte"></div>
        <button class="principal" type="button" id="gps-go">▶ Démarrer le suivi GPS</button>
        <p class="total">Distance, temps, allure et tracé de votre parcours, avec une annonce à chaque kilomètre. Gardez l'appli ouverte : l'écran reste allumé tout seul (touchez « Écran noir » pour économiser la batterie).</p>
        <p class="gps-alerte" id="gps-alerte" hidden></p>
        ${liste.length ? `<h2>Mes parcours</h2><div class="liste-fiches">${liste.map(r => `<button class="fiche" type="button" data-parcours="${r.id}">
          <span class="gps-ico" aria-hidden="true">${r.type === "marche" ? "🚶" : "🏃"}</span>
          <span><b>${km(r.distance)} km · ${duree(r.duree)}</b><span class="res">${new Date(r.debut).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${allure(r.duree, r.distance)} min/km</span></span><span class="fleche" aria-hidden="true">›</span></button>`).join("")}</div>` : ""}`;
      z.querySelectorAll("[data-gps-type]").forEach(b => b.onclick = () => dessiner(b.dataset.gpsType));
      z.querySelector("#gps-go").onclick = () => demarrer(t);
      z.querySelectorAll("[data-parcours]").forEach(b => b.onclick = () => resume(b.dataset.parcours));
      const m = nouvelleCarte(z.querySelector("#gps-carte"));
      if (m) navigator.geolocation?.getCurrentPosition((p) => { if (carte === m) { m.setView([p.coords.latitude, p.coords.longitude], 16); L.circleMarker([p.coords.latitude, p.coords.longitude], { radius: 8, color: "#fff", weight: 3, fillColor: "#26c6b0", fillOpacity: 1 }).addTo(m); } }, () => {}, { enableHighAccuracy: true, timeout: 15000 });
      return;
    }
    z.innerHTML = `<div class="gps-direct">
        <div class="gps-gros"><span id="gps-dist">0,00</span><small>km</small></div>
        <div class="gps-stats"><div><b id="gps-temps">00:00</b><small>Durée</small></div><div><b id="gps-moy">--:--</b><small>Allure moy. /km</small></div><div><b id="gps-act">--:--</b><small>Allure actuelle</small></div></div>
        <div class="gps-carte" id="gps-carte"></div>
        <p class="gps-precision" id="gps-prec">Recherche du GPS…</p>
        <p class="gps-alerte" id="gps-alerte" hidden></p>
        <div class="commandes"><button class="gros go" type="button" id="gps-pause">Pause</button><button class="gros sec" type="button" id="gps-fin">Terminer</button></div>
        <div class="tv-ligne"><button class="mini" type="button" id="gps-noir">🌙 Écran noir (batterie)</button><label class="case"><input type="checkbox" id="gps-voix" ${parler ? "checked" : ""}> Annonce à chaque km</label></div></div>`;
    const m = nouvelleCarte(z.querySelector("#gps-carte"), suivi.points.map(p => [p[0], p[1]]));
    if (m) { trace = L.polyline(suivi.points.map(p => [p[0], p[1]]), { color: "#ff4b2b", weight: 5 }).addTo(m);
      const d = suivi.points[suivi.points.length - 1];
      point = L.circleMarker(d ? [d[0], d[1]] : [0, 0], { radius: 8, color: "#fff", weight: 3, fillColor: "#ff4b2b", fillOpacity: 1 }).addTo(m);
      if (d) m.setView([d[0], d[1]], 16); }
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
    el("gps-prec").textContent = suivi.precision == null ? "Recherche du GPS…" : suivi.precision <= 35 ? `GPS ✓ (précision ${suivi.precision} m)` : `GPS faible (${suivi.precision} m) : à découvert, ça ira mieux`;
  }
  function resume(id) {
    const r = parcours().find(x => x.id === id); const z = $z(); if (!r || !z) return dessiner();
    const date = new Date(r.debut).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    z.innerHTML = `<div class="gps-resume">
        <p class="doux">${NOM[r.type] || "Parcours"} · ${date}</p>
        <div class="gps-carte grande" id="gps-carte"></div>
        <div class="gps-gros"><span>${km(r.distance)}</span><small>km</small></div>
        <div class="gps-stats"><div><b>${duree(r.duree)}</b><small>Durée</small></div><div><b>${allure(r.duree, r.distance)}</b><small>min/km</small></div><div><b>${(r.distance / 1000 / (r.duree / 3600 || 1)).toFixed(1).replace(".", ",")}</b><small>km/h</small></div></div>
        <p class="gps-kcal">≈ <b>${Math.round((r.type === "marche" ? 0.55 : 1) * (window.Decouverte && Decouverte.poidsActuel() || 70) * r.distance / 1000)}</b> kcal dépensées${window.Decouverte && Decouverte.poidsActuel() ? "" : " (estimation pour 70 kg : indiquez votre poids dans le Profil)"}</p>
        ${r.kms && r.kms.length ? `<h2>Temps au kilomètre</h2><div class="gps-kms">${r.kms.map((s, i) => { const max = Math.max(...r.kms);
          return `<div><span>${i + 1}</span><i style="width:${Math.round(s / max * 100)}%"></i><b>${duree(s)}</b></div>`; }).join("")}</div>` : ""}
        <button class="principal" type="button" id="gps-partager">Partager</button>
        <button class="lien" type="button" id="gps-retour">← Mes parcours</button>
        <button class="lien danger" type="button" id="gps-suppr">Supprimer ce parcours</button></div>`;
    const m = nouvelleCarte(z.querySelector("#gps-carte"), r.points);
    if (m && r.points.length) { L.polyline(r.points, { color: "#ff4b2b", weight: 5 }).addTo(m);
      L.circleMarker(r.points[0], { radius: 7, color: "#fff", weight: 3, fillColor: "#26c6b0", fillOpacity: 1 }).addTo(m);
      L.circleMarker(r.points[r.points.length - 1], { radius: 7, color: "#fff", weight: 3, fillColor: "#ff4b2b", fillOpacity: 1 }).addTo(m); }
    z.querySelector("#gps-retour").onclick = () => dessiner(r.type);
    z.querySelector("#gps-partager").onclick = async () => {
      const t = `${r.type === "marche" ? "🚶 Marche" : "🏃 Course"} : ${km(r.distance)} km en ${duree(r.duree)} (${allure(r.duree, r.distance)} min/km) avec Rythmo Sport 💪`;
      try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); toast("Texte copié"); } } catch {} };
    deuxClics(z.querySelector("#gps-suppr"), "Sûr ? Touchez encore", () => { D().parcours = parcours().filter(x => x.id !== id); Compte.sauver(); dessiner(r.type); });
  }

  return {
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
