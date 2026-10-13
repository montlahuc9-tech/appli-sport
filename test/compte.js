// Compte, accès et sauvegarde.
// Avec les clés Supabase (config.js) : vrai compte e-mail + mot de passe, et Alex décide qui entre
// (table « membres »), peut bloquer / supprimer quelqu'un, ou fermer toute l'appli (table « appli »).
// Sans clés : inscription gardée sur le téléphone (mode hors ligne, sans contrôle).
window.Compte = (() => {
  const CFG = window.CONFIG || {};
  const ENV = CFG.environnement === "test" ? "test" : "prod";
  const P = ENV === "test" ? "ms-test" : "ms";   // la version test garde ses affaires à part sur le téléphone
  const enLigne = !!(CFG.supabaseUrl && CFG.supabaseKey && window.supabase);
  const sb = enLigne ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: P + "-session" } }) : null;
  const lire = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? def; } catch { return def; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const vide = () => ({ seances: [], historique: [], charges: {}, reglages: {}, maj: 0 });

  let utilisateur = null;   // { email, prenom, id?, role? }
  let donnees = vide();
  let acces = { ok: true }; // { ok, raison: "attente" | "bloque" | "ferme" | "test", message }
  let attente = null, ecouteurs = [];
  const cleDonnees = () => `${P}-donnees:` + (utilisateur ? utilisateur.email.toLowerCase() : "?");
  const normal = (d) => Object.assign(vide(), d || {});
  const depuisSession = (u) => ({ id: u.id, email: (u.email || "").toLowerCase(), prenom: (u.user_metadata && u.user_metadata.prenom) || (u.email || "").split("@")[0] });

  // Qui a le droit d'entrer ? (vérifié à chaque ouverture de l'appli)
  async function verifierAcces() {
    const memo = lire(P + "-acces", { ok: true });
    try {
      const [{ data: app }, { data: moi, error }] = await Promise.all([
        sb.from("appli").select("ouverte, message").eq("id", 1).maybeSingle(),
        sb.from("membres").select("actif, test, role, prenom, jusqu_au").eq("email", utilisateur.email).maybeSingle()
      ]);
      if (error) throw error;
      let m = moi;
      if (!m) { // première fois : on se met dans la liste d'attente, Alex activera
        await sb.from("membres").insert({ email: utilisateur.email, prenom: utilisateur.prenom });
        m = { actif: false, test: false, role: "membre" };
      }
      utilisateur.role = m.role;
      const admin = m.role === "admin" && m.actif;
      if (app && !app.ouverte && !admin) acces = { ok: false, raison: "ferme", message: app.message || "" };
      else if (m.actif && m.role !== "admin" && m.jusqu_au && m.jusqu_au < new Date().toISOString().slice(0, 10)) acces = { ok: false, raison: "fin" };
      else if (!m.actif) acces = { ok: false, raison: m.role === "membre" && !memo.vuActif ? "attente" : "bloque" };
      else if (ENV === "test" && !m.test && !admin) acces = { ok: false, raison: "test" };
      else acces = { ok: true, vuActif: true };
      if (m.actif) acces.vuActif = true;
    } catch { acces = memo; }   // pas de réseau : on garde la dernière réponse connue
    ecrire(P + "-acces", acces);
  }
  async function chargerEnLigne() {
    const local = normal(lire(cleDonnees(), null));
    if (!acces.ok) { donnees = local; return; }
    try {
      const { data, error } = await sb.from("donnees").select("contenu").eq("user_id", utilisateur.id).eq("env", ENV).maybeSingle();
      if (error) throw error;
      const distant = data && data.contenu ? normal(data.contenu) : null;
      donnees = distant && (distant.maj || 0) >= (local.maj || 0) ? distant : local;
      if (!distant || (local.maj || 0) > (distant.maj || 0)) envoyer();
    } catch { donnees = local; }
    ecrire(cleDonnees(), donnees);
  }
  async function envoyer() {
    if (!sb || !utilisateur || !utilisateur.id || !acces.ok) return;
    try { await sb.from("donnees").upsert({ user_id: utilisateur.id, env: ENV, email: utilisateur.email, prenom: utilisateur.prenom, contenu: donnees, maj: new Date().toISOString() }); } catch {}
  }
  async function apresConnexion(u) {
    utilisateur = depuisSession(u); ecrire(P + "-compte", utilisateur);
    await verifierAcces(); await chargerEnLigne();
  }

  return {
    enLigne, env: ENV,
    get utilisateur() { return utilisateur; },
    get donnees() { return donnees; },
    get acces() { return acces; },
    get estAdmin() { return !!(utilisateur && utilisateur.role === "admin" && acces.ok); },
    async init() {
      if (enLigne) {
        try {
          const { data } = await sb.auth.getSession();
          const u = data && data.session && data.session.user;
          if (u) await apresConnexion(u);
        } catch {
          const c = lire(P + "-compte", null); if (c) { utilisateur = c; acces = lire(P + "-acces", { ok: true }); donnees = normal(lire(cleDonnees(), null)); }
        }
      } else {
        const c = lire(P + "-compte", null);
        if (c && c.email) { utilisateur = c; donnees = normal(lire(cleDonnees(), null)); }
      }
      return utilisateur;
    },
    async reverifier() { if (enLigne && utilisateur) { await verifierAcces(); if (acces.ok) await chargerEnLigne(); } return acces; },
    async inscrire({ prenom, email, mdp }) {
      email = (email || "").trim().toLowerCase(); prenom = (prenom || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Cette adresse e-mail ne semble pas correcte.");
      if (!prenom) throw new Error("Indiquez votre prénom.");
      if (enLigne) {
        if (!mdp || mdp.length < 6) throw new Error("Le mot de passe doit faire au moins 6 caractères.");
        const { data, error } = await sb.auth.signUp({ email, password: mdp, options: { data: { prenom } } });
        if (error) throw new Error(/registered|exists/i.test(error.message) ? "Ce compte existe déjà : connectez-vous." : error.message);
        if (!data.session) return { confirmer: true };
        await apresConnexion(data.user);
      } else {
        utilisateur = { email, prenom }; ecrire(P + "-compte", utilisateur);
        donnees = normal(lire(cleDonnees(), null));
      }
      return { ok: true };
    },
    async connecter({ email, mdp }) {
      email = (email || "").trim().toLowerCase();
      if (!enLigne) throw new Error("Pas de connexion en ligne : utilisez « Créer mon compte ».");
      const { data, error } = await sb.auth.signInWithPassword({ email, password: mdp });
      if (error) throw new Error(/invalid/i.test(error.message) ? "E-mail ou mot de passe incorrect." : /confirm/i.test(error.message) ? "Confirmez d'abord votre e-mail (lien reçu par mail)." : error.message);
      await apresConnexion(data.user);
      return { ok: true };
    },
    async motDePasseOublie(email) {
      if (!enLigne) return;
      const { error } = await sb.auth.resetPasswordForEmail((email || "").trim().toLowerCase(), { redirectTo: location.origin + location.pathname });
      if (error) throw new Error(error.message);
    },
    async deconnecter() {
      if (sb) { try { await sb.auth.signOut(); } catch {} }
      utilisateur = null; donnees = vide(); acces = { ok: true };
      try { localStorage.removeItem(P + "-compte"); localStorage.removeItem(P + "-acces"); } catch {}
    },
    async changerPrenom(prenom) {
      prenom = (prenom || "").trim(); if (!prenom || !utilisateur) return;
      utilisateur.prenom = prenom; ecrire(P + "-compte", utilisateur);
      if (sb) { try { await sb.auth.updateUser({ data: { prenom } }); } catch {} }
      this.sauver();
    },
    sauver() {
      if (!utilisateur) return;
      donnees.maj = Date.now(); ecrire(cleDonnees(), donnees);
      if (enLigne) { clearTimeout(attente); attente = setTimeout(envoyer, 1500); }
      ecouteurs.forEach(f => { try { f(); } catch {} });
    },
    surChangement(f) { ecouteurs.push(f); },
    // Lien « mot de passe oublié » reçu par mail : l'appli s'ouvre et demande le nouveau mot de passe
    surRecuperation(f) { if (sb) sb.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") f(); }); },
    async nouveauMdp(mdp) {
      if (!mdp || mdp.length < 6) throw new Error("Le mot de passe doit faire au moins 6 caractères.");
      const { data, error } = await sb.auth.updateUser({ password: mdp }); if (error) throw new Error(error.message);
      if (data && data.user) await apresConnexion(data.user);
    },

    // ---------- Gestion (Alex seulement : la base refuse ces actions aux autres) ----------
    admin: {
      async membres() { const { data, error } = await sb.from("membres").select("*").order("ajoute", { ascending: false }); if (error) throw error; return data || []; },
      async modifier(email, champs) { const { error } = await sb.from("membres").update(champs).eq("email", email); if (error) throw error; },
      async ajouter(email, prenom, test) { const { error } = await sb.from("membres").upsert({ email: email.trim().toLowerCase(), prenom: prenom || "", actif: true, test: !!test }); if (error) throw error; },
      async supprimer(email) { // retire la personne et efface ses séances
        await sb.from("donnees").delete().eq("email", email);
        const { error } = await sb.from("membres").delete().eq("email", email); if (error) throw error; },
      async etatAppli() { const { data } = await sb.from("appli").select("ouverte, message").eq("id", 1).maybeSingle(); return data || { ouverte: true, message: "" }; },
      async majAppli(champs) { const { error } = await sb.from("appli").update(champs).eq("id", 1); if (error) throw error; }
    }
  };
})();
