// Écran Recettes : on coche ce qu'on a chez soi, l'appli montre les recettes faisables (et celles où il manque 1 ingrédient).
window.Recettes = (() => {
  const $id = (i) => document.getElementById(i);
  const R = () => Compte.donnees.reglages;
  const frigo = () => new Set(R().frigo || []);
  const MOMENTS = { tout: "Tout", avant: "⚡ Avant le sport", apres: "💪 Après le sport", repas: "🍽️ Repas", collation: "🍎 Collation" };
  const TAGS = { vege: "Végétarien", "sans-cuisson": "Sans cuisson", budget: "Petit budget", rapide: "Rapide" };
  let filtre = "tout", ouvert = false;
  const manquants = (r, f) => r.ing.filter(([k]) => !INGREDIENTS[k].base && !f.has(k)).map(([k]) => k);
  // Protéine en poudre : seulement pour ceux qui en prennent (par défaut : non)
  const poudre = () => R().proteinePoudre === true;
  const visible = (r) => !r.poudre || poudre();

  function dessiner() {
    const f = frigo(), z = $id("recettes-corps");
    const nb = f.size;
    // 1) Mes ingrédients
    const blocIng = Object.entries(CATS_INGREDIENTS).map(([c, nom]) => `<div class="cat-ing"><h3>${nom}</h3><div class="puces">${
      Object.entries(INGREDIENTS).filter(([, i]) => i.cat === c).map(([k, i]) => `<button type="button" data-ing="${k}" aria-pressed="${f.has(k)}">${esc(i.nom)}</button>`).join("")}</div></div>`).join("");
    // 2) Recettes
    const liste = RECETTES.filter(r => visible(r) && (filtre === "tout" || r.moments.includes(filtre)));
    const pret = [], presque = [];
    for (const r of liste) { const m = manquants(r, f); if (!m.length) pret.push(r); else if (m.length === 1) presque.push([r, m[0]]); }
    const carte = (r, manque) => { const n = nutritionRecette(r);
      return `<button class="fiche recette" type="button" data-recette="${r.id}"><span class="rec-ico" aria-hidden="true">${icone(r)}</span>
        <span><b>${esc(r.titre)}</b><span class="res">${manque ? `<span class="badge manque">Il manque : ${esc(INGREDIENTS[manque].nom.toLowerCase())}</span> ` : ""}⏱ ${r.temps} min · <em class="prot">${n[1]} g de protéines</em> · ${n[0]} kcal</span></span><span class="fleche" aria-hidden="true">›</span></button>`; };
    z.innerHTML = CoachNutrition.bloc() + `
      <section class="bloc mes-ingredients">
        <button class="ing-tete" type="button" id="ing-ouvrir"><span><b>🧺 Ce que j'ai chez moi</b><span>${nb ? `${nb} ingrédient${nb > 1 ? "s" : ""} coché${nb > 1 ? "s" : ""}` : "Touchez pour cocher vos ingrédients"}</span></span><span class="lien-txt">${ouvert ? "Fermer" : "Modifier"}</span></button>
        <div id="ing-liste" ${ouvert ? "" : "hidden"}>
          <p class="total">Sel, poivre, huile et épices : on suppose que vous en avez.</p>
          ${blocIng}
          <div class="ing-actions"><button class="lien" type="button" id="ing-vider">Tout décocher</button><button class="principal" type="button" id="ing-ok">Voir mes recettes</button></div>
        </div>
      </section>
      <div class="poudre-choix"><span>Protéine en poudre :</span><div class="puces"><button type="button" data-poudre="non" aria-pressed="${!poudre()}">Je n'en prends pas</button><button type="button" data-poudre="oui" aria-pressed="${poudre()}">J'en prends</button></div></div>
      <p class="total">Les protéines indiquées viennent des aliments (œufs, lait, viande, poisson, légumineuses)${poudre() ? ". Certaines recettes proposent en plus une version avec de la poudre." : ", pas de poudre."}</p>
      <div class="puces defilant" id="rec-moments">${Object.entries(MOMENTS).map(([k, t]) => `<button type="button" data-moment="${k}" aria-pressed="${filtre === k}">${t}</button>`).join("")}</div>
      ${nb ? `
        <h2 class="rec-titre">✅ Vous pouvez faire (${pret.length})</h2>
        <div class="liste-fiches">${pret.map(r => carte(r)).join("") || `<p class="total">Aucune recette complète avec ces ingrédients : regardez juste en dessous, il manque peu de chose.</p>`}</div>
        ${presque.length ? `<h2 class="rec-titre">🛒 Il manque 1 ingrédient (${presque.length})</h2><div class="liste-fiches">${presque.map(([r, m]) => carte(r, m)).join("")}</div>` : ""}`
      : `<h2 class="rec-titre">Toutes les recettes (${liste.length})</h2><div class="liste-fiches">${liste.map(r => carte(r)).join("")}</div>`}
      <p class="total">Valeurs nutritionnelles indicatives, pour 1 portion. Ce ne sont pas des conseils médicaux : en cas de régime particulier, demandez à un professionnel de santé.</p>`;
    $id("ing-ouvrir").onclick = () => { ouvert = !ouvert; dessiner(); };
    z.querySelectorAll("[data-ing]").forEach(b => b.onclick = () => { const s = frigo(), k = b.dataset.ing; s.has(k) ? s.delete(k) : s.add(k); R().frigo = [...s]; Compte.sauver();
      b.setAttribute("aria-pressed", String(s.has(k))); const t = z.querySelector(".mes-ingredients .ing-tete span span"); if (t) t.textContent = `${s.size} ingrédient${s.size > 1 ? "s" : ""} coché${s.size > 1 ? "s" : ""}`; });
    if ($id("ing-vider")) $id("ing-vider").onclick = () => { R().frigo = []; Compte.sauver(); dessiner(); };
    if ($id("ing-ok")) $id("ing-ok").onclick = () => { ouvert = false; dessiner(); setTimeout(() => z.querySelector(".rec-titre")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
    z.querySelectorAll("[data-poudre]").forEach(b => b.onclick = () => { R().proteinePoudre = b.dataset.poudre === "oui"; Compte.sauver(); dessiner(); });
    z.querySelectorAll("[data-moment]").forEach(b => b.onclick = () => { filtre = b.dataset.moment; dessiner(); });
    z.querySelectorAll("[data-recette]").forEach(b => b.onclick = () => ouvrirRecette(b.dataset.recette));
    CoachNutrition.brancher(z, dessiner, ouvrirRecette);
  }
  function icone(r) {
    const k = r.ing.map(i => i[0]);
    return k.includes("saumon") || k.includes("thon") || k.includes("sardines") ? "🐟" : k.includes("poulet") ? "🍗" : k.includes("steak") ? "🥩"
      : k.includes("proteine") || (r.moments.includes("avant") && k.includes("lait")) ? "🥤" : k.includes("pates") ? "🍝" : k.includes("riz") ? "🍚"
      : k.includes("oeuf") ? "🍳" : k.includes("avoine") ? "🥣" : k.includes("banane") || k.includes("pomme") ? "🍌" : "🥗";
  }
  function ouvrirRecette(id) {
    const r = RECETTES.find(x => x.id === id), f = frigo(), n = nutritionRecette(r);
    window.ouvrirFeuilleRecette(`<div class="fiche-exo recette-detail">
      <div class="infos-fiche">${r.moments.map(m => `<span class="badge type">${MOMENTS[m].replace(/^\S+ /, "")}</span>`).join("")}${r.tags.map(t => `<span class="badge maison">${TAGS[t]}</span>`).join("")}</div>
      <h2>${icone(r)} ${esc(r.titre)}</h2>
      <div class="nutri"><div><b>${n[0]}</b><span>kcal</span></div><div><b>${n[1]} g</b><span>protéines</span></div><div><b>${n[2]} g</b><span>glucides</span></div><div><b>${n[3]} g</b><span>lipides</span></div></div>
      <p class="total">⏱ ${r.temps} min · pour 1 personne</p>
      <h3>Ingrédients</h3>
      <ul class="rec-ing">${r.ing.map(([k, , t]) => `<li class="${INGREDIENTS[k].base || f.has(k) ? "ok" : "manque"}">${INGREDIENTS[k].base || f.has(k) ? "✓" : "✗"} ${esc(t)}</li>`).join("")}</ul>
      <h3>Préparation</h3>
      <ol class="rec-etapes">${r.etapes.map(e => `<li>${esc(e)}</li>`).join("")}</ol>
      ${r.astuce ? `<p class="astuce">💡 ${esc(r.astuce)}</p>` : ""}
      ${r.boost && poudre() ? `<p class="astuce boost">💪 Version protéinée : ajoutez ${r.boost === 15 ? "½ dose" : "1 dose"} de protéine en poudre (${r.boost} g), soit environ +${Math.round(r.boost * 0.78)} g de protéines.</p>` : ""}
    </div>`);
  }
  return { dessiner };
})();
