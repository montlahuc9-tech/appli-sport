// Fiches toutes prêtes : rangées par lieu (maison / salle), puis par groupe.
// Les noms d'exercices correspondent à la bibliothèque (exercices.js) : photo et muscles viennent de là.
const GROUPES = {
  haut:   { nom: "Haut du corps",      muscles: ["pecs", "epaules", "dos"] },
  bras:   { nom: "Bras",               muscles: ["biceps", "triceps", "avbras"] },
  bas:    { nom: "Bas du corps",       muscles: ["quadri", "ischios", "fessiers", "mollets"] },
  abdos:  { nom: "Abdos et lombaires", muscles: ["abdos", "lombaires"] },
  cardio: { nom: "Cardio",             muscles: ["cardio"] },
  etirements: { nom: "Étirements",     muscles: ["etirements"] }
};
const MUSCLES = {
  pecs: "Pectoraux", epaules: "Épaules", dos: "Dos", biceps: "Biceps", triceps: "Triceps", avbras: "Avant-bras",
  quadri: "Quadriceps", ischios: "Ischios", fessiers: "Fessiers", mollets: "Mollets", abdos: "Abdos", lombaires: "Lombaires", cardio: "Cardio", etirements: "Étirements"
};
const groupeDuMuscle = (m) => Object.keys(GROUPES).find(g => GROUPES[g].muscles.includes(m)) || "cardio";

// serie_(nom, séries, reps, repos) pour une fiche en séries ; circ_(nom) pour un circuit
const serie_ = (nom, series, reps, repos) => ({ nom, series, reps, repos });
const circ_ = (nom) => ({ nom });

const FICHES = [
  // ---------------- MAISON ----------------
  { id: "m-haut-1", lieu: "maison", groupe: "haut", type: "circuit", titre: "Haut du corps sans matériel",
    note: "Aucun matériel, juste une chaise.", travail: 40, repos: 20, tours: 3, pause: 60,
    exos: [circ_("Pompes"), circ_("Superman (allongé sur le ventre)"), circ_("Pompes larges"), circ_("Pompes déclinées (pieds sur une chaise)"), circ_("Pompes inclinées (mains sur une chaise)")] },
  { id: "m-haut-2", lieu: "maison", groupe: "haut", type: "series", titre: "Pecs, épaules et dos (haltères)",
    note: "Deux haltères. Notez vos poids pour progresser.",
    exos: [serie_("Développé haltères au sol", 4, "12", 60), serie_("Rowing haltère", 4, "10 / bras", 60), serie_("Développé épaules haltères", 3, "12", 60),
           serie_("Élévations latérales haltères", 3, "15", 45), serie_("Pull-over haltère", 3, "12", 60), serie_("Oiseau haltères (buste penché)", 3, "15", 45)] },

  { id: "m-bras-1", lieu: "maison", groupe: "bras", type: "series", titre: "Biceps et triceps (haltères)",
    note: "On alterne biceps et triceps pour récupérer plus vite.",
    exos: [serie_("Curl biceps haltères", 3, "12", 45), serie_("Extension triceps haltère", 3, "12", 45), serie_("Curl marteau", 3, "12", 45),
           serie_("Kickback triceps haltère", 3, "12 / bras", 45), serie_("Curl concentré", 3, "10 / bras", 45), serie_("Dips sur chaise", 3, "12", 60)] },
  { id: "m-bras-2", lieu: "maison", groupe: "bras", type: "circuit", titre: "Triceps et avant-bras express",
    note: "Une chaise et un haltère léger.", travail: 30, repos: 15, tours: 3, pause: 45,
    exos: [circ_("Dips sur chaise"), circ_("Curl poignets paumes vers le haut"), circ_("Pompes diamant"), circ_("Curl poignets paumes vers le bas"), circ_("Rotations de poignets")] },

  { id: "m-bas-1", lieu: "maison", groupe: "bas", type: "circuit", titre: "Jambes sans matériel",
    note: "Gardez le dos droit et les genoux dans l'axe des pieds.", travail: 40, repos: 20, tours: 4, pause: 60,
    exos: [circ_("Squats"), circ_("Fentes alternées"), circ_("Pont fessier"), circ_("Chaise contre le mur"), circ_("Mollets debout")] },
  { id: "m-bas-2", lieu: "maison", groupe: "bas", type: "series", titre: "Cuisses et fessiers (haltère)",
    note: "Un haltère ou une bouteille d'eau suffit pour commencer.",
    exos: [serie_("Goblet squat (haltère)", 4, "12", 60), serie_("Fentes bulgares (pied sur une chaise)", 3, "10 / jambe", 60), serie_("Hip thrust (dos sur le canapé)", 4, "15", 60),
           serie_("Soulevé de terre jambes tendues (haltères)", 3, "12", 60), serie_("Pont fessier sur une jambe", 3, "12 / jambe", 45), serie_("Mollets sur une jambe (haltère)", 3, "15 / jambe", 45)] },

  { id: "m-abdos-1", lieu: "maison", groupe: "abdos", type: "circuit", titre: "Abdos et gainage",
    note: "Sur un tapis. Gardez le bas du dos plaqué au sol.", travail: 30, repos: 15, tours: 3, pause: 45,
    exos: [circ_("Crunchs"), circ_("Planche"), circ_("Russian twist"), circ_("Relevés de jambes"), circ_("Gainage latéral"), circ_("Bicycle crunch")] },
  { id: "m-abdos-2", lieu: "maison", groupe: "abdos", type: "circuit", titre: "Dos solide (lombaires)",
    note: "Idéal si vous restez assis toute la journée. Mouvements lents et contrôlés.", travail: 30, repos: 20, tours: 3, pause: 45,
    exos: [circ_("Superman (allongé sur le ventre)"), circ_("Dead bug"), circ_("Extension lombaire au sol"), circ_("Planche"), circ_("Pont fessier"), circ_("Gainage latéral")] },

  { id: "m-cardio-1", lieu: "maison", groupe: "cardio", type: "circuit", titre: "Cardio HIIT",
    note: "Ça monte vite : buvez de l'eau et ralentissez si besoin.", travail: 40, repos: 20, tours: 3, pause: 60,
    exos: [circ_("Jumping jacks"), circ_("Burpees"), circ_("Montées de genoux"), circ_("Mountain climbers"), circ_("Squats sautés"), circ_("Fentes sautées")] },
  { id: "m-cardio-2", lieu: "maison", groupe: "cardio", type: "circuit", titre: "Tabata 4 minutes",
    note: "20 s à fond, 10 s de repos, 8 fois. Court mais intense.", travail: 20, repos: 10, tours: 4, pause: 10,
    exos: [circ_("Mountain climbers"), circ_("Jumping jacks")] },

  // ---------------- SALLE ----------------
  { id: "s-haut-1", lieu: "salle", groupe: "haut", type: "series", titre: "Pecs et épaules (poussée)",
    note: "Échauffez-vous avec 2 séries légères au développé couché.",
    exos: [serie_("Développé couché", 4, "8", 120), serie_("Développé incliné haltères", 3, "10", 90), serie_("Écarté à la poulie", 3, "12", 60),
           serie_("Développé militaire", 3, "10", 90), serie_("Élévations latérales à la poulie", 3, "15", 45), serie_("Pec deck (machine papillon)", 3, "12", 60)] },
  { id: "s-haut-2", lieu: "salle", groupe: "haut", type: "series", titre: "Dos (tirage)",
    note: "Tirez avec le dos, pas avec les bras : coudes vers les hanches.",
    exos: [serie_("Tractions", 4, "8", 120), serie_("Tirage vertical", 4, "10", 90), serie_("Rowing barre", 4, "8", 120),
           serie_("Tirage horizontal", 3, "12", 60), serie_("Face pull", 3, "15", 60), serie_("Shrugs à la barre (trapèzes)", 3, "12", 60)] },

  { id: "s-bras-1", lieu: "salle", groupe: "bras", type: "series", titre: "Biceps et triceps",
    note: "Pas d'élan : le mouvement doit rester propre.",
    exos: [serie_("Curl barre", 3, "10", 60), serie_("Extension triceps poulie", 3, "12", 60), serie_("Curl pupitre", 3, "12", 60),
           serie_("Barre au front", 3, "10", 60), serie_("Curl à la poulie", 3, "12", 60), serie_("Dips (buste droit)", 3, "10", 90)] },
  { id: "s-bras-2", lieu: "salle", groupe: "bras", type: "series", titre: "Avant-bras et poigne",
    note: "À faire en fin de séance : la poigne est fatiguée ensuite.",
    exos: [serie_("Curl poignets à la barre", 3, "15", 45), serie_("Curl poignets à la poulie", 3, "15", 45), serie_("Enrouleur de poignets", 3, "2 allers-retours", 60), serie_("Marche du fermier", 3, "30 m", 90)] },

  { id: "s-bas-1", lieu: "salle", groupe: "bas", type: "series", titre: "Jambes complètes",
    note: "La plus dure : buvez bien et prenez vos temps de repos.",
    exos: [serie_("Squat barre", 4, "8", 120), serie_("Presse à cuisses", 3, "12", 90), serie_("Leg curl allongé", 3, "12", 60),
           serie_("Leg extension", 3, "12", 60), serie_("Fentes marchées haltères", 3, "10 / jambe", 90), serie_("Mollets à la machine", 4, "15", 45)] },
  { id: "s-bas-2", lieu: "salle", groupe: "bas", type: "series", titre: "Fessiers et ischios",
    note: "Serrez les fessiers en haut de chaque mouvement.",
    exos: [serie_("Hip thrust à la barre", 4, "10", 90), serie_("Soulevé de terre roumain", 4, "8", 120), serie_("Leg curl assis", 3, "12", 60),
           serie_("Kickback fessier à la poulie", 3, "12 / jambe", 60), serie_("Machine abducteurs", 3, "15", 60), serie_("Mollets assis", 3, "15", 45)] },

  { id: "s-abdos-1", lieu: "salle", groupe: "abdos", type: "series", titre: "Abdos à la salle",
    note: "Expirez en contractant, sans tirer sur la nuque.",
    exos: [serie_("Relevés de jambes suspendu", 3, "12", 60), serie_("Crunch à la poulie", 3, "15", 45), serie_("Roue abdominale", 3, "10", 60),
           serie_("Crunch à la machine", 3, "15", 45), serie_("Planche", 3, "45 s", 30)] },
  { id: "s-abdos-2", lieu: "salle", groupe: "abdos", type: "series", titre: "Lombaires et gainage",
    note: "Charges légères au début : le bas du dos se renforce doucement.",
    exos: [serie_("Banc à lombaires", 3, "15", 60), serie_("Good morning à la barre", 3, "10", 90), serie_("Planche", 3, "45 s", 30),
           serie_("Gainage latéral", 3, "30 s / côté", 30), serie_("Dead bug", 3, "10 / côté", 30)] },

  { id: "s-cardio-1", lieu: "salle", groupe: "cardio", type: "circuit", titre: "Circuit cardio salle",
    note: "Enchaînez les postes de la salle. Musique à fond !", travail: 45, repos: 15, tours: 4, pause: 90,
    exos: [circ_("Rameur"), circ_("Kettlebell swing"), circ_("Box jump"), circ_("Battle rope"), circ_("Wall ball")] },
  { id: "s-cardio-2", lieu: "salle", groupe: "cardio", type: "circuit", titre: "Cardio machines (endurance)",
    note: "5 minutes par machine, rythme où vous pouvez encore parler.", travail: 300, repos: 30, tours: 2, pause: 60,
    exos: [circ_("Rameur"), circ_("Vélo"), circ_("Tapis de course"), circ_("Vélo elliptique")] }
];

// ---------------- SÉANCES FEMMES (choix « Femme » en haut de l'écran Séances) ----------------
FICHES.push(
  { id: "f-m-fessiers", public: "femmes", lieu: "maison", groupe: "bas", type: "circuit", titre: "Fessiers galbés",
    note: "Sans matériel, juste une chaise pour se tenir. Serrez bien les fessiers en haut de chaque mouvement.", travail: 40, repos: 20, tours: 3, pause: 60,
    exos: [circ_("Pont fessier"), circ_("Kickback fessier à quatre pattes"), circ_("Élévation latérale de jambe (debout)"), circ_("Squats"), circ_("Fentes croisées arrière"), circ_("Élévation de jambe arrière debout")] },
  { id: "f-m-jambes", public: "femmes", lieu: "maison", groupe: "bas", type: "circuit", titre: "Cuisses et jambes",
    note: "Pour affiner et raffermir les jambes. Un haltère ou une bouteille d'eau pour le squat sumo.", travail: 40, repos: 20, tours: 3, pause: 60,
    exos: [circ_("Squat sumo (haltère)"), circ_("Fentes alternées"), circ_("Chaise contre le mur"), circ_("Montée sur chaise + genou levé"), circ_("Pont fessier sur une jambe"), circ_("Mollets debout")] },
  { id: "f-m-ventre", public: "femmes", lieu: "maison", groupe: "abdos", type: "circuit", titre: "Ventre plat et gainage",
    note: "Sur un tapis. Rentrez le nombril et gardez le bas du dos plaqué au sol.", travail: 30, repos: 15, tours: 3, pause: 45,
    exos: [circ_("Planche"), circ_("Crunch inversé"), circ_("Bicycle crunch"), circ_("Gainage latéral"), circ_("Ciseaux (battements de jambes)"), circ_("Crunch pieds levés (toucher les pieds)")] },
  { id: "f-m-bras", public: "femmes", lieu: "maison", groupe: "bras", type: "series", titre: "Bras toniques",
    note: "Des haltères légers (1 à 3 kg) suffisent. Mouvements lents et contrôlés.",
    exos: [serie_("Pompes inclinées (mains sur une chaise)", 3, "10", 45), serie_("Dips sur chaise", 3, "10", 45), serie_("Curl biceps haltères", 3, "15", 45),
           serie_("Kickback triceps haltère", 3, "15 / bras", 45), serie_("Élévations latérales haltères", 3, "15", 45), serie_("Extension triceps haltère", 3, "15", 45)] },
  { id: "f-m-cardio", public: "femmes", lieu: "maison", groupe: "cardio", type: "circuit", titre: "Cardio sans sauts (appartement)",
    note: "Aucun saut : idéal en appartement, sans déranger les voisins, et doux pour les genoux.", travail: 40, repos: 20, tours: 3, pause: 60,
    exos: [circ_("Marche rapide sur place (sans sauter)"), circ_("Squats"), circ_("Mountain climbers"), circ_("Montée sur chaise + genou levé"), circ_("Fentes alternées"), circ_("Planche")] },
  { id: "f-m-debutante", public: "femmes", lieu: "maison", groupe: "cardio", type: "circuit", titre: "Full body débutante",
    note: "Pour (re)commencer en douceur : 30 secondes d'effort, 30 secondes de repos.", travail: 30, repos: 30, tours: 3, pause: 60,
    exos: [circ_("Squats"), circ_("Pompes inclinées (mains sur une chaise)"), circ_("Pont fessier"), circ_("Superman (allongé sur le ventre)"), circ_("Planche"), circ_("Jumping jacks")] },

  { id: "f-m-haut", public: "femmes", lieu: "maison", groupe: "haut", type: "series", titre: "Dos et épaules (posture)",
    note: "Pour se tenir droite et avoir de jolies épaules. Deux haltères légers.",
    exos: [serie_("Rowing deux haltères", 3, "12", 45), serie_("Oiseau haltères (buste penché)", 3, "15", 45), serie_("Développé épaules haltères", 3, "12", 45),
           serie_("Élévations latérales haltères", 3, "15", 45), serie_("Superman (allongé sur le ventre)", 3, "12", 30), serie_("Pompes inclinées (mains sur une chaise)", 3, "10", 45)] },

  { id: "f-s-fessiers", public: "femmes", lieu: "salle", groupe: "bas", type: "series", titre: "Fessiers (salle)",
    note: "La séance fessiers complète. Commencez léger au hip thrust pour bien sentir le mouvement.",
    exos: [serie_("Hip thrust à la barre", 4, "10", 90), serie_("Pull-through à la poulie", 3, "12", 60), serie_("Kickback fessier à la poulie", 3, "12 / jambe", 60),
           serie_("Machine abducteurs", 3, "15", 60), serie_("Soulevé de terre roumain", 3, "10", 90), serie_("Fentes marchées haltères", 3, "10 / jambe", 90)] },
  { id: "f-s-jambes", public: "femmes", lieu: "salle", groupe: "bas", type: "series", titre: "Jambes et intérieur des cuisses",
    note: "Cuisses, intérieur des cuisses et fessiers. Buvez bien entre les séries.",
    exos: [serie_("Presse à cuisses", 4, "12", 90), serie_("Soulevé de terre sumo", 3, "10", 90), serie_("Machine adducteurs (intérieur des cuisses)", 3, "15", 60),
           serie_("Leg curl assis", 3, "12", 60), serie_("Step-up sur banc (haltères)", 3, "10 / jambe", 60), serie_("Mollets à la machine", 3, "15", 45)] },
  { id: "f-s-haut", public: "femmes", lieu: "salle", groupe: "haut", type: "series", titre: "Haut du corps tonique",
    note: "Dos, épaules et bras, pour une jolie posture. Charges modérées, 12 à 15 répétitions.",
    exos: [serie_("Tirage vertical", 3, "12", 60), serie_("Tirage horizontal", 3, "12", 60), serie_("Développé incliné haltères", 3, "12", 60),
           serie_("Élévations latérales à la poulie", 3, "15", 45), serie_("Extension triceps poulie", 3, "15", 45), serie_("Curl à la poulie", 3, "15", 45)] },
  { id: "f-s-bras", public: "femmes", lieu: "salle", groupe: "bras", type: "series", titre: "Bras toniques (salle)",
    note: "Charges légères, 15 répétitions. Idéal en fin de séance.",
    exos: [serie_("Curl à la poulie", 3, "15", 45), serie_("Extension triceps poulie", 3, "15", 45), serie_("Curl biceps haltères", 3, "12", 45),
           serie_("Kickback triceps haltère", 3, "12 / bras", 45), serie_("Dips (buste droit)", 3, "8", 60)] },
  { id: "f-s-abdos", public: "femmes", lieu: "salle", groupe: "abdos", type: "series", titre: "Abdos et taille",
    note: "Ventre, côtés et bas du dos.",
    exos: [serie_("Relevés de jambes suspendu", 3, "10", 60), serie_("Crunch à la poulie", 3, "15", 45), serie_("Russian twist", 3, "20", 30),
           serie_("Planche", 3, "45 s", 30), serie_("Gainage latéral", 3, "30 s / côté", 30), serie_("Banc à lombaires", 3, "12", 45)] },
  { id: "f-s-cardio", public: "femmes", lieu: "salle", groupe: "cardio", type: "circuit", titre: "Cardio brûle-calories",
    note: "2 minutes par poste, à un rythme soutenu mais où vous pouvez encore parler.", travail: 120, repos: 30, tours: 3, pause: 60,
    exos: [circ_("Vélo elliptique"), circ_("Rameur"), circ_("Kettlebell swing"), circ_("Tapis de course"), circ_("Step-up sur banc (haltères)")] }
);

// ---------------- RUNNING et MARCHE SPORTIVE (espaces à part, pour tout le monde) ----------------
// Dans un circuit, « duree » sur un exercice remplace le temps d'effort commun (ex. 3 min de marche, 1 min rapide).
const UNIVERS = {
  running: { nom: "Running", categories: [["fractionne", "Fractionné et endurance"], ["echauffement", "Échauffement"], ["renfo", "Renforcement du coureur"], ["etirements", "Étirements"]] },
  marche:  { nom: "Marche sportive", categories: [["marche", "Marche active"], ["renfo", "Renforcement et équilibre"], ["etirements", "Étirements"]] }
};
const d_ = (nom, duree) => ({ nom, duree });
FICHES.push(
  // ---- Running ----
  { id: "r-frac-1", univers: "running", cat: "fractionne", lieu: "exterieur", type: "circuit", titre: "Fractionné débutant",
    note: "1 minute de footing lent, puis 30 secondes de course rapide. Téléphone en poche : la voix annonce chaque changement.", travail: 30, repos: 0, tours: 8, pause: 0,
    exos: [d_("Footing lent (récupération)", 60), d_("Course rapide", 30)] },
  { id: "r-frac-2", univers: "running", cat: "fractionne", lieu: "exterieur", type: "circuit", titre: "Fractionné 30/30",
    note: "Le classique pour progresser en vitesse : 30 s lent, 30 s vite, 10 fois. Échauffez-vous 10 minutes avant.", travail: 30, repos: 0, tours: 10, pause: 0,
    exos: [d_("Footing lent (récupération)", 30), d_("Course rapide", 30)] },
  { id: "r-frac-3", univers: "running", cat: "fractionne", lieu: "exterieur", type: "circuit", titre: "Fractionné long (confirmé)",
    note: "1 min 30 de footing lent, puis 3 minutes à allure soutenue, 5 fois.", travail: 180, repos: 0, tours: 5, pause: 0,
    exos: [d_("Footing lent (récupération)", 90), d_("Course rapide", 180)] },
  { id: "r-endurance", univers: "running", cat: "fractionne", lieu: "exterieur", type: "circuit", titre: "Footing + accélérations",
    note: "4 minutes de footing tranquille puis 20 secondes d'accélération, 6 fois. Idéal pour améliorer l'endurance.", travail: 240, repos: 0, tours: 6, pause: 0,
    exos: [d_("Footing (allure tranquille)", 240), d_("Course rapide", 20)] },
  { id: "r-echauffement", univers: "running", cat: "echauffement", lieu: "exterieur", type: "circuit", titre: "Échauffement avant course",
    note: "5 minutes pour réveiller chevilles, hanches et jambes avant de courir.", travail: 30, repos: 10, tours: 1, pause: 0,
    exos: [circ_("Cercles de chevilles"), circ_("Cercles de hanches"), circ_("Montées de genoux"), circ_("Talons-fesses"), circ_("Skipping (genoux hauts rapides)"), circ_("Pas croisés (carioca)"), circ_("Marche des mains (inchworm)")] },
  { id: "r-renfo", univers: "running", cat: "renfo", lieu: "maison", type: "circuit", titre: "Renforcement du coureur",
    note: "2 fois par semaine, à la maison : protège les genoux et les chevilles et rend la foulée plus efficace.", travail: 40, repos: 20, tours: 3, pause: 60,
    exos: [circ_("Squats"), circ_("Fentes alternées"), circ_("Mollets debout"), circ_("Pont fessier sur une jambe"), circ_("Planche"), circ_("Gainage latéral"), circ_("Montées sur une chaise")] },
  { id: "r-pieds", univers: "running", cat: "renfo", lieu: "maison", type: "series", titre: "Mollets, chevilles et pieds",
    note: "Pour éviter les petites blessures du coureur (tendons, chevilles).",
    exos: [serie_("Mollets debout", 3, "20", 30), serie_("Mollets sur une jambe (haltère)", 3, "12 / jambe", 30), serie_("Cercles de chevilles", 2, "30 s", 15),
           serie_("Chaise contre le mur", 3, "45 s", 45), serie_("Élévation latérale de jambe (debout)", 3, "15 / jambe", 30)] },
  { id: "r-etirements", univers: "running", cat: "etirements", lieu: "exterieur", type: "circuit", titre: "Étirements après la course",
    note: "Doucement, sans forcer ni donner d'à-coups. Respirez calmement.", travail: 30, repos: 5, tours: 1, pause: 0,
    exos: [circ_("Étirement des mollets (contre un mur)"), circ_("Étirement des quadriceps (allongé sur le côté)"), circ_("Étirement des ischios (debout)"),
           circ_("Étirement des hanches (fente au sol)"), circ_("Étirement des fessiers (allongé)"), circ_("Posture de l'enfant (dos)")] },
  // ---- Marche sportive ----
  { id: "w-debutant", univers: "marche", cat: "marche", lieu: "exterieur", type: "circuit", titre: "Marche active débutant",
    note: "20 minutes : 3 minutes de marche normale, 1 minute de marche rapide, 5 fois.", travail: 180, repos: 0, tours: 5, pause: 0,
    exos: [d_("Marche normale", 180), d_("Marche rapide", 60)] },
  { id: "w-30", univers: "marche", cat: "marche", lieu: "exterieur", type: "circuit", titre: "Marche rapide 30 minutes",
    note: "2 minutes de marche normale, 3 minutes de marche rapide, 6 fois. On doit pouvoir parler, mais pas chanter.", travail: 180, repos: 0, tours: 6, pause: 0,
    exos: [d_("Marche normale", 120), d_("Marche rapide", 180)] },
  { id: "w-sportive", univers: "marche", cat: "marche", lieu: "exterieur", type: "circuit", titre: "Marche sportive (intervalles)",
    note: "Pour les marcheurs réguliers : grands pas, bras qui balancent.", travail: 120, repos: 0, tours: 6, pause: 0,
    exos: [d_("Marche rapide", 120), d_("Marche très rapide", 60)] },
  { id: "w-equilibre", univers: "marche", cat: "renfo", lieu: "maison", type: "circuit", titre: "Jambes et équilibre",
    note: "À la maison, avec une chaise pour se tenir. Doux pour les articulations.", travail: 30, repos: 30, tours: 2, pause: 60,
    exos: [circ_("Squats"), circ_("Montées sur une chaise"), circ_("Mollets debout"), circ_("Élévation latérale de jambe (debout)"), circ_("Élévation de jambe arrière debout"), circ_("Pont fessier")] },
  { id: "w-dos", univers: "marche", cat: "renfo", lieu: "maison", type: "circuit", titre: "Dos et posture du marcheur",
    note: "Pour marcher bien droit et soulager le bas du dos.", travail: 30, repos: 20, tours: 2, pause: 45,
    exos: [circ_("Superman (allongé sur le ventre)"), circ_("Dos rond, dos creux (chat)"), circ_("Planche"), circ_("Pont fessier"), circ_("Genoux contre la poitrine")] },
  { id: "w-etirements", univers: "marche", cat: "etirements", lieu: "exterieur", type: "circuit", titre: "Étirements après la marche",
    note: "5 minutes pour finir en douceur.", travail: 30, repos: 5, tours: 1, pause: 0,
    exos: [circ_("Étirement des mollets (contre un mur)"), circ_("Étirement des quadriceps (allongé sur le côté)"), circ_("Étirement des ischios (debout)"),
           circ_("Étirement des hanches (fente au sol)"), circ_("Dos rond, dos creux (chat)"), circ_("Genoux contre la poitrine")] }
);

// ---------------- MAISON : une base SANS MATÉRIEL, puis des versions ciblées avec accessoires ----------------
// (inspiré des programmes Decathlon / Basic-Fit : 40-45 s d'effort, 15-20 s de repos, 3 tours)
FICHES.push(
  // Homme
  { id: "m-full-0", lieu: "maison", groupe: "cardio", type: "circuit", titre: "Full body sans matériel",
    note: "La base : tout le corps, sans aucun accessoire. 45 s d'effort, 15 s de repos, 3 tours.", travail: 45, repos: 15, tours: 3, pause: 60,
    exos: [circ_("Squats"), circ_("Pompes"), circ_("Fentes alternées"), circ_("Planche"), circ_("Mountain climbers"), circ_("Pont fessier"), circ_("Superman (allongé sur le ventre)")] },
  { id: "m-haut-0", lieu: "maison", groupe: "haut", type: "circuit", titre: "Haut du corps débutant (sans matériel)",
    note: "Pour commencer les pompes en douceur : mains sur une chaise.", travail: 30, repos: 30, tours: 3, pause: 60,
    exos: [circ_("Pompes inclinées (mains sur une chaise)"), circ_("Superman (allongé sur le ventre)"), circ_("Pompes inclinées serrées (triceps)"), circ_("Planche"), circ_("Dips sur chaise")] },
  { id: "m-bras-0", lieu: "maison", groupe: "bras", type: "circuit", titre: "Bras sans matériel",
    note: "Sans matériel, ce sont surtout les triceps qui travaillent. Pour les biceps, il faut un élastique ou des haltères (voir les autres séances).", travail: 30, repos: 20, tours: 3, pause: 45,
    exos: [circ_("Dips sur chaise"), circ_("Pompes diamant"), circ_("Pompes inclinées serrées (triceps)"), circ_("Rotations de poignets"), circ_("Pompe + gainage latéral")] },
  { id: "m-abdos-0", lieu: "maison", groupe: "abdos", type: "circuit", titre: "Abdos débutant (sans matériel)",
    note: "Sur un tapis ou une serviette. Expirez quand vous contractez.", travail: 30, repos: 20, tours: 3, pause: 45,
    exos: [circ_("Crunchs"), circ_("Talons alternés (obliques)"), circ_("Dead bug"), circ_("Crunch oblique au sol"), circ_("Planche")] },
  { id: "m-haut-el", lieu: "maison", groupe: "haut", type: "series", titre: "Haut du corps à l'élastique",
    note: "Un élastique de résistance (bande longue). Plus vous le tendez au départ, plus c'est dur.",
    exos: [serie_("Écarté pecs à l'élastique", 3, "15", 45), serie_("Rowing assis à l'élastique", 4, "12", 45), serie_("Développé épaules à l'élastique", 3, "12", 45),
           serie_("Élévations latérales à l'élastique", 3, "15", 45), serie_("Oiseau à l'élastique", 3, "15", 45), serie_("Pompes", 3, "max", 60)] },
  { id: "m-bras-el", lieu: "maison", groupe: "bras", type: "series", titre: "Biceps et triceps à l'élastique",
    note: "Pieds sur l'élastique pour les curls. Gardez les coudes collés au corps.",
    exos: [serie_("Curl biceps à l'élastique", 4, "15", 45), serie_("Extension triceps à l'élastique (allongé)", 4, "15", 45), serie_("Rowing vertical à l'élastique", 3, "12", 45), serie_("Dips sur chaise", 3, "12", 60)] },
  { id: "m-bas-el", lieu: "maison", groupe: "bas", type: "series", titre: "Jambes à l'élastique",
    note: "Un élastique long, plus un mini-élastique pour la marche latérale si vous en avez un.",
    exos: [serie_("Squats à l'élastique", 4, "15", 60), serie_("Good morning à l'élastique", 3, "15", 45), serie_("Kickback debout à l'élastique", 3, "15 / jambe", 45),
           serie_("Marche latérale avec élastique", 3, "12 pas / côté", 45), serie_("Mollets à l'élastique", 3, "20", 30)] },
  { id: "m-abdos-lests", lieu: "maison", groupe: "abdos", type: "circuit", titre: "Abdos avec lests de chevilles",
    note: "Les lests (0,5 à 2 kg par cheville) rendent les relevés de jambes bien plus durs : commencez léger.", travail: 30, repos: 20, tours: 3, pause: 45,
    exos: [circ_("Relevés de jambes avec lests"), circ_("Ciseaux avec lests"), circ_("Crunch inversé"), circ_("Bicycle crunch"), circ_("Planche")] },
  { id: "m-full-h", lieu: "maison", groupe: "cardio", type: "circuit", titre: "Full body haltères",
    note: "Deux haltères. 45 s d'effort, 15 s de repos, 3 tours.", travail: 45, repos: 15, tours: 3, pause: 60,
    exos: [circ_("Goblet squat (haltère)"), circ_("Soulevé de terre jambes tendues (haltères)"), circ_("Rowing deux haltères"), circ_("Développé épaules haltères"), circ_("Pont fessier"), circ_("Extension triceps haltère")] },

  // Femme
  { id: "f-m-full-0", public: "femmes", lieu: "maison", groupe: "cardio", type: "circuit", titre: "Full body sans matériel",
    note: "La base, sans aucun accessoire : tout le corps en 15 minutes.", travail: 40, repos: 20, tours: 3, pause: 60,
    exos: [circ_("Squats"), circ_("Pompes inclinées (mains sur une chaise)"), circ_("Fentes alternées"), circ_("Pont fessier"), circ_("Planche"), circ_("Mountain climbers")] },
  { id: "f-m-ventre-0", public: "femmes", lieu: "maison", groupe: "abdos", type: "circuit", titre: "Ventre débutante (sans matériel)",
    note: "En douceur, sur un tapis. Rentrez le nombril pendant tout l'exercice.", travail: 30, repos: 20, tours: 3, pause: 45,
    exos: [circ_("Crunchs"), circ_("Talons alternés (obliques)"), circ_("Dead bug"), circ_("Crunch oblique au sol"), circ_("Planche")] },
  { id: "f-m-bras-0", public: "femmes", lieu: "maison", groupe: "bras", type: "circuit", titre: "Bras sans matériel",
    note: "Juste une chaise : surtout l'arrière des bras (triceps).", travail: 30, repos: 30, tours: 3, pause: 45,
    exos: [circ_("Pompes inclinées (mains sur une chaise)"), circ_("Dips sur chaise"), circ_("Pompes inclinées serrées (triceps)"), circ_("Moulinets des bras"), circ_("Planche")] },
  { id: "f-m-haut-0", public: "femmes", lieu: "maison", groupe: "haut", type: "circuit", titre: "Dos et posture (sans matériel)",
    note: "Pour se tenir droite, sans accessoire.", travail: 30, repos: 20, tours: 3, pause: 45,
    exos: [circ_("Superman (allongé sur le ventre)"), circ_("Pompes inclinées (mains sur une chaise)"), circ_("Dos rond, dos creux (chat)"), circ_("Extension lombaire au sol"), circ_("Planche")] },
  { id: "f-m-fessiers-el", public: "femmes", lieu: "maison", groupe: "bas", type: "circuit", titre: "Fessiers à l'élastique",
    note: "Mini-élastique au-dessus des genoux pour la marche latérale, élastique long pour le reste.", travail: 40, repos: 20, tours: 3, pause: 60,
    exos: [circ_("Marche latérale avec élastique"), circ_("Kickback debout à l'élastique"), circ_("Squats à l'élastique"), circ_("Pont fessier"), circ_("Adduction à l'élastique (intérieur des cuisses)"), circ_("Good morning à l'élastique")] },
  { id: "f-m-fessiers-lests", public: "femmes", lieu: "maison", groupe: "bas", type: "circuit", titre: "Fessiers avec lests de chevilles",
    note: "Des lests de 0,5 à 1 kg suffisent. Mouvements lents, sans à-coups.", travail: 40, repos: 20, tours: 3, pause: 60,
    exos: [circ_("Kickback à quatre pattes avec lests"), circ_("Élévation latérale de jambe avec lests"), circ_("Élévation de jambe arrière avec lests"), circ_("Pont fessier sur une jambe avec lests"), circ_("Fentes croisées arrière")] },
  { id: "f-m-bras-el", public: "femmes", lieu: "maison", groupe: "bras", type: "series", titre: "Bras et épaules à l'élastique",
    note: "Un élastique léger suffit. Gardez les coudes fixes.",
    exos: [serie_("Curl biceps à l'élastique", 3, "15", 45), serie_("Extension triceps à l'élastique (allongé)", 3, "15", 45), serie_("Élévations latérales à l'élastique", 3, "15", 45),
           serie_("Développé épaules à l'élastique", 3, "12", 45), serie_("Écarté à l'élastique (pull apart)", 3, "15", 45)] },
  { id: "f-m-cardio-lests", public: "femmes", lieu: "maison", groupe: "cardio", type: "circuit", titre: "Cardio doux avec lests",
    note: "Sans sauts, les lests de chevilles font monter le cœur sans abîmer les genoux.", travail: 40, repos: 20, tours: 3, pause: 60,
    exos: [circ_("Montées de genoux avec lests"), circ_("Marche rapide sur place (sans sauter)"), circ_("Élévation latérale de jambe avec lests"), circ_("Squats"), circ_("Kickback à quatre pattes avec lests")] }
);

// ---------------- NIVEAUX : 1 = Débutant, 2 = Intermédiaire, 3 = Confirmé ----------------
const NIVEAUX = { 1: "Débutant", 2: "Intermédiaire", 3: "Confirmé" };
(() => {
  const n = {
    "m-haut-1": 2, "m-haut-2": 2, "m-bras-1": 2, "m-bras-2": 2, "m-bas-1": 1, "m-bas-2": 2, "m-abdos-1": 1, "m-abdos-2": 1, "m-cardio-1": 3, "m-cardio-2": 3,
    "m-full-0": 1, "m-haut-0": 1, "m-bras-0": 1, "m-abdos-0": 1, "m-haut-el": 2, "m-bras-el": 2, "m-bas-el": 2, "m-abdos-lests": 3, "m-full-h": 2,
    "f-m-full-0": 1, "f-m-ventre-0": 1, "f-m-bras-0": 1, "f-m-haut-0": 1, "f-m-fessiers-el": 2, "f-m-fessiers-lests": 2, "f-m-bras-el": 1, "f-m-cardio-lests": 1,
    "s-haut-1": 3, "s-haut-2": 3, "s-bras-1": 2, "s-bras-2": 2, "s-bas-1": 3, "s-bas-2": 2, "s-abdos-1": 2, "s-abdos-2": 1, "s-cardio-1": 2, "s-cardio-2": 1,
    "f-m-fessiers": 1, "f-m-jambes": 2, "f-m-ventre": 2, "f-m-bras": 1, "f-m-cardio": 1, "f-m-debutante": 1, "f-m-haut": 1,
    "f-s-fessiers": 2, "f-s-jambes": 2, "f-s-haut": 1, "f-s-bras": 1, "f-s-abdos": 2, "f-s-cardio": 2,
    "r-frac-1": 1, "r-frac-2": 2, "r-frac-3": 3, "r-endurance": 2, "r-echauffement": 1, "r-renfo": 2, "r-pieds": 1, "r-etirements": 1,
    "w-debutant": 1, "w-30": 2, "w-sportive": 3, "w-equilibre": 1, "w-dos": 1, "w-etirements": 1
  };
  FICHES.forEach(f => { f.niveau = n[f.id] || 2; });
})();

// ---------------- ÉCHAUFFEMENTS (proposés avant chaque séance, pour éviter les blessures) ----------------
FICHES.push(
  { id: "e-general", echauffement: true, lieu: "partout", type: "circuit", niveau: 1, titre: "Échauffement complet (5 min)",
    note: "À faire avant chaque séance : réveille les articulations, monte doucement le cardio et prépare les muscles. C'est le meilleur moyen d'éviter les blessures.",
    travail: 30, repos: 5, tours: 1, pause: 0, prepa: 5,
    exos: [circ_("Marche rapide sur place (sans sauter)"), circ_("Moulinets des bras"), circ_("Cercles d'épaules"), circ_("Cercles de hanches"),
           circ_("Cercles de chevilles"), circ_("Montées de genoux"), circ_("Talons-fesses"), circ_("Squats"), circ_("Jumping jacks")] },
  { id: "e-haut", echauffement: true, lieu: "partout", type: "circuit", niveau: 1, titre: "Échauffement haut du corps (5 min)",
    note: "Avant une séance pecs, épaules, dos ou bras : épaules, coudes et poignets bien chauds avant de soulever.",
    travail: 30, repos: 5, tours: 1, pause: 0, prepa: 5,
    exos: [circ_("Marche rapide sur place (sans sauter)"), circ_("Moulinets des bras"), circ_("Cercles d'épaules"), circ_("Rotations de poignets"),
           circ_("Pompes inclinées (mains sur une chaise)"), circ_("Rotation du bassin (allongé)"), circ_("Superman (allongé sur le ventre)"), circ_("Jumping jacks")] },
  { id: "e-bas", echauffement: true, lieu: "partout", type: "circuit", niveau: 1, titre: "Échauffement jambes (5 min)",
    note: "Avant une séance jambes ou fessiers : chevilles, genoux et hanches prêts à travailler.",
    travail: 30, repos: 5, tours: 1, pause: 0, prepa: 5,
    exos: [circ_("Marche rapide sur place (sans sauter)"), circ_("Cercles de chevilles"), circ_("Cercles de hanches"), circ_("Talons-fesses"),
           circ_("Montées de genoux"), circ_("Squats"), circ_("Fentes alternées"), circ_("Pont fessier")] }
);
// Quel échauffement pour quelle séance
const echauffementPour = (f) => f.univers === "running" ? "r-echauffement"
  : (f.groupe === "haut" || f.groupe === "bras") ? "e-haut" : f.groupe === "bas" ? "e-bas" : "e-general";

// ---------------- MATÉRIEL : ce qu'il faut pour chaque séance maison (chaise, canapé, mur, tapis ne comptent pas) ----------------
const MATERIELS = { elastique: "Élastique", lests: "Lests de chevilles", halteres: "Haltères", barre: "Barre de porte", corde: "Corde à sauter" };
const materielFiche = (f) => [...new Set((f.exos || []).map(e => { const x = EXERCICES.find(y => y.nom === e.nom); return x && x.mat; }).filter(Boolean))];

// ---------------- ZONES : les grosses tuiles dans Maison et Salle ----------------
const ZONES = {
  haut:    { nom: "Haut du corps",      ico: "💪", detail: "Pectoraux, épaules, dos" },
  bras:    { nom: "Bras",               ico: "🦾", detail: "Biceps, triceps, avant-bras" },
  bas:     { nom: "Jambes et fessiers", ico: "🦵", detail: "Cuisses, fessiers, mollets" },
  abdos:   { nom: "Ventre et dos",      ico: "🧘", detail: "Abdos, gainage, lombaires" },
  cardio:  { nom: "Cardio",             ico: "❤️", detail: "Transpirer, brûler des calories" },
  complet: { nom: "Corps entier",       ico: "⭐", detail: "Tout le corps en une séance" }
};
["m-full-0", "m-full-h", "f-m-full-0", "f-m-debutante"].forEach(id => { const f = FICHES.find(x => x.id === id); if (f) f.zone = "complet"; });
FICHES.forEach(f => { if (!f.zone && f.groupe) f.zone = f.groupe; });
const zoneDe = (f) => f.zone || f.groupe || "complet";
MATERIELS.halteres = "Haltères ou bouteilles d'eau";
