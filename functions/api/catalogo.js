// Cloudflare Pages Function: GET /api/catalogo
// Lee productos, precios y existencias de Loyverse y devuelve solo lo que la web necesita.
// El token de Loyverse nunca llega al navegador: vive en Cloudflare como variable secreta.
//
// Variables (Cloudflare → proyecto de Pages → Settings → Variables and Secrets):
//   LOYVERSE_TOKEN     (obligatoria, tipo Secret) token creado en Loyverse → Configuración → Tokens de acceso
//   LOYVERSE_STORE_ID  (opcional) id de la tienda si la cuenta tiene varias; vacío = la primera

const API = "https://api.loyverse.com/v1.0";
const CACHE_SECONDS = 60;

let memo = null; // { at, body } por instancia, para no llamar a Loyverse en cada visita

export async function onRequestGet({ env }) {
  if (!env.LOYVERSE_TOKEN) return json({ error: "Falta LOYVERSE_TOKEN" }, 503);

  if (memo && Date.now() - memo.at < CACHE_SECONDS * 1000) return json(memo.body);

  try {
    const get = (path, key) => fetchAll(path, key, env.LOYVERSE_TOKEN);
    const [items, categories, levels, stores] = await Promise.all([
      get("/items", "items"),
      get("/categories", "categories"),
      get("/inventory", "inventory_levels"),
      get("/stores", "stores"),
    ]);

    const storeId = env.LOYVERSE_STORE_ID || (stores[0] && stores[0].id);
    const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const stock = new Map(levels.filter((l) => l.store_id === storeId).map((l) => [l.variant_id, l.in_stock]));

    const productos = [];
    for (const item of items) {
      if (item.deleted_at) continue;
      const variants = item.variants || [];
      for (const v of variants) {
        if (v.deleted_at) continue;
        const store = (v.stores || []).find((s) => s.store_id === storeId);
        if (store && store.available_for_sale === false) continue;

        const price = store && store.pricing_type === "FIXED" ? store.price : v.default_pricing_type === "FIXED" ? v.default_price : null;
        const optionValues = [v.option1_value, v.option2_value, v.option3_value].filter(Boolean).join(" · ");
        productos.push({
          categoria: catName[item.category_id] || "",
          nombre: item.item_name,
          detalle: variants.length > 1 ? optionValues : "",
          precio: typeof price === "number" && price > 0 ? price : null,
          agotado: Boolean(item.track_stock && stock.has(v.variant_id) && stock.get(v.variant_id) <= 0),
          img: item.image_url || null,
        });
      }
    }

    const body = { actualizado: new Date().toISOString(), productos };
    memo = { at: Date.now(), body };
    return json(body);
  } catch (err) {
    // Si Loyverse falla, la web usa los productos de config.js.
    // El detalle va solo a los logs de Cloudflare; al cliente, un mensaje genérico.
    console.error("catalogo:", (err && (err.stack || err.message)) || String(err));
    return json({ error: "No se pudo leer el catálogo" }, 502);
  }
}

async function fetchAll(path, key, token) {
  const out = [];
  let cursor = "";
  for (let page = 0; page < 20; page++) {
    const url = `${API}${path}?limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Loyverse ${path} respondió ${res.status}`);
    const data = await res.json();
    out.push(...(data[key] || []));
    if (!data.cursor) break;
    cursor = data.cursor;
  }
  return out;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Datos públicos (lo mismo que se ve en la carta): la app de Expo en navegador también los puede leer.
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": status === 200 ? `public, max-age=${CACHE_SECONDS}` : "no-store",
    },
  });
}
