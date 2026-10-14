// Outils partagés : recherche d'un exercice, photos, silhouette des muscles, petites fonctions d'affichage.
const $ = (id) => document.getElementById(id);
const esc = (t) => { const d = document.createElement("div"); d.textContent = t ?? ""; return d.innerHTML; };
const sansAccent = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const fmt = (s) => { s = Math.max(0, Math.ceil(s)); const m = Math.floor(s / 60); return String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
const dureeTexte = (s) => s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? " " + String(s % 60).padStart(2, "0") : ""}` : `${s} s`;

const PAR_NOM = new Map(EXERCICES.map(e => [e.nom, e]));
// Retrouve un exercice de la bibliothèque, même si le nom a été un peu modifié
function infoExo(nom, muscleLibre) {
  if (PAR_NOM.has(nom)) return PAR_NOM.get(nom);
  const n = sansAccent(nom).trim(); let meilleur = null, long = 0;
  for (const e of EXERCICES) {
    const court = sansAccent(e.nom).replace(/\s*\(.*\)\s*/g, "").trim();
    if (court.length > long && n.length >= 4 && (n.includes(court) || court.includes(n))) { meilleur = e; long = court.length; }
  }
  if (meilleur) return meilleur;
  const m = muscleLibre || "cardio";
  return { nom, photo: null, lieu: "maison", muscle: m, p: m === "cardio" ? ["quadri", "abdos"] : [m], s: [], series: 3, reps: "10", repos: 60, libre: true };
}
const urlPhoto = (id, i) => `photos/${encodeURIComponent(id)}_${i}.jpg`;
// « · matériel : barre de porte » quand l'exercice demande un matériel particulier
const materiel = (ex) => ex && ex.materiel ? ` · matériel : ${ex.materiel}` : "";
const nomMuscles = (ex) => ex.muscle === "cardio" ? "Cardio" : [ex.p, ex.s].flat().filter((m, i, a) => a.indexOf(m) === i).slice(0, 3).map(m => MUSCLES[m] || m).join(", ");

// ---------- Silhouette quand il n'y a pas de photo ----------
const POSES = {
  debout:    { t: [32, 10], n: [32, 18], b: [32, 35], c: [[27, 26], [37, 26]], m: [[26, 35], [38, 35]], g: [[29, 47], [35, 47]], p: [[28, 59], [36, 59]] },
  saut:      { t: [32, 10], n: [32, 18], b: [32, 35], c: [[24, 14], [40, 14]], m: [[20, 6], [44, 6]], g: [[25, 46], [39, 46]], p: [[20, 58], [44, 58]] },
  squat:     { t: [26, 15], n: [28, 22], b: [40, 38], c: [[20, 27], [20, 28]], m: [[12, 27], [12, 28]], g: [[26, 41], [27, 42]], p: [[29, 59], [30, 59]] },
  fente:     { t: [32, 11], n: [32, 18], b: [32, 36], c: [[29, 27], [35, 27]], m: [[28, 35], [36, 35]], g: [[21, 46], [42, 56]], p: [[21, 59], [52, 59]] },
  pompe:     { t: [11, 36], n: [16, 39], b: [37, 44], c: [[17, 49], [18, 49]], m: [[17, 59], [18, 59]], g: [[47, 49], [47, 49]], p: [[57, 56], [57, 56]] },
  planche:   { t: [11, 41], n: [16, 44], b: [37, 46], c: [[16, 57], [17, 57]], m: [[25, 57], [26, 57]], g: [[47, 50], [47, 50]], p: [[57, 54], [57, 54]] },
  crunch:    { t: [14, 42], n: [19, 46], b: [33, 56], c: [[14, 36], [15, 36]], m: [[10, 41], [11, 41]], g: [[42, 42], [43, 42]], p: [[51, 58], [52, 58]] },
  pont:      { t: [9, 53], n: [15, 53], b: [33, 42], c: [[19, 58], [20, 58]], m: [[27, 58], [28, 58]], g: [[44, 40], [45, 40]], p: [[47, 58], [48, 58]] },
  souleve:   { t: [17, 22], n: [22, 25], b: [39, 30], c: [[22, 36], [23, 36]], m: [[22, 46], [23, 46]], g: [[38, 44], [39, 44]], p: [[36, 59], [37, 59]], barre: [[11, 46], [35, 46]] },
  press:     { t: [32, 13], n: [32, 21], b: [32, 38], c: [[23, 19], [41, 19]], m: [[24, 7], [40, 7]], g: [[29, 49], [35, 49]], p: [[28, 60], [36, 60]], halteres: true },
  rowing:    { t: [15, 24], n: [20, 27], b: [38, 32], c: [[27, 30], [28, 31]], m: [[24, 41], [25, 41]], g: [[37, 45], [38, 45]], p: [[35, 59], [36, 59]], halteres: true },
  curl:      { t: [32, 10], n: [32, 18], b: [32, 35], c: [[27, 28], [37, 28]], m: [[23, 20], [41, 20]], g: [[29, 47], [35, 47]], p: [[28, 59], [36, 59]], halteres: true }
};
const REGLES_POSE = [[/pont|hip thrust/, "pont"], [/chaise contre/, "squat"], [/genoux|burpee|jumping|saut|jump|corde/, "saut"], [/wall ball|developpe|militaire/, "press"],
  [/rowing|tirage/, "rowing"], [/curl/, "curl"], [/souleve|swing/, "souleve"], [/fente/, "fente"], [/squat|presse/, "squat"], [/pompe/, "pompe"],
  [/planche|gainage|mountain|superman/, "planche"], [/crunch|releve|twist|abdo/, "crunch"]];
function svgSilhouette(ex, classe = "") {
  const n = sansAccent(ex.nom), r = REGLES_POSE.find(([re]) => re.test(n)), P = POSES[r ? r[1] : "debout"];
  const z = [...ex.p, ...ex.s], a = (...k) => k.some(x => z.includes(x)), coul = (on) => on ? "var(--travail)" : "#4a525e";
  const tronc = a("pecs", "abdos", "dos", "lombaires"), haut = a("epaules", "biceps", "triceps"), avant = a("avbras"), cuisse = a("quadri", "ischios", "fessiers"), mollet = a("mollets");
  const L = (p1, p2, on, l = 4.6, op = 1) => `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${coul(on)}" stroke-width="${l}" stroke-linecap="round" opacity="${op}"/>`;
  let s = '<line x1="2" y1="62" x2="62" y2="62" stroke="#262b34" stroke-width="1.5"/>';
  for (const i of [1, 0]) { const op = i ? 0.5 : 1;
    s += L(P.b, P.g[i], cuisse, 4.8, op) + L(P.g[i], P.p[i], mollet, 4.2, op) + L(P.n, P.c[i], haut, 4, op) + L(P.c[i], P.m[i], avant, 3.6, op);
    if (i === 1) s += L(P.n, P.b, tronc, 6.5); }
  s += `<circle cx="${P.t[0]}" cy="${P.t[1]}" r="5.2" fill="#6b7482"/>`;
  if (P.barre) { const [d, f] = P.barre; s += `<line x1="${d[0]}" y1="${d[1]}" x2="${f[0]}" y2="${f[1]}" stroke="#c4cad3" stroke-width="2.2" stroke-linecap="round"/>`; }
  if (P.halteres) for (const m of P.m) s += `<rect x="${m[0] - 3.5}" y="${m[1] - 1.6}" width="7" height="3.2" rx="1.2" fill="#c4cad3"/>`;
  return `<svg class="pose ${classe}" viewBox="0 0 64 64" role="img" aria-label="${esc(ex.nom)}">${s}</svg>`;
}
// Petite vignette (photo de départ, ou silhouette)
const vignette = (ex) => ex.photo ? `<img src="${urlPhoto(ex.photo, 0)}" alt="" loading="lazy">` : svgSilhouette(ex);
// Les deux photos (départ / arrivée), qu'on peut agrandir
function photosGrandes(ex) {
  if (!ex.photo) return svgSilhouette(ex, "grande");
  return `<div class="photos" data-zoom="${esc(ex.nom)}">` + [0, 1].map(i =>
    `<figure><img src="${urlPhoto(ex.photo, i)}" alt="${esc(ex.nom)} : ${i ? "arrivée" : "départ"}"><figcaption>${i ? "2 · Arrivée" : "1 · Départ"}</figcaption></figure>`).join("") + `</div>`;
}
function brancherZoom(racine, ex) {
  const z = racine.querySelector("[data-zoom]"); if (!z || !ex.photo) return;
  z.onclick = () => { const d = document.createElement("div"); d.className = "zoom-photo";
    d.innerHTML = `<div class="duo">${[0, 1].map(i => `<img src="${urlPhoto(ex.photo, i)}" alt="">`).join("")}<p>${esc(ex.nom)} · 1 = départ, 2 = arrivée · touchez pour fermer</p></div>`;
    d.onclick = () => d.remove(); document.body.appendChild(d); };
}

// ---------- Silhouette face / dos avec les muscles travaillés ----------
const CORPS_SVG = `<svg viewBox="0 0 124 128" aria-label="Muscles travaillés" role="img">
  <circle class="neutre" cx="30" cy="9" r="7"/>
  <ellipse class="z" data-z="epaules" cx="17" cy="24" rx="5.5" ry="4.5"/><ellipse class="z" data-z="epaules" cx="43" cy="24" rx="5.5" ry="4.5"/>
  <ellipse class="z" data-z="pecs" cx="24.5" cy="30" rx="6" ry="5"/><ellipse class="z" data-z="pecs" cx="35.5" cy="30" rx="6" ry="5"/>
  <rect class="z" data-z="abdos" x="24" y="36.5" width="12" height="20" rx="3"/>
  <rect class="z" data-z="abdos" x="18.5" y="37" width="4.5" height="17" rx="2"/><rect class="z" data-z="abdos" x="37" y="37" width="4.5" height="17" rx="2"/>
  <ellipse class="z" data-z="biceps" cx="12" cy="35" rx="3.6" ry="8"/><ellipse class="z" data-z="biceps" cx="48" cy="35" rx="3.6" ry="8"/>
  <ellipse class="z" data-z="avbras" cx="9.5" cy="51" rx="3" ry="8"/><ellipse class="z" data-z="avbras" cx="50.5" cy="51" rx="3" ry="8"/>
  <rect class="neutre" x="19" y="57.5" width="22" height="7" rx="3"/>
  <ellipse class="z" data-z="quadri" cx="24.5" cy="77" rx="5.6" ry="13"/><ellipse class="z" data-z="quadri" cx="35.5" cy="77" rx="5.6" ry="13"/>
  <ellipse class="z" data-z="mollets" cx="24.5" cy="104" rx="4" ry="11"/><ellipse class="z" data-z="mollets" cx="35.5" cy="104" rx="4" ry="11"/>
  <circle class="neutre" cx="94" cy="9" r="7"/>
  <ellipse class="z" data-z="epaules" cx="81" cy="24" rx="5.5" ry="4.5"/><ellipse class="z" data-z="epaules" cx="107" cy="24" rx="5.5" ry="4.5"/>
  <ellipse class="z" data-z="dos" cx="94" cy="33" rx="12.5" ry="10.5"/>
  <rect class="z" data-z="dos" x="88" y="42" width="12" height="7" rx="3"/>
  <rect class="z" data-z="lombaires" x="88" y="50" width="12" height="7" rx="3"/>
  <ellipse class="z" data-z="triceps" cx="76" cy="35" rx="3.6" ry="8"/><ellipse class="z" data-z="triceps" cx="112" cy="35" rx="3.6" ry="8"/>
  <ellipse class="z" data-z="avbras" cx="73.5" cy="51" rx="3" ry="8"/><ellipse class="z" data-z="avbras" cx="114.5" cy="51" rx="3" ry="8"/>
  <ellipse class="z" data-z="fessiers" cx="88.5" cy="63" rx="6.2" ry="6"/><ellipse class="z" data-z="fessiers" cx="99.5" cy="63" rx="6.2" ry="6"/>
  <ellipse class="z" data-z="ischios" cx="88.5" cy="81" rx="5.6" ry="11.5"/><ellipse class="z" data-z="ischios" cx="99.5" cy="81" rx="5.6" ry="11.5"/>
  <ellipse class="z" data-z="mollets" cx="88.5" cy="104" rx="4.4" ry="10.5"/><ellipse class="z" data-z="mollets" cx="99.5" cy="104" rx="4.4" ry="10.5"/>
</svg><div class="legende-muscles"><span><i></i>principal</span><span><i style="opacity:.42"></i>secondaire</span></div>`;
function colorerCorps(racine, ex) {
  const p = ex ? ex.p : [], s = ex ? ex.s : [];
  racine.querySelectorAll(".z").forEach(el => { const z = el.dataset.z; el.classList.toggle("on", p.includes(z)); el.classList.toggle("sec", !p.includes(z) && s.includes(z)); });
  const leg = racine.querySelector(".legende-muscles"); if (leg) leg.hidden = !s.length;
}

function toast(texte, ms = 2600) { const t = $("toast"); t.textContent = texte; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, ms); }
// Bouton « sûr ? » en deux appuis (pas de fenêtre de confirmation)
function deuxClics(bouton, texte, action) {
  let arme = false; bouton.addEventListener("click", () => { if (arme) return action(); arme = true; const avant = bouton.textContent; bouton.textContent = texte;
    setTimeout(() => { arme = false; bouton.textContent = avant; }, 3000); });
}
