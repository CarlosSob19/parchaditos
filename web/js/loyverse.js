// Catálogo desde Loyverse. window.loadCatalog() resuelve un array con la misma forma que PRODUCTS:
// { id, cat, nombre, detalle, precio, img, agotado }.
// Si LOYVERSE.activo es false o la función /api/catalogo falla, resuelve PRODUCTS de config.js.
window.loadCatalog = (() => {
  let promise = null;

  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  async function fetchCatalog() {
    const res = await fetch("/api/catalogo", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`catalogo ${res.status}`);
    const data = await res.json();
    const seen = new Set();
    const list = (data.productos || [])
      .filter((p) => LOYVERSE.categorias[p.categoria])
      .map((p) => {
        // La foto local de config.js (mismo nombre) gana sobre la de Loyverse.
        const local = PRODUCTS.find((x) => x.nombre.toLowerCase() === p.nombre.toLowerCase());
        let id = slug(`${p.nombre} ${p.detalle}`) || "producto";
        while (seen.has(id)) id += "-2";
        seen.add(id);
        return {
          id,
          cat: LOYVERSE.categorias[p.categoria],
          nombre: p.nombre,
          detalle: p.detalle || (local ? local.detalle : ""),
          precio: p.precio,
          img: (local && local.img) || p.img || null,
          agotado: Boolean(p.agotado),
        };
      });
    if (!list.length) throw new Error("catalogo vacío");
    return list;
  }

  return function load() {
    if (load.retry) { promise = null; load.retry = false; load.fallback = false; }
    if (!promise) {
      promise = LOYVERSE.activo
        ? fetchCatalog().catch((err) => {
          console.warn("Loyverse no respondió, uso PRODUCTS:", err.message);
          window.loadCatalog.fallback = true; // la página avisa que los precios pueden no estar al día
          return PRODUCTS;
        })
        : Promise.resolve(PRODUCTS);
    }
    return promise;
  };
})();
