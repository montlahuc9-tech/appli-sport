// Outils partagés : recherche d'un exercice, photos, silhouette des muscles, petites fonctions d'affichage.
const $ = (id) => document.getElementById(id);
const esc = (t) => { const d = document.createElement("div"); d.textContent = t ?? ""; return d.innerHTML; };
const sansAccent = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const fmt = (s) => { s = Math.max(0, Math.ceil(s)); const m = Math.floor(s / 60); return String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
const dureeTexte = (s) => s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? " " + String(s % 60).padStart(2, "0") : ""}` : `${s} s`;

const PAR_NOM = new Map(EXERCICES.map(e => [e.nom, e]));
// Retrouve un exercice de la bibliothèque, même si le nom a été un peu modifié
// Échauffements et étirements (communs maison / salle) : à la salle, photos du même style que les autres exercices de salle (Free Exercise DB)
const PHOTO_SALLE = {"Cercles de chevilles": "Ankle_Circles", "Cercles de hanches": "Standing_Hip_Circles", "Talons-fesses": "Single_Leg_Butt_Kick", "Skipping (genoux hauts rapides)": "Fast_Skipping", "Pas croisés (carioca)": "Carioca_Quick_Step", "Marche des mains (inchworm)": "Inchworm", "Moulinets des bras": "Arm_Circles", "Cercles d'épaules": "Shoulder_Circles", "Torsion du dos (allongé)": "Side-Lying_Floor_Stretch", "Étirement des mollets (contre un mur)": "Calf_Stretch_Hands_Against_Wall", "Étirement des quadriceps (allongé sur le côté)": "On_Your_Side_Quad_Stretch", "Étirement des ischios (allongé, avec serviette)": "Hamstring_Stretch", "Étirement des hanches (fente au sol)": "Kneeling_Hip_Flexor", "Étirement papillon (intérieur des cuisses)": "Groin_and_Back_Stretch", "Posture de l'enfant (dos)": "Childs_Pose", "Dos rond, dos creux (chat)": "Cat_Stretch", "Genoux contre la poitrine": "One_Knee_To_Chest"};
function infoExo(nom, muscleLibre) {
  const e = infoExoBrut(nom, muscleLibre);
  return e && window.LIEU_SALLE && PHOTO_SALLE[e.nom] ? { ...e, photo: PHOTO_SALLE[e.nom] } : e;
}
function infoExoBrut(nom, muscleLibre) {
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
// Photos de salle : Free Exercise DB (.jpg) ; illustrations maison : RepDB (« rdb/… », .webp)
const urlPhoto = (id, i) => id.startsWith("rdb/") ? `photos/rdb/${encodeURIComponent(id.slice(4))}_${i}.webp` : `photos/${encodeURIComponent(id)}_${i}.jpg`;
const classePhoto = (ex) => ex && ex.photo && ex.photo.startsWith("rdb/") ? "dessin" : "";
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
const vignette = (ex) => ex.photo ? `<img class="${classePhoto(ex)}" src="${urlPhoto(ex.photo, 0)}" alt="" loading="lazy">` : svgSilhouette(ex);
// Les deux photos (départ / arrivée), qu'on peut agrandir
function photosGrandes(ex) {
  if (!ex.photo) return svgSilhouette(ex, "grande");
  return `<div class="photos ${classePhoto(ex)}" data-zoom="${esc(ex.nom)}">` + [0, 1].map(i =>
    `<figure><img src="${urlPhoto(ex.photo, i)}" alt="${esc(ex.nom)} : ${i ? "arrivée" : "départ"}"><figcaption>${i ? "2 · Arrivée" : "1 · Départ"}</figcaption></figure>`).join("") + `</div>`;
}
// Le mouvement animé : la photo de départ et celle d'arrivée se fondent l'une dans l'autre, en boucle
function animMouvement(ex) {
  if (!ex.photo) return svgSilhouette(ex, "grande");
  return `<div class="anim ${classePhoto(ex)}" data-zoom="${esc(ex.nom)}" role="img" aria-label="${esc(ex.nom)} : le mouvement">
    <img src="${urlPhoto(ex.photo, 0)}" alt=""><img class="b" src="${urlPhoto(ex.photo, 1)}" alt=""><span class="etiq">▶ Mouvement</span>${ex.noteImage ? `<span class="note-image">${esc(ex.noteImage)}</span>` : ""}</div>`;
}
const lienVideo = (ex) => { const en = typeof YT !== "undefined" && YT[ex.nom];
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(en ? en + (/stretch|warm up|drill|walking|running|jog|posture|pose|treadmill/.test(en) ? "" : " exercise") + " proper form" : ex.nom.replace(/\(.*?\)/g, "") + " exercice bien faire le mouvement")}`; };
function brancherZoom(racine, ex) {
  const z = racine.querySelector("[data-zoom]"); if (!z || !ex.photo) return;
  z.onclick = () => { const d = document.createElement("div"); d.className = "zoom-photo";
    d.innerHTML = `<div class="duo">${[0, 1].map(i => `<img src="${urlPhoto(ex.photo, i)}" alt="">`).join("")}<p>${esc(ex.nom)} · 1 = départ, 2 = arrivée · touchez pour fermer</p></div>`;
    d.onclick = () => d.remove(); document.body.appendChild(d); };
}

// ---------- Silhouette face / dos avec les muscles travaillés ----------
// Corps de face et de dos, muscle par muscle (dessin : react-body-highlighter, licence MIT)
const CORPS_SVG = `<svg viewBox="0 0 210 222" aria-label="Muscles travaillés" role="img"><g transform="translate(0 0)"><polygon class="z" data-z="pecs" points="51.8 41.6 51.0 55.1 58.0 58.0 67.8 55.5 70.6 47.3 62.0 41.6"/><polygon class="z" data-z="pecs" points="29.8 46.5 31.4 55.5 40.8 58.0 48.2 55.1 47.8 42.0 37.6 42.0"/><polygon class="z" data-z="abdos" points="68.6 63.3 67.3 57.1 58.8 59.6 60.0 64.1 60.4 83.3 65.7 78.8 66.5 69.8"/><polygon class="z" data-z="abdos" points="33.9 78.4 33.1 71.8 31.0 63.3 32.2 57.1 40.8 59.2 39.2 63.3 39.2 83.7"/><polygon class="z" data-z="abdos" points="56.3 59.2 58.0 64.1 58.4 78.0 58.4 92.7 56.3 98.4 55.1 104.1 51.4 107.8 51.0 84.5 50.6 67.3 51.0 57.1"/><polygon class="z" data-z="abdos" points="43.7 58.8 48.6 57.1 49.0 67.3 48.6 84.5 48.2 107.3 44.5 103.7 40.8 91.4 40.8 78.4 41.2 64.5"/><polygon class="z" data-z="biceps" points="16.7 68.2 18.0 71.4 22.9 66.1 29.0 53.9 27.8 49.4 20.4 55.9"/><polygon class="z" data-z="biceps" points="71.4 49.4 70.2 54.7 76.3 66.1 81.6 71.8 82.9 69.0 78.8 55.5"/><polygon class="z" data-z="triceps" points="69.4 55.5 69.4 61.6 75.9 72.7 77.6 70.2 75.5 67.3"/><polygon class="z" data-z="triceps" points="22.4 69.4 29.8 55.5 29.8 60.8 22.9 73.1"/><polygon class="neutre" points="55.5 23.7 50.6 33.5 50.6 39.2 61.6 40.0 70.6 44.9 69.4 36.7 63.3 35.1 58.4 30.6"/><polygon class="neutre" points="29.0 44.9 30.2 37.1 36.3 35.1 41.2 30.2 44.5 24.5 49.0 33.9 48.6 39.2 38.0 39.6"/><polygon class="z" data-z="epaules" points="78.4 53.1 79.6 47.8 79.2 41.2 75.9 38.0 71.0 36.3 72.2 42.9 71.4 47.3"/><polygon class="z" data-z="epaules" points="28.2 47.3 21.2 53.1 20.0 47.8 20.4 40.8 24.5 37.1 28.6 37.1 26.9 43.3"/><polygon class="neutre" points="42.4 2.9 40.0 11.8 42.0 19.6 46.1 23.3 49.8 25.3 54.7 22.4 57.6 19.2 59.2 10.2 57.1 2.4 49.8 0.0"/><polygon class="z" data-z="fessiers" points="52.7 110.2 54.3 124.9 60.0 110.2 62.0 100.0 64.9 94.3 60.0 92.7 56.7 104.5"/><polygon class="z" data-z="fessiers" points="47.8 110.6 44.9 125.3 42.0 115.9 40.4 113.1 39.6 107.3 38.0 102.4 34.7 93.9 39.6 92.2 41.6 99.2 43.7 105.3"/><polygon class="z" data-z="quadri" points="34.7 98.8 37.1 108.2 37.1 127.8 34.3 137.1 31.0 132.7 29.4 120.0 28.2 111.4 29.4 100.8 32.2 94.7"/><polygon class="z" data-z="quadri" points="63.3 105.7 64.5 100.0 66.9 94.7 70.2 101.2 71.0 111.8 68.2 133.1 65.3 137.6 62.4 128.6 62.0 111.4"/><polygon class="z" data-z="quadri" points="38.8 129.4 38.4 112.2 41.2 118.4 44.5 129.4 42.9 135.1 40.0 146.1 36.3 146.5 35.5 140.0"/><polygon class="z" data-z="quadri" points="59.6 145.7 55.5 129.0 60.8 113.9 61.2 130.2 64.1 139.6 62.9 146.5"/><polygon class="z" data-z="quadri" points="32.7 138.4 26.5 145.7 25.7 136.7 25.7 127.3 26.9 114.3 29.4 133.5"/><polygon class="z" data-z="quadri" points="71.8 113.1 73.9 124.1 73.9 140.4 72.7 145.7 66.5 138.4 70.2 133.5"/><polygon class="neutre" points="33.9 140.0 34.7 143.3 35.5 147.3 36.3 151.0 35.1 156.7 29.8 156.7 27.3 152.7 27.3 147.3 30.2 144.1"/><polygon class="neutre" points="65.7 140.0 72.2 147.8 72.2 152.2 69.8 157.1 64.9 156.7 62.9 151.0"/><polygon class="z" data-z="mollets" points="71.4 160.4 73.5 153.5 76.7 161.2 79.6 167.8 78.4 187.8 79.6 195.5 74.7 195.5"/><polygon class="z" data-z="mollets" points="24.9 194.7 27.8 164.9 28.2 160.4 26.1 154.3 24.9 157.6 22.4 161.6 20.8 167.8 22.0 188.2 20.8 195.5"/><polygon class="z" data-z="mollets" points="72.7 195.1 69.8 159.2 65.3 158.4 64.1 162.4 64.1 165.3 65.7 177.1"/><polygon class="z" data-z="mollets" points="35.5 158.4 35.9 162.4 35.9 166.9 35.1 172.2 35.1 176.7 32.2 182.0 30.6 187.3 26.9 194.7 27.3 187.8 28.2 180.4 28.6 175.5 29.0 169.8 29.8 164.1 30.2 158.8"/><polygon class="z" data-z="avbras" points="6.1 88.6 10.2 75.1 14.7 70.2 16.3 74.3 19.2 73.5 4.5 97.6 0.0 100.0"/><polygon class="z" data-z="avbras" points="84.5 69.8 83.3 73.5 80.0 73.1 95.1 98.4 100.0 100.4 93.5 89.4 89.8 76.3"/><polygon class="z" data-z="avbras" points="77.6 72.2 77.6 77.6 80.4 84.1 85.3 89.8 92.2 101.2 94.7 99.6"/><polygon class="z" data-z="avbras" points="6.9 101.2 13.5 90.6 18.8 84.1 21.6 77.1 21.2 71.8 4.9 98.8"/></g><g transform="translate(110 0)"><polygon class="neutre" points="50.6 0.0 46.0 0.9 40.9 5.5 40.4 12.8 45.1 20.0 55.7 20.0 59.1 13.6 59.6 4.7 55.7 1.3"/><polygon class="z" data-z="dos" points="44.7 21.7 47.7 21.7 47.2 38.3 47.7 64.7 38.3 53.2 35.3 40.9 31.1 36.6 39.1 33.2 43.8 27.2"/><polygon class="z" data-z="dos" points="52.3 21.7 55.7 21.7 56.6 27.2 60.9 32.8 68.9 36.6 64.7 40.4 61.7 53.2 52.3 64.7 53.2 38.3"/><polygon class="z" data-z="epaules" points="29.4 37.0 23.0 39.1 17.4 44.3 18.3 53.6 24.3 49.4 27.2 46.4"/><polygon class="z" data-z="epaules" points="71.1 37.0 78.3 39.6 82.6 44.7 81.7 53.6 74.9 48.9 72.3 45.1"/><polygon class="z" data-z="dos" points="31.1 38.7 28.1 48.9 28.5 55.3 34.0 75.3 47.2 71.1 47.2 66.4 36.6 54.0 33.6 41.3"/><polygon class="z" data-z="dos" points="68.9 38.7 71.9 49.4 71.5 56.2 66.0 75.3 52.8 71.1 52.8 66.4 63.4 54.5 66.4 41.7"/><polygon class="z" data-z="triceps" points="26.8 49.8 17.9 55.7 14.5 72.3 16.6 81.7 21.7 63.8 26.8 55.7"/><polygon class="z" data-z="triceps" points="73.6 50.2 82.1 55.7 86.0 73.2 83.4 82.1 77.9 63.0 73.2 55.7"/><polygon class="z" data-z="triceps" points="26.8 58.3 26.8 68.5 23.0 75.3 19.1 77.4 22.6 65.5"/><polygon class="z" data-z="triceps" points="72.8 58.3 77.0 64.7 80.4 77.4 76.6 75.3 72.8 68.9"/><polygon class="z" data-z="lombaires" points="47.7 72.8 34.5 77.0 35.3 83.4 49.4 102.1 46.8 83.0"/><polygon class="z" data-z="lombaires" points="52.3 72.8 65.5 77.0 64.7 83.4 50.6 102.1 53.2 83.8"/><polygon class="z" data-z="avbras" points="86.4 75.7 91.1 83.4 93.2 94.0 100.0 106.4 96.2 104.3 88.1 89.4 84.3 83.8"/><polygon class="z" data-z="avbras" points="13.6 75.7 8.9 83.8 6.8 93.6 0.0 106.4 3.8 104.3 12.3 88.5 15.7 83.0"/><polygon class="z" data-z="avbras" points="81.3 79.6 77.4 77.9 79.1 84.7 91.1 103.8 93.2 108.9 94.5 104.7"/><polygon class="z" data-z="avbras" points="18.7 79.6 22.1 77.9 20.9 84.3 9.4 103.0 6.8 108.5 5.1 104.7"/><polygon class="z" data-z="fessiers" points="44.7 99.6 30.2 108.5 29.8 118.7 31.5 126.0 47.2 121.3 49.4 114.9"/><polygon class="z" data-z="fessiers" points="55.3 99.1 51.1 114.5 52.3 120.9 68.1 126.0 69.8 119.1 69.4 108.5"/><polygon class="z" data-z="quadri" points="48.1 123.0 44.7 123.0 41.3 125.5 45.1 144.3 48.5 135.7 48.9 129.4"/><polygon class="z" data-z="quadri" points="51.9 122.6 55.7 123.4 59.1 126.0 54.9 144.3 51.9 136.2 51.1 129.4"/><polygon class="z" data-z="ischios" points="28.9 122.1 31.1 129.4 36.6 126.0 35.3 135.3 34.5 150.2 29.4 158.3 28.9 146.8 27.7 141.3 27.2 131.5"/><polygon class="z" data-z="ischios" points="71.5 121.7 69.4 128.9 63.8 126.0 65.5 136.6 66.4 150.2 71.1 158.3 71.5 147.7 72.8 142.1 73.6 131.9"/><polygon class="z" data-z="ischios" points="38.7 125.5 44.3 146.0 40.4 166.8 36.2 152.8 37.0 135.3"/><polygon class="z" data-z="ischios" points="61.7 125.5 63.4 136.2 64.3 153.2 60.0 166.8 56.2 146.4"/><polygon class="neutre" points="34.5 153.2 31.1 159.1 33.6 166.4 37.4 162.6"/><polygon class="neutre" points="66.4 153.6 63.0 163.0 66.8 166.4 69.4 159.1"/><polygon class="z" data-z="mollets" points="29.4 160.4 28.5 167.2 24.7 179.6 23.8 192.8 25.5 197.0 28.5 193.2 29.8 180.0 31.9 171.1 31.9 166.8"/><polygon class="z" data-z="mollets" points="37.4 165.1 35.3 167.7 33.2 171.9 31.1 180.4 30.2 191.9 34.0 200.0 38.7 190.6 39.1 168.9"/><polygon class="z" data-z="mollets" points="63.0 165.1 61.3 168.5 61.7 190.6 66.4 199.6 70.6 191.9 68.9 179.6 66.8 170.2"/><polygon class="z" data-z="mollets" points="70.6 160.4 72.3 168.5 75.7 179.1 76.6 192.8 74.5 196.6 72.3 193.6 70.6 179.6 68.1 168.1"/><polygon class="z" data-z="mollets" points="28.5 195.7 30.2 195.7 33.6 201.7 30.6 220.0 28.5 213.6 26.8 198.3"/><polygon class="z" data-z="mollets" points="69.8 195.7 71.9 195.7 73.6 198.3 71.9 213.2 70.2 219.6 67.2 202.1"/></g></svg><div class="legende-muscles"><span><i></i>principal</span><span><i style="opacity:.42"></i>secondaire</span></div>`;
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

// ---------- « Comment faire » : explications de l'exercice (explications.js) ----------
const ONGLETS_MAT = { halteres: "🏋️ Haltères", bouteilles: "💧 Bouteilles d'eau", elastique: "➰ Élastique" };
function blocExplication(ex) {
  const x = typeof EXPLIC !== "undefined" && ex && EXPLIC[ex.nom]; if (!x) return "";
  let ongl = "";
  if (x.v) {
    const mat = (typeof Compte !== "undefined" && Compte.donnees && Compte.donnees.reglages && Compte.donnees.reglages.materiel) || [];
    const cles = Object.keys(ONGLETS_MAT).filter(k => x.v[k]);
    const actif = cles.find(k => mat.includes(k)) || (cles.includes("bouteilles") && !mat.includes("halteres") ? "bouteilles" : cles[0]);
    ongl = `<div class="cf-mat"><p class="cf-t">Avec quoi ?</p><div class="puces">${cles.map(k => `<button type="button" data-cf="${k}" aria-pressed="${k === actif}">${ONGLETS_MAT[k]}</button>`).join("")}</div>
      ${cles.map(k => `<p class="cf-v" data-cfv="${k}" ${k === actif ? "" : "hidden"}>${esc(x.v[k])}</p>`).join("")}</div>`;
  }
  return `<section class="comment-faire"><h3>📖 Comment faire</h3>
    ${x.lests ? `<p class="cf-info">🦶 ${esc(x.lests)}</p>` : ""}
    ${ongl}
    <p><b>Départ :</b> ${esc(x.d)}</p>
    <ol class="cf-etapes">${x.m.map(e => `<li>${esc(e)}</li>`).join("")}</ol>
    ${x.r ? `<p>🫁 <b>Respiration :</b> ${esc(x.r)}</p>` : ""}
    ${x.e ? `<p>⚠️ <b>À éviter :</b> ${esc(x.e)}</p>` : ""}
    ${x.sans ? `<p class="cf-sans">💡 ${esc(x.sans)}</p>` : ""}</section>`;
}
function brancherExplication(racine) {
  racine.querySelectorAll("[data-cf]").forEach(b => b.onclick = () => {
    racine.querySelectorAll("[data-cf]").forEach(o => o.setAttribute("aria-pressed", String(o === b)));
    racine.querySelectorAll("[data-cfv]").forEach(p => p.hidden = p.dataset.cfv !== b.dataset.cf); });
}
