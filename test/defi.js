// Défi Calisthenics 30 jours : au poids du corps, à la maison ou dehors.
// 4 semaines qui montent progressivement (6 jours d'entraînement + 1 jour de récupération), puis test final et grand final.
// Chaque jour est une vraie séance (FICHES « cali-01 » à « cali-30 »), lancée avec le minuteur comme les autres.
const DEFI_CALI = (() => {
  const S = (nom, series, reps, repos) => ({ nom, series, reps, repos });
  const C = (nom) => ({ nom });
  const w = (arr, k) => arr[Math.min(k, arr.length - 1)];          // valeur selon la semaine (0 à 3)
  const series = (k) => k < 2 ? 3 : 4;
  const recup = { type: "circuit", titre: "Récupération active", travail: 40, repos: 10, tours: 1, pause: 0,
    note: "Jour léger : on étire tout le corps pour récupérer. Bien respirer, ne jamais forcer.",
    exos: ["Dos rond, dos creux (chat)", "Posture de l'enfant (dos)", "Étirement des hanches (fente au sol)", "Étirement des ischios (allongé, avec serviette)",
      "Étirement des fessiers (allongé)", "Étirement des quadriceps (allongé sur le côté)", "Torsion du dos (allongé)", "Genoux contre la poitrine"].map(C) };
  const jours = [
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
    (k) => ({ type: "series", titre: "Haut du corps : variations",
      note: "Pas de barre ? Remplacez les tractions par le rowing sous une table.",
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
    () => recup,
  ];
  const fiches = [];
  for (let n = 1; n <= 28; n++) { const k = Math.floor((n - 1) / 7), base = jours[(n - 1) % 7](k); fiches.push({ ...base, jour: n, semaine: k + 1 }); }
  fiches.push({ jour: 29, semaine: 5, type: "series", titre: "Test final : votre maximum",
    note: "Le maximum de répétitions propres sur chaque exercice, une seule série, avec 3 minutes de repos entre deux. Comparez avec le jour 1 !",
    exos: [S("Pompes", 1, "max", 180), S("Tractions (barre de porte)", 1, "max", 180), S("Squats", 1, "max (2 min)", 180), S("Dips sur chaise", 1, "max", 180), S("Planche", 1, "max", 0)] });
  fiches.push({ jour: 30, semaine: 5, type: "circuit", titre: "Grand final", travail: 45, repos: 15, tours: 4, pause: 60,
    note: "Le dernier jour : on donne tout. Bravo pour ces 30 jours !",
    exos: ["Burpees", "Pompes", "Squats sautés", "Dips sur chaise", "Mountain climbers", "Fentes alternées", "Planche"].map(C) });
  fiches.forEach(f => Object.assign(f, { id: "cali-" + String(f.jour).padStart(2, "0"), univers: "cali", cat: "defi", lieu: "maison", niveau: f.semaine === 1 ? 1 : f.semaine >= 4 ? 3 : 2,
    titre: `Jour ${f.jour} · ${f.titre}` }));
  return fiches;
})();
UNIVERS.cali = { nom: "Calisthenics", categories: [] };
FICHES.push(...DEFI_CALI);
