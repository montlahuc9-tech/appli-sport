// Défis Calisthenics 30 jours : au poids du corps, à la maison ou dehors.
// Niveau 1 : les bases. Niveau 2 : plus dur, il ne s'ouvre qu'une fois les 30 jours du niveau 1 terminés.
// Chaque semaine : 6 jours d'entraînement + 1 jour de récupération, et ça monte un peu chaque semaine. Jour 29 : test, jour 30 : grand final.
// Chaque jour est une vraie séance (FICHES « cali-01 »… et « cali2-01 »…), lancée avec le minuteur comme les autres.
const S_ = (nom, series, reps, repos) => ({ nom, series, reps, repos });
const C_ = (nom) => ({ nom });
const w_ = (arr, k) => arr[Math.min(k, arr.length - 1)];          // valeur selon la semaine (0 à 3)
const RECUP_CALI = { type: "circuit", titre: "Récupération active", travail: 40, repos: 10, tours: 1, pause: 0, recup: true,
  note: "Jour léger : on étire tout le corps pour récupérer. Bien respirer, ne jamais forcer. Le muscle se construit pendant le repos.",
  exos: ["Dos rond, dos creux (chat)", "Posture de l'enfant (dos)", "Étirement des hanches (fente au sol)", "Étirement des ischios (allongé, avec serviette)",
    "Étirement des fessiers (allongé)", "Étirement des quadriceps (allongé sur le côté)", "Torsion du dos (allongé)", "Genoux contre la poitrine"].map(C_) };

function construireDefi(prefixe, niveau, jours, test, final) {
  const fiches = [];
  for (let n = 1; n <= 28; n++) { const k = Math.floor((n - 1) / 7), base = jours[(n - 1) % 7](k); fiches.push({ ...base, jour: n, semaine: k + 1 }); }
  fiches.push({ ...test, jour: 29, semaine: 5 }, { ...final, jour: 30, semaine: 5 });
  fiches.forEach(f => Object.assign(f, { id: prefixe + String(f.jour).padStart(2, "0"), univers: "cali", cat: "defi", lieu: "maison", defi: niveau,
    niveau: niveau === 1 ? (f.semaine === 1 ? 1 : f.semaine >= 4 ? 3 : 2) : 3, titre: `Jour ${f.jour} · ${f.titre}` }));
  return fiches;
}

// ---------------- Niveau 1 : les bases ----------------
const DEFI_CALI = (() => { const S = S_, C = C_, w = w_, series = (k) => k < 2 ? 3 : 4;
  return construireDefi("cali-", 1, [
    (k) => ({ type: "series", titre: "Poussée et tirage",
      note: k === 0 ? "Avant de commencer : faites le maximum de pompes (genoux au sol si besoin) et de tractions, et notez-le. On comparera au jour 29. Trop dur ? Pompes genoux au sol. Pas de barre ? Rowing sous une table (voir « Comment faire »)." : "Gardez de bonnes répétitions propres plutôt que beaucoup de mauvaises.",
      exos: [S(k === 0 ? "Pompes inclinées (mains sur une chaise)" : "Pompes", series(k), w(["10", "10", "12", "15"], k), 75), S("Tractions (barre de porte)", series(k), w(["3 à 5", "4 à 6", "5 à 7", "6 à 8"], k), 90),
        S("Dips sur chaise", series(k), w(["8", "10", "12", "15"], k), 60), S("Pompes diamant", 3, w(["5", "6", "8", "10"], k), 60), S("Planche", 3, w(["30 s", "40 s", "50 s", "60 s"], k), 45)] }),
    (k) => ({ type: "series", titre: "Jambes et gainage", note: "Descendez lentement à chaque répétition : c'est là que la force se construit.",
      exos: [S("Squats", series(k), w(["15", "20", "25", "30"], k), 60), S("Fentes alternées", series(k), w(["10 / jambe", "12 / jambe", "14 / jambe", "16 / jambe"], k), 60),
        S("Pont fessier sur une jambe", 3, w(["10 / jambe", "12 / jambe", "14 / jambe", "15 / jambe"], k), 45), S("Chaise contre le mur", 3, w(["30 s", "40 s", "50 s", "60 s"], k), 45),
        S("Relevés de jambes", 3, w(["10", "12", "14", "15"], k), 45), S("Gainage latéral", 3, w(["20 s / côté", "30 s / côté", "35 s / côté", "45 s / côté"], k), 30)] }),
    (k) => ({ type: "circuit", titre: "Full body en circuit", travail: [30, 35, 40, 45][k], repos: [30, 25, 20, 15][k], tours: k < 2 ? 3 : 4, pause: 60,
      note: "Enchaînez les exercices, le minuteur s'occupe du reste. Sans sauter : prenez les versions « sans sauter » de « Comment faire ».",
      exos: ["Burpees", "Pompes", "Squats sautés", "Mountain climbers", "Superman (allongé sur le ventre)", "Planche"].map(C) }),
    (k) => ({ type: "series", titre: "Haut du corps : variations", note: "Pas de barre ? Remplacez les tractions par le rowing sous une table.",
      exos: [S("Pompes larges", series(k), w(["8", "10", "12", "14"], k), 75), S("Tractions (barre de porte)", series(k), w(["3 à 5", "4 à 6", "5 à 7", "6 à 8"], k), 90),
        S("Pompes déclinées (pieds sur une chaise)", 3, w(["6", "8", "10", "12"], k), 75), S("Dips sur chaise", 3, w(["8", "10", "12", "15"], k), 60),
        S("Pompe + gainage latéral", 3, w(["6", "8", "8", "10"], k), 60), S("Dead bug", 3, w(["8 / côté", "10 / côté", "12 / côté", "12 / côté"], k), 30)] }),
    (k) => ({ type: "series", titre: "Jambes explosives et abdos", note: "Atterrissez en douceur sur les sauts. Genoux fragiles ? Prenez les versions sans saut.",
      exos: [S("Fentes bulgares (pied sur une chaise)", series(k), w(["8 / jambe", "10 / jambe", "12 / jambe", "12 / jambe"], k), 75), S("Squats sautés", 3, w(["10", "12", "15", "15"], k), 60),
        S("Fentes sautées", 3, w(["20 s", "30 s", "30 s", "40 s"], k), 60), S("Mollets debout", 3, w(["20", "25", "25", "30"], k), 30),
        S("Crunch inversé", 3, w(["12", "15", "15", "20"], k), 30), S("Russian twist", 3, w(["20", "24", "30", "30"], k), 30)] }),
    (k) => ({ type: "series", titre: "Force : les 4 classiques", note: "Les 4 mouvements de base de la calisthenics. Prenez bien vos temps de repos.",
      exos: [S("Pompes", series(k), w(["12", "14", "16", "18"], k), 90), S("Tractions (barre de porte)", series(k), w(["max - 1", "max - 1", "max", "max"], k), 120),
        S("Squats", series(k), w(["20", "25", "30", "35"], k), 60), S("Dips sur chaise", series(k), w(["10", "12", "15", "18"], k), 75), S("Planche", 3, w(["40 s", "50 s", "60 s", "75 s"], k), 45)] }),
    () => RECUP_CALI,
  ], { type: "series", titre: "Test final : votre maximum",
    note: "Le maximum de répétitions propres sur chaque exercice, une seule série, avec 3 minutes de repos entre deux. Comparez avec le jour 1 !",
    exos: [S("Pompes", 1, "max", 180), S("Tractions (barre de porte)", 1, "max", 180), S("Squats", 1, "max (2 min)", 180), S("Dips sur chaise", 1, "max", 180), S("Planche", 1, "max", 0)] },
  { type: "circuit", titre: "Grand final", travail: 45, repos: 15, tours: 4, pause: 60, note: "Le dernier jour : on donne tout. Bravo pour ces 30 jours ! Le niveau 2 s'ouvre quand les 30 jours sont faits.",
    exos: ["Burpees", "Pompes", "Squats sautés", "Dips sur chaise", "Mountain climbers", "Fentes alternées", "Planche"].map(C) });
})();

// ---------------- Niveau 2 : plus dur (après le niveau 1) ----------------
// Plus de séries, plus de répétitions, moins de repos, et des descentes lentes (3 secondes) pour plus de travail musculaire.
const DEFI_CALI2 = (() => { const S = S_, C = C_, w = w_, series = (k) => k < 2 ? 4 : 5;
  const lent = "Descendez lentement en 3 secondes à chaque répétition, puis remontez normalement : c'est ce qui fait travailler le muscle.";
  return construireDefi("cali2-", 2, [
    (k) => ({ type: "series", titre: "Poussée lourde", note: k === 0 ? "Bienvenue au niveau 2 ! Avant de commencer, refaites votre maximum de pompes et de tractions et notez-le. " + lent : lent,
      exos: [S("Pompes déclinées (pieds sur une chaise)", series(k), w(["10", "12", "14", "15"], k), 75), S("Tractions (barre de porte)", series(k), w(["5 à 7", "6 à 8", "7 à 9", "8 à 10"], k), 90),
        S("Dips sur chaise", series(k), w(["12", "15", "18", "20"], k), 60), S("Pompes diamant", 3, w(["10", "12", "14", "15"], k), 60), S("Planche", 3, w(["60 s", "75 s", "90 s", "90 s"], k), 45)] }),
    (k) => ({ type: "series", titre: "Jambes : force sur une jambe", note: "Une jambe à la fois : c'est plus dur, et ça corrige les différences entre la droite et la gauche. " + lent,
      exos: [S("Fentes bulgares (pied sur une chaise)", series(k), w(["10 / jambe", "12 / jambe", "14 / jambe", "15 / jambe"], k), 75), S("Pont fessier sur une jambe", 4, w(["15 / jambe", "15 / jambe", "18 / jambe", "20 / jambe"], k), 45),
        S("Squats", 4, w(["30", "35", "40", "40"], k), 60), S("Chaise contre le mur", 3, w(["60 s", "75 s", "90 s", "90 s"], k), 45),
        S("Mollets debout", 4, w(["25", "30", "30", "35"], k), 30), S("Relevés de jambes", 3, w(["15", "18", "20", "20"], k), 45)] }),
    (k) => ({ type: "circuit", titre: "HIIT au poids du corps", travail: [40, 45, 45, 50][k], repos: [20, 15, 15, 10][k], tours: 4, pause: 60,
      note: "Effort à fond, repos court. Sans sauter : prenez les versions « sans sauter » de « Comment faire ».",
      exos: ["Burpees", "Pompes larges", "Fentes sautées", "Mountain climbers", "Squats sautés", "Planche"].map(C) }),
    (k) => ({ type: "series", titre: "Haut du corps : volume", note: "Beaucoup de répétitions, peu de repos : c'est ce qui fait grossir le muscle. Pas de barre ? Rowing sous une table.",
      exos: [S("Pompes larges", series(k), w(["15", "16", "18", "20"], k), 60), S("Tractions (barre de porte)", series(k), w(["max - 2", "max - 2", "max - 1", "max - 1"], k), 90),
        S("Pompe + gainage latéral", 4, w(["10", "10", "12", "12"], k), 60), S("Dips sur chaise", 4, w(["12", "15", "15", "18"], k), 60),
        S("Superman (allongé sur le ventre)", 3, w(["15", "18", "20", "20"], k), 30), S("Pompes", 2, "max", 90)] }),
    (k) => ({ type: "series", titre: "Abdos et gainage avancés", note: "Gardez le bas du dos collé au sol sur tous les exercices allongés.",
      exos: [S("Crunch pieds levés (toucher les pieds)", 4, w(["15", "18", "20", "20"], k), 30), S("Ciseaux (battements de jambes)", 4, w(["30 s", "40 s", "45 s", "50 s"], k), 30),
        S("Russian twist", 4, w(["30", "30", "40", "40"], k), 30), S("Gainage latéral", 3, w(["45 s / côté", "50 s / côté", "60 s / côté", "60 s / côté"], k), 30),
        S("Bicycle crunch", 3, w(["20", "24", "30", "30"], k), 30), S("Squats sautés", 3, w(["15", "15", "20", "20"], k), 60)] }),
    (k) => ({ type: "series", titre: "Force max : les 4 classiques", note: "5 séries sur chaque mouvement de base. Prenez bien vos temps de repos. " + lent,
      exos: [S("Pompes", 5, w(["15", "16", "18", "20"], k), 90), S("Tractions (barre de porte)", 5, w(["max - 1", "max - 1", "max", "max"], k), 120),
        S("Squats", 5, w(["35", "40", "45", "50"], k), 60), S("Dips sur chaise", 5, w(["15", "16", "18", "20"], k), 75), S("Planche", 3, w(["75 s", "90 s", "90 s", "2 min"], k), 45)] }),
    () => RECUP_CALI,
  ], { type: "series", titre: "Test final niveau 2",
    note: "Votre maximum sur chaque exercice, une seule série, 3 minutes de repos entre deux. Comparez avec le jour 1 du niveau 2… et avec le jour 1 du niveau 1 !",
    exos: [S("Pompes", 1, "max", 180), S("Tractions (barre de porte)", 1, "max", 180), S("Squats", 1, "max (2 min)", 180), S("Dips sur chaise", 1, "max", 180), S("Planche", 1, "max", 0)] },
  { type: "circuit", titre: "Grand final niveau 2", travail: 50, repos: 10, tours: 5, pause: 60, note: "60 jours d'entraînement : bravo ! Continuez à votre rythme pour garder vos progrès.",
    exos: ["Burpees", "Pompes déclinées (pieds sur une chaise)", "Squats sautés", "Dips sur chaise", "Mountain climbers", "Fentes sautées", "Planche"].map(C) });
})();

// ---------------- Où en est la personne ? ----------------
// niveau 1 ou 2 → { liste, faits (Set des ids), prochain (fiche ou null), fini, ouvert, aujourdhui (une séance du défi faite aujourd'hui) }
function etatDefi(niveau) {
  const r = Compte.donnees.reglages, cle = niveau === 1 ? "defiCali" : "defiCali2", liste = niveau === 1 ? DEFI_CALI : DEFI_CALI2, pre = niveau === 1 ? "cali-" : "cali2-";
  const debut = r[cle] && r[cle].debut;
  const hist = (Compte.donnees.historique || []).filter(h => h.id && h.id.startsWith(pre) && (!debut || new Date(h.date) >= new Date(debut)));
  const faits = new Set(hist.map(h => h.id)), fini = liste.every(f => faits.has(f.id));
  // le niveau 2 s'ouvre quand les 30 jours du niveau 1 sont faits (et reste ouvert ensuite)
  if (niveau === 1 && fini && !(r.defiCali2 && r.defiCali2.ouvert)) { r.defiCali2 = { ...(r.defiCali2 || {}), ouvert: new Date().toISOString() }; Compte.sauver(); }
  const ouvert = niveau === 1 || !!(r.defiCali2 && r.defiCali2.ouvert);
  return { niveau, liste, faits, fini, ouvert, prochain: liste.find(f => !faits.has(f.id)) || null, commence: faits.size > 0,
    aujourdhui: hist.some(h => new Date(h.date).toDateString() === new Date().toDateString()) };
}
// Le défi en cours (niveau 2 s'il est ouvert et commencé ou si le niveau 1 est fini), pour le coach nutrition
function defiEnCours() {
  const e1 = etatDefi(1); if (!e1.fini) return e1.commence ? e1 : null;
  const e2 = etatDefi(2); return e2.fini ? null : e2;
}
UNIVERS.cali = { nom: "Calisthenics", categories: [] };
FICHES.push(...DEFI_CALI, ...DEFI_CALI2);
