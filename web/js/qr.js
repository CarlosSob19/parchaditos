// Generador de QR imprimibles. Todo se arma en el navegador; no se envía nada a ningún servicio.
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs["UTF-8"]) qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

  const LOCAL = [
    { slug: "carta", title: "La carta", cta: "Escanea y mira lo que tenemos", where: "Entrada, barra y mesas sin QR propio" },
    { slug: "reservar", title: "Reserva", cta: "Aparta tu zona VIP", where: "Entrada y flyers" },
    { slug: "cumple", title: "Cumpleaños", cta: "Celébralo en zona VIP con hookah", where: "Flyers y redes" },
    { slug: "resena", title: "¿Te gustó?", cta: "Déjanos tu reseña en Google", where: "Con la cuenta o en la salida", needs: () => INFO.resenas, missing: "Falta INFO.resenas en config.js" },
  ];

  /* ---------- Dominio ---------- */
  const domainInput = $("#domain");
  const KEY = "qr-domain";
  let saved = "";
  try { saved = localStorage.getItem(KEY) || ""; } catch (e) {}
  domainInput.value = saved || location.origin;

  const base = () => {
    const v = domainInput.value.trim().replace(/\/+$/, "");
    return /^https?:\/\//i.test(v) ? v : v ? `https://${v}` : location.origin;
  };
  const isLocal = () => /\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$)/i.test(base());

  /* ---------- QR ---------- */
  function svg(text) {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  }

  function card({ title, cta, data, shown, test, note, file }) {
    return `
      <article class="qcard">
        <p class="qcard__brand">PARCHADITOS<em>.</em></p>
        <h3 class="qcard__title">${esc(title)}</h3>
        <div class="qcard__qr" data-file="${esc(file)}">${svg(data)}</div>
        <p class="qcard__cta">${esc(cta)}</p>
        <p class="qcard__url">${esc(shown)}</p>
        <div class="qcard__tools no-print">
          ${note ? `<p class="qcard__note">${esc(note)}</p>` : ""}
          ${test ? `<a href="${esc(test)}" target="_blank" rel="noopener">Probar</a>` : ""}
          <button type="button" data-download>Descargar SVG</button>
        </div>
      </article>`;
  }

  function render() {
    const b = base();
    const short = b.replace(/^https?:\/\//, "");
    // Con el servidor local no existen las rutas cortas: "Probar" usa la ruta final.
    const local = /\/\/(localhost|127\.0\.0\.1)/.test(location.origin);

    $("#gridMesas").innerHTML = TABLES.map((t) => card({
      title: t.nombre,
      cta: "Escanea para pedir, llamar al mesero o pedir la cuenta",
      data: `${b}/m/${t.id}`,
      shown: `${short}/m/${t.id}`,
      test: local ? `/productos.html?mesa=${t.id}` : `/m/${t.id}`,
      file: `qr-mesa-${t.id}`,
    })).join("");

    $("#gridLocal").innerHTML = LOCAL.map((q) => card({
      title: q.title,
      cta: q.cta,
      data: `${b}/${q.slug}`,
      shown: `${short}/${q.slug}`,
      test: local ? null : `/${q.slug}`,
      note: q.needs && !q.needs() ? q.missing : q.where,
      file: `qr-${q.slug}`,
    })).join("");

    renderWifi();
    $("#domainWarn").hidden = !isLocal();
  }

  /* ---------- Wi-Fi ---------- */
  // Formato estándar que leen las cámaras de iPhone y Android: WIFI:T:WPA;S:red;P:clave;;
  const wifiEsc = (s) => s.replace(/([\\;,:"])/g, "\\$1");
  function renderWifi() {
    const name = $("#wifiName").value.trim();
    const pass = $("#wifiPass").value;
    const type = $("#wifiType").value;
    if (!name) { $("#gridWifi").innerHTML = `<p class="qempty no-print">Escribe el nombre de la red para ver el QR.</p>`; return; }
    const data = `WIFI:T:${type};S:${wifiEsc(name)};${type === "nopass" ? "" : `P:${wifiEsc(pass)};`};`;
    $("#gridWifi").innerHTML = card({
      title: "Wi-Fi",
      cta: "Escanea con la cámara para conectarte",
      data,
      shown: type === "nopass" ? name : `${name} · Clave: ${pass}`,
      file: "qr-wifi",
    });
  }

  /* ---------- Eventos ---------- */
  domainInput.addEventListener("input", () => {
    try { localStorage.setItem(KEY, domainInput.value.trim()); } catch (e) {}
    render();
  });
  ["#wifiName", "#wifiPass", "#wifiType"].forEach((s) => $(s).addEventListener("input", renderWifi));

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-download]");
    if (!btn) return;
    const box = btn.closest(".qcard").querySelector(".qcard__qr");
    const blob = new Blob([box.innerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${box.dataset.file}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  const syncPrint = () => document.querySelectorAll("[data-print]").forEach((c) => {
    document.querySelector(`[data-sec="${c.dataset.print}"]`).classList.toggle("skip-print", !c.checked);
  });
  document.querySelectorAll("[data-print]").forEach((c) => c.addEventListener("change", syncPrint));
  $("#print").addEventListener("click", () => {
    if (isLocal() && !confirm("El dominio es localhost: estos QR no abrirán en los celulares de los clientes. ¿Imprimir igual?")) return;
    window.print();
  });

  syncPrint();
  render();
})();
