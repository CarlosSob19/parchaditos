// Cloudflare Pages Function: GET /m/<mesa> → carta en "modo mesa".
// Los QR de cada mesa apuntan aquí. En _redirects la línea "/m/:mesa ... ?mesa=:mesa" no
// reemplaza el nombre de la mesa en la URL publicada, así que la redirección se hace aquí.
// (Las funciones tienen prioridad sobre _redirects en su ruta.)

export function onRequest({ params, request }) {
  const mesa = String(params.mesa || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const url = new URL(request.url);
  const destino = mesa ? `/productos.html?mesa=${mesa}` : "/productos.html";
  // 302 = temporal, igual que en _redirects: si cambia el destino no hay que reimprimir QR.
  return Response.redirect(`${url.origin}${destino}`, 302);
}
