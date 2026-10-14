(() => {
  const { animate } = Site;
  const $ = (s) => document.querySelector(s);

  const STEP_NAMES = { servicio: "Servicio", zona: "Zona", fecha: "Fecha y hora", personas: "Personas", datos: "Tus datos" };
  // Lo que le falta a cada paso, para decirlo en vez de dejar el botón apagado sin explicación.
  const STEP_HINTS = { servicio: "Escoge un servicio para seguir", zona: "Escoge una zona para seguir", fecha: "Escoge el día y la hora para seguir", datos: "" };
  const SAVE_KEY = "reserva-v1";

  const state = {
    service: null,
    zone: null,
    date: null, // Date
    time: null, // { value: "20:30", label: "8:30 p.m." }
    people: 4,
    occasion: OCCASIONS[0],
    flavor: HOOKAH_FLAVORS[0],
    group: null, // franja de horas abierta
  };
  let current = 0;
  let reached = 0;
  let advanceTimer = 0;
  let pushed = 0; // pasos que este visitante agregó al historial

  const fmtDayLong = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
  const fmtWd = new Intl.DateTimeFormat("es-CO", { weekday: "short" });
  const fmtMonth = new Intl.DateTimeFormat("es-CO", { month: "short" });

  // Los pasos activos dependen del servicio: sin zona VIP no se pide zona.
  const activeSteps = () => ["servicio", ...(state.service && !state.service.zona ? [] : ["zona"]), "fecha", "personas", "datos"];
  const maxPeople = () => (state.zone && state.zone.max) || MAX_PEOPLE;

  /* ---------- Guardar el avance (sobrevive a recargar, a Atrás y a la ida a WhatsApp) ---------- */
  function save() {
    try {
      sessionStorage.setItem(SAVE_KEY, JSON.stringify({
        service: state.service && state.service.id,
        zone: state.zone && state.zone.id,
        date: state.date && state.date.toISOString(),
        time: state.time && state.time.value,
        people: state.people,
        occasion: state.occasion,
        flavor: state.flavor,
        name: $("#fName").value,
        phone: $("#fPhone").value,
        notes: $("#fNotes").value,
        current,
        reached,
      }));
    } catch (e) { /* almacenamiento bloqueado: se sigue sin guardar */ }
  }

  function restore() {
    let d;
    try { d = JSON.parse(sessionStorage.getItem(SAVE_KEY) || "null"); } catch (e) { d = null; }
    if (!d) return false;
    state.service = SERVICES.find((s) => s.id === d.service) || null;
    state.zone = ZONES.find((z) => z.id === d.zone) || null;
    if (d.date) {
      const date = new Date(d.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date >= today && slotsFor(date).length && !isFull(date)) {
        state.date = date;
        state.time = d.time ? slotsFor(date).find((s) => s.value === d.time) || null : null;
      }
    }
    state.people = Math.max(1, Math.min(maxPeople(), Number(d.people) || 4));
    if (OCCASIONS.includes(d.occasion)) state.occasion = d.occasion;
    if (HOOKAH_FLAVORS.includes(d.flavor)) state.flavor = d.flavor;
    $("#fName").value = d.name || "";
    $("#fPhone").value = d.phone || "";
    $("#fNotes").value = d.notes || "";
    // Vuelve al último paso que sigue siendo válido.
    const steps = activeSteps();
    let i = 0;
    while (i < Math.min(d.current || 0, steps.length - 1) && isValid(steps[i])) i++;
    current = i;
    reached = Math.max(i, Math.min(d.reached || 0, steps.length - 1));
    return true;
  }

  /* ---------- Render de opciones ---------- */
  function radioButton(cls, html, checked, attrs = "") {
    return `<button type="button" class="${cls}" role="radio" aria-checked="${checked}" ${attrs}>${html}</button>`;
  }

  // Elegir una opción única lleva solo al siguiente paso (con una pausa corta para ver la selección).
  function autoAdvance() {
    clearTimeout(advanceTimer);
    const steps = activeSteps();
    if (current >= steps.length - 1 || !isValid(steps[current])) return;
    advanceTimer = setTimeout(() => goTo(current + 1), 320);
  }

  function renderServices() {
    $("#optServices").innerHTML = SERVICES.map((s) => radioButton(
      "opt",
      `<span class="opt__ghost" aria-hidden="true">${s.id === "hookah" ? "H" : s.id === "vip" ? "VIP" : "V+H"}</span>
       <span class="opt__tag">${s.tag}</span>
       <span class="opt__check" aria-hidden="true">✓</span>
       <span class="opt__name">${s.nombre}</span>
       <span class="opt__desc">${s.desc}</span>`,
      state.service === s,
      `data-id="${s.id}" data-cursor="Elegir"`,
    )).join("");
    $("#optServices").querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      state.service = SERVICES.find((s) => s.id === b.dataset.id);
      if (!state.service.zona) state.zone = null;
      reached = Math.min(reached, 0);
      renderServices();
      renderDates();
      renderTimes();
      renderSteps();
      update();
      autoAdvance();
    }));
  }

  function renderZones() {
    $("#optZones").innerHTML = ZONES.map((z) => radioButton(
      "opt",
      `<span class="opt__ghost" aria-hidden="true">${z.id === "any" ? "?" : z.nombre.split(" ")[1]}</span>
       <span class="opt__check" aria-hidden="true">✓</span>
       <span class="opt__name">${z.nombre}</span>
       <span class="opt__desc">${z.detalle}</span>`,
      state.zone === z,
      `data-id="${z.id}" data-cursor="Elegir"`,
    )).join("");
    $("#optZones").querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      state.zone = ZONES.find((z) => z.id === b.dataset.id);
      if (state.people > maxPeople()) state.people = maxPeople();
      renderZones();
      renderDates();
      renderTimes();
      renderPeople();
      update();
      autoAdvance();
    }));
  }

  function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  // DIAS_ESPECIALES de config.js: cerrado, zonas llenas u otro horario solo ese día.
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const special = (d) => (typeof DIAS_ESPECIALES !== "undefined" ? DIAS_ESPECIALES.find((x) => x.fecha === iso(d)) : null) || null;
  // ¿Ya no hay cupo ese día para lo que se está reservando? "todas" llena todo; "salon" es la hookah sin zona.
  function isFull(d) {
    const sp = special(d);
    if (!sp || !Array.isArray(sp.lleno) || !sp.lleno.length) return false;
    if (sp.lleno.includes("todas")) return true;
    if (state.service && !state.service.zona) return sp.lleno.includes("salon");
    const zones = ZONES.filter((z) => z.id !== "any").map((z) => z.id);
    if (!state.zone || state.zone.id === "any") return zones.every((id) => sp.lleno.includes(id));
    return sp.lleno.includes(state.zone.id);
  }

  function slotsFor(date) {
    const sp = special(date);
    if (sp && sp.cerrado) return [];
    const h = (sp && sp.horas) || HOURS[date.getDay()];
    if (!h) return [];
    const now = new Date();
    const slots = [];
    for (let t = h.inicio; t <= h.fin - 1; t += 0.5) {
      const hour = Math.floor(t) % 24;
      const min = t % 1 ? 30 : 0;
      // En el día de hoy solo se muestran horas con al menos 1 hora de margen.
      if (sameDay(date, now)) {
        const slot = new Date(date);
        slot.setHours(Math.floor(t), min, 0, 0);
        if (slot - now < 60 * 60 * 1000) continue;
      }
      const h12 = hour % 12 || 12;
      const ampm = hour < 12 ? "a.m." : "p.m.";
      slots.push({
        t,
        value: `${String(hour).padStart(2, "0")}:${min ? "30" : "00"}`,
        label: `${h12}:${min ? "30" : "00"} ${ampm}`,
      });
    }
    return slots;
  }

  // Franjas para no mostrar 19 horas de una: primero la franja, después la media hora.
  const GROUPS = [
    { id: "tarde", nombre: "Tarde", desde: 0, hasta: 19 },
    { id: "noche", nombre: "Noche", desde: 19, hasta: 22 },
    { id: "tarde-noche", nombre: "Más tarde", desde: 22, hasta: 99 },
  ];
  const groupOf = (t) => GROUPS.find((g) => t >= g.desde && t < g.hasta);

  function renderDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: BOOKING_DAYS_AHEAD }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
    // Si el día escogido se llenó para la zona nueva, se suelta para no mandar una reserva imposible.
    if (state.date && (isFull(state.date) || !slotsFor(state.date).length)) { state.date = null; state.time = null; }
    $("#optDates").innerHTML = days.map((d, i) => {
      const open = slotsFor(d).length > 0;
      const full = open && isFull(d);
      const sp = special(d);
      const why = !open ? "Cerrado" : full ? "Lleno" : "";
      const wd = i === 0 ? "Hoy" : i === 1 ? "Mañana" : fmtWd.format(d).replace(".", "");
      const note = sp && sp.nota ? `, ${sp.nota}` : "";
      return `<button type="button" class="date${full ? " date--full" : ""}${sp && sp.nota && !why ? " date--special" : ""}" role="radio" aria-checked="${sameDay(state.date, d)}" data-i="${i}" ${why ? "disabled" : ""} aria-label="${fmtDayLong.format(d)}${why ? `, ${why.toLowerCase()}` : ""}${note}"${sp && sp.nota ? ` title="${Site.esc(sp.nota)}"` : ""}>
        <span class="date__wd">${wd}</span>
        <span class="date__d">${d.getDate()}</span>
        <span class="date__m">${why || fmtMonth.format(d).replace(".", "")}</span>
      </button>`;
    }).join("");
    $("#optDates").querySelectorAll(".date").forEach((b) => b.addEventListener("click", () => {
      state.date = days[Number(b.dataset.i)];
      state.time = null;
      state.group = null;
      renderDates();
      renderTimes();
      update();
    }));
    const sel = $("#optDates").querySelector('[aria-checked="true"]');
    if (sel) {
      const box = $("#optDates");
      box.scrollLeft = sel.offsetLeft - box.clientWidth / 2 + sel.offsetWidth / 2;
    }
  }

  function renderTimes() {
    const box = $("#optTimes");
    const tabs = $("#timeGroups");
    if (!state.date) {
      tabs.innerHTML = "";
      box.innerHTML = `<p class="times__empty">Escoge un día primero.</p>`;
      return;
    }
    const slots = slotsFor(state.date);
    const groups = GROUPS.filter((g) => slots.some((s) => groupOf(s.t) === g));
    if (!state.group || !groups.includes(state.group)) {
      state.group = (state.time && groupOf(slots.find((s) => s.value === state.time.value)?.t)) || groups[groups.length > 1 ? 1 : 0];
    }
    tabs.innerHTML = groups.map((g) => {
      const n = slots.filter((s) => groupOf(s.t) === g);
      const range = `${n[0].label.replace(/:00 /, " ")} – ${n[n.length - 1].label.replace(/:00 /, " ")}`;
      return radioButton("tgroup", `<b>${g.nombre}</b><small>${range}</small>`, state.group === g, `data-g="${g.id}"`);
    }).join("");
    tabs.querySelectorAll(".tgroup").forEach((b) => b.addEventListener("click", () => {
      state.group = GROUPS.find((g) => g.id === b.dataset.g);
      renderTimes();
    }));

    const shown = slots.filter((s) => groupOf(s.t) === state.group);
    box.innerHTML = shown.map((s) => radioButton("chip", s.label, state.time && state.time.value === s.value, `data-v="${s.value}"`)).join("");
    box.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
      state.time = slots.find((s) => s.value === b.dataset.v);
      box.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-checked", String(c === b)));
      update();
      autoAdvance();
    }));
    if (animate) gsap.from(box.children, { y: 8, autoAlpha: 0, duration: 0.25, stagger: 0.02, ease: "power3.out", overwrite: true });
  }

  function renderPeople() {
    const max = maxPeople();
    $("#peopleValue").textContent = state.people;
    $("#peopleLabel").textContent = state.people === 1 ? "persona" : "personas";
    $("#peopleMinus").disabled = state.people <= 1;
    $("#peoplePlus").disabled = state.people >= max;
    const quick = [2, 4, 6, 8, 10, 15].filter((n) => n <= max);
    $("#peopleChips").innerHTML = quick.map((n) => radioButton("chip", n, state.people === n, `data-n="${n}"`)).join("");
    $("#peopleChips").querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => setPeople(Number(b.dataset.n))));
    const note = $("#peopleNote");
    const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola Parchaditos, queremos reservar para más de ${max} personas.`)}`;
    note.innerHTML = state.zone && state.zone.max
      ? `${state.zone.nombre}: hasta ${max} personas. ¿Son más? <a href="${wa}" target="_blank" rel="noopener">Escríbenos</a>`
      : `¿Más de ${max}? <a href="${wa}" target="_blank" rel="noopener">Escríbenos</a> y lo organizamos.`;
  }

  function setPeople(n) {
    const prev = state.people;
    state.people = Math.max(1, Math.min(maxPeople(), n));
    renderPeople();
    update();
    if (animate && prev !== state.people) {
      gsap.fromTo("#peopleValue", { yPercent: state.people > prev ? 30 : -30, autoAlpha: 0.2 }, { yPercent: 0, autoAlpha: 1, duration: 0.25, ease: "power3.out", overwrite: true });
    }
  }

  function renderChoiceChips(sel, list, key) {
    $(sel).innerHTML = list.map((v) => radioButton("chip", v, state[key] === v, `data-v="${v}"`)).join("");
    $(sel).querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
      state[key] = b.dataset.v;
      $(sel).querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-checked", String(c === b)));
      save();
    }));
  }

  /* ---------- Pasos ---------- */
  function renderSteps() {
    const steps = activeSteps();
    const ol = $("#steps");
    ol.style.setProperty("--n", steps.length);
    ol.innerHTML = steps.map((s, i) => {
      const cls = i === current ? "is-current" : i <= reached ? "is-done" : "";
      return `<li class="steps__item ${cls}">
        <button type="button" data-i="${i}" ${i <= reached && i !== current ? "" : "tabindex=\"-1\""} ${i === current ? 'aria-current="step"' : ""}>
          <span><span class="steps__num">${i + 1}</span><span class="steps__label">${STEP_NAMES[s]}</span></span>
        </button>
      </li>`;
    }).join("");
    ol.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      if (i <= reached && i !== current) goTo(i);
    }));
  }

  /* ---------- Validación de datos ---------- */
  // Celular colombiano: 10 dígitos que empiezan por 3 (o fijo 60X), con o sin +57.
  const phoneDigits = () => $("#fPhone").value.replace(/\D/g, "").replace(/^57(?=\d{10}$)/, "");
  const nameOk = () => $("#fName").value.trim().length > 1;
  const phoneOk = () => /^(3\d{9}|60\d{8})$/.test(phoneDigits());

  function isValid(step) {
    switch (step) {
      case "servicio": return !!state.service;
      case "zona": return !!state.zone;
      case "fecha": return !!(state.date && state.time);
      case "personas": return state.people >= 1 && state.people <= maxPeople();
      case "datos": return nameOk() && phoneOk();
      default: return true;
    }
  }

  function setFieldError(input, msg) {
    const field = input.closest(".field");
    const err = field.querySelector(".field__error");
    field.classList.toggle("is-invalid", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    err.textContent = msg || "";
  }

  function checkFields(show) {
    const errors = [
      [$("#fName"), nameOk() ? "" : "Escribe tu nombre."],
      [$("#fPhone"), phoneOk() ? "" : "Celular de 10 dígitos, ej. 300 123 4567."],
    ];
    errors.forEach(([input, msg]) => {
      // Mientras escribe solo se quitan errores; se muestran al salir del campo o al intentar seguir.
      if (show || !msg) setFieldError(input, msg);
    });
    const first = errors.find(([, msg]) => msg);
    return first ? first[0] : null;
  }

  function nudge() {
    const btn = $("#btnNext");
    const mini = $("#miniSummary");
    mini.classList.add("is-warn");
    if (animate) gsap.fromTo(btn, { x: 0 }, { keyframes: { x: [-6, 6, -4, 4, 0] }, duration: 0.32, ease: "power2.out", overwrite: true });
  }

  function goTo(i, fromHistory = false) {
    clearTimeout(advanceTimer);
    const steps = activeSteps();
    const from = document.querySelector(`.step[data-step="${steps[current]}"]`);
    const to = document.querySelector(`.step[data-step="${steps[i]}"]`);
    const dir = i > current ? 1 : -1;
    current = i;
    reached = Math.max(reached, i);
    if (!fromHistory) { history.pushState({ step: i }, ""); pushed++; }

    const show = () => {
      document.querySelectorAll(".step").forEach((s) => (s.hidden = s !== to));
      if (steps[i] === "datos") $("#flavorField").hidden = !state.service.hookah;
      if (steps[i] === "fecha") renderDates();
      renderSteps();
      update();
      Site.bindInteractive(to);
      if (animate) gsap.fromTo(to, { x: 24 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: "power3.out", overwrite: true });
      const title = to.querySelector(".step__title");
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
      if (window.innerWidth <= 760 || $(".bk__flow").getBoundingClientRect().top < 0) Site.scrollToTarget(".bk__flow", -90);
    };

    if (animate && from && from !== to) gsap.to(from, { x: -16 * dir, autoAlpha: 0, duration: 0.15, ease: "power2.out", overwrite: true, onComplete: show });
    else show();
  }

  /* ---------- Resumen ---------- */
  function update() {
    const steps = activeSteps();
    const step = steps[current];
    const last = current === steps.length - 1;
    const ok = isValid(step);

    $("#btnBack").style.visibility = current === 0 ? "hidden" : "visible";
    $("#btnNext").textContent = last ? "Reservar por WhatsApp" : "Continuar";
    // El botón nunca se apaga: si falta algo, al tocarlo dice qué.
    $("#btnNext").classList.toggle("is-pending", !ok);
    $("#btnNext").setAttribute("aria-disabled", String(!ok));

    const dateTxt = state.date ? fmtDayLong.format(state.date) : "—";
    $("#sumService").textContent = state.service ? state.service.nombre : "Sin escoger";
    $("#sumZone").textContent = state.service && !state.service.zona ? "Salón general" : state.zone ? state.zone.nombre : "—";
    $("#sumDate").textContent = dateTxt;
    $("#sumTime").textContent = state.time ? state.time.label : "—";
    $("#sumPeople").textContent = state.people;

    const mini = $("#miniSummary");
    mini.classList.remove("is-warn");
    if (!ok && STEP_HINTS[step]) {
      mini.textContent = STEP_HINTS[step];
    } else {
      const parts = [
        state.service && state.service.nombre,
        state.zone && state.zone.nombre,
        state.date && fmtWd.format(state.date).replace(".", "") + " " + state.date.getDate(),
        state.time && state.time.label,
        current >= steps.indexOf("personas") && `${state.people} pers.`,
      ].filter(Boolean);
      mini.textContent = parts.length ? parts.join(" · ") : "Escoge un servicio para empezar";
    }
    save();
  }

  function buildMessage() {
    const zone = state.service.zona ? state.zone.nombre : "Salón general";
    const lines = [
      "Hola Parchaditos, quiero hacer una reserva:",
      "",
      `• Servicio: ${state.service.nombre}`,
      `• Zona: ${zone}`,
      `• Fecha: ${fmtDayLong.format(state.date)}`,
      `• Hora: ${state.time.label}`,
      `• Personas: ${state.people}`,
      `• Ocasión: ${state.occasion}`,
    ];
    if (state.service.hookah) lines.push(`• Sabor hookah: ${state.flavor}`);
    lines.push("", `A nombre de: ${$("#fName").value.trim()}`, `Celular: ${$("#fPhone").value.trim()}`);
    const notes = $("#fNotes").value.trim();
    if (notes) lines.push(`Notas: ${notes}`);
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  /* ---------- Eventos ---------- */
  $("#btnBack").addEventListener("click", () => {
    if (current === 0) return;
    if (pushed > 0) history.back();
    else { goTo(current - 1, true); history.replaceState({ step: current }, ""); }
  });
  $("#peopleMinus").addEventListener("click", () => setPeople(state.people - 1));
  $("#peoplePlus").addEventListener("click", () => setPeople(state.people + 1));
  $("#fName").addEventListener("input", () => { checkFields(false); update(); });
  $("#fNotes").addEventListener("input", save);
  // Formato mientras escribe: 300 123 4567
  $("#fPhone").addEventListener("input", (e) => {
    const el = e.target;
    const raw = el.value;
    if (!raw.startsWith("+")) {
      const d = raw.replace(/\D/g, "").slice(0, 10);
      const f = [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(" ");
      if (f !== raw) el.value = f;
    }
    checkFields(false);
    update();
  });
  ["#fName", "#fPhone"].forEach((s) => $(s).addEventListener("blur", () => {
    if ($(s).value.trim()) checkFields(true);
  }));

  // Atrás del celular = paso anterior (no se sale de la página perdiendo todo).
  history.replaceState({ step: current }, "");
  window.addEventListener("popstate", (e) => {
    if (!$("#done").hidden || (window.Cart && Cart.lastPopWasCart())) return;
    pushed = Math.max(0, pushed - 1);
    const i = e.state && typeof e.state.step === "number" ? e.state.step : 0;
    if (i !== current) goTo(Math.min(i, activeSteps().length - 1), true);
  });

  $("#bkForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const steps = activeSteps();
    const step = steps[current];
    if (step === "datos") {
      const bad = checkFields(true);
      if (bad) { bad.focus(); nudge(); return; }
    }
    if (!isValid(step)) { update(); nudge(); return; }
    if (current < steps.length - 1) { goTo(current + 1); return; }

    const url = buildMessage();
    window.open(url, "_blank", "noopener");
    showDone(url);
  });

  /* ---------- Último paso: el mensaje se envía en WhatsApp ---------- */
  function showDone(url) {
    $("#doneWa").href = url;
    $(".bk__layout").hidden = true;
    $(".bk__head").hidden = true;
    $("#done").hidden = false;
    $("#doneSummary").textContent = [
      state.service.nombre,
      state.service.zona ? state.zone.nombre : "Salón general",
      fmtDayLong.format(state.date),
      state.time.label,
      `${state.people} ${state.people === 1 ? "persona" : "personas"}`,
    ].join(" · ");
    Site.scrollToTarget("#done", -120);
    if (animate) gsap.from("#donePending > *", { y: 24, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" });
  }

  $("#doneEdit").addEventListener("click", () => {
    $("#done").hidden = true;
    $(".bk__layout").hidden = false;
    $(".bk__head").hidden = false;
    Site.scrollToTarget(".bk__flow", -90);
  });
  $("#doneSent").addEventListener("click", () => {
    try { sessionStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ }
    $("#donePending").hidden = true;
    $("#doneOk").hidden = false;
    if (animate) gsap.from("#doneOk > *", { y: 16, autoAlpha: 0, duration: 0.4, stagger: 0.05, ease: "power3.out" });
  });

  /* ---------- Inicio ---------- */
  const query = new URLSearchParams(location.search);
  const restored = restore();
  const pre = query.get("servicio");
  let startAt = current;
  if (pre && !restored) {
    state.service = SERVICES.find((s) => s.id === pre) || null;
    // Con el servicio ya escogido desde un enlace, se arranca en el paso siguiente.
    if (state.service) startAt = 1;
    const preZone = query.get("zona");
    if (preZone && state.service && state.service.zona) {
      state.zone = ZONES.find((z) => z.id === preZone) || null;
      if (state.zone) startAt = 2;
    }
  }
  // QR de cumpleaños y similares: ?ocasion=Cumpleaños deja la ocasión elegida.
  const preOccasion = query.get("ocasion");
  if (preOccasion) state.occasion = OCCASIONS.find((o) => o.toLowerCase() === preOccasion.toLowerCase()) || state.occasion;

  renderServices();
  renderZones();
  renderDates();
  renderTimes();
  renderPeople();
  renderChoiceChips("#occasionChips", OCCASIONS, "occasion");
  renderChoiceChips("#flavorChips", HOOKAH_FLAVORS, "flavor");
  Site.splitChars();

  current = startAt;
  reached = Math.max(reached, startAt);
  const steps0 = activeSteps();
  document.querySelectorAll(".step").forEach((el) => (el.hidden = el.dataset.step !== steps0[current]));
  if (steps0[current] === "datos") $("#flavorField").hidden = !(state.service && state.service.hookah);
  history.replaceState({ step: current }, "");
  renderSteps();
  update();

  Site.onUnlock(() => {
    if (!animate) return;
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from(".bk__title .char", { yPercent: 115, duration: 1.1, stagger: 0.025 })
      .from(".bk__head .eyebrow, .bk__lead", { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.06 }, 0.25)
      .from(".steps, .bk__form, .summary", { y: 30, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, 0.3)
      .from(".header", { yPercent: -100, duration: 0.8, clearProps: "transform" }, 0.2);
  });
})();
