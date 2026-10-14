// Detalles compartidos: estado abierto/cerrado, barra de progreso, texto que se mezcla y volver arriba.
(() => {
  const { animate, finePointer, lenis, fmtHour } = Site;

  /* ---------- Abierto ahora / cerrado (según HOURS de config.js) ---------- */
  const DAY_NAMES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

  function openStatus(now = new Date()) {
    const day = now.getDay();
    const t = now.getHours() + now.getMinutes() / 60;
    const today = HOURS[day];
    const yesterday = HOURS[(day + 6) % 7];

    // Turno de ayer que sigue abierto después de medianoche (fin > 24).
    if (yesterday && yesterday.fin > 24 && t < yesterday.fin - 24) return { open: true, text: `Abierto · cierra ${fmtHour(yesterday.fin)}` };
    if (today && t >= today.inicio && t < today.fin) return { open: true, text: `Abierto · cierra ${fmtHour(today.fin)}` };
    if (today && t < today.inicio) return { open: false, text: `Cerrado · abre hoy ${fmtHour(today.inicio)}` };

    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d]) return { open: false, text: `Cerrado · abre ${i === 1 ? "mañana" : DAY_NAMES[d]} ${fmtHour(HOURS[d].inicio)}` };
    }
    return { open: false, text: "Cerrado" };
  }

  function paintStatus() {
    const s = openStatus();
    document.querySelectorAll(".js-status").forEach((el) => {
      el.classList.toggle("is-open", s.open);
      el.textContent = s.text;
    });
  }
  paintStatus();
  setInterval(paintStatus, 60 * 1000);

  /* ---------- Barra de progreso de lectura ---------- */
  const bar = document.getElementById("progress");
  if (bar) {
    const paint = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    if (lenis) lenis.on("scroll", paint);
    else window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
    paint();
  }

  /* ---------- Texto que se mezcla al pasar el mouse ---------- */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+";
  function scramble(el) {
    const final = el.dataset.text || (el.dataset.text = el.textContent);
    let frame = 0;
    const total = 14;
    cancelAnimationFrame(el._raf);
    const tick = () => {
      frame++;
      const done = Math.floor((frame / total) * final.length);
      el.textContent = [...final].map((ch, i) => (i < done || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
      if (frame < total) el._raf = requestAnimationFrame(tick);
      else el.textContent = final;
    };
    tick();
  }
  if (animate && finePointer) {
    document.querySelectorAll(".nav__link, .footer__link").forEach((el) => {
      el.addEventListener("pointerenter", () => scramble(el));
    });
  }

  /* ---------- Menú móvil: enlaces en cascada ---------- */
  const toggle = document.getElementById("menuToggle");
  if (animate && toggle) {
    toggle.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") !== "true") { gsap.killTweensOf(".nav__link"); gsap.set(".nav__link", { clearProps: "transform,opacity,visibility" }); return; }
      gsap.fromTo(".nav.is-open .nav__link", { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, stagger: 0.04, ease: "expo.out", delay: 0.08, overwrite: true });
    });
  }

  /* ---------- Volver arriba ---------- */
  const top = document.getElementById("toTop");
  if (top) {
    top.addEventListener("click", () => {
      if (lenis) lenis.scrollTo(0, { duration: 1, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: 0, behavior: animate ? "smooth" : "auto" });
    });
  }
})();

// Íconos de cada categoría, de relleno mientras no hay fotos (inicio y productos).
// Trazo de línea con un relleno suave detrás (las piezas con class="f") para que tengan volumen.
window.catIcon = (cat, cls) => {
  const paths = {
    // Botella con etiqueta y un vaso con hielo al lado
    licores: '<path class="f" d="M20 21l4-6V6h8v9l4 6v35a3 3 0 0 1-3 3H23a3 3 0 0 1-3-3z"/>'
      + '<path d="M24 6h8M24 15h8M20 21l4-6V6h8v9l4 6v35a3 3 0 0 1-3 3H23a3 3 0 0 1-3-3z"/><path d="M20 31h16v13H20z"/><path d="M24 36h8M24 40h5"/>'
      + '<path class="f" d="M41 38h17l-2 18a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3z"/><path d="M41 38h17l-2 18a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3z"/><path d="M42 46h15"/><path d="M45 50l3-2 3 3-3 2zM50 44l2.5-2 2.5 2.5-2.5 2z"/>',
    // Vape desechable con boquilla, ventana de líquido y vapor
    vapes: '<path class="f" d="M24 20a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v34a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/>'
      + '<path d="M24 20a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v34a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M28 14V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/>'
      + '<rect x="28.5" y="24" width="7" height="16" rx="3.5"/><path d="M28.5 33h7"/><circle cx="32" cy="51" r="2"/>'
      + '<path d="M42 9c3-2 5 1 8-1s5 1 8-1M44 16c2.5-1.5 4 1 6.5-.5s4 1 6.5-.5"/>',
    // Wrap enrollado con banda, brasa y humo
    blunts: '<path class="f" d="M9 47 41 15a5.7 5.7 0 0 1 8 8L17 55z"/>'
      + '<path d="M9 47 41 15a5.7 5.7 0 0 1 8 8L17 55z"/><path d="M35 21l8 8M31 25l8 8"/><path d="M9 47l8 8"/>'
      + '<path d="M6 51c-2 2-1 5 1 6s4 1 6-1" opacity=".6"/><path d="M50 12c1-4 5-5 6-9M45 9c0-3 3-4 3-7"/>',
    // Granizado: vaso con domo, pitillo y hielo
    granizados: '<path class="f" d="M18 25h28l-3.6 30.5a3 3 0 0 1-3 2.6H24.6a3 3 0 0 1-3-2.6z"/>'
      + '<path d="M18 25h28l-3.6 30.5a3 3 0 0 1-3 2.6H24.6a3 3 0 0 1-3-2.6z"/><path d="M16 25h32M18 25c0-8 6-13.5 14-13.5S46 17 46 25"/>'
      + '<path d="M35 11.5 39 3h7"/><path d="M21 32h22"/><path d="M27 41l3-3 3 3-3 3zM34 48l3-3 3 3-3 3zM26 51l2-2 2 2-2 2z"/>',
  };
  return `<svg class="${cls}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[cat] || '<circle cx="32" cy="32" r="20"/>'}</svg>`;
};

// Gota líquida que sigue al cursor en todo el sitio.
// En la portada es grande y revela la capa roja con PARCHADITOS; al bajar se encoge y queda como cursor.
// Se estira hacia donde se mueve y suelta gotitas si va rápido. En celular solo vive en la portada (sigue el dedo).
(() => {
  const { animate, finePointer } = Site;
  const hero = document.querySelector(".hero");
  const layer = document.getElementById("reveal");
  if (!animate) { if (layer) layer.style.clipPath = "circle(0 at 50% 50%)"; return; }

  const page = finePointer ? document.body.appendChild(document.createElement("div")) : null;
  if (page) { page.className = "gota"; page.setAttribute("aria-hidden", "true"); }
  if (!layer && !page) return;
  if (layer) layer.style.clipPath = "path('M0 0')";
  const cursorEl = document.querySelector(".cursor");

  const BIG = () => Math.min(170, window.innerWidth * 0.22) * 0.9;
  const SMALL = 10; // tamaño como cursor, fuera de la portada
  const HOVER = 42; // sobre enlaces con etiqueta ("Ver", "Ir"…)

  const target = { x: window.innerWidth / 2, y: window.innerHeight * 0.45, hero: 0, page: 0 };
  const cur = { x: target.x, y: target.y, vx: 0, vy: 0, hero: 0, page: 0, r: SMALL };
  const drops = [];
  let t = 0;
  let running = false;
  let idle = 0;

  // Contorno de la gota: elipse estirada en la dirección del movimiento, con ondulación de líquido.
  function blob(R, ox, oy, speed, ang) {
    if (R < 0.6) return "";
    const stretch = Math.min(speed * 0.022, 0.55);
    const a = R * (1 + stretch);
    const b = R * (1 - stretch * 0.35);
    const N = R > 30 ? 40 : 24;
    const cx = cur.x - ox;
    const cy = cur.y - oy;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      const rel = th - ang;
      let r = (a * b) / Math.hypot(b * Math.cos(rel), a * Math.sin(rel));
      r *= 1 + 0.06 * Math.sin(3 * th + t * 0.05) + 0.04 * Math.sin(5 * th - t * 0.07);
      // La cola queda un poco atrás: el líquido "arrastra".
      const back = Math.cos(rel) < 0 ? -Math.cos(rel) * stretch * R * 0.35 : 0;
      pts.push([cx + Math.cos(th) * r - Math.cos(ang) * back, cy + Math.sin(th) * r - Math.sin(ang) * back]);
    }
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const m0 = mid(pts[N - 1], pts[0]);
    let d = `M${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
    for (let i = 0; i < N; i++) {
      const m = mid(pts[i], pts[(i + 1) % N]);
      d += `Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
    }
    return d + "Z";
  }

  const dropsPath = (where, ox, oy) => drops.filter((p) => p.where === where).map((p) => {
    const x = p.x - ox - p.r;
    const y = p.y - oy;
    const r = p.r.toFixed(1);
    return `M${x.toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${(p.r * 2).toFixed(1)} 0a${r} ${r} 0 1 0 ${(-p.r * 2).toFixed(1)} 0`;
  }).join("");

  const loop = () => {
    t++;
    cur.vx = (target.x - cur.x) * 0.2;
    cur.vy = (target.y - cur.y) * 0.2;
    cur.x += cur.vx;
    cur.y += cur.vy;
    const ease = (k) => { cur[k] += (target[k] - cur[k]) * (target[k] ? 0.12 : 0.1); if (Math.abs(cur[k] - target[k]) < 0.005) cur[k] = target[k]; };
    ease("hero");
    ease("page");
    const want = cursorEl && cursorEl.classList.contains("is-big") ? HOVER : SMALL;
    cur.r += (want - cur.r) * 0.16;

    const speed = Math.hypot(cur.vx, cur.vy);
    const ang = Math.atan2(cur.vy, cur.vx);
    const heroR = BIG() * cur.hero;
    const pageR = cur.r * cur.page;

    // Gotitas que se desprenden al mover rápido (proporcionales al tamaño actual).
    const R = Math.max(heroR, pageR);
    if (speed > 14 && R > 6 && Math.random() < 0.35) {
      drops.push({
        where: heroR >= pageR ? "hero" : "page",
        x: cur.x - Math.cos(ang) * R * 0.9 + (Math.random() - 0.5) * R * 0.5,
        y: cur.y - Math.sin(ang) * R * 0.9 + (Math.random() - 0.5) * R * 0.5,
        r: R * (0.08 + Math.random() * 0.12),
      });
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      drops[i].r *= 0.94;
      drops[i].y += 0.6;
      if (drops[i].r < 1) drops.splice(i, 1);
    }

    if (layer) {
      const rect = hero.getBoundingClientRect();
      layer.style.clipPath = `path('${blob(heroR, rect.left, rect.top, speed, ang) + dropsPath("hero", rect.left, rect.top) || "M0 0"}')`;
    }
    if (page) page.style.clipPath = `path('${blob(pageR, 0, 0, speed, ang) + dropsPath("page", 0, 0) || "M0 0"}')`;

    // Quieto y ya asentado: el bucle se detiene (cero trabajo hasta el próximo movimiento).
    const settled = speed < 0.05 && !drops.length && Math.abs(want - cur.r) < 0.1 && cur.hero === target.hero && cur.page === target.page;
    idle = settled ? idle + 1 : 0;
    if (idle > 90 || (!target.hero && !target.page && heroR < 0.6 && pageR < 0.6 && !drops.length)) {
      running = false;
      gsap.ticker.remove(loop);
    }
  };
  const wake = () => { idle = 0; if (!running) { running = true; gsap.ticker.add(loop); } };

  // ¿El punto está sobre la portada (y no sobre sus botones)?
  const overHero = (x, y, el) => {
    if (!layer) return false;
    const r = hero.getBoundingClientRect();
    if (y < r.top || y > r.bottom || r.bottom < 80) return false;
    return !(el && el.closest && el.closest(".hero__ui a, .hero__ui button, .header"));
  };

  /* ---------- Mouse: en toda la página ---------- */
  if (finePointer) {
    let last = null;
    const place = (x, y, el) => {
      target.x = x;
      target.y = y;
      const inHero = overHero(x, y, el);
      target.hero = inHero ? 1 : 0;
      target.page = inHero ? 0 : 1;
      wake();
    };
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      last = e;
      place(e.clientX, e.clientY, e.target);
    }, { passive: true });
    // Al hacer scroll sin mover el mouse, la gota cambia de tamaño al cruzar el borde de la portada.
    window.addEventListener("scroll", () => {
      if (last) place(last.clientX, last.clientY, document.elementFromPoint(last.clientX, last.clientY));
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => { target.hero = 0; target.page = 0; wake(); });
    return;
  }

  /* ---------- Celular: solo en la portada, sigue el dedo ---------- */
  if (!layer) return;
  let offTimer = 0;
  const onTouch = (e) => {
    const tt = e.touches[0];
    if (!tt || e.target.closest(".hero__ui a, .hero__ui button")) return;
    clearTimeout(offTimer);
    target.x = tt.clientX;
    target.y = tt.clientY;
    target.hero = 1;
    wake();
  };
  hero.addEventListener("touchstart", onTouch, { passive: true });
  hero.addEventListener("touchmove", onTouch, { passive: true });
  hero.addEventListener("touchend", () => { offTimer = setTimeout(() => { target.hero = 0; wake(); }, 500); }, { passive: true });

})();
