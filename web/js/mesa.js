// Modo mesa: se activa al escanear el QR de una mesa (/m/<id> → /?mesa=<id>).
// Muestra una barra fija para pedir, llamar al mesero, pedir la cuenta y la hookah.
// Todo sale por WhatsApp con el nombre de la mesa, igual al ticket predefinido en Loyverse.
window.Mesa = (() => {
  const { esc, animate, lenis } = Site;
  const params = new URLSearchParams(location.search);

  // QR de reseñas: hoy va a /ir-resena.html. Esto queda por si algún navegador guardó el destino viejo (/?ir=resena).
  if (params.get("ir") === "resena" && INFO.resenas) location.replace(INFO.resenas);

  const KEY_TABLE = "pd-mesa";
  const KEY_CART = "pd-pedido";
  const KEY_LAST = "pd-ultimo";
  const load = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const save = (k, v) => {
    try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  };

  /* ---------- Mesa activa ---------- */
  const scanned = params.get("mesa");
  let fresh = false;
  if (scanned) {
    const t = TABLES.find((x) => x.id === scanned.toLowerCase());
    if (t) { save(KEY_TABLE, { id: t.id, at: Date.now() }); fresh = true; }
    // Se quita ?mesa= de la dirección para que al compartir la página no se comparta la mesa.
    params.delete("mesa");
    history.replaceState(null, "", location.pathname + (params.toString() ? `?${params}` : "") + location.hash);
  }
  const stored = load(KEY_TABLE);
  const table = stored && Date.now() - stored.at < TABLE_HOURS * 3600 * 1000 ? TABLES.find((x) => x.id === stored.id) : null;
  if (!table) { save(KEY_TABLE, null); return { active: false }; }

  /* ---------- Pedido ---------- */
  const fmt = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  const keyOf = (p) => `${p.nombre}|${p.detalle || ""}`;
  const label = (l) => (l.detalle ? `${l.nombre} (${l.detalle})` : l.nombre);

  let cart = load(KEY_CART);
  if (!cart || cart.mesa !== table.id) cart = { mesa: table.id, lines: [], nota: "" };
  const persist = () => save(KEY_CART, cart);
  const count = () => cart.lines.reduce((n, l) => n + l.qty, 0);

  function add(p) {
    const k = keyOf(p);
    const line = cart.lines.find((l) => l.key === k);
    if (line) line.qty++;
    else cart.lines.push({ key: k, nombre: p.nombre, detalle: p.detalle || "", precio: p.precio || null, qty: 1 });
    persist();
    paintCount(true);
    toast(`Agregado: ${p.nombre}`, "Ver pedido", () => openSheet("pedido"));
  }

  function setQty(k, qty) {
    const line = cart.lines.find((l) => l.key === k);
    if (!line) return;
    line.qty = qty;
    cart.lines = cart.lines.filter((l) => l.qty > 0);
    persist();
    paintCount();
  }

  function totalText(lines) {
    const known = lines.filter((l) => l.precio);
    if (!known.length) return "";
    const sum = known.reduce((s, l) => s + l.precio * l.qty, 0);
    return known.length === lines.length ? fmt.format(sum) : `${fmt.format(sum)} + productos por confirmar`;
  }

  /* ---------- WhatsApp ---------- */
  const phone = WHATSAPP_MESAS || WHATSAPP;
  function send(lines) {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent([`*${table.nombre.toUpperCase()}*`, ...lines].join("\n"))}`;
    window.open(url, "_blank", "noopener");
  }

  function sendOrder(lines, nota) {
    const total = totalText(lines);
    send([
      "Pedido:",
      ...lines.map((l) => `${l.qty} × ${label(l)}`),
      ...(nota ? [`Nota: ${nota}`] : []),
      ...(total ? [`Total: ${total}`] : []),
    ]);
  }

  const ACTIONS = {
    mesero: { text: "Mesero", msg: ["Por favor, ¿nos atienden en la mesa?"], done: "Le avisamos al mesero." },
    cuenta: { text: "Cuenta", msg: ["¿Nos traen la cuenta, por favor?"], done: "Pediste la cuenta." },
    carbon: { text: "Cambio de carbón", msg: ["Hookah: cambio de carbón, por favor."], done: "Pediste cambio de carbón." },
    hielo: { text: "Hielo, vasos o servilletas", msg: ["¿Nos traen hielo, vasos y servilletas?"], done: "Pedido enviado." },
  };

  function runAction(id) {
    const a = ACTIONS[id];
    send(a.msg);
    closeSheet();
    if (id === "cuenta" && INFO.resenas) toast("Pediste la cuenta. ¿Nos dejas una reseña?", "Opinar", () => window.open(INFO.resenas, "_blank", "noopener"));
    else toast(a.done);
  }

  /* ---------- Interfaz ---------- */
  document.body.classList.add("has-tbar");
  document.body.insertAdjacentHTML("beforeend", `
    <div class="tbar" id="tbar">
      <button type="button" class="tbar__table" data-open="mesa" aria-label="Opciones de la mesa ${esc(table.nombre)}">
        <small>Estás en</small><b>${esc(table.nombre)}</b>
      </button>
      <button type="button" class="tbar__btn" data-act="mesero">Mesero</button>
      <button type="button" class="tbar__btn" data-act="cuenta">Cuenta</button>
      <button type="button" class="tbar__btn tbar__btn--main" data-open="pedido">Pedido <span class="tbar__count" id="tbarCount">0</span></button>
    </div>
    <div class="sheet" id="sheet" hidden>
      <div class="sheet__backdrop" data-close></div>
      <div class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" tabindex="-1" data-lenis-prevent>
        <div class="sheet__head">
          <h2 class="sheet__title" id="sheetTitle"></h2>
          <button type="button" class="sheet__close" data-close aria-label="Cerrar">×</button>
        </div>
        <div class="sheet__body" id="sheetBody"></div>
      </div>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  const $ = (s) => document.querySelector(s);
  const sheet = $("#sheet");
  const panel = sheet.querySelector(".sheet__panel");
  let lastFocus = null;

  function paintCount(bump) {
    const el = $("#tbarCount");
    el.textContent = count();
    el.classList.toggle("is-empty", !count());
    if (bump && animate) gsap.fromTo(el, { scale: 1.6 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
  }

  function openSheet(view) {
    lastFocus = document.activeElement;
    $("#toast").classList.remove("is-on");
    render(view);
    sheet.hidden = false;
    document.body.classList.add("is-locked");
    if (lenis) lenis.stop();
    if (animate) {
      gsap.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: "expo.out" });
      gsap.fromTo(".sheet__backdrop", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
    }
    panel.focus();
  }

  function closeSheet() {
    if (sheet.hidden) return;
    const done = () => {
      sheet.hidden = true;
      document.body.classList.remove("is-locked");
      if (lenis) lenis.start();
      if (lastFocus) lastFocus.focus();
    };
    if (animate) gsap.to(panel, { yPercent: 100, duration: 0.35, ease: "power2.in", onComplete: done });
    else done();
  }

  function render(view) {
    const body = $("#sheetBody");
    const last = load(KEY_LAST);
    const lastForTable = last && last.lines && last.lines.length ? last : null;

    if (view === "mesa") {
      $("#sheetTitle").textContent = table.nombre;
      body.innerHTML = `
        ${lastForTable ? `
          <p class="sheet__label">Otra ronda</p>
          <button type="button" class="sheet__row sheet__row--main" data-ronda>
            <b>Repetir el último pedido</b><span>${esc(lastForTable.lines.map((l) => `${l.qty} × ${l.nombre}`).join(", "))}</span>
          </button>` : ""}
        <p class="sheet__label">Hookah</p>
        <button type="button" class="sheet__row" data-act="carbon"><b>Cambio de carbón</b></button>
        <div class="sheet__row sheet__row--static"><b>Cambiar sabor</b>
          <div class="sheet__chips">${HOOKAH_FLAVORS.map((f) => `<button type="button" class="chip" data-flavor="${esc(f)}">${esc(f)}</button>`).join("")}</div>
        </div>
        <p class="sheet__label">Mesa</p>
        <button type="button" class="sheet__row" data-act="hielo"><b>${ACTIONS.hielo.text}</b></button>
        <button type="button" class="sheet__row" data-act="mesero"><b>Llamar al mesero</b></button>
        <button type="button" class="sheet__row" data-act="cuenta"><b>Pedir la cuenta</b></button>
        <button type="button" class="sheet__exit" data-exit>No estoy en ${esc(table.nombre)}</button>`;
      return;
    }

    // Pedido
    $("#sheetTitle").textContent = `Pedido · ${table.nombre}`;
    if (!cart.lines.length) {
      body.innerHTML = `
        <p class="sheet__empty">Todavía no has agregado nada. Toca <b>Agregar</b> en los productos de la carta.</p>
        <button type="button" class="btn btn--accent btn--block" data-carta>Ver la carta</button>
        ${lastForTable ? `<button type="button" class="btn btn--ghost btn--block sheet__gap" data-ronda>Repetir el último pedido</button>` : ""}`;
      return;
    }
    const priced = cart.lines.filter((l) => l.precio);
    const pending = cart.lines.length - priced.length;
    const total = priced.length ? `${fmt.format(priced.reduce((s, l) => s + l.precio * l.qty, 0))}${pending ? `<small>+ ${pending} con precio por confirmar</small>` : ""}` : "";
    body.innerHTML = `
      <ul class="sheet__lines">${cart.lines.map((l) => `
        <li class="line">
          <span class="line__name">${esc(l.nombre)}${l.detalle ? `<small>${esc(l.detalle)}</small>` : ""}</span>
          <span class="line__qty">
            <button type="button" data-qty="-1" data-k="${esc(l.key)}" aria-label="Quitar uno de ${esc(l.nombre)}">−</button>
            <b>${l.qty}</b>
            <button type="button" data-qty="1" data-k="${esc(l.key)}" aria-label="Agregar uno de ${esc(l.nombre)}">+</button>
          </span>
        </li>`).join("")}
      </ul>
      <label class="sheet__label" for="mesaNote">Nota para la barra (opcional)</label>
      <textarea class="sheet__note" id="mesaNote" rows="2" maxlength="200" placeholder="Ej. sin hielo, bien frío, dos vasos">${esc(cart.nota)}</textarea>
      ${total ? `<p class="sheet__total"><span>Total</span><b>${total}</b></p>` : ""}
      <button type="button" class="btn btn--accent btn--block" data-send>Enviar pedido a la barra</button>
      <p class="sheet__hint">Se abre WhatsApp con el pedido listo. Solo toca enviar.</p>
      <button type="button" class="sheet__exit" data-clear>Vaciar pedido</button>`;
  }

  sheet.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-close]");
    if (!t) return;
    if (t.hasAttribute("data-close")) closeSheet();
    else if (t.dataset.act) runAction(t.dataset.act);
    else if (t.dataset.flavor) {
      send([`Hookah: cambiar el sabor a ${t.dataset.flavor}, por favor.`]);
      closeSheet();
      toast(`Pediste sabor ${t.dataset.flavor}.`);
    } else if (t.dataset.qty) {
      const line = cart.lines.find((l) => l.key === t.dataset.k);
      if (line) setQty(line.key, line.qty + Number(t.dataset.qty));
      render("pedido");
    } else if (t.hasAttribute("data-send")) {
      sendOrder(cart.lines, cart.nota.trim());
      save(KEY_LAST, { lines: cart.lines });
      cart.lines = [];
      cart.nota = "";
      persist();
      paintCount();
      closeSheet();
      toast("Pedido enviado. Ya va para tu mesa.");
    } else if (t.hasAttribute("data-ronda")) {
      const last = load(KEY_LAST);
      sendOrder(last.lines, "Otra ronda");
      closeSheet();
      toast("Otra ronda en camino.");
    } else if (t.hasAttribute("data-clear")) {
      cart.lines = [];
      persist();
      paintCount();
      render("pedido");
    } else if (t.hasAttribute("data-carta")) {
      closeSheet();
      goToMenu();
    } else if (t.hasAttribute("data-exit")) {
      save(KEY_TABLE, null);
      save(KEY_CART, null);
      location.reload();
    }
  });
  sheet.addEventListener("input", (e) => {
    if (e.target.id === "mesaNote") { cart.nota = e.target.value; persist(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

  $("#tbar").addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.open) openSheet(t.dataset.open);
    else if (t.dataset.act) runAction(t.dataset.act);
  });

  /* ---------- Avisos ---------- */
  let toastTimer;
  function toast(text, actionText, action) {
    const el = $("#toast");
    el.innerHTML = `<span>${esc(text)}</span>${actionText ? `<button type="button">${esc(actionText)}</button>` : ""}`;
    if (actionText) el.querySelector("button").addEventListener("click", () => { el.classList.remove("is-on"); action(); });
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 3500);
  }

  // La carta vive en productos.html; desde otra página se navega hasta allá.
  function goToMenu() {
    if (document.querySelector("#catalogo")) Site.scrollToTarget("#catalogo");
    else location.href = "productos.html#catalogo";
  }

  paintCount();

  // Recién escaneado: saludo y, si la carta está en esta página, directo a ella.
  if (fresh) {
    Site.onUnlock(() => {
      setTimeout(() => {
        toast(`Bienvenido a ${table.nombre}. Pide desde aquí sin levantarte.`);
        if (document.querySelector("#catalogo")) Site.scrollToTarget("#catalogo");
      }, animate ? 1400 : 0);
    });
  }

  return { active: true, table, add };
})();
