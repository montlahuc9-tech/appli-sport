// Le guide de l'appli : chaque étape avec une image de l'écran et une explication simple.
// « avert: true » = l'avertissement santé (une page entière dans le guide PDF).
const GUIDE = [
  { titre: "Bienvenue !", img: null, texte: [
    "Rythmo Sport vous aide pendant vos séances : un minuteur qui parle, un coup de sifflet, les images de chaque exercice avec l'explication du mouvement, et les muscles travaillés.",
    "Maison, salle, course, marche, défi Calisthenics 30 jours, recettes et repères de nutrition : tout est dans l'appli. Commencez par lire l'avertissement santé, puis voici comment vous en servir."] },
  { titre: "1. À lire avant de commencer", img: "27-avertissement", avert: true, texte: [
    "Rythmo Sport est une application d'aide à l'entraînement. Ce n'est pas un coach sportif diplômé, ni un médecin, ni un diététicien. Son créateur n'est pas coach sportif. La « voix du coach » est une voix de synthèse : elle ne vous voit pas et ne corrige pas vos mouvements.",
    "Demandez l'avis de votre médecin avant de commencer, surtout après une longue pause, en cas de problème de santé, de blessure ou de grossesse. Arrêtez-vous tout de suite en cas de douleur, de vertige ou de malaise (urgence : 15 ou 112).",
    "Les calories, les protéines et les recettes sont des repères, pas un régime. Le GPS et les calories dépensées sont des estimations. Vous pratiquez sous votre propre responsabilité.",
    "À l'inscription, il faut cocher la case « J'ai lu l'avertissement santé ». Vous le retrouvez à tout moment dans le Profil → « Lire l'avertissement santé »."] },
  { titre: "2. Mettre l'appli sur votre téléphone", img: "16-profil", texte: [
    "Ouvrez le lien de l'appli dans Chrome (Android) ou Safari (iPhone).",
    "Android : menu ⋮ en haut à droite → « Installer l'application ».",
    "iPhone : ouvrez le lien dans Safari, touchez le bouton Partager (carré avec une flèche), puis « Sur l'écran d'accueil » et « Ajouter ».",
    "L'appli se met ensuite à jour toute seule : vous n'avez jamais rien à réinstaller."] },
  { titre: "3. Créer votre compte", img: "01-inscription", texte: [
    "Indiquez votre prénom, si vous êtes un homme ou une femme, et votre e-mail.",
    "Lisez l'avertissement santé (« ⚠️ Lire l'avertissement »), cochez la case, puis touchez « Créer mon compte ». L'appli vous montre ensuite les séances faites pour vous. Homme ou femme se change dans le Profil."] },
  { titre: "4. Votre programme personnalisé", img: "23-programme", texte: [
    "À la première ouverture, l'appli vous pose quelques questions : votre objectif (perdre du poids, prendre du muscle, être en forme, courir mieux, se remettre au sport), votre niveau, les jours où vous voulez vous entraîner, le temps, le lieu, le matériel et une éventuelle douleur à ménager. L'âge, la taille et le poids sont facultatifs : ils servent aux calories et aux repères de nutrition.",
    "L'appli construit alors votre programme de la semaine, en haut de l'accueil. Touchez une séance pour la lancer : elle se coche toute seule quand elle est faite. La séance du jour est marquée « Aujourd'hui ». « 📅 Changer mes jours » réorganise le programme. Pour tout changer : Profil → « Refaire le questionnaire »."] },
  { titre: "5. Choisir où vous faites votre séance", img: "02-seances", texte: [
    "L'accueil a 5 grosses tuiles : 🏠 Maison, 🏋️ Salle, 🏃 Course, 🚶 Marche et 💪 Calisthenics (le défi 30 jours). Touchez celle qui vous correspond.",
    "Juste en dessous, le bouton « ⚡ Fractionné » ouvre directement les séances de fractionné en course. Plus bas, « Refaire votre dernière séance » la relance en un appui."] },
  { titre: "6. À la maison : votre matériel", img: "19-materiel", texte: [
    "La première fois, l'appli vous demande ce que vous avez chez vous : élastique, lests de chevilles, haltères ou bouteilles d'eau, barre de porte, corde à sauter… Rien du tout ? Ne cochez rien : il y a plein de séances sans matériel.",
    "Vous ne voyez ensuite que les séances que vous pouvez faire. Pour changer : « Modifier » en haut de l'espace Maison."] },
  { titre: "7. Choisir ce que vous voulez travailler", img: "03-zones", texte: [
    "Touchez une zone : Haut du corps, Bras, Jambes et fessiers, Ventre et dos, Cardio ou Corps entier. Les séances de cette zone s'affichent juste en dessous.",
    "Vous ne savez pas quoi faire ? Touchez « ▶ Une séance pour moi » : l'appli en choisit une adaptée à votre niveau et à votre matériel, différente de vos dernières séances."] },
  { titre: "8. Toujours s'échauffer", img: "05-question-echauffement", texte: [
    "Pour limiter le risque de blessure, l'appli propose 5 minutes d'échauffement avant chaque séance. Touchez « Oui » : l'échauffement démarre, puis un bouton lance votre séance.",
    "Déjà échauffé(e) ? Touchez « ⏭ Passer l'échauffement », dans la question ou pendant l'échauffement. Vous pouvez aussi ne plus le proposer, dans le Profil."] },
  { titre: "9. Voir une séance", img: "04-fiche", texte: [
    "Chaque séance indique le lieu, le niveau, la durée et la liste des exercices.",
    "Touchez un exercice pour voir le mouvement (animé), l'explication « Comment faire », les muscles travaillés dessinés sur le corps (rouge vif = principal, rouge pâle = secondaire) et le matériel nécessaire.",
    "Touchez « Lancer la séance » quand vous êtes prêt."] },
  { titre: "10. « Comment faire » : chaque exercice expliqué", img: "24-comment-faire", texte: [
    "Pour chaque exercice : la position de départ, le mouvement étape par étape, la respiration et l'erreur à éviter.",
    "« Avec quoi ? » : touchez Haltères, Bouteilles d'eau ou Élastique pour voir comment faire avec ce que vous avez. Un encadré 💡 dit quoi faire si vous n'avez pas le matériel (pas de chaise, pas de banc, pas de barre, pas d'élastique), et pour les lests, où les mettre.",
    "Pendant une séance, le bouton « 📖 Comment faire » sous l'image ouvre la même explication. « ▶ Voir une vidéo du mouvement » cherche des vidéos de l'exercice sur YouTube (souvent en anglais : regardez le geste)."] },
  { titre: "11. Le minuteur (séances en circuit)", img: "06-minuteur", texte: [
    "Touchez « Démarrer » : « one, two, three », coup de sifflet, c'est parti !",
    "La voix annonce chaque exercice, le repos et l'exercice suivant. Couleurs : rouge = effort, turquoise = repos, jaune = préparation.",
    "« Pause » pour souffler, « Remise à zéro » pour arrêter. L'écran reste allumé tout seul."] },
  { titre: "12. Les séances en séries (musculation)", img: "08-series", texte: [
    "Faites votre série, puis touchez son numéro (1, 2, 3…) : le repos se lance tout seul et la voix vous dit quand repartir.",
    "Notez le poids utilisé dans la case « kg » : l'appli s'en souvient pour la prochaine fois."] },
  { titre: "13. Le repos entre les séries", img: "07-repos-series", texte: [
    "Pendant le repos, le minuteur affiche le temps restant et l'exercice suivant, avec le poids à utiliser.",
    "Au bout du repos : sifflet et « C'est reparti ! »."] },
  { titre: "14. Créer votre propre séance", img: "09-choisir-exercices", texte: [
    "Dans un espace (Maison, Salle…), tout en bas : « + Créer ma séance ». Donnez-lui un nom, choisissez Maison, Salle ou Dehors, et Séries ou Circuit.",
    "Touchez « + Choisir des exercices », filtrez par groupe et par muscle, cochez tous ceux que vous voulez, puis « Ajouter »."] },
  { titre: "15. Régler votre séance", img: "10-creer-seance", texte: [
    "Réglez les séries, répétitions et repos (ou l'effort, le repos et les rounds pour un circuit).",
    "⇄ remplace un exercice, ↑ le remonte, × le retire. Touchez « Enregistrer » : votre séance apparaît dans « Mes séances »."] },
  { titre: "16. Les exercices", img: "11-exercice", texte: [
    "L'onglet Exercices montre tous les exercices, classés par lieu (Maison, Salle, Dehors), par groupe et par muscle. À la maison ce sont des dessins, à la salle des photos.",
    "Touchez un exercice pour voir « Comment faire », les muscles travaillés et la vidéo."] },
  { titre: "17. La musique", img: "12-musique", texte: [
    "Vos propres musiques : dans le Minuteur, touchez « + Ajouter mes musiques du téléphone » et choisissez vos MP3. Ils restent dans l'appli (rien n'est envoyé) et se lancent avec « Démarrer ».",
    "2 musiques sont aussi fournies avec l'appli. Pour choisir la musique : Minuteur → « Son, voix et musique ».",
    "Tempo : l'appli calcule le tempo de chaque musique (en BPM). Touchez « Marche », « Muscu / HIIT », « Footing » ou « Course rapide » : la musique accélère ou ralentit pour suivre votre rythme.",
    "La musique baisse pendant les repos et quand la voix parle. Vous préférez votre musique habituelle ? Choisissez « Sans musique »."] },
  { titre: "18. La séance musique : 1 chanson = 1 exercice", img: "20-musique-seance", texte: [
    "Sur une séance, touchez « 🎵 Séance musique ». Choisissez vos chansons (celles de l'appli ou vos MP3) : chaque chanson porte un exercice.",
    "La musique devient le minuteur : l'appli écoute vos chansons à l'avance et cale les efforts quand la musique monte, les repos quand elle retombe, toujours en rythme. « ⏭ Chanson suivante » passe au suivant."] },
  { titre: "19. Vos playlists : Spotify, Apple Music, Deezer, YouTube Music", img: "13-spotify", texte: [
    "Dans le Minuteur, les boutons de playlist ouvrent votre musique dans la bonne appli. Lancez la lecture, revenez dans Rythmo Sport et touchez « Démarrer ». La voix et le sifflet passent par-dessus.",
    "Pour ajouter votre playlist : dans votre appli de musique, ouvrez la playlist, ⋮ ou … → Partager → Copier le lien, puis collez-le dans « + Ajouter ou retirer une playlist »."] },
  { titre: "20. La voix du coach", img: null, texte: [
    "Pendant vos séances, une voix vous encourage au bon moment : au départ, au milieu de l'effort, dans les 10 dernières secondes (« Encore un petit effort ! »), pendant le repos et à la fin.",
    "C'est une voix de synthèse, pas un vrai coach : elle ne vous voit pas. Écoutez votre corps avant tout. Vous préférez le calme ? Profil → « La voix du coach » : décochez la case."] },
  { titre: "21. Course, Marche et Fractionné", img: "14-running", texte: [
    "Fractionné (débutant, 30/30, long, footing + accélérations), footing, marche active, renforcement et étirements : la voix annonce chaque changement (« Course rapide ! », « Footing lent ! »).",
    "Dehors ou à la salle ? En haut de l'espace Course (ou Marche), choisissez « 🌳 Dehors » ou « 🏋️ Sur tapis (salle) ». Sur tapis, chaque exercice donne la vitesse conseillée (et l'inclinaison pour la marche).",
    "Vous voulez faire votre propre fractionné ? Le Minuteur a aussi un mode intervalles."] },
  { titre: "22. Le suivi GPS", img: "18-gps", texte: [
    "Course ou Marche → « 📍 Suivi GPS de mon parcours » → « Démarrer » : distance, durée, allure et tracé sur la carte, avec une annonce à chaque kilomètre.",
    "Important : gardez l'appli ouverte. L'écran reste allumé tout seul et vous pouvez mettre le téléphone dans la poche. Si vous verrouillez l'écran ou passez à une autre appli, le GPS s'arrête. « Écran noir » économise la batterie sans arrêter le suivi.",
    "À la fin : résumé, carte, temps au kilomètre et bouton Partager. Vos parcours sont gardés dans « Mes parcours ». Distances et allures sont des estimations."] },
  { titre: "23. Le défi Calisthenics 30 jours", img: "25-defi", texte: [
    "Tuile 💪 Calisthenics sur l'accueil : 30 jours au poids du corps (pompes, tractions, dips, squats, gainage). Chaque semaine : 6 jours d'entraînement et 1 jour de récupération, et ça monte un peu chaque semaine. Jour 29 : test de votre maximum, à comparer avec le jour 1. Jour 30 : grand final.",
    "Il suffit d'un tapis et d'une chaise. Une barre de porte, c'est mieux, mais pas obligatoire : « Comment faire » donne une solution sans barre. Les jours faits se cochent tout seuls, et le prochain jour s'affiche en grand. « Recommencer le défi à zéro » repart au jour 1.",
    "Trop dur ? Prenez les versions plus faciles (genoux au sol, mains sur une table) et ne forcez jamais sur une douleur."] },
  { titre: "24. Progresser", img: "15-progression", texte: [
    "Après 3 séances réussies, l'appli vous propose une version plus dure ou la séance du niveau supérieur. Votre niveau se règle dans le Profil.",
    "En musculation, quand vous réussissez 2 fois le même poids, elle vous propose d'en ajouter un peu."] },
  { titre: "25. Sur la télé", img: "17-tele", texte: [
    "Minuteur → « 📺 Afficher sur la télé ». Avec une clé Chromecast ou une Google TV : un seul appui, le minuteur s'affiche en grand sur la télé.",
    "Autres télés : « Copier l'écran du téléphone » : l'appli vous dit le nom exact du bouton à toucher sur VOTRE téléphone (Smart View chez Samsung, Recopie de l'écran sur iPhone…)."] },
  { titre: "26. Les recettes", img: "22-recettes", texte: [
    "Onglet « Recettes » en bas : touchez « Ce que j'ai chez moi » et cochez vos ingrédients (frigo, fruits et légumes, placard).",
    "L'appli montre les recettes que vous pouvez faire tout de suite, puis celles où il ne manque qu'un ingrédient. Filtrez : avant le sport, après le sport, repas ou collation. Chaque recette indique le temps, les calories et les protéines. Vous prenez de la protéine en poudre ? Touchez « J'en prends » pour voir aussi les versions avec poudre."] },
  { titre: "27. Le coach nutrition", img: "26-coach-nutrition", texte: [
    "En haut de l'onglet Recettes, « 🥗 Mon coach nutrition » donne des repères pour la journée : calories, protéines et eau, calculés avec votre âge, votre taille, votre poids, votre objectif et vos séances. Il manque une info ? Remplissez-la directement dans le bloc.",
    "Vous y trouvez aussi 5 conseils selon votre objectif, un rappel les jours de sport (quoi manger avant et après), et une idée de journée (midi, collation, soir) avec les recettes de l'appli. « 🔄 Une autre idée » en propose d'autres.",
    "Ce sont des repères, pas un régime : Rythmo Sport n'est pas un diététicien. Pas de calcul de calories avant 18 ans. En cas de maladie, de grossesse, de régime particulier ou de troubles alimentaires, parlez-en à un médecin ou à un diététicien."] },
  { titre: "Une question, une idée ?", img: null, texte: [
    "L'appli est en test : vos retours sont précieux. Dites ce qui vous plaît, ce qui manque ou ce qui bloque. Bonnes séances, à votre rythme ! 💪"] }
];
