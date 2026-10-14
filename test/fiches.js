// Fiches toutes prêtes : rangées par lieu (maison / salle), puis par groupe.
// Les noms d'exercices correspondent à la bibliothèque (exercices.js) : photo et muscles viennent de là.
const GROUPES = {
  haut:   { nom: "Haut du corps",      muscles: ["pecs", "epaules", "dos"] },
  bras:   { nom: "Bras",               muscles: ["biceps", "triceps", "avbras"] },
  bas:    { nom: "Bas du corps",       muscles: ["quadri", "ischios", "fessiers", "mollets"] },
  abdos:  { nom: "Abdos et lombaires", muscles: ["abdos", "lombaires"] },
  cardio: { nom: "Cardio",             muscles: ["cardio"] }
};
const MUSCLES = {
  pecs: "Pectoraux", epaules: "Épaules", dos: "Dos", biceps: "Biceps", triceps: "Triceps", avbras: "Avant-bras",
  quadri: "Quadriceps", ischios: "Ischios", fessiers: "Fessiers", mollets: "Mollets", abdos: "Abdos", lombaires: "Lombaires", cardio: "Cardio"
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

// ---------------- PROGRAMMES FEMMES (affichés dans leur propre partie, maison et salle) ----------------
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
  { id: "f-s-abdos", public: "femmes", lieu: "salle", groupe: "abdos", type: "series", titre: "Abdos et taille",
    note: "Ventre, côtés et bas du dos.",
    exos: [serie_("Relevés de jambes suspendu", 3, "10", 60), serie_("Crunch à la poulie", 3, "15", 45), serie_("Russian twist", 3, "20", 30),
           serie_("Planche", 3, "45 s", 30), serie_("Gainage latéral", 3, "30 s / côté", 30), serie_("Banc à lombaires", 3, "12", 45)] },
  { id: "f-s-cardio", public: "femmes", lieu: "salle", groupe: "cardio", type: "circuit", titre: "Cardio brûle-calories",
    note: "2 minutes par poste, à un rythme soutenu mais où vous pouvez encore parler.", travail: 120, repos: 30, tours: 3, pause: 60,
    exos: [circ_("Vélo elliptique"), circ_("Rameur"), circ_("Kettlebell swing"), circ_("Tapis de course"), circ_("Step-up sur banc (haltères)")] }
);
