(() => {
  const { animate, finePointer, esc } = Site;
  const CATS = CATEGORIES.filter((c) => c.activo);
  const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  renderHeroMedia();
  renderHeroObject();
  document.querySelector(".hero__stage").insertAdjacentHTML("beforeend", '<div class="hero__fade" aria-hidden="true"></div>');
  renderCategories();
  renderStats();
  renderGallery();
  renderReviews();
  renderVisit();
  Site.splitChars();
  Site.splitWords();
  const smoke = initSmoke();

  Site.onUnlock(() => {
    if (animate) intro();
    if (smoke) smoke.start();
  });

  if (!animate) return;

  /* ---------- Intro ---------- */
  function intro() {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero .big .char", { yPercent: 115, duration: 1.2, stagger: 0.035 })
      .from(".hero__eyebrow, .hero__lead, .hero__actions, .hero__hint", { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.06 }, 0.3)
      .from(".header", { yPercent: -100, duration: 0.8, clearProps: "transform" }, 0.3);
    if (document.querySelector(".hero--obj")) tl.from("#heroObj", { y: 60, scale: 0.92, autoAlpha: 0, duration: 1.3 }, 0.35);
  }

  /* ---------- Parallax con el mouse ---------- */
  if (finePointer) {
    const hero = document.querySelector(".hero");
    const b1 = gsap.utils.toArray(".js-big1");
    const b2 = gsap.utils.toArray(".js-big2");
    const b1X = gsap.quickTo(b1, "x", { duration: 1.4, ease: "power3" });
    const b2X = gsap.quickTo(b2, "x", { duration: 1.4, ease: "power3" });
    hero.addEventListener("pointermove", (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      b1X(nx * -60);
      b2X(nx * 60);
    });
  }

  /* ---------- Anillo del botón de reserva: solo mientras está en pantalla ---------- */
  if ("IntersectionObserver" in window) {
    const ring = new IntersectionObserver((es) => es.forEach((en) => en.target.classList.toggle("is-idle", !en.isIntersecting)));
    document.querySelectorAll(".btn--reserve").forEach((b) => ring.observe(b));
  }

  /* ---------- Hero al hacer scroll ---------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 761px)", () => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=90%", pin: true, scrub: 1 },
    });
    if (document.querySelector(".hero--obj")) tl.to("#heroObj", { yPercent: -16, scale: 0.82, ease: "none" }, 0);
    tl.to(".big", { scale: 1.35, ease: "none" }, 0)
      .to(".hero__ui", { autoAlpha: 0, y: -40, ease: "none", duration: 0.5 }, 0)
      .to(".hero__fade", { opacity: 1, ease: "none" }, 0.3);
  });
  mm.add("(max-width: 760px)", () => {
    gsap.to(".big", { yPercent: 20, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  });

  /* ---------- Marquee con velocidad según scroll ---------- */
  const marquee = gsap.to(".marquee__track", { xPercent: -50, duration: 22, ease: "none", repeat: -1 });
  const speed = { t: 1 };
  const setSpeed = gsap.quickTo(speed, "t", { duration: 0.4, ease: "power3", onUpdate: () => marquee.timeScale(speed.t) });
  let calm = null;
  let dir = 1;
  ScrollTrigger.create({
    onUpdate: (self) => {
      dir = self.direction;
      setSpeed(dir * Math.min(1 + Math.abs(self.getVelocity()) / 400, 5));
      if (calm) calm.kill();
      calm = gsap.delayedCall(0.15, () => setSpeed(dir));
    },
  });
  ScrollTrigger.create({ trigger: ".marquee", start: "top bottom", end: "bottom top", onToggle: (st) => (st.isActive ? marquee.play() : marquee.pause()) });

  gsap.utils.toArray(".section-head .eyebrow").forEach((el) => {
    gsap.from(el, { autoAlpha: 0, x: -20, duration: 0.8, scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* ---------- Categorías en horizontal ---------- */
  mm.add("(min-width: 761px)", () => {
    const track = document.querySelector(".hscroll__track");
    const distance = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => -distance(), ease: "none",
      scrollTrigger: {
        trigger: "#hscroll", start: "top top+=80", end: () => `+=${distance()}`,
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    gsap.utils.toArray(".cat__ghost").forEach((g) => {
      gsap.fromTo(g, { xPercent: 20 }, {
        xPercent: -20, ease: "none",
        scrollTrigger: { trigger: g.closest(".cat"), containerAnimation: tween, start: "left right", end: "right left", scrub: true },
      });
    });
  });
  mm.add("(max-width: 760px)", () => {
    maskReveal(document.querySelector(".hscroll__track"));
  });

  gsap.from(".service", {
    y: 60, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.1,
    scrollTrigger: { trigger: ".services__list", start: "top 80%" },
  });

  /* ---------- "¿Qué está pasando?": las letras suben al llegar y el signo se queda meciéndose ---------- */
  gsap.from(".ask", {
    y: 40, autoAlpha: 0, duration: 1, ease: "expo.out",
    scrollTrigger: { trigger: ".ask", start: "top 88%", once: true },
    onComplete: () => document.querySelector(".ask").classList.add("is-in"),
  });

  /* ---------- Manifiesto: las palabras se encienden con el scroll ---------- */
  document.querySelectorAll(".js-fill").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="fill-word">${w}</span>`).join(" ");
    gsap.fromTo(el.querySelectorAll(".fill-word"), { opacity: 0.12 }, {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
    });
  });

  /* ---------- Cifras que cuentan ---------- */
  document.querySelectorAll(".js-count").forEach((el) => {
    const to = Number(el.dataset.to);
    const c = { v: 0 };
    gsap.to(c, {
      v: to, duration: 1.6, ease: "power3.out",
      onUpdate: () => { el.textContent = Math.round(c.v); },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
  gsap.from(".stat", { y: 50, autoAlpha: 0, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".stats", start: "top 85%" } });

  /* ---------- Tarjetas apiladas: la de atrás se encoge y oscurece ---------- */
  const cards = gsap.utils.toArray(".exp__card");
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    card.insertAdjacentHTML("beforeend", '<span class="exp__shade" aria-hidden="true"></span>');
    const st = { trigger: next, start: "top 75%", end: () => `top ${110 + (i + 1) * 22}px`, scrub: true };
    gsap.to(card, { scale: 0.92, ease: "none", scrollTrigger: st });
    gsap.to(card.querySelector(".exp__shade"), { opacity: 0.35, ease: "none", scrollTrigger: { ...st } });
  });
  gsap.utils.toArray(".exp__ghost").forEach((g) => {
    gsap.fromTo(g, { xPercent: 15 }, { xPercent: -15, ease: "none", scrollTrigger: { trigger: g.closest(".exp__card"), start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- Galería: fotos con parallax y entrada escalonada ---------- */
  gsap.utils.toArray(".shot").forEach((el, i) => maskReveal(el, (i % 4) * 0.08));
  gsap.utils.toArray(".shot img").forEach((img) => {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });
  if (document.querySelector(".review")) {
    gsap.from(".review", {
      y: 40, autoAlpha: 0, duration: 0.9, ease: "expo.out", stagger: 0.06,
      scrollTrigger: { trigger: ".reviews", start: "top 85%" },
    });
  }
  gsap.from(".visit > *", {
    y: 40, autoAlpha: 0, duration: 0.9, ease: "expo.out", stagger: 0.08,
    scrollTrigger: { trigger: ".visit", start: "top 85%" },
  });

  /* ---------- Frase de cierre ---------- */
  gsap.from(".footer__claim p", { yPercent: 40, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".footer__claim", start: "top 88%" } });

  /* ---------- Footer: letras que suben ---------- */
  gsap.from(".footer__big .char", {
    yPercent: 110, duration: 1.2, stagger: 0.04, ease: "expo.out",
    scrollTrigger: { trigger: ".footer", start: "top 80%" },
  });

  /* ================================================================ */

  // Humo saliendo de la cazoleta.
  function initSmoke() {
    if (Site.reduceMotion) return null;
    const canvas = document.getElementById("smoke");
    if (!canvas) return null;
    const conn = navigator.connection || {};
    const touch = !finePointer;
    // Ahorro de datos o celular modesto con video de fondo: sin humo (el video ya da movimiento).
    if (conn.saveData || (touch && navigator.deviceMemory && navigator.deviceMemory <= 4 && document.querySelector(".hero--media"))) {
      canvas.remove();
      return null;
    }
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, running = false, visible = true, tick = 0;
    const parts = [];
    // En celular: media resolución (el humo es difuso, no se nota), menos partículas y 30 cuadros por segundo.
    const SPAWN = touch ? 0.12 : 0.35;
    const MAX = touch ? 40 : 160;

    // Cada bocanada es un círculo difuso pintado una sola vez y reutilizado (antes: un degradado nuevo por partícula y por cuadro).
    const sprite = (rgb) => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, `rgba(${rgb}, 1)`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
      return c;
    };
    const WHITE = sprite("255, 230, 225");
    const RED = sprite("255, 70, 50");

    const resize = () => {
      // La barra de direcciones del celular cambia el alto al hacer scroll: si el tamaño no cambió, no se toca.
      if (canvas.clientWidth === w && Math.abs(canvas.clientHeight - h) < 120 && w) return;
      dpr = touch ? 0.5 : Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && running) requestAnimationFrame(frame); });

    const frame = () => {
      if (!running || document.hidden) return;
      requestAnimationFrame(frame);
      if (!visible) return;
      if (touch && (tick++ & 1)) return;

      const scale = Math.max(0.8, Math.min(w, 1400) / 900);
      const step = touch ? 2 : 1; // a 30 fps cada partícula avanza el doble por cuadro

      for (let i = 0; i < (parts.length < MAX && Math.random() < SPAWN * step ? 1 : 0); i++) {
        parts.push({
          x: Math.random() * w,
          y: h + 20,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(0.7 + Math.random() * 0.8) * scale,
          r: (30 + Math.random() * 40) * scale,
          life: 0,
          max: 320 + Math.random() * 200,
          seed: Math.random() * 100,
          red: Math.random() < 0.35,
        });
      }

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "screen";
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += step;
        if (p.life > p.max) { parts.splice(i, 1); continue; }
        p.x += (p.vx + Math.sin(p.life * 0.025 + p.seed) * 0.5) * step;
        p.y += p.vy * step;
        p.vy *= step === 2 ? 0.994 : 0.997;
        p.r += 0.32 * scale * step;
        ctx.globalAlpha = Math.sin((Math.PI * p.life) / p.max) * 0.06;
        ctx.drawImage(p.red ? RED : WHITE, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;
    };

    return { start: () => { if (!running) { running = true; frame(); } } };
  }

  // Tarjetas, filtros, cinta y texto del hero según las categorías activas de config.js.
  function renderCategories() {
    const pad = (i) => String(i + 1).padStart(2, "0");
    document.querySelector(".hscroll__track").innerHTML = CATS.map((c, i) => `
      <article class="cat" data-cat="${c.id}" data-cursor="Ver">
        <span class="cat__num">${pad(i)}</span>
        <div class="cat__media">${c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy">` : catIcon(c.id, "cat__icon")}<span class="cat__ghost">${esc(c.ghost)}</span>
          <div class="cat__alt${c.img ? " cat__alt--img" : ""}" aria-hidden="true">${c.img ? "" : `${catIcon(c.id, "cat__icon")}<span class="cat__ghost">${esc(c.ghost)}</span>`}</div></div>
        <div class="cat__info">
          <h3 class="cat__title">${esc(c.nombre)}</h3>
          <p>${esc(c.desc)}</p>
          ${c.desde ? `<span class="cat__from">Desde ${money.format(c.desde)}</span><br>` : ""}
          <a class="link-arrow" href="productos.html?cat=${c.id}">Ver ${esc(c.corto)}</a>
        </div>
      </article>`).join("");


    // Las frases de las ventanas del local van en la cinta, entre las categorías.
    const words = [...CATS.map((c) => c.nombre), "¿Ya te parchaste?", "Hookah", "Zonas VIP", "¿Qué está pasando?"];
    const once = words.map((w) => `<span>${esc(w)}</span><b>✦</b>`).join("");
    document.querySelector(".marquee__track").innerHTML = once + once;

    const names = CATS.map((c, i) => (i ? c.corto : c.nombre));
    document.querySelector(".hero__lead").textContent = `${names.join(", ")} y dos zonas VIP para que el parche no pare.`;
  }

  /* ---------- Portada con video o foto (HERO en config.js) ---------- */
  function renderHeroMedia() {
    const box = document.getElementById("heroMedia");
    if (!box || typeof HERO === "undefined") return;
    const small = window.matchMedia("(max-width: 760px)").matches;
    const src = (small && HERO.videoMovil) || HERO.video;
    if (src && !Site.reduceMotion) {
      box.innerHTML = `<video autoplay muted loop playsinline preload="metadata" ${HERO.poster ? `poster="${esc(HERO.poster)}"` : ""} aria-hidden="true"><source src="${esc(src)}" type="video/mp4"></video>`;
    } else if (HERO.poster) {
      box.innerHTML = `<img src="${esc(HERO.poster)}" alt="" fetchpriority="high">`;
    } else return;
    document.querySelector(".hero").classList.add("hero--media");
  }

  /* ---------- Objeto protagonista de la portada (3D o PNG) ---------- */
  function renderHeroObject() {
    const box = document.getElementById("heroObj");
    if (!box || typeof HERO === "undefined" || (!HERO.modelo && !HERO.objeto)) return;
    const hero = document.querySelector(".hero");
    hero.classList.add("hero--obj");
    const ready = () => box.classList.add("is-ready");
    const conn = navigator.connection || {};

    // Sin modelo 3D (o con ahorro de datos): el PNG, que se inclina hacia el mouse.
    if (!HERO.modelo || (conn.saveData && HERO.objeto)) {
      box.innerHTML = `<img src="${esc(HERO.objeto)}" alt="" fetchpriority="high">`;
      const img = box.querySelector("img");
      if (img.complete) ready();
      else img.addEventListener("load", ready, { once: true });
      if (animate && finePointer) {
        const rx = gsap.quickTo(box, "rotationX", { duration: 1.2, ease: "power3" });
        const ry = gsap.quickTo(box, "rotationY", { duration: 1.2, ease: "power3" });
        gsap.set(box, { transformPerspective: 900 });
        hero.addEventListener("pointermove", (e) => {
          ry((e.clientX / window.innerWidth - 0.5) * 24);
          rx((e.clientY / window.innerHeight - 0.5) * -16);
        });
      }
      return;
    }

    // Visor 3D (también en celular). Se pide de una, así carga mientras se ve la verificación de edad,
    // y aparece con un solo fundido en su sitio cuando el modelo ya está listo (nunca se cambia una imagen por otra).
    start3d();
  }

  function start3d() {
    const box = document.getElementById("heroObj");
    const hero = document.querySelector(".hero");
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js";
    // SRI: si el CDN sirviera un archivo distinto al esperado, el navegador no lo ejecuta.
    s.integrity = "sha384-cprcVQt7wbUl0xngF3PGP6yBB7n4/t+4AoAMG9biiMCGFiWOdzUH10Ie2COTqFNW";
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
    const sway = HERO.giro === "vaiven";
    const spin = Site.reduceMotion || sway ? "" : 'auto-rotate auto-rotate-delay="0" rotation-per-second="16deg"';
    box.insertAdjacentHTML("beforeend", `<model-viewer src="${esc(HERO.modelo)}" alt="" ${spin}
      disable-zoom disable-pan disable-tap interaction-prompt="none" camera-orbit="0deg 80deg auto" field-of-view="26deg"
      interpolation-decay="120" environment-image="neutral" exposure="1.1" shadow-intensity="0" loading="eager"></model-viewer>`);
    const mv = box.querySelector("model-viewer");
    mv.addEventListener("load", () => box.classList.add("is-ready", "is-3d"), { once: true });
    if (Site.reduceMotion) return;

    // Hacia dónde mira el logo: se mece solo y se suma lo que haga el mouse, el dedo o la inclinación del teléfono.
    const aim = { x: 0, y: 0 }; // -1 … 1
    const cur = { x: 0, y: 0 };
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const t = (now - t0) / 1000;
      cur.x += (aim.x - cur.x) * 0.08;
      cur.y += (aim.y - cur.y) * 0.08;
      const swayX = sway ? Math.sin(t * 0.55) * 24 : 0;
      const swayY = sway ? Math.sin(t * 0.37) * 4 : 0;
      mv.cameraOrbit = `${swayX * (1 - Math.min(1, Math.abs(cur.x))) - cur.x * 55}deg ${80 + swayY + cur.y * 14}deg auto`;
      raf = requestAnimationFrame(tick);
    };
    // Solo trabaja mientras la portada está en pantalla.
    new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(tick);
    }).observe(hero);

    if (finePointer) {
      hero.addEventListener("pointermove", (e) => {
        aim.x = (e.clientX / window.innerWidth - 0.5) * 2;
        aim.y = (e.clientY / window.innerHeight - 0.5) * 2;
      });
      hero.addEventListener("pointerleave", () => { aim.x = 0; aim.y = 0; });
      return;
    }

    // Celular: el logo gira siguiendo el dedo sobre la portada y vuelve al soltar.
    let release = 0;
    const touch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      clearTimeout(release);
      aim.x = (t.clientX / window.innerWidth - 0.5) * 2;
      aim.y = (t.clientY / window.innerHeight - 0.5) * 1.2;
    };
    hero.addEventListener("touchstart", touch, { passive: true });
    hero.addEventListener("touchmove", touch, { passive: true });
    hero.addEventListener("touchend", () => { release = setTimeout(() => { aim.x = 0; aim.y = 0; }, 400); }, { passive: true });
    // Android: se inclina al mover el teléfono (iOS pide permiso, así que ahí queda el vaivén y el dedo).
    if ("DeviceOrientationEvent" in window && typeof DeviceOrientationEvent.requestPermission !== "function") {
      window.addEventListener("deviceorientation", (e) => {
        if (e.gamma == null) return;
        aim.x = Math.max(-1, Math.min(1, e.gamma / 30));
      }, { passive: true });
    }
  }

  /* ---------- Cifras: salen de config.js para que nunca mientan ---------- */
  function renderStats() {
    const box = document.getElementById("stats");
    if (!box) return;
    const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const open = Object.entries(HOURS).filter(([, h]) => h);
    const latest = Math.max(...open.map(([, h]) => h.fin));
    const lateDays = open.filter(([, h]) => h.fin === latest).map(([d]) => DAYS[d]);
    const [hh, ampm] = Site.fmtHour(latest).replace(":00", "").split(" ");
    const zones = ZONES.filter((z) => z.id !== "any").length;
    const flavors = HOOKAH_FLAVORS.filter((f) => !/sorpr/i.test(f)).length;
    const biggest = Math.max(...ZONES.map((z) => z.max || 0));
    const stat = (num, label) => `<div class="stat"><span class="stat__num">${num}</span><span class="stat__label">${esc(label)}</span></div>`;
    box.innerHTML = [
      stat(`<span class="js-count" data-to="${zones}">${animate ? 0 : zones}</span>`, zones === 1 ? "Zona VIP privada" : "Zonas VIP privadas"),
      stat(`<span class="js-count" data-to="${flavors}">${animate ? 0 : flavors}</span>`, "Sabores de hookah"),
      stat(`<span class="js-count" data-to="${biggest}">${animate ? 0 : biggest}</span>`, "Personas en la VIP más grande"),
      stat(`${hh}<small> ${ampm}</small>`, lateDays.length > 1 ? `${lateDays.slice(0, -1).join(", ")} y ${lateDays.slice(-1)[0].toLowerCase()}` : lateDays[0] || ""),
    ].join("");
    document.querySelectorAll(".js-flavors").forEach((el) => (el.textContent = flavors));
  }

  /* ---------- Galería "El sitio" ---------- */
  function renderGallery() {
    const box = document.getElementById("galleryGrid");
    const shots = typeof GALLERY === "undefined" ? [] : GALLERY.filter((g) => g.img);
    if (!box || !shots.length) {
      const sec = document.getElementById("sitio");
      if (sec) sec.hidden = true;
      return;
    }
    box.innerHTML = shots.map((g) => {
      const cls = `shot${g.forma ? ` shot--${g.forma}` : ""}`;
      return `<figure class="${cls}"><img src="${esc(g.img)}" alt="${esc(g.alt)}" loading="lazy"><figcaption>${esc(g.alt)}</figcaption></figure>`;
    }).join("");
  }

  /* ---------- Reseñas (solo si hay en config.js) ---------- */
  function renderReviews() {
    const sec = document.getElementById("resenas");
    if (!sec) return;
    const list = typeof REVIEWS !== "undefined" ? REVIEWS : [];
    if (!list.length) { sec.hidden = true; return; }
    sec.querySelector(".reviews__list").innerHTML = list.map((r) => {
      const n = Math.max(0, Math.min(5, r.estrellas || 5));
      return `<figure class="review">
        <span class="review__stars" aria-label="${n} de 5 estrellas">${"★".repeat(n)}${"☆".repeat(5 - n)}</span>
        <blockquote>“${esc(r.texto)}”</blockquote>
        <figcaption>${esc(r.nombre)}${r.fuente ? ` · ${esc(r.fuente)}` : ""}</figcaption>
      </figure>`;
    }).join("");
    const more = sec.querySelector(".reviews__more");
    if (INFO.resenas) more.innerHTML = `<a class="btn btn--ghost" href="${esc(INFO.resenas)}" target="_blank" rel="noopener">Déjanos tu reseña</a>`;
    else more.remove();
  }

  /* ---------- Cómo llegar: el mapa solo carga si lo piden (más rápido y más privado) ---------- */
  function renderVisit() {
    const sec = document.getElementById("ubicacion");
    if (!sec) return;
    // Con coordenadas el marcador cae en el sitio exacto; la dirección escrita sola Google no la encuentra.
    const query = encodeURIComponent(INFO.coordenadas || `${INFO.direccion}, ${INFO.ciudad}`);
    const route = INFO.mapa || `https://www.google.com/maps/search/?api=1&query=${query}`;
    sec.querySelector(".js-route").href = route;
    const map = sec.querySelector(".visit__map");
    map.querySelector("button").addEventListener("click", () => {
      map.innerHTML = `<iframe title="Mapa de ${esc(INFO.nombre)}" src="https://www.google.com/maps?q=${query}&z=18&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    });
  }


  // Revelación con máscara: el elemento se "abre" de abajo hacia arriba y su foto se asienta (como landonorris.com).
  function maskReveal(el, delay = 0) {
    const img = el.querySelector("img");
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true }, delay });
    tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power4.out", clearProps: "clipPath" });
    if (img) tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.1, ease: "expo.out" }, 0);
  }

  // El fondo de "Lo que tenemos" toma el color de la categoría activa y se funde suave entre una y otra.
  const strip = document.querySelector(".hscroll");
  const section = document.getElementById("productos");
  let tinted = null;
  const tint = (card) => {
    if (!card || card === tinted) return;
    tinted = card;
    const css = getComputedStyle(card);
    const rgb = css.getPropertyValue("--c-rgb").trim();
    if (!rgb) return;
    strip.style.setProperty("--tint", `rgba(${rgb}, 0.22)`);
    section.style.setProperty("--tint-solid", css.getPropertyValue("--c").trim());
  };
  const catCards = [...document.querySelectorAll(".cat")];
  if (finePointer) {
    catCards.forEach((c) => c.addEventListener("pointerenter", () => tint(c)));
    // Al recorrer las categorías con el scroll, manda la que está más cerca del centro.
    ScrollTrigger.create({
      trigger: strip, start: "top bottom", end: "bottom top",
      onUpdate: () => {
        if (strip.querySelector(".cat:hover")) return;
        const mid = window.innerWidth / 2;
        let best = null, dist = Infinity;
        catCards.forEach((c) => {
          const r = c.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - mid);
          if (d < dist) { dist = d; best = c; }
        });
        tint(best);
      },
    });
  }
  tint(catCards[0]);

  // Carrusel en celular: los puntos marcan la tarjeta centrada y llevan a cada una.
  const dots = document.getElementById("hscrollDots");
  if (dots && catCards.length > 1) {
    dots.innerHTML = catCards.map(() => "<i></i>").join("");
    const marks = [...dots.children];
    let raf = 0;
    const sync = () => {
      raf = 0;
      if (strip.scrollWidth <= strip.clientWidth + 4) return;
      const mid = strip.scrollLeft + strip.clientWidth / 2;
      let best = 0, dist = Infinity;
      catCards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < dist) { dist = d; best = i; }
      });
      marks.forEach((m, i) => m.classList.toggle("is-on", i === best));
      tint(catCards[best]);
    };
    strip.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(sync); }, { passive: true });
    sync();
  }

  // La capa de color de cada categoría crece desde el punto por donde entra el mouse y se va por donde sale.
  if (finePointer) {
    document.querySelectorAll(".cat__media").forEach((m) => {
      const aim = (e) => {
        const r = m.getBoundingClientRect();
        m.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        m.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      };
      m.addEventListener("pointerenter", aim);
      m.addEventListener("pointerleave", aim);
    });
  } else if ("IntersectionObserver" in window) {
    // En celular no hay mouse: la tarjeta se enciende sola al pasar por el centro de la pantalla.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        en.target.classList.toggle("is-lit", en.isIntersecting);
        if (en.isIntersecting) tint(en.target);
      });
    }, { rootMargin: "-42% 0px -42% 0px" });
    document.querySelectorAll(".cat").forEach((c) => io.observe(c));
  }
})();
