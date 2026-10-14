// Dock flotante: navegación rápida (Inicio, Productos, Reservar, WhatsApp, Pedido) en todas las páginas.
// En computador los íconos se agrandan al pasar el mouse, como el dock de macOS.
(() => {
  const { animate, finePointer, lenis } = Site;
  const body = document.body;
  const page = body.classList.contains("page-home") ? "inicio"
    : body.classList.contains("page-products") ? "productos"
    : body.classList.contains("page-booking") ? "reservas" : "";

  const svg = (d, fill = false) => `<svg viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'} aria-hidden="true">${d}</svg>`;
  const ICONS = {
    inicio: svg('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    productos: svg('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'),
    reservas: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/>'),
    whatsapp: svg('<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z"/>', true),
    pedido: svg('<path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),
  };

  const base = body.classList.contains("page-lost") ? "/" : "";
  const link = (id, href, label, extra = "") =>
    `<a class="dock__item${id === "reservas" ? " dock__item--accent" : ""}" href="${href}" data-dock="${id}" ${page === id ? 'aria-current="page"' : ""} ${extra}>
      <span class="dock__icon">${ICONS[id]}</span><span class="dock__label">${label}</span>
    </a>`;

  const nav = document.createElement("nav");
  nav.className = "dock";
  nav.id = "dock";
  nav.setAttribute("aria-label", "Accesos rápidos");
  nav.innerHTML = `
    ${link("inicio", page === "inicio" ? "#inicio" : `${base}index.html`, "Inicio")}
    ${link("productos", `${base}productos.html`, "Productos")}
    ${link("reservas", `${base}reservas.html`, "Reservar")}
    <span class="dock__sep" aria-hidden="true"></span>
    ${link("whatsapp", `https://wa.me/${WHATSAPP}`, "WhatsApp", 'target="_blank" rel="noopener"')}
    <button type="button" class="dock__item" id="cartOpen" data-dock="pedido" aria-label="Ver tu pedido">
      <span class="dock__icon">${ICONS.pedido}<b class="dock__badge" id="cartCount" hidden>0</b></span><span class="dock__label">Pedido</span>
    </button>`;
  body.appendChild(nav);

  // Aparece al pasar el título grande de la página (el header se va en ese momento; ver common.js).
  let unlocked = false;
  let past = false;
  let pinned = false; // con productos en el pedido, el dock se queda a la vista (el carrito siempre a un toque)
  const paint = () => {
    const on = unlocked && (past || pinned);
    nav.classList.toggle("is-visible", on);
    nav.inert = !on;
  };
  Site.onPastHead((p) => { past = p; paint(); });
  Site.onUnlock(() => { unlocked = true; paint(); });
  window.Dock = { pin: (v) => { pinned = !!v; paint(); }, el: nav };

  // Inicio en la misma página: vuelve arriba con el scroll suave.
  if (page === "inicio") {
    nav.querySelector('[data-dock="inicio"]').addEventListener("click", (e) => {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Efecto de lupa: cada ícono crece según qué tan cerca está el mouse.
  if (animate && finePointer) {
    const items = [...nav.querySelectorAll(".dock__item")];
    const scales = items.map((el) => gsap.quickTo(el.querySelector(".dock__icon"), "scale", { duration: 0.35, ease: "power3" }));
    const lifts = items.map((el) => gsap.quickTo(el.querySelector(".dock__icon"), "y", { duration: 0.35, ease: "power3" }));
    nav.addEventListener("pointermove", (e) => {
      items.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(e.clientX - (r.left + r.width / 2));
        const k = Math.max(0, 1 - d / 140);
        scales[i](1 + k * 0.45);
        lifts[i](-k * 10);
      });
    });
    nav.addEventListener("pointerleave", () => { scales.forEach((s) => s(1)); lifts.forEach((l) => l(0)); });
  }
})();
