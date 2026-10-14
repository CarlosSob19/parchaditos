// Verifica que ningún QR impreso se rompa. Se corre solo antes de publicar (npm run publicar).
//
//   node tools/verificar-qr.mjs                       revisa los archivos de web/
//   node tools/verificar-qr.mjs --url https://dominio  además prueba cada QR en la web publicada
//
// Cada ruta que alguna vez tuvo QR queda anotada en tools/qr-impresos.json y no se borra sola:
// aunque quites una mesa de TABLES o cambies _redirects, esa ruta tiene que seguir funcionando.
// Si de verdad retiraste un QR (lo despegaste del local), borra su línea de qr-impresos.json a mano.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "web");
const REGISTRO = path.join(ROOT, "tools", "qr-impresos.json");

const errores = [];
const avisos = [];
const falla = (m) => errores.push(m);
const avisa = (m) => avisos.push(m);
const leer = (f) => fs.readFileSync(path.join(WEB, f), "utf8");
const existe = (f) => fs.existsSync(path.join(WEB, f));

/* ---------- config.js: si tiene un error, se cae toda la web ---------- */
let cfg = {};
try {
  const code = leer("js/config.js") + "\n;({ TABLES, SERVICES, OCCASIONS, INFO })";
  cfg = vm.runInNewContext(code, {}, { filename: "web/js/config.js" });
} catch (e) {
  falla(`web/js/config.js tiene un error y la web no cargaría: ${e.message}`);
}
const TABLES = cfg.TABLES || [];
const SERVICES = cfg.SERVICES || [];
const OCCASIONS = cfg.OCCASIONS || [];
const INFO = cfg.INFO || {};

/* ---------- _redirects (camino principal) ---------- */
const reglas = [];
if (!existe("_redirects")) falla("Falta web/_redirects: ningún QR funcionaría en Cloudflare.");
else {
  for (const linea of leer("_redirects").split(/\r?\n/)) {
    const t = linea.trim();
    if (!t || t.startsWith("#")) continue;
    const [desde, hacia] = t.split(/\s+/);
    reglas.push({ desde, hacia });
  }
}

function resolver(mapa, ruta) {
  for (const [desde, hacia] of mapa) {
    const patron = new RegExp("^" + desde.replace(/:[a-z]+/gi, "([a-z0-9-]+)") + "$", "i");
    const m = ruta.match(patron);
    if (m) {
      const valor = m[1];
      return hacia.replace(/:[a-z]+/gi, valor);
    }
  }
  return null;
}

/* ---------- 404.html (plan B) ---------- */
let planB = [];
if (!existe("404.html")) falla("Falta web/404.html: se perdió el plan B de los QR.");
else {
  const m = leer("404.html").match(/<script id="qr-rutas" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) falla('web/404.html ya no tiene el bloque <script id="qr-rutas">: se perdió el plan B de los QR.');
  else {
    try { planB = Object.entries(JSON.parse(m[1])); }
    catch (e) { falla(`El bloque qr-rutas de web/404.html no es JSON válido: ${e.message}`); }
  }
}

/* ---------- Registro de QR impresos ---------- */
let registro = { nota: "", rutas: [] };
try { registro = JSON.parse(fs.readFileSync(REGISTRO, "utf8")); } catch (e) {}
const actuales = [
  ...reglas.map((r) => r.desde).filter((d) => !d.includes(":")),
  ...TABLES.map((t) => `/m/${t.id}`),
];
const nuevas = actuales.filter((r) => !registro.rutas.includes(r));
if (nuevas.length) {
  registro.rutas.push(...nuevas);
  registro.nota = "Rutas con QR. Se agregan solas y no se borran solas: cada una tiene que seguir funcionando. Si despegaste un QR del local para siempre, puedes borrar su línea.";
  fs.writeFileSync(REGISTRO, JSON.stringify(registro, null, 2) + "\n");
  console.log(`Registradas ${nuevas.length} rutas nuevas en tools/qr-impresos.json: ${nuevas.join(", ")}`);
}

/* ---------- Revisar cada QR ---------- */
const mapaReglas = reglas.map((r) => [r.desde, r.hacia]);
const destinos = {};

for (const ruta of registro.rutas) {
  const destino = resolver(mapaReglas, ruta);
  const plan = resolver(planB, ruta);
  if (!destino) { falla(`${ruta}: no tiene regla en web/_redirects.`); continue; }
  if (plan !== destino) falla(`${ruta}: _redirects lleva a "${destino}" pero el plan B de 404.html lleva a "${plan}". Deben ser iguales.`);
  destinos[ruta] = destino;

  const url = new URL(destino, "https://x");
  const archivo = url.pathname.replace(/^\//, "") || "index.html";
  if (!existe(archivo)) { falla(`${ruta}: lleva a ${url.pathname}, que ya no existe en web/.`); continue; }

  const mesa = url.searchParams.get("mesa");
  if (mesa !== null) {
    if (!TABLES.some((t) => t.id === mesa.toLowerCase()))
      falla(`${ruta}: la mesa "${mesa}" tiene QR impreso pero ya no está en TABLES de config.js. Vuelve a ponerla: el nombre se puede cambiar, el id no.`);
    const html = leer(archivo);
    if (!/js\/mesa\.js/.test(html)) falla(`${ruta}: ${archivo} ya no carga js/mesa.js, así que el modo mesa no se activaría.`);
    if (!/js\/config\.js/.test(html)) falla(`${ruta}: ${archivo} ya no carga js/config.js.`);
  }
  const servicio = url.searchParams.get("servicio");
  if (servicio !== null && !SERVICES.some((s) => s.id === servicio))
    falla(`${ruta}: el servicio "${servicio}" ya no está en SERVICES de config.js. Vuelve a ponerlo con ese mismo id.`);
  const ocasion = url.searchParams.get("ocasion");
  if (ocasion !== null && !OCCASIONS.some((o) => o.toLowerCase() === ocasion.toLowerCase()))
    avisa(`${ruta}: la ocasión "${ocasion}" ya no está en OCCASIONS. El QR abre la reserva, pero sin la ocasión elegida.`);
  if (archivo === "ir-resena.html") {
    if (!/js\/config\.js/.test(leer(archivo))) falla(`${ruta}: ir-resena.html ya no carga js/config.js.`);
    if (!/^https?:\/\//i.test(INFO.resenas || "")) avisa(`${ruta}: INFO.resenas está vacío. El QR de reseñas lleva al inicio en vez de Google.`);
  }
}

/* ---------- Prueba en la web publicada ---------- */
const i = process.argv.indexOf("--url");
if (i > -1 && !errores.length) {
  const base = (process.argv[i + 1] || "").replace(/\/+$/, "");
  if (!/^https?:\/\//.test(base)) falla("Uso: --url https://tu-dominio.com");
  else {
    console.log(`Probando ${Object.keys(destinos).length} QR en ${base} …`);
    const limpio = (p) => p.replace(/\.html$/, "").replace(/\/index$/, "/").replace(/\/+$/, "") || "/";
    for (const [ruta, destino] of Object.entries(destinos)) {
      const esperado = new URL(destino, base);
      let ok = false, detalle = "";
      for (let intento = 0; intento < 4 && !ok; intento++) {
        if (intento) await new Promise((r) => setTimeout(r, 5000)); // la publicación tarda unos segundos en verse
        try {
          const res = await fetch(base + ruta, { redirect: "follow", headers: { "cache-control": "no-cache" } });
          const final = new URL(res.url);
          const mismaPagina = limpio(final.pathname) === limpio(esperado.pathname);
          const mismosDatos = [...esperado.searchParams].every(([k, v]) => final.searchParams.get(k) === v);
          ok = res.ok && mismaPagina && mismosDatos;
          detalle = `respondió ${res.status} en ${final.pathname}${final.search}`;
        } catch (e) { detalle = e.message; }
      }
      if (ok) console.log(`  ✓ ${ruta}`);
      else falla(`${ruta} en ${base}: ${detalle}; debía llegar a ${esperado.pathname}${esperado.search}.`);
    }
  }
}

/* ---------- Resultado ---------- */
for (const a of avisos) console.log(`AVISO  ${a}`);
if (errores.length) {
  for (const e of errores) console.error(`ERROR  ${e}`);
  console.error(`\n${errores.length} problema(s): algún QR impreso dejaría de funcionar. No publiques hasta arreglarlo.`);
  process.exit(1);
}
console.log(`OK: los ${registro.rutas.length} QR registrados funcionan.`);
