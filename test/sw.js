// Fait marcher l'appli même sans réseau (à la salle, au sous-sol…).
// Changer VERSION à chaque mise à jour pour que les téléphones prennent la nouvelle version.
const VERSION = "20261030222908";
const COQUILLE = ["./", "index.html", "style.css", "config.js", "lib/supabase.js", "lib/591.supabase.js", "lib/qrcode.js", "avertissement.js", "exercices.js", "explications.js", "fiches.js", "defi.js",
  "compte.js", "commun.js", "minuteur.js", "app.js", "version.js", "voix.js", "guide.js", "gps.js", "coach.js", "decouverte.js", "recettes-data.js", "coach-nutrition.js", "recettes.js", "musique-seance.js", "lib/leaflet/leaflet.js", "lib/leaflet/leaflet.css", "tv.html", "manifest.webmanifest", "icones/icone-192.png", "icones/icone-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open("appli-" + VERSION).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== "appli-" + VERSION && n !== "photos").map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Photos et polices : gardées une fois vues (elles ne changent pas)
  if (url.pathname.includes("/photos/") || url.pathname.includes("/musique/") || url.pathname.includes("/voix/") || url.pathname.includes("/guide/") || url.hostname.includes("fonts.g")) {
    // Musiques : on garde le fichier entier (le lecteur demande parfois juste un morceau du fichier)
    const req = url.pathname.includes("/musique/") ? new Request(url.href) : e.request;
    e.respondWith(caches.open("photos").then(async c => { const r = await c.match(req); if (r) return r;
      const n = await fetch(req); if (n.status === 200 || n.type === "opaque") c.put(req, n.clone()); return n; }));
    return;
  }
  if (url.origin !== location.origin) return;   // comptes en ligne : toujours le réseau
  // L'appli : d'abord le réseau (pour avoir la dernière version), sinon la copie gardée
  // cache: "no-cache" = on demande toujours au serveur s'il y a du nouveau (sinon le navigateur garde l'ancienne version 10 minutes)
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { if (r.ok) { const copie = r.clone(); caches.open("appli-" + VERSION).then(c => c.put(e.request, copie)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});
