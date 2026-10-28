// Coach nutrition : des repères simples (calories, protéines, eau) calculés avec le profil, des conseils selon l'objectif,
// et une journée type composée avec les recettes de l'appli. Ce n'est pas un régime : pour un suivi personnalisé, voir un diététicien.
window.CoachNutrition = (() => {
  const R = () => Compte.donnees.reglages;
  const P = () => R().profilSport || {};
  const femme = () => R().public === "femme";
  const CONSEILS = {
    perdre: ["Mangez à votre faim, mais remplissez la moitié de l'assiette de légumes.", "Des protéines à chaque repas (œufs, poisson, viande, légumineuses, laitages) : elles calment la faim et protègent les muscles.",
      "Pas de régime trop strict : perdre 0,5 kg par semaine, c'est déjà très bien, et ça tient dans le temps.", "Méfiez-vous des boissons sucrées et de l'alcool : beaucoup de calories sans caler.",
      "Ne sautez pas de repas après le sport : une collation protéinée évite de craquer le soir."],
    muscle: ["Des protéines à chaque repas, réparties sur la journée (3 ou 4 prises).", "Ne mangez pas trop peu : sans assez d'énergie, le muscle ne se construit pas.",
      "Après la séance, un repas ou une collation avec protéines et féculents dans les 2 heures.", "Le sommeil compte autant que l'assiette : visez 7 à 9 heures.",
      "Féculents complets (riz, pâtes, pain complet, flocons d'avoine) pour avoir de l'énergie à l'entraînement."],
    forme: ["Une assiette équilibrée : la moitié de légumes, un quart de protéines, un quart de féculents.", "Des fruits et légumes à chaque repas, de toutes les couleurs.",
      "Buvez régulièrement dans la journée, sans attendre d'avoir soif.", "Limitez les plats tout prêts et les produits très transformés.", "Prenez le temps de manger, assis, sans écran."],
    courir: ["Les féculents sont votre carburant : un peu plus les veilles de sortie longue.", "Avant de courir : un repas léger 2 à 3 heures avant, ou une petite collation 1 heure avant (banane, tartine).",
      "Après la course : boire, puis des protéines et des féculents pour récupérer.", "Pour une sortie de plus d'1 heure, emportez de l'eau.", "Le fer compte pour les coureurs : viande rouge, lentilles, épinards, avec un fruit riche en vitamine C."],
    reprise: ["Pas besoin de tout changer d'un coup : un seul petit changement par semaine.", "Trois vrais repas par jour, avec des légumes et des protéines.",
      "Buvez un grand verre d'eau avant et après chaque séance.", "Une collation après le sport si vous avez faim : un yaourt et un fruit suffisent.", "Écoutez votre faim : ni se priver, ni se forcer."]
  };
  function reperes() {
    const p = P(), poids = Decouverte.poidsActuel(), obj = p.objectif || "forme";
    const complet = poids && p.age && p.taille, mineur = p.age && p.age < 18;
    const r = { obj, poids, complet, mineur };
    if (!poids || mineur) return r;
    const seances = (p.programme && p.programme.length) || p.frequence || 3;
    const prot = { perdre: 1.6, muscle: 1.8, forme: 1.2, courir: 1.4, reprise: 1.1 }[obj];
    r.proteines = Math.round(poids * prot / 5) * 5;
    r.eau = Math.round(poids * 0.033 * 10) / 10;
    if (complet) {
      const base = 10 * poids + 6.25 * p.taille - 5 * p.age + (femme() ? -161 : 5);       // métabolisme de base (Mifflin-St Jeor)
      const activite = seances >= 5 ? 1.6 : seances >= 3 ? 1.45 : 1.35;
      let kcal = base * activite;
      if (obj === "perdre") kcal = Math.max(kcal * 0.85, base * 1.1, femme() ? 1400 : 1700);  // déficit doux, jamais trop bas
      if (obj === "muscle") kcal *= 1.1;
      r.kcal = Math.round(kcal / 50) * 50;
    }
    return r;
  }
  // Est-ce un jour de sport ? (programme de la semaine)
  function jourDeSport() {
    const p = P(), auj = Decouverte.SEMAINE[(new Date().getDay() + 6) % 7];
    const s = (p.programme || []).find(x => x.jour === auj);
    return s ? FICHES.find(f => f.id === s.id) : null;
  }
  // Journée type avec les recettes de l'appli (en priorité celles qu'on peut faire avec son frigo)
  let graine = 0;
  function journee(r, sport) {
    const frigo = new Set(R().frigo || []), poudre = R().proteinePoudre === true;
    const ok = (x) => !x.poudre || poudre;
    const manque = (x) => x.ing.filter(([k]) => !INGREDIENTS[k].base && !frigo.has(k)).length;
    const choisir = (moment, deja) => {
      const l = RECETTES.filter(x => ok(x) && x.moments.includes(moment) && !deja.includes(x)).sort((a, b) => manque(a) - manque(b));
      const meilleurs = l.filter(x => manque(x) === manque(l[0] || x)); const pool = meilleurs.length > 1 ? meilleurs : l;
      return pool.length ? pool[(graine + moment.length) % pool.length] : null;
    };
    const plan = [], deja = [];
    const ajoute = (nom, moment) => { const x = choisir(moment, deja); if (x) { deja.push(x); plan.push([nom, x]); } };
    ajoute("Midi", "repas"); if (sport) { ajoute("Avant le sport", "avant"); ajoute("Après le sport", "apres"); } else ajoute("Collation", "collation"); ajoute("Soir", "repas");
    return plan;
  }
  function bloc() {
    const r = reperes(), sport = jourDeSport(), O = Decouverte.OBJECTIFS[r.obj];
    const plan = journee(r, sport), tot = plan.reduce((a, [, x]) => { const n = nutritionRecette(x); return [a[0] + n[0], a[1] + n[1]]; }, [0, 0]);
    const ouvert = R().coachNutritionOuvert !== false;
    return `<section class="bloc coach-nutri">
      <button class="ing-tete" type="button" id="cn-ouvrir"><span><b>🥗 Mon coach nutrition</b><span>${O.ico} Objectif : ${O.nom.toLowerCase()}${sport ? " · jour de sport" : " · jour de repos"}</span></span><span class="lien-txt">${ouvert ? "Fermer" : "Ouvrir"}</span></button>
      <div ${ouvert ? "" : "hidden"}>
      ${r.mineur ? `<p class="total">Avant 18 ans, pas de calcul de calories : le corps grandit encore. Mangez à votre faim, varié, avec des protéines et des légumes à chaque repas.</p>` : `
      <div class="nutri cn-reperes">
        ${r.kcal ? `<div><b>≈ ${r.kcal}</b><span>kcal / jour</span></div>` : ""}
        ${r.proteines ? `<div><b>≈ ${r.proteines} g</b><span>protéines / jour</span></div>` : ""}
        ${r.eau ? `<div><b>≈ ${String(r.eau).replace(".", ",")} L</b><span>d'eau${sport ? " + 0,5 L" : ""}</span></div>` : ""}
      </div>
      ${!r.complet ? `<p class="total">Pour avoir vos repères (calories, protéines, eau), indiquez votre âge, votre taille et votre poids :</p>
        <div class="dc-corps cn-form"><label class="champ">Âge<input id="cn-age" type="number" inputmode="numeric" min="12" max="100" value="${P().age || ""}" placeholder="ans"></label>
        <label class="champ">Taille<input id="cn-taille" type="number" inputmode="numeric" min="120" max="230" value="${P().taille || ""}" placeholder="cm"></label>
        <label class="champ">Poids<input id="cn-poids" type="text" inputmode="decimal" value="${r.poids ? String(r.poids).replace(".", ",") : ""}" placeholder="kg"></label></div>
        <button class="principal" type="button" id="cn-valider">Voir mes repères</button>` : ""}`}
      <h3>💡 Mes conseils</h3>
      <ul class="cn-conseils">${CONSEILS[r.obj].map(c => `<li>${esc(c)}</li>`).join("")}</ul>
      ${sport ? `<p class="astuce">🏋️ Aujourd'hui : <b>${esc(sport.titre)}</b>. Mangez léger 1 à 3 heures avant, et une collation avec des protéines après.</p>` : ""}
      <h3>🍽️ Idée pour aujourd'hui</h3>
      <div class="liste-fiches">${plan.map(([nom, x]) => { const n = nutritionRecette(x);
        return `<button class="fiche recette" type="button" data-recette="${x.id}"><span class="rec-ico" aria-hidden="true">${nom === "Soir" ? "🌙" : nom === "Midi" ? "☀️" : nom.startsWith("Avant") ? "⚡" : nom.startsWith("Après") ? "💪" : "🍎"}</span>
          <span><b>${nom} : ${esc(x.titre)}</b><span class="res">${n[0]} kcal · ${n[1]} g de protéines</span></span><span class="fleche" aria-hidden="true">›</span></button>`; }).join("")}</div>
      <p class="total">Ces ${plan.length} recettes : ≈ ${tot[0]} kcal et ${tot[1]} g de protéines. Ajoutez votre petit-déjeuner, du pain, des fruits ou un laitage selon votre faim${r.kcal ? ` pour approcher vos ${r.kcal} kcal` : ""}.</p>
      <button class="lien" type="button" id="cn-autre">🔄 Une autre idée</button>
      <p class="total cn-avert">Repères indicatifs, calculés à partir de votre profil. Rythmo Sport n'est pas un diététicien : ce n'est pas un régime ni un avis médical : en cas de maladie, de grossesse, de régime particulier ou de troubles alimentaires, parlez-en à un médecin ou un diététicien.</p>
      </div></section>`;
  }
  function brancher(z, redessiner, ouvrirRecette) {
    const b = z.querySelector("#cn-ouvrir"); if (!b) return;
    b.onclick = () => { R().coachNutritionOuvert = R().coachNutritionOuvert === false; Compte.sauver(); redessiner(); };
    const a = z.querySelector("#cn-autre"); if (a) a.onclick = () => { graine++; redessiner(); };
    const v = z.querySelector("#cn-valider"); if (v) v.onclick = () => {
      const pr = R().profilSport || (R().profilSport = {}), age = +z.querySelector("#cn-age").value, t = +z.querySelector("#cn-taille").value, w = parseFloat(String(z.querySelector("#cn-poids").value).replace(",", "."));
      if (age >= 12 && age <= 100) pr.age = age; if (t >= 120 && t <= 230) pr.taille = t; if (w >= 30 && w <= 250) Decouverte.noterPoids(w);
      Compte.sauver(); redessiner(); };
    z.querySelectorAll(".coach-nutri [data-recette]").forEach(x => x.onclick = () => ouvrirRecette(x.dataset.recette));
  }
  return { bloc, brancher, reperes };
})();
