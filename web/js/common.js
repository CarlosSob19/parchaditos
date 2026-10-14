// Código compartido por todas las páginas: edad, scroll suave, menú, header y cursor.
window.Site = (() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const animate = hasGsap && !reduceMotion;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    // En celular la barra de direcciones cambia el alto al hacer scroll: no recalcular por eso (evita saltos).
    ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });
    // Las mismas curvas que los tokens de CSS (--ease-drawer, --ease-out), para que JS y CSS se sientan iguales.
    gsap.registerEase("drawer", bezier(0.32, 0.72, 0, 1));
    gsap.registerEase("outStrong", bezier(0.23, 1, 0.32, 1));
  }

  // cubic-bezier(x1, y1, x2, y2) como función de GSAP.
  function bezier(x1, y1, x2, y2) {
    const a = (a1, a2) => 1 - 3 * a2 + 3 * a1;
    const b = (a1, a2) => 3 * a2 - 6 * a1;
    const c = (a1) => 3 * a1;
    const calc = (t, a1, a2) => ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t;
    const slope = (t, a1, a2) => 3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1);
    return (x) => {
      if (x <= 0 || x >= 1) return x;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const d = slope(t, x1, x2);
        if (Math.abs(d) < 1e-6) break;
        t -= (calc(t, x1, x2) - x) / d;
      }
      return calc(Math.min(1, Math.max(0, t)), y1, y2);
    };
  }

  const unlockCallbacks = [];

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.stop();
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  function scrollToTarget(target, offset = -80) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------- Foco atrapado en diálogos (teclado) ---------- */
  // Mantiene el Tab dentro de "box" y llama onEscape con Esc. Devuelve la función que lo libera.
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function trapFocus(box, onEscape) {
    const prev = document.activeElement;
    const visible = () => [...box.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    const onKey = (e) => {
      if (e.key === "Escape" && onEscape) { e.preventDefault(); onEscape(); return; }
      if (e.key !== "Tab") return;
      const items = visible();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return (restore = true) => {
      document.removeEventListener("keydown", onKey);
      if (restore && prev && prev.focus) prev.focus({ preventScroll: true });
    };
  }

  /* ---------- Menú móvil ---------- */
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("menuToggle");
  let releaseMenu = null;

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("is-locked", open);
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) releaseMenu = trapFocus(document.getElementById("header"), () => setMenu(false));
    else if (releaseMenu) { releaseMenu(false); releaseMenu = null; }
  }
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2 || !document.querySelector(id)) return;
      e.preventDefault();
      if (nav.classList.contains("is-open")) setMenu(false);
      scrollToTarget(id);
    });
  });

  /* ---------- Datos del negocio (config.js) ---------- */
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const DAY_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const fmtHour = (h) => {
    const hour = Math.floor(h) % 24;
    const min = h % 1 ? "30" : "00";
    return `${hour % 12 || 12}:${min} ${hour < 12 ? "a.m." : "p.m."}`;
  };
  const hhmm = (h) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${h % 1 ? "30" : "00"}`;

  // Agrupa días seguidos con el mismo horario: "Dom – Jue · 4:00 p.m. – 12:00 a.m.".
  function scheduleGroups() {
    const key = (d) => (HOURS[d] ? `${HOURS[d].inicio}-${HOURS[d].fin}` : "x");
    const groups = [];
    for (let d = 0; d < 7; d++) {
      const last = groups[groups.length - 1];
      if (last && last.key === key(d)) last.days.push(d);
      else groups.push({ key: key(d), days: [d], h: HOURS[d] });
    }
    return groups;
  }

  function scheduleLines() {
    return scheduleGroups().map(({ days, h }) => {
      const label = days.length > 1 ? `${DAY_SHORT[days[0]]} – ${DAY_SHORT[days[days.length - 1]]}` : DAY_SHORT[days[0]];
      return `${label} · ${h ? `${fmtHour(h.inicio)} – ${fmtHour(h.fin)}` : "Cerrado"}`;
    });
  }

  function paintInfo() {
    const link = (href, text, cls = "footer__link") => `<a href="${esc(href)}" class="${cls}" target="_blank" rel="noopener">${esc(text)}</a>`;
    document.querySelectorAll(".js-address").forEach((el) => {
      const txt = `${esc(INFO.direccion)}<br>${esc(INFO.ciudad)}`;
      el.innerHTML = INFO.mapa ? `<a href="${esc(INFO.mapa)}" class="footer__link" target="_blank" rel="noopener">${txt}</a>` : txt;
    });
    document.querySelectorAll(".js-address-inline").forEach((el) => (el.textContent = `${INFO.direccion}, ${INFO.ciudad}`));
    document.querySelectorAll(".js-hours").forEach((el) => (el.innerHTML = scheduleLines().map(esc).join("<br>")));
    document.querySelectorAll(".js-social").forEach((el) => {
      el.innerHTML = [
        INFO.instagram && link(INFO.instagram, "Instagram"),
        INFO.tiktok && link(INFO.tiktok, "TikTok"),
        link(`https://wa.me/${WHATSAPP}`, "WhatsApp"),
      ].filter(Boolean).join("<br>");
    });
    document.querySelectorAll(".js-name").forEach((el) => (el.textContent = INFO.nombre));
    document.querySelectorAll(".js-email").forEach((el) => {
      el.innerHTML = INFO.email ? `<a href="mailto:${esc(INFO.email)}" class="footer__link">${esc(INFO.email)}</a>` : `<a href="https://wa.me/${WHATSAPP}" class="footer__link" target="_blank" rel="noopener">WhatsApp</a>`;
    });
    document.querySelectorAll(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));
    document.querySelectorAll(".wa-link").forEach((a) => {
      a.href = `https://wa.me/${WHATSAPP}`;
      a.target = "_blank";
      a.rel = "noopener";
    });

    // Datos estructurados para Google (negocio local, dirección y horario).
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BarOrPub",
      name: INFO.nombre,
      url: location.origin + "/",
      address: { "@type": "PostalAddress", streetAddress: INFO.direccion, addressLocality: INFO.ciudad, addressCountry: INFO.pais },
      ...(INFO.coordenadas ? { geo: { "@type": "GeoCoordinates", latitude: Number(INFO.coordenadas.split(",")[0]), longitude: Number(INFO.coordenadas.split(",")[1]) } } : {}),
      telephone: `+${WHATSAPP}`,
      sameAs: [INFO.instagram, INFO.tiktok].filter(Boolean),
      acceptsReservations: true,
      openingHoursSpecification: scheduleGroups().filter((g) => g.h).map((g) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: g.days.map((d) => DAY_SCHEMA[d]),
        opens: hhmm(g.h.inicio),
        closes: hhmm(g.h.fin),
      })),
    });
    document.head.appendChild(ld);
  }
  paintInfo();

  /* ---------- Header arriba, dock abajo ---------- */
  // Mientras se ve el título grande de la página ([data-hub-after]) manda el header.
  // Al pasarlo, el header se va y aparece el dock (dock.js). Al volver arriba, al revés.
  const header = document.getElementById("header");
  const anchor = document.querySelector("[data-hub-after]");
  const pastCallbacks = [];
  let past = false;

  function isPast() {
    if (!anchor) return window.scrollY > 300;
    // Si GSAP fijó la portada, cuenta todo el tramo fijado (su contenedor .pin-spacer).
    const box = anchor.parentElement && anchor.parentElement.classList.contains("pin-spacer") ? anchor.parentElement : anchor;
    return box.getBoundingClientRect().bottom < window.innerHeight * 0.3;
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paintScroll);
  };
  const paintScroll = () => {
    ticking = false;
    header.classList.toggle("is-scrolled", window.scrollY > 60);
    const now = isPast();
    // En modo mesa la barra de la mesa reemplaza al dock, así que el header no se esconde.
    const keepHeader = nav.classList.contains("is-open") || document.body.classList.contains("has-tbar");
    const hide = now && !keepHeader;
    header.classList.toggle("is-hidden", hide);
    header.inert = hide;
    if (now !== past) {
      past = now;
      document.body.classList.toggle("is-past-head", past);
      pastCallbacks.forEach((cb) => cb(past));
    }
  };
  // Lenis también mueve el scroll nativo, así que basta con escuchar ese (una vez por cuadro).
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  paintScroll();

  /* ---------- Cursor y botones magnéticos ---------- */
  const cursor = document.querySelector(".cursor");
  const label = cursor && cursor.querySelector(".cursor__label");
  let xTo, yTo;
  if (cursor && animate && finePointer) {
    // Misma rapidez que la gota (fx.js), para que la etiqueta ("Ver", "Ir") viaje dentro de ella.
    xTo = gsap.quickTo(cursor, "x", { duration: 0.12, ease: "power2" });
    yTo = gsap.quickTo(cursor, "y", { duration: 0.12, ease: "power2" });
    window.addEventListener("pointermove", (e) => {
      cursor.classList.add("is-on");
      xTo(e.clientX);
      yTo(e.clientY);
    });
  } else if (cursor) {
    cursor.remove();
  }

  function bindInteractive(root = document) {
    if (!xTo) return;
    root.querySelectorAll("[data-cursor]").forEach((el) => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = "1";
      el.addEventListener("pointerenter", () => { label.textContent = el.dataset.cursor; cursor.classList.add("is-big"); });
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-big"));
    });
    root.querySelectorAll(".magnetic").forEach((btn) => {
      if (btn.dataset.magBound) return;
      btn.dataset.magBound = "1";
      const bx = gsap.quickTo(btn, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const by = gsap.quickTo(btn, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        bx((e.clientX - r.left - r.width / 2) * 0.3);
        by((e.clientY - r.top - r.height / 2) * 0.3);
      });
      btn.addEventListener("pointerleave", () => { bx(0); by(0); });
    });
  }

  /* ---------- Dividir texto ---------- */
  function splitChars(root = document) {
    root.querySelectorAll(".split").forEach((el) => {
      el.innerHTML = [...el.textContent].map((c) => `<span class="char">${c === " " ? "&nbsp;" : c}</span>`).join("");
    });
  }

  function splitWords(root = document) {
    root.querySelectorAll(".reveal-text").forEach((el) => {
      const walk = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === 3) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
              const w = document.createElement("span");
              w.className = "word";
              w.innerHTML = `<span>${part}</span>`;
              frag.appendChild(w);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        });
      };
      walk(el);
      if (animate) {
        gsap.from(el.querySelectorAll(".word > span"), {
          yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      }
    });
  }

  /* ---------- Verificación de edad ---------- */
  function initGate() {
    const gate = document.getElementById("ageGate");
    let verified = !gate;
    // Se recuerda 12 horas: quien vuelve esta misma noche no tiene que responder otra vez.
    try {
      verified = sessionStorage.getItem("age-ok") === "1" || Date.now() - Number(localStorage.getItem("age-ok-at") || 0) < 12 * 3600e3;
    } catch (e) {}

    const unlock = () => {
      if (gate) gate.classList.add("is-hidden");
      document.body.classList.remove("is-locked");
      if (lenis) lenis.start();
      unlockCallbacks.forEach((cb) => cb());
    };

    // Las páginas sin verificación (privacidad, 404) se abren directo.
    if (verified || !gate) { unlock(); return; }

    // Mientras se pregunta la edad, el teclado no puede salir del cuadro.
    const release = trapFocus(gate);
    document.getElementById("ageYes").focus({ preventScroll: true });
    document.getElementById("ageYes").addEventListener("click", () => {
      try { sessionStorage.setItem("age-ok", "1"); localStorage.setItem("age-ok-at", String(Date.now())); } catch (e) {}
      release(false);
      // La página arranca mientras el aviso se desvanece (no después).
      if (animate) gsap.to(gate, { autoAlpha: 0, duration: 0.3, ease: "power2.out", onStart: unlock });
      else unlock();
    });
    document.getElementById("ageNo").addEventListener("click", () => {
      document.getElementById("ageDenied").hidden = false;
    });
  }

  /* ---------- Precarga y transiciones entre páginas ---------- */
  const curtain = document.getElementById("curtain");
  // Navegadores con transiciones nativas entre páginas (CSS @view-transition): no hace falta la cortina.
  const nativeTransitions = "onpagereveal" in window;

  function runLoader(done) {
    const loader = document.getElementById("loader");
    let fromNav = false;
    let seen = false; // La precarga solo se ve la primera vez de cada visita.
    try {
      fromNav = sessionStorage.getItem("pt") === "1";
      sessionStorage.removeItem("pt");
      seen = sessionStorage.getItem("loaded") === "1";
      sessionStorage.setItem("loaded", "1");
    } catch (e) {}

    if (animate && loader && seen && !fromNav) {
      loader.remove();
      done();
      return;
    }

    if (!animate) {
      if (loader) loader.remove();
      done();
      return;
    }

    gsap.set(curtain, { y: 0, yPercent: 100 });

    // Viene de otra página del sitio: la cortina ya cubre la pantalla y se retira hacia arriba.
    if (fromNav || !loader) {
      if (loader) loader.remove();
      gsap.set(curtain, { yPercent: 0 });
      gsap.to(curtain, { yPercent: -100, duration: 0.45, ease: "expo.inOut", delay: 0.05, onComplete: () => gsap.set(curtain, { yPercent: 100 }) });
      gsap.delayedCall(0.15, done);
      return;
    }

    // Primera carga: logo + línea roja rápida y se desvanece (menos de 1 s).
    const num = document.getElementById("loaderCount");
    const bar = document.getElementById("loaderBar");
    const c = { v: 0 };
    gsap.timeline()
      .from("#loaderLogo", { yPercent: 110, duration: 0.4, ease: "expo.out" })
      .to(c, {
        v: 100, duration: 0.4, ease: "power2.out",
        onUpdate: () => {
          num.textContent = Math.round(c.v);
          bar.style.transform = `scaleX(${c.v / 100})`;
        },
      }, 0.1)
      .to(loader, { autoAlpha: 0, duration: 0.25, ease: "power2.out" })
      .add(done, "-=0.3")
      .add(() => loader.remove());
  }

  function initTransitions() {
    if (!animate || !curtain || nativeTransitions) return;
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download") || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Mismo documento (solo cambia el #): lo maneja el scroll suave.
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      try { sessionStorage.setItem("pt", "1"); } catch (err) {}
      if (nav.classList.contains("is-open")) setMenu(false);
      // Sale rápido desde el primer cuadro (power4.out): el toque se siente atendido al instante.
      gsap.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: "power4.out", onComplete: () => { location.href = url.href; } });
    });
    // Al volver con el botón "atrás" el navegador puede restaurar la página con la cortina puesta.
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) gsap.set(curtain, { yPercent: 100 });
    });
  }

  /* ---------- ¿Está abierto ahora? (también cuenta la madrugada del día anterior) ---------- */
  function openNow(at = new Date()) {
    const h = at.getHours() + at.getMinutes() / 60;
    const today = HOURS[at.getDay()];
    const yesterday = HOURS[(at.getDay() + 6) % 7];
    return !!((today && h >= today.inicio && h < today.fin) || (yesterday && yesterday.fin > 24 && h < yesterday.fin - 24));
  }

  /* ---------- Aviso corto abajo (agregado al pedido, deshacer, etc.) ---------- */
  let toastEl = null;
  let toastTimer = 0;
  function toast(text, actionText, action) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "snack";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = `<span>${esc(text)}</span>${actionText ? `<button type="button">${esc(actionText)}</button>` : ""}`;
    if (actionText) toastEl.querySelector("button").addEventListener("click", () => { hide(); action(); });
    const hide = () => toastEl.classList.remove("is-on");
    void toastEl.offsetWidth;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hide, actionText ? 5000 : 3000);
    return hide;
  }

  /* ---------- Sin internet: la web sigue abriendo (sw.js) y avisa en vez de fallar callada ---------- */
  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready).then((reg) => {
        // Guarda ya lo que esta página cargó, para que funcione sin señal desde la primera visita.
        const urls = performance.getEntriesByType("resource").map((r) => r.name).concat(location.href);
        if (reg.active) reg.active.postMessage({ type: "warm", urls });
      }).catch(() => {});
    });
  }
  window.addEventListener("offline", () => toast("Sin conexión. Ves la última versión guardada."));
  window.addEventListener("online", () => toast("Volvió la conexión."));

  // Se ejecuta después de que todos los scripts de la página registraron sus callbacks.
  document.addEventListener("DOMContentLoaded", () => {
    bindInteractive();
    initTransitions();
    runLoader(initGate);
  });

  return {
    esc,
    fmtHour,
    reduceMotion,
    finePointer,
    animate,
    lenis,
    scrollToTarget,
    trapFocus,
    bindInteractive,
    // cb(true) al pasar el título grande y cb(false) al volver arriba.
    onPastHead: (cb) => { pastCallbacks.push(cb); cb(past); },
    splitChars,
    splitWords,
    onUnlock: (cb) => unlockCallbacks.push(cb),
    openNow,
    toast,
  };
})();
