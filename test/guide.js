// Le guide de l'appli : chaque étape avec une image de l'écran et une explication simple.
const GUIDE = [
  { titre: "Bienvenue !", img: null, texte: [
    "Rythmo Sport vous guide pendant vos séances : un minuteur qui parle, un coup de sifflet, les photos de chaque exercice et les muscles travaillés.",
    "Fitness à la maison ou à la salle, Running ou Marche sportive : tout est dans l'appli. Voici comment vous en servir en quelques minutes."] },
  { titre: "1. Mettre l'appli sur votre téléphone", img: "16-profil", texte: [
    "Ouvrez le lien de l'appli dans Chrome (Android) ou Safari (iPhone).",
    "Android : menu ⋮ en haut à droite → « Installer l'application ».",
    "iPhone : ouvrez le lien dans Safari, touchez le bouton Partager (carré avec une flèche), puis « Sur l'écran d'accueil » et « Ajouter ».",
    "L'appli se met ensuite à jour toute seule : vous n'avez jamais rien à réinstaller."] },
  { titre: "2. Créer votre compte", img: "01-inscription", texte: [
    "Indiquez votre prénom, si vous êtes un homme ou une femme, et votre e-mail.",
    "L'appli vous montre alors les séances faites pour vous. Vous pourrez changer ce choix à tout moment."] },
  { titre: "3. Choisir une séance", img: "02-seances", texte: [
    "En haut : Fitness, Running ou Marche sportive.",
    "En Fitness : Homme ou Femme, puis Maison ou Salle. Les séances sont rangées par groupe : haut du corps, bras, bas du corps, abdos et lombaires, cardio.",
    "Le filtre de niveau (Débutant, Intermédiaire, Confirmé) n'affiche que les séances de votre niveau."] },
  { titre: "3 bis. Mon matériel (à la maison)", img: "19-materiel", texte: [
    "Chaque groupe a des séances SANS matériel (badge vert), puis des versions ciblées avec accessoires : élastique, lests de chevilles, haltères (badge jaune).",
    "Touchez « Rien » si vous n'avez aucun accessoire, ou cochez ce que vous avez (Élastique, Lests de chevilles, Haltères…) : l'appli n'affiche que les séances que vous pouvez faire. « Tout voir » montre tout."] },
  { titre: "4. Toujours s'échauffer", img: "05-question-echauffement", texte: [
    "Pour éviter les blessures, l'appli propose 5 minutes d'échauffement avant chaque séance.",
    "Touchez « Oui » : l'échauffement démarre, puis un bouton « Passer à ma séance » lance votre séance. Vous pouvez aussi les lancer depuis l'encadré orange en haut de l'écran Séances.",
    "Déjà échauffé(e) ? Touchez « ⏭ Passer l'échauffement » : dans la question, ou même pendant l'échauffement. Vous pouvez aussi décocher « Me proposer l'échauffement avant chaque séance »."] },
  { titre: "5. Voir une séance", img: "04-fiche", texte: [
    "Chaque séance indique le lieu, le niveau, la durée et la liste des exercices.",
    "Touchez un exercice pour voir le mouvement (animé), les muscles travaillés et le matériel nécessaire. Le bouton « Voir une vidéo du mouvement » ouvre des vidéos sur YouTube.",
    "Touchez « Lancer la séance » quand vous êtes prêt."] },
  { titre: "6. Le minuteur (séances en circuit)", img: "06-minuteur", texte: [
    "Touchez « Démarrer » : « one, two, three », coup de sifflet, c'est parti !",
    "La voix annonce chaque exercice, le repos et l'exercice suivant. Couleurs : rouge = effort, turquoise = repos, jaune = préparation.",
    "« Pause » pour souffler, « Remise à zéro » pour arrêter. L'écran reste allumé tout seul."] },
  { titre: "7. Les séances en séries (musculation)", img: "08-series", texte: [
    "Faites votre série, puis touchez son numéro (1, 2, 3…) : le repos se lance tout seul et la voix vous dit quand repartir.",
    "Notez le poids utilisé dans la case « kg » : l'appli s'en souvient pour la prochaine fois."] },
  { titre: "8. Le repos entre les séries", img: "07-repos-series", texte: [
    "Pendant le repos, le minuteur affiche le temps restant et l'exercice suivant, avec le poids à utiliser.",
    "Au bout du repos : sifflet et « C'est reparti ! »."] },
  { titre: "9. Créer votre propre séance", img: "09-choisir-exercices", texte: [
    "Écran Séances → « + Créer ma séance ». Donnez-lui un nom, choisissez Maison, Salle ou Dehors, et Séries ou Circuit.",
    "Touchez « + Choisir des exercices », filtrez par groupe et par muscle, cochez tous ceux que vous voulez, puis « Ajouter ».",
    "Tous les exercices sont disponibles, ceux des hommes comme ceux des femmes."] },
  { titre: "10. Régler votre séance", img: "10-creer-seance", texte: [
    "Réglez les séries, répétitions et repos (ou l'effort, le repos et les rounds pour un circuit).",
    "⇄ remplace un exercice, ↑ le remonte, × le retire. Touchez « Enregistrer » : votre séance apparaît dans « Mes séances »."] },
  { titre: "11. Les exercices", img: "11-exercice", texte: [
    "L'onglet Exercices montre tous les exercices avec photos, classés par lieu (Maison, Salle, Dehors), par groupe et par muscle.",
    "Rouge vif = muscle principal, rouge pâle = muscle secondaire."] },
  { titre: "12. La musique", img: "12-musique", texte: [
    "Vos propres musiques : dans le Minuteur, touchez « + Ajouter mes musiques du téléphone » et choisissez vos MP3. Ils restent dans l'appli (rien n'est envoyé) et se lancent avec « Démarrer ».",
    "2 musiques sont aussi fournies avec l'appli. Pour choisir la musique : Minuteur → « Son, voix et musique ».",
    "Tempo : l'appli calcule le tempo de chaque musique (en BPM). Touchez « Marche », « Muscu / HIIT », « Footing » ou « Course rapide » : la musique accélère ou ralentit pour suivre votre rythme. Vous pouvez aussi régler la vitesse à la main.",
    "La musique baisse pendant les repos et quand la voix parle. Vous pouvez aussi garder votre musique habituelle : choisissez « Sans musique »."] },
  { titre: "13. Spotify", img: "13-spotify", texte: [
    "Dans le Minuteur, les boutons verts ouvrent une playlist dans Spotify. Lancez la musique, revenez dans l'appli et touchez « Démarrer ».",
    "Pour ajouter votre playlist : dans Spotify, ⋮ → Partager → Copier le lien, puis collez-le dans « + Ajouter ou retirer une playlist »."] },
  { titre: "14. Running et Marche sportive", img: "14-running", texte: [
    "Fractionné, footing, marche active, renforcement et étirements : la voix annonce chaque changement (« Course rapide ! », « Footing lent ! »).",
    "Vous pouvez verrouiller votre téléphone et le mettre en poche : la séance continue (sur Android ; sur iPhone, gardez l'appli ouverte)."] },
  { titre: "14 bis. Le suivi GPS", img: "18-gps", texte: [
    "Running ou Marche sportive → « 📍 Suivi GPS de mon parcours » → « Démarrer » : distance, durée, allure et tracé sur la carte, avec une annonce à chaque kilomètre.",
    "Gardez l'appli ouverte (l'écran reste allumé) ; « Écran noir » économise la batterie. À la fin : résumé, carte, temps au kilomètre et bouton Partager. Vos parcours sont gardés dans « Mes parcours »."] },
  { titre: "15. Progresser", img: "15-progression", texte: [
    "Après 3 séances réussies, l'appli vous propose une version plus dure ou la séance du niveau supérieur.",
    "En musculation, quand vous réussissez 2 fois le même poids, elle vous propose d'en ajouter un peu."] },
  { titre: "16. Sur la télé", img: "17-tele", texte: [
    "Minuteur → « 📺 Afficher sur la télé ». Avec une clé Chromecast ou une Google TV : un seul appui, le minuteur s'affiche en grand sur la télé et le téléphone reste dans votre main.",
    "Autres télés : « Copier l'écran du téléphone » : l'appli vous dit le nom exact du bouton à toucher sur VOTRE téléphone (Smart View chez Samsung, Recopie de l'écran sur iPhone…), puis met le minuteur en grand."] },
  { titre: "Une question, une idée ?", img: null, texte: [
    "L'appli est en test : vos retours sont précieux. Dites ce qui vous plaît, ce qui manque ou ce qui bloque. Bonnes séances ! 💪"] }
];
