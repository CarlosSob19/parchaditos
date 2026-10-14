// Service worker: la web abre sin internet con la última versión que el visitante vio.
// - Páginas, CSS y JS propios: primero la red (siempre lo más nuevo); sin conexión, lo guardado.
// - Librerías de CDN y fuentes (URLs con versión fija): primero lo guardado.
// - /api/ y las rutas de los QR: siempre a la red, nunca se guardan.
// Si cambias algo de este archivo, sube VERSION para que el navegador instale el nuevo.
const VERSION = "parche-v1";
const PAGES = ["/", "/index.html", "/productos.html", "/reservas.html", "/contacto.html", "/privacidad.html", "/404.html"];
const CDN = ["https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://fonts.gstatic.com"];
const MAX_ENTRIES = 150;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PAGES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// La página manda la lista de archivos que ya cargó, para tenerlos desde la primera visita.
self.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "warm" || !Array.isArray(e.data.urls)) return;
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    for (const url of e.data.urls.slice(0, 60)) {
      if (!cacheable(new URL(url))) continue;
      if (await c.match(url)) continue;
      try {
        const res = await fetch(url, { mode: url.startsWith(self.location.origin) ? "same-origin" : "cors", credentials: "omit" });
        if (res.ok) await c.put(url, res);
      } catch (err) { /* sin red: se guarda en la próxima visita */ }
    }
    await trim(c);
  })());
});

function cacheable(u) {
  if (u.origin === self.location.origin) return !u.pathname.startsWith("/api/") && !u.pathname.startsWith("/m/");
  return CDN.includes(u.origin);
}

async function trim(c) {
  const keys = await c.keys();
  const extra = keys.length - MAX_ENTRIES;
  // Lo más viejo primero (las páginas base nunca se sacan).
  for (let i = 0, n = 0; i < keys.length && n < extra; i++) {
    if (PAGES.includes(new URL(keys[i].url).pathname)) continue;
    await c.delete(keys[i]);
    n++;
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (!cacheable(u)) return;

  if (u.origin !== self.location.origin) {
    // CDN y fuentes: la URL ya trae versión, así que lo guardado sirve tal cual.
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === "opaque") {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    })));
    return;
  }

  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok && res.type === "basic") {
        const copy = res.clone();
        e.waitUntil(caches.open(VERSION).then((c) => c.put(req, copy)));
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
      if (hit) return hit;
      // Página que no estaba guardada: 404.html redirige las rutas cortas de los QR y si no, ofrece volver.
      if (req.mode === "navigate") return (await caches.match("/404.html")) || Response.error();
      // Un CSS o JS de otra versión: sirve el más parecido que tengamos.
      if (/\.(css|js)$/.test(u.pathname)) {
        const c = await caches.open(VERSION);
        const same = (await c.keys()).filter((k) => new URL(k.url).pathname === u.pathname).pop();
        if (same) return c.match(same);
      }
      return Response.error();
    }
  })());
});
