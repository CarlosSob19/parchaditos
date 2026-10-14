// Página de productos: catálogo con filtros, búsqueda, carrito y preguntas frecuentes.
(() => {
  const { animate, esc } = Site;
  const CATS = CATEGORIES.filter((c) => c.activo);
  const catName = (id) => (CATS.find((c) => c.id === id) || { nombre: "" }).nombre;
  const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  // Modo mesa (mesa.js): los productos van al pedido de la mesa y el carrito normal se oculta.
  const mesa = () => window.Mesa && window.Mesa.active;
  const norm = (t) => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  let products = PRODUCTS;
  const asked = new URLSearchParams(location.search).get("cat");
  let filter = CATS.some((c) => c.id === asked) ? asked : "todos";
  let query = "";

  renderTabs();
  renderFaq();
  Site.splitChars();
  Site.splitWords();
  // Con Loyverse activo se muestran tarjetas "fantasma" mientras llega el catálogo real
  // (nada de pintar la lista de ejemplo y cambiar precios en la cara del cliente).
  const live = typeof LOYVERSE !== "undefined" && LOYVERSE.activo && typeof window.loadCatalog === "function";
  if (live) renderSkeleton();
  else renderCatalog(false);
  bindCatalog();

  if (window.Cart) Cart.setCatalog(products);
  if (live) fetchLive();

  function fetchLive() {
    window.loadCatalog().then((list) => {
      if (Array.isArray(list) && list.length) products = list;
      if (window.Cart) Cart.setCatalog(products);
      renderCatalog(false);
      showNotice(window.loadCatalog.fallback);
    });
  }

  function renderSkeleton() {
    const grid = document.getElementById("productGrid");
    grid.setAttribute("aria-busy", "true");
    grid.innerHTML = Array.from({ length: 6 }, () => `
      <div class="card card--ghost" aria-hidden="true">
        <div class="card__media"></div>
        <div class="card__body"><i></i><i></i><i></i></div>
      </div>`).join("");
    document.getElementById("resultCount").textContent = "Cargando…";
  }

  // Si Loyverse no respondió: se muestra la lista guardada y un aviso con opción de reintentar.
  function showNotice(on) {
    let note = document.getElementById("catalogNote");
    if (!on) { if (note) note.remove(); return; }
    if (!note) {
      document.getElementById("productGrid").insertAdjacentHTML("beforebegin", `
        <p class="catalog__note" id="catalogNote" role="status">
          <span>No pudimos traer los precios de hoy. Te mostramos la carta guardada; confirma el precio por WhatsApp.</span>
          <button type="button" class="catalog__retry">Reintentar</button>
        </p>`);
      note = document.getElementById("catalogNote");
      note.querySelector("button").addEventListener("click", (e) => {
        e.currentTarget.disabled = true;
        e.currentTarget.textContent = "Cargando…";
        window.loadCatalog.retry = true;
        fetchLive();
      });
    } else {
      const b = note.querySelector("button");
      b.disabled = false;
      b.textContent = "Reintentar";
    }
  }
  if (window.Cart) Cart.onChange(() => paintQty());

  Site.onUnlock(() => {
    if (!animate) return;
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from(".pg__title .char", { yPercent: 115, duration: 1.1, stagger: 0.025 })
      .from(".pg__head .eyebrow, .pg__lead, .pg__bar", { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.06 }, 0.25)
      .from([...document.querySelectorAll("#productGrid > *")].slice(0, 8), { y: 24, autoAlpha: 0, duration: 0.6, stagger: 0.04 }, 0.35)
      .from(".header", { yPercent: -100, duration: 0.8, clearProps: "transform" }, 0.2);
  });

  /* ---------- Filtros ---------- */
  function renderTabs() {
    const active = (id) => id === filter;
    document.querySelector(".tabs").innerHTML = [{ id: "todos", nombre: "Todos" }, ...CATS].map((c) =>
      `<button class="tab${active(c.id) ? " is-active" : ""}" role="tab" id="tab-${c.id}" aria-selected="${active(c.id)}" aria-controls="productGrid" tabindex="${active(c.id) ? 0 : -1}" data-filter="${c.id}">${esc(c.nombre)}</button>`).join("");
  }

  function setFilter(next, focus = false) {
    filter = next;
    document.querySelectorAll(".tab").forEach((t) => {
      const on = t.dataset.filter === next;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    // La categoría queda en la URL para compartirla (productos.html?cat=licores).
    const url = new URL(location.href);
    if (next === "todos") url.searchParams.delete("cat");
    else url.searchParams.set("cat", next);
    history.replaceState(history.state, "", url);
    renderCatalog();
    keepGridInView();
    const tab = document.querySelector(`.tab[data-filter="${next}"]`);
    if (tab) tab.scrollIntoView({ block: "nearest", inline: "center", behavior: animate ? "smooth" : "auto" });
  }

  // Si el visitante está abajo y cambia de categoría o busca, sube hasta los productos (no queda viendo el pie).
  function keepGridInView() {
    const grid = document.getElementById("productGrid");
    const bar = document.querySelector(".pg__bar");
    if (grid.getBoundingClientRect().top >= (bar ? bar.offsetHeight : 0)) return;
    const top = document.getElementById("catalogo") || grid;
    const y = top.getBoundingClientRect().top + window.scrollY - 8;
    if (Site.lenis) Site.lenis.scrollTo(y, { immediate: !Site.finePointer, duration: 0.6 });
    else window.scrollTo({ top: y, behavior: "auto" });
  }

  /* ---------- Catálogo ---------- */
  function renderCatalog(anim = true) {
    const grid = document.getElementById("productGrid");
    grid.removeAttribute("aria-busy");
    const active = products.filter((p) => CATS.some((c) => c.id === p.cat));
    const q = norm(query.trim());
    const list = active
      .filter((p) => filter === "todos" || p.cat === filter)
      .filter((p) => !q || norm(`${p.nombre} ${p.detalle || ""} ${catName(p.cat)}`).includes(q));
    grid.setAttribute("aria-labelledby", `tab-${filter}`);

    grid.innerHTML = list.map((p) => {
      const cat = catName(p.cat);
      const media = p.img
        ? `<img src="${esc(p.img)}" alt="${esc(p.nombre)}" loading="lazy">`
        : `${catIcon(p.cat, "card__icon")}<span class="card__ph" aria-hidden="true">${esc(cat.split(" ")[0])}</span>`;
      return `
        <article class="card${p.agotado ? " is-out" : ""}">
          <div class="card__media" data-cat="${esc(p.cat)}">${media}<span class="card__badge">${esc(cat)}</span>${p.agotado ? `<span class="card__out">Agotado</span>` : ""}</div>
          <div class="card__body">
            <h3 class="card__name">${esc(p.nombre)}</h3>
            <p class="card__detail">${esc(p.detalle || "")}</p>
            <div class="card__foot">
              <span class="card__price">${p.precio ? money.format(p.precio) : "Consultar"}</span>
              <span class="card__action" data-id="${esc(p.id)}">${actionFor(p)}</span>
            </div>
          </div>
        </article>`;
    }).join("") || `<p class="grid__empty">${q
      ? `No encontramos “${esc(query.trim())}”. Prueba con otra palabra o <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, ¿tienen ${query.trim()}?`)}" target="_blank" rel="noopener">pregúntanos por WhatsApp</a>.`
      : "No hay productos en esta categoría por ahora."}</p>`;

    document.getElementById("resultCount").textContent = `${list.length} ${list.length === 1 ? "producto" : "productos"}`;

    // Filtrar se usa mucho: entrada corta, solo las primeras tarjetas; el resto aparece de una.
    if (animate && anim) {
      gsap.from([...grid.children].slice(0, 8), { y: 12, autoAlpha: 0, duration: 0.3, ease: "power3.out", stagger: 0.03, overwrite: true });
      ScrollTrigger.refresh();
    }
  }

  // Botón de cada producto: agotado, agregar (carrito o mesa) o +/− si ya está en el pedido.
  function actionFor(p) {
    if (p.agotado) return `<button type="button" class="card__btn" disabled>Agotado</button>`;
    if (mesa()) return `<button type="button" class="card__btn" data-mesa-add="${esc(p.id)}" aria-label="Agregar ${esc(p.nombre)} al pedido de la mesa">+ Agregar</button>`;
    if (window.Cart && Cart.qty(p.id) > 0) return Cart.qtyControl(p);
    if (window.Cart) return `<button type="button" class="card__btn" data-cart-step="1" data-id="${esc(p.id)}" aria-label="Agregar ${esc(p.nombre)} al pedido">+ Agregar</button>`;
    const msg = encodeURIComponent(`Hola, quiero pedir: ${p.nombre} (${catName(p.cat)}).`);
    return `<a class="card__btn" href="https://wa.me/${WHATSAPP}?text=${msg}" target="_blank" rel="noopener">Pedir</a>`;
  }

  // Al cambiar el carrito solo se repinta el botón de cada tarjeta (sin rehacer la grilla).
  function paintQty() {
    document.querySelectorAll(".card__action").forEach((el) => {
      const p = products.find((x) => x.id === el.dataset.id);
      if (!p) return;
      const focused = el.contains(document.activeElement) && document.activeElement.dataset.cartStep;
      el.innerHTML = actionFor(p);
      if (focused) {
        const again = el.querySelector(`[data-cart-step="${focused}"]`) || el.querySelector("button");
        if (again) again.focus({ preventScroll: true });
      }
    });
  }

  function bindCatalog() {
    const tabs = [...document.querySelectorAll(".tab")];
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => setFilter(t.dataset.filter));
      // Flechas, Inicio y Fin para moverse entre filtros (patrón de pestañas accesibles).
      t.addEventListener("keydown", (e) => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        setFilter(tabs[(to + tabs.length) % tabs.length].dataset.filter, true);
      });
    });

    let timer = 0;
    document.getElementById("search").addEventListener("input", (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => { query = e.target.value; renderCatalog(); keepGridInView(); }, 150);
    });

    // Celular: la búsqueda es un botón redondo junto a los filtros; al tocarlo se abre y ocupa la barra.
    const bar = document.querySelector(".pg__bar");
    const search = document.getElementById("search");
    search.addEventListener("focus", () => bar.classList.add("is-searching"));
    search.addEventListener("blur", () => { if (!search.value.trim()) bar.classList.remove("is-searching"); });
    document.getElementById("searchClose").addEventListener("click", () => {
      search.value = "";
      query = "";
      renderCatalog();
      bar.classList.remove("is-searching");
      search.blur();
    });

    // Pestañas que se salen de la pantalla: el desvanecido se quita al llegar al final.
    const tabsBox = document.querySelector(".tabs");
    const edge = () => tabsBox.classList.toggle("is-end", tabsBox.scrollLeft + tabsBox.clientWidth >= tabsBox.scrollWidth - 4);
    tabsBox.addEventListener("scroll", edge, { passive: true });
    edge();
    const current = tabsBox.querySelector(".is-active");
    if (current && current.offsetLeft > tabsBox.clientWidth * 0.6) tabsBox.scrollLeft = current.offsetLeft - 16;

    document.getElementById("productGrid").addEventListener("click", (e) => {
      const b = e.target.closest("[data-mesa-add]");
      if (!b || !mesa()) return;
      const p = products.find((x) => x.id === b.dataset.mesaAdd);
      if (p) window.Mesa.add(p);
    });
  }

  /* ---------- Preguntas frecuentes + datos para Google ---------- */
  function renderFaq() {
    const box = document.getElementById("faqList");
    if (!box || typeof FAQ === "undefined" || !FAQ.length) {
      const sec = document.getElementById("preguntas");
      if (sec) sec.hidden = true;
      return;
    }
    box.innerHTML = FAQ.map((f) => `<details class="faq__item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
    document.head.appendChild(ld);
    if (animate) {
      box.addEventListener("toggle", () => ScrollTrigger.refresh(), true);
      gsap.from(".faq__item", { y: 30, autoAlpha: 0, duration: 0.8, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: box, start: "top 88%" } });
    }
  }
})();
