// Avertissement santé : montré à l'inscription (case à cocher obligatoire), à la première ouverture pour les comptes déjà créés,
// dans le Profil, dans le guide, dans le guide PDF et dans la vidéo.
const AVERTISSEMENT = {
  titre: "⚠️ À lire avant de commencer",
  intro: "Rythmo Sport est une application d'aide à l'entraînement. Ce n'est pas un coach sportif diplômé, ni un médecin, ni un diététicien. Son créateur n'est pas coach sportif. La « voix du coach » est une voix de synthèse qui annonce les exercices et vous encourage : elle ne vous voit pas et ne peut pas corriger vos mouvements.",
  points: [
    ["🩺 Votre santé d'abord", "Les séances, les programmes et les conseils sont généraux : ils ne sont pas adaptés à votre état de santé. Demandez l'avis de votre médecin avant de commencer, surtout si vous n'avez pas fait de sport depuis longtemps, si vous avez un problème de santé (cœur, tension, diabète, dos, articulations…), une blessure, ou si vous êtes enceinte."],
    ["✋ Arrêtez-vous si ça ne va pas", "Allez à votre rythme. Arrêtez tout de suite en cas de douleur, de vertige, de malaise, d'essoufflement anormal ou de douleur dans la poitrine, et consultez un médecin. Urgence : appelez le 15 ou le 112."],
    ["🪑 Votre matériel et votre environnement", "Vérifiez que tout est sûr : chaise stable et calée, barre de porte bien fixée, élastique en bon état, sol qui ne glisse pas, assez de place autour de vous. Dehors, restez attentif à la circulation."],
    ["🥗 Nutrition", "Les calories, les protéines et les recettes sont des repères, pas un régime ni un avis médical. Vérifiez les ingrédients si vous avez une allergie. En cas de maladie, de grossesse, de régime particulier ou de troubles alimentaires, parlez-en à un médecin ou à un diététicien."],
    ["📍 Des estimations", "Les distances GPS, les allures et les calories dépensées sont des estimations, pas des mesures exactes."],
    ["🧒 Moins de 18 ans", "Utilisez l'appli avec l'accord d'un parent."],
  ],
  fin: "En utilisant Rythmo Sport, vous pratiquez sous votre propre responsabilité.",
};
const htmlAvertissement = () => `<div class="avert"><h2>${AVERTISSEMENT.titre}</h2><p><b>${AVERTISSEMENT.intro}</b></p>
  ${AVERTISSEMENT.points.map(([t, x]) => `<h3>${t}</h3><p>${x}</p>`).join("")}<p class="avert-fin"><b>${AVERTISSEMENT.fin}</b></p></div>`;
