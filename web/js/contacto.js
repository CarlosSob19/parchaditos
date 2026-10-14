// Página de contacto: reservas y pedidos por WhatsApp, y redes sociales con logos en 3D.
(() => {
  const { animate, finePointer, esc } = Site;
  const wa = (msg) => `https://wa.me/${WHATSAPP}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

  /* ---------- Logos 3D ---------- */
  // Cada logo es una pila de capas: el cuerpo se extruye hacia atrás y el dibujo sobresale adelante.
  // Se arma con CSS 3D, sin imágenes, así se ve nítido en cualquier tamaño y pesa casi nada.
  const GLYPHS = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4" y="4" width="16" height="16" rx="4.8"/><circle cx="12" cy="12" r="3.9"/><circle cx="16.9" cy="7.1" r="1.05" fill="currentColor" stroke="none"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg>',
  };
  const BODY_LAYERS = 18;
  const GLYPH_LAYERS = 6;

  function icon3d(kind) {
    const range = (n, fn) => Array.from({ length: n }, (_, k) => fn(k)).join("");
    return `<div class="i3d i3d--${kind}" aria-hidden="true">
      <div class="i3d__obj">
        ${range(BODY_LAYERS, (k) => `<span class="i3d__slab" style="--k:${BODY_LAYERS - k}"></span>`)}
        <span class="i3d__face">
          ${range(GLYPH_LAYERS, (k) => `<span class="i3d__glyph${k === GLYPH_LAYERS - 1 ? " i3d__glyph--top" : ""}" style="--k:${k + 1}">${GLYPHS[kind]}</span>`)}
        </span>
      </div>
      <span class="i3d__floor"></span>
    </div>`;
  }

  // El logo sigue al mouse, gira al entrar en pantalla y da una vuelta al tocarlo.
  function bindIcon(stage) {
    const obj = stage.querySelector(".i3d__obj");
    const s = { x: 0, y: 0, spin: animate ? -200 : 0 };
    const paint = () => {
      obj.style.setProperty("--px", `${s.x}deg`);
      obj.style.setProperty("--py", `${s.y + s.spin}deg`);
      obj.style.setProperty("--gx", `${50 + s.y * 1.4}%`);
      obj.style.setProperty("--gy", `${30 - s.x * 1.4}%`);
    };
    paint();
    if (!animate) return;

    gsap.to(s, {
      spin: 0, duration: 1.8, ease: "expo.out", onUpdate: paint,
      scrollTrigger: { trigger: stage, start: "top 85%" },
    });
    stage.addEventListener("click", () => gsap.to(s, { spin: "-=360", duration: 1.2, ease: "power3.out", onUpdate: paint }));
    if (!finePointer) return;
    const zone = stage.closest("[data-tilt]") || stage;
    zone.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
      gsap.to(s, { x: Math.max(-1, Math.min(1, ny)) * -22, y: Math.max(-1, Math.min(1, nx)) * 28, duration: 0.6, ease: "power3.out", overwrite: "auto", onUpdate: paint });
    });
    zone.addEventListener("pointerleave", () => gsap.to(s, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.5)", overwrite: "auto", onUpdate: paint }));
  }

  /* ---------- WhatsApp ---------- */
  document.querySelectorAll(".js-wa").forEach((a) => {
    a.href = wa(a.dataset.msg);
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll(".js-tel").forEach((a) => (a.href = `tel:+${WHATSAPP}`));
  // 573001234567 → +57 300 123 4567
  const n = String(WHATSAPP);
  const pretty = n.length === 12 && n.startsWith("57") ? `+57 ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}` : `+${n}`;
  document.querySelectorAll(".js-wa-num").forEach((el) => {
    el.innerHTML = `<a href="${esc(wa("Hola Parchaditos"))}" target="_blank" rel="noopener">${esc(pretty)}</a>`;
  });

  /* ---------- Redes ---------- */
  // Instagram siempre aparece ("Muy pronto" mientras INFO.instagram esté vacío). TikTok solo si tiene enlace.
  const SOCIALS = [
    { id: "instagram", nombre: "Instagram", url: INFO.instagram, texto: "Fotos de la noche, eventos y promos antes que nadie. Etiquétanos y te compartimos.", siempre: true },
    { id: "tiktok", nombre: "TikTok", url: INFO.tiktok, texto: "Los videos del parche: la hookah, los granizados y cómo se pone el fin de semana." },
  ].filter((s) => s.url || s.siempre);

  const handle = (url) => {
    const last = String(url).split("?")[0].split("/").filter(Boolean).pop() || "";
    return `@${last.replace(/^@/, "")}`;
  };

  document.getElementById("socials").innerHTML = SOCIALS.map((s, i) => `
    <article class="soc soc--${s.id}${i % 2 ? " soc--flip" : ""}" data-tilt>
      <div class="soc__stage js-icon3d" data-icon="${s.id}" data-cursor="${s.url ? "Seguir" : "Pronto"}"></div>
      <div class="soc__info">
        <p class="eyebrow">${esc(s.nombre)}</p>
        <p class="soc__handle" style="--len:${(s.url ? handle(s.url) : "Muy pronto").length}">${s.url ? esc(handle(s.url)) : "Muy pronto"}</p>
        <p class="soc__text">${esc(s.texto)}</p>
        ${s.url
          ? `<a class="btn btn--reserve magnetic" href="${esc(s.url)}" target="_blank" rel="noopener" data-cursor="Ir"><span class="btn--reserve__text">Seguir en ${esc(s.nombre)}</span><span class="btn--reserve__icon" aria-hidden="true">→</span></a>`
          : ""}
      </div>
      <span class="soc__ghost" aria-hidden="true">${s.id === "instagram" ? "INSTA" : "TIKTOK"}</span>
    </article>`).join("");

  document.querySelectorAll(".js-icon3d").forEach((stage) => {
    stage.innerHTML = icon3d(stage.dataset.icon);
    bindIcon(stage);
  });

  Site.splitChars();
  Site.splitWords();

  Site.onUnlock(() => {
    if (!animate) return;
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from(".pg__title .char", { yPercent: 115, duration: 1.3, stagger: 0.03 })
      .from(".pg__head .eyebrow, .pg__lead", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.4)
      .from(".header", { yPercent: -100, duration: 1, clearProps: "transform" }, 0.3);
    gsap.utils.toArray(".ch, .soc").forEach((el) => {
      gsap.from(el, { y: 60, autoAlpha: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
  });
})();
