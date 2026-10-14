// Carrito: junta varios productos y los manda en un solo mensaje de WhatsApp.
// Se guarda en el navegador para que no se pierda al recargar. En "modo mesa" (mesa.js) no se usa.
// En celular se abre como hoja desde abajo y se cierra deslizándola hacia abajo.
window.Cart = (() => {
  const KEY = "pedido-v1";
  const NOTE_KEY = "pedido-nota";
  const { esc, trapFocus, lenis, animate } = Site;
  const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  const isSheet = () => window.matchMedia("(max-width: 760px)").matches;

  let catalog = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
  let items = {}; // { idProducto: cantidad }
  let delivery = "Domicilio";
  const listeners = [];

  try { items = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { items = {}; }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };
  const find = (id) => catalog.find((p) => p.id === id);
  const qty = (id) => items[id] || 0;

  // Solo cuenta productos que siguen en el catálogo y no están agotados.
  const lines = () => Object.entries(items)
    .map(([id, n]) => ({ p: find(id), n }))
    .filter((l) => l.p && !l.p.agotado && l.n > 0);
  const count = () => lines().reduce((sum, l) => sum + l.n, 0);

  function set(id, n) {
    const p = find(id);
    if (!p || p.agotado) return;
    const prev = qty(id);
    const next = Math.max(0, Math.min(20, n));
    if (next) items[id] = next;
    else delete items[id];
    save();
    emit({ id, added: next > prev });
  }
  const add = (id, n = 1) => set(id, qty(id) + n);
  const emit = (info) => listeners.forEach((cb) => cb(info));

  // Vaciar se puede deshacer durante 5 segundos.
  function clear() {
    const backup = { ...items };
    items = {};
    save();
    emit({});
    Site.toast("Pedido vaciado", "Deshacer", () => { items = backup; save(); emit({}); });
  }

  function setCatalog(list) {
    catalog = list || [];
    emit({});
  }

  function message(note) {
    const rows = lines().map(({ p, n }) => `• ${n} x ${p.nombre}${p.detalle ? ` (${p.detalle})` : ""}${p.precio ? ` · ${money.format(p.precio * n)}` : ""}`);
    const total = lines().reduce((s, { p, n }) => s + (p.precio || 0) * n, 0);
    const pending = lines().some(({ p }) => !p.precio);
    const out = ["Hola Parchaditos, quiero hacer este pedido:", "", ...rows];
    if (total) out.push("", `Total: ${money.format(total)}${pending ? " + productos por consultar" : ""}`);
    out.push("", `Entrega: ${delivery}`);
    if (note) out.push(`${delivery === "Domicilio" ? "Dirección / notas" : "Notas"}: ${note}`);
    return out.join("\n");
  }

  /* ---------- Interfaz: cajón (se crea aquí) y botón "Pedido" del dock ---------- */
  const onProducts = document.body.classList.contains("page-products");
  if (!document.getElementById("cart")) {
    const more = onProducts
      ? `<button type="button" class="cart__more" data-cart-close>Seguir comprando</button>`
      : `<a class="cart__more" href="${document.body.classList.contains("page-lost") ? "/" : ""}productos.html">Seguir viendo productos →</a>`;
    document.body.insertAdjacentHTML("beforeend", `
    <div class="cart" id="cart" hidden>
      <div class="cart__scrim" data-cart-close></div>
      <aside class="cart__panel" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
        <div class="cart__grab" aria-hidden="true"><i></i></div>
        <div class="cart__head">
          <h2 class="cart__title" id="cartTitle">Tu pedido</h2>
          <button type="button" class="cart__close" data-cart-close aria-label="Cerrar pedido">✕</button>
        </div>
        <div class="cart__body" data-lenis-prevent>
          <ul class="cart__list" id="cartList"></ul>
          <div class="cart__field" id="cartFields">
            <span class="cart__label" id="cartModeLabel">¿Cómo lo quieres?</span>
            <div class="cart__mode" role="radiogroup" aria-labelledby="cartModeLabel">
              <button type="button" role="radio" data-mode="Domicilio">Domicilio</button>
              <button type="button" role="radio" data-mode="Recoger">Paso a recoger</button>
            </div>
            <label for="cartNote" id="cartNoteLabel">Dirección y notas</label>
            <textarea id="cartNote" rows="2" placeholder="Barrio, dirección y cualquier indicación."></textarea>
          </div>
        </div>
        <div class="cart__foot">
          <p class="cart__closed" id="cartClosed" hidden></p>
          <div class="cart__total"><span>Total</span><span id="cartTotal">—</span></div>
          <button type="button" class="btn btn--accent btn--block" id="cartSend">Enviar pedido por WhatsApp</button>
          <div class="cart__sent" id="cartSent" hidden>
            <p><b>¿Ya enviaste el mensaje en WhatsApp?</b> Sin ese mensaje el pedido no nos llega.</p>
            <div class="cart__sent-btns">
              <button type="button" class="btn btn--ghost" id="cartResend">Abrir WhatsApp otra vez</button>
              <button type="button" class="btn btn--accent" id="cartDone">Sí, ya lo envié</button>
            </div>
          </div>
          <div class="cart__row">
            ${more}
            <button type="button" class="cart__clear" id="cartClear">Vaciar</button>
          </div>
        </div>
      </aside>
    </div>`);
  }
  const box = document.getElementById("cart");
  const panel = box && box.querySelector(".cart__panel");
  const scrim = box && box.querySelector(".cart__scrim");
  const openBtn = document.getElementById("cartOpen");
  const countEl = document.getElementById("cartCount");
  let release = null;
  let isOpen = false;
  let sentUrl = "";
  let expectPop = false;
  let lastPopWasCart = false;

  function qtyControl(p, label) {
    return `<span class="qty" role="group" aria-label="Cantidad de ${esc(label || p.nombre)}">
      <button type="button" data-cart-step="-1" data-id="${esc(p.id)}" aria-label="Quitar uno">−</button>
      <output aria-live="polite">${qty(p.id)}</output>
      <button type="button" data-cart-step="1" data-id="${esc(p.id)}" aria-label="Agregar uno">+</button>
    </span>`;
  }

  function renderMode() {
    box.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.mode === delivery)));
    box.querySelector("#cartNoteLabel").textContent = delivery === "Domicilio" ? "Dirección y notas" : "Notas (opcional)";
    box.querySelector("#cartNote").placeholder = delivery === "Domicilio" ? "Barrio, dirección y cualquier indicación." : "A qué hora pasas, o algo especial.";
  }

  function renderDrawer() {
    if (!box) return;
    const list = box.querySelector("#cartList");
    const ls = lines();
    list.innerHTML = ls.length ? ls.map(({ p, n }) => `
      <li class="cart__line">
        <span class="cart__name">${esc(p.nombre)}</span>
        <span class="cart__meta">${esc(p.detalle || "")}${p.precio ? ` · ${money.format(p.precio * n)}` : " · Precio por WhatsApp"}</span>
        ${qtyControl(p)}
      </li>`).join("") : `<li class="cart__empty">Tu pedido está vacío. Agrega productos desde el catálogo.</li>`;

    const total = ls.reduce((s, { p, n }) => s + (p.precio || 0) * n, 0);
    const pending = ls.some(({ p }) => !p.precio);
    box.querySelector("#cartTotal").textContent = total ? `${money.format(total)}${pending ? " + consultar" : ""}` : ls.length ? "Te lo decimos por WhatsApp" : "—";
    box.querySelector("#cartSend").disabled = !ls.length;
    box.querySelector("#cartClear").hidden = !ls.length;
    box.querySelector("#cartFields").hidden = !ls.length;
    // Fuera de horario se puede pedir igual, pero se avisa.
    const closed = box.querySelector("#cartClosed");
    closed.hidden = !ls.length || Site.openNow();
    closed.textContent = "Ahora estamos cerrados. Puedes enviarlo y te respondemos apenas abramos.";
    if (!ls.length) showSent(false);
    renderMode();
  }

  function showSent(on) {
    box.querySelector("#cartSent").hidden = !on;
    box.querySelector("#cartSend").hidden = on;
  }

  function renderButton(info) {
    if (!openBtn) return;
    const n = count();
    countEl.hidden = n === 0;
    countEl.textContent = n;
    openBtn.setAttribute("aria-label", `Ver tu pedido, ${n} ${n === 1 ? "producto" : "productos"}`);
    // En productos, con algo en el pedido, el dock queda a la vista para llegar al carrito con un toque.
    if (window.Dock && onProducts && !document.body.classList.contains("has-tbar")) window.Dock.pin(n > 0);
    if (info && info.added && animate) {
      openBtn.classList.remove("is-bump");
      void openBtn.offsetWidth;
      openBtn.classList.add("is-bump");
    }
  }

  /* ---------- Abrir y cerrar (interrumpible: se puede abrir mientras se cierra) ---------- */
  function open() {
    if (!box || isOpen) return;
    isOpen = true;
    const snack = document.querySelector(".snack");
    if (snack) snack.classList.remove("is-on");
    renderDrawer();
    const wasHidden = box.hidden;
    box.hidden = false;
    document.body.classList.add("is-locked");
    if (lenis) lenis.stop();
    release = trapFocus(box, close);
    box.querySelector(".cart__close").focus({ preventScroll: true });
    // Atrás del celular cierra el pedido en vez de salir de la página.
    history.pushState({ ...(history.state || {}), cart: true }, "");
    if (animate) {
      gsap.killTweensOf([panel, scrim]);
      const axis = isSheet() ? "yPercent" : "xPercent";
      gsap.set(panel, { xPercent: 0, yPercent: 0, y: 0 });
      if (wasHidden) gsap.set(panel, { [axis]: 100 });
      gsap.to(panel, { [axis]: 0, duration: 0.42, ease: "drawer" });
      gsap.fromTo(scrim, { autoAlpha: wasHidden ? 0 : gsap.getProperty(scrim, "opacity") }, { autoAlpha: 1, duration: 0.25, ease: "power2.out" });
    }
  }

  function close(fromHistory = false) {
    if (!box || !isOpen) return;
    isOpen = false;
    if (fromHistory !== true && history.state && history.state.cart) { expectPop = true; history.back(); }
    if (release) { release(); release = null; }
    const done = () => {
      if (isOpen) return;
      box.hidden = true;
      document.body.classList.remove("is-locked");
      if (lenis) lenis.start();
    };
    if (animate) {
      gsap.killTweensOf([panel, scrim]);
      const axis = isSheet() ? "yPercent" : "xPercent";
      gsap.to(panel, { [axis]: 100, y: 0, duration: 0.26, ease: "power3.out", onComplete: done });
      gsap.to(scrim, { autoAlpha: 0, duration: 0.2, ease: "power2.out" });
    } else done();
  }

  // Otros scripts (reservas) usan el historial para sus pasos: les avisa si este "atrás" era del pedido.
  window.addEventListener("popstate", (e) => {
    lastPopWasCart = expectPop || isOpen;
    expectPop = false;
    if (isOpen && !(e.state && e.state.cart)) close(true);
  });

  /* ---------- Deslizar hacia abajo para cerrar (celular) ---------- */
  function initDrag() {
    const grab = box.querySelector(".cart__grab");
    const head = box.querySelector(".cart__head");
    let startY = 0, startT = 0, dy = 0, dragging = false, pid = null;
    const down = (e) => {
      if (!isSheet() || dragging || e.target.closest("button")) return; // un solo dedo y no sobre botones
      dragging = true;
      pid = e.pointerId;
      startY = e.clientY;
      startT = performance.now();
      dy = 0;
      e.currentTarget.setPointerCapture(pid);
      gsap.killTweensOf(panel);
    };
    const move = (e) => {
      if (!dragging || e.pointerId !== pid) return;
      const raw = e.clientY - startY;
      // Hacia arriba ofrece resistencia en vez de un tope seco.
      dy = raw > 0 ? raw : -Math.pow(-raw, 0.6);
      gsap.set(panel, { y: dy });
    };
    const up = (e) => {
      if (!dragging || e.pointerId !== pid) return;
      dragging = false;
      const v = dy / Math.max(1, performance.now() - startT);
      if (dy > panel.offsetHeight * 0.3 || (dy > 20 && v > 0.11)) close();
      else gsap.to(panel, { y: 0, duration: 0.3, ease: "drawer" });
    };
    [grab, head].forEach((el) => {
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
  }

  /* ---------- El producto vuela hasta el pedido ---------- */
  function fly(from) {
    if (!animate || !from || !openBtn) return;
    const target = openBtn.querySelector(".dock__icon");
    const dockOn = window.Dock && window.Dock.el.classList.contains("is-visible");
    if (!target || !dockOn) return;
    const a = from.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const dot = document.createElement("span");
    dot.className = "cart-fly";
    dot.style.left = `${a.left + a.width / 2 - 14}px`;
    dot.style.top = `${a.top + a.height / 2 - 14}px`;
    document.body.appendChild(dot);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dyy = b.top + b.height / 2 - (a.top + a.height / 2);
    // x con salida suave, y con caída (power2.in): dibuja un arco natural.
    gsap.to(dot, { x: dx, duration: 0.55, ease: "power2.out" });
    gsap.to(dot, { y: dyy, duration: 0.55, ease: "power2.in" });
    gsap.to(dot, { scale: 0.35, duration: 0.55, ease: "power1.in", onComplete: () => dot.remove() });
  }

  if (box) {
    box.addEventListener("click", (e) => {
      if (e.target.closest("[data-cart-close]")) close();
      const m = e.target.closest("[data-mode]");
      if (m) { delivery = m.dataset.mode; renderMode(); }
    });
    box.querySelector("#cartClear").addEventListener("click", clear);
    const note = box.querySelector("#cartNote");
    try { note.value = localStorage.getItem(NOTE_KEY) || ""; } catch (e) {}
    note.addEventListener("input", () => { try { localStorage.setItem(NOTE_KEY, note.value); } catch (e) {} });
    box.querySelector("#cartSend").addEventListener("click", () => {
      sentUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message(note.value.trim()))}`;
      window.open(sentUrl, "_blank", "noopener");
      showSent(true);
    });
    box.querySelector("#cartResend").addEventListener("click", () => window.open(sentUrl, "_blank", "noopener"));
    box.querySelector("#cartDone").addEventListener("click", () => {
      items = {};
      save();
      try { localStorage.removeItem(NOTE_KEY); } catch (e) {}
      note.value = "";
      emit({});
      showSent(false);
      close();
      Site.toast("¡Listo! Te respondemos por WhatsApp.");
    });
    initDrag();
  }
  if (openBtn) openBtn.addEventListener("click", open);

  // Botones +/− en cualquier parte de la página (tarjetas y cajón).
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cart-step]");
    if (!b) return;
    const step = Number(b.dataset.cartStep);
    const before = qty(b.dataset.id);
    add(b.dataset.id, step);
    // Fuera del cajón, agregar muestra a dónde fue y un aviso con acceso directo al pedido.
    if (step > 0 && qty(b.dataset.id) > before && !b.closest(".cart")) {
      const p = find(b.dataset.id);
      fly(b);
      if (navigator.vibrate && navigator.userActivation && navigator.userActivation.isActive) navigator.vibrate(8);
      if (p && !document.body.classList.contains("has-tbar")) Site.toast(`Agregado: ${p.nombre}`, "Ver pedido", open);
    }
  });

  listeners.push((info) => { renderButton(info); if (box && !box.hidden) renderDrawer(); });
  renderButton();
  // Con Loyverse activo, el carrito usa los productos y precios reales en cualquier página.
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.loadCatalog === "function") window.loadCatalog().then((list) => Array.isArray(list) && setCatalog(list));
  });

  return {
    setCatalog,
    add,
    set,
    qty,
    count,
    clear,
    open,
    close,
    qtyControl,
    onChange: (cb) => listeners.push(cb),
    lastPopWasCart: () => lastPopWasCart,
  };
})();
