# Parchaditos: finalización, hosting, QR y Loyverse

Esta guía tiene lo que falta para dejar la web y la app listas y publicadas. Explica también cómo funcionan los QR del local y la conexión con Loyverse. Los pasos básicos (assets, probar en local) siguen en [README.md](README.md). Las fotos, el video y el 3D están en [GUIA-FOTOS-Y-3D.md](GUIA-FOTOS-Y-3D.md).

---

## 0. Pendientes por los cambios recientes

Estos cambios ya están hechos en el código, pero cada uno necesita algo de tu parte para quedar completo. La lista final (sección 5) también los incluye.

### 0.1 Catálogo igual en la web y en la app

**Qué cambió:** la web y la app tienen ahora los mismos 10 licores en la lista de respaldo (`PRODUCTS` en la web, `DRINKS` en la app). En la web aparecieron 5 nuevos: Vodka, Granizado de maracuyá, Granizado de mango biche, Michelada y Cóctel de la casa. También se igualaron dos ids de la app (`agua` → `aguardiente`, `gra-licor` → `granizado-licor`) para que una sola foto sirva en los dos lados.

**Qué falta:**

- [ ] Poner los precios reales en las dos listas, o dejar `null` para que diga "Consultar".
- [ ] Si el local no vende alguno de los 5 nuevos, borrarlo **en las dos listas**.
- [ ] Mientras no uses Loyverse: cada producto que agregues o quites, hazlo en las dos. Con Loyverse activo esto deja de importar, porque las dos leen de ahí.

### 0.2 La app lee Loyverse

**Qué cambió:** la app lee el mismo catálogo que la web (`/api/catalogo`) y solo muestra Licores, Granizados y Cocteles. Guarda la última carta en el teléfono por si no hay señal.

**Qué falta:**

- [ ] En Loyverse, crear las categorías con estos nombres **exactos**: `Licores`, `Granizados`, `Cocteles` (y `Vapes`, `Blunts` para la web). Si prefieres otros nombres, cámbialos en `LOYVERSE.categorias` de **los dos** config.
- [ ] Asignar cada producto de Loyverse a su categoría. Los que queden sin categoría o en una que no está en la lista no salen ni en la web ni en la app.
- [ ] En `mobile/src/constants/config.ts`: `DOMINIO` con el dominio real (sin `/` al final) y `LOYVERSE.activo: true`.
- [ ] **Compilar la app otra vez** después de cambiar `DOMINIO` o `LOYVERSE` (README, sección 6). Esos valores van dentro de la app. Los precios y productos que cambies después en Loyverse llegan solos, sin compilar.
- [ ] Volver a publicar la web: la función `/api/catalogo` ahora permite que la app la lea (cabecera `Access-Control-Allow-Origin`).

### 0.3 Script de fotos

**Qué cambió:** `tools/preparar-fotos.py` recorta, comprime, borra el GPS y conecta las fotos en la web y en la app.

**Qué falta:**

- [ ] Tomar las fotos según [GUIA-FOTOS-Y-3D.md](GUIA-FOTOS-Y-3D.md), ponerlas en `fotos/` y correr `python tools/preparar-fotos.py` parado en `PARCHADITOS`.
- [ ] Copiar los videos a mano a `web/assets/video/` (`hero.mp4` y `hero-movil.mp4`). El script los conecta, pero no los comprime: usa HandBrake (guía, sesión 4).
- [ ] Las categorías van en **PNG sin fondo**. Si el script avisa "no tiene fondo transparente", quítale el fondo y vuelve a correrlo.
- [ ] Si usas fotos de Loyverse y también locales: el producto debe llamarse **igual** en Loyverse y en `config.js` para que gane la foto local.
- [ ] Después de correr el script, compilar la app otra vez (las fotos de la app van dentro de la app) y volver a publicar la web.

### 0.4 Imágenes 3D

- [ ] Si las haces con **Meshy gratis**, la licencia CC BY 4.0 obliga a dar crédito. Pídeme agregar "Modelos 3D creados con Meshy" en el pie de la página de privacidad, o paga Meshy Pro (US$20, un mes basta) mientras las generas.
- [ ] Si quieres que el cliente pueda **girar un modelo 3D** con el dedo en la web, pásame el archivo `.glb` y lo agrego.

### 0.5 Correo y dominio

- [ ] Al comprar el dominio, crear `contacto@tudominio.com` con Cloudflare Email Routing (sección 2.3) y ponerlo en `INFO.email`. La política de privacidad lo muestra como canal para los datos personales; si está vacío, muestra WhatsApp.
- [ ] Cambiar `TU-DOMINIO.com` en `robots.txt`, `sitemap.xml`, las líneas `og:image` y `DOMINIO` de la app. Pídemelo y lo cambio en todos.

### 0.6 Probar en local

El servidor de prueba ahora toma un puerto libre si el 5173 está ocupado. En la terminal, `python -m http.server 5173 --directory web` sigue funcionando igual (README, sección 4).

### 0.7 Próximas mejoras (estilo landonorris.com)

Esto **todavía no está hecho**. Es lo que le falta a la web y a la app para parecerse más a landonorris.com, ordenado por impacto. Pídeme la que quieras y la hago en las dos.

**Sin material tuyo (se pueden hacer ya):**

- [ ] **Próximo evento con cuenta regresiva y agenda.** Es el equivalente a "próxima carrera" en la web de Lando. Arriba sale "Faltan 2 d 04 h 12 min" para la próxima noche con DJ, la promo o el partido. Debajo va la agenda de las próximas fechas, cada una con botón para reservar ese día. Los eventos se editan en `config.js`. Es lo que más reservas trae.
- [ ] **Menú de pantalla completa.** Enlaces gigantes. Al pasar el mouse por cada uno aparece una imagen o un color que sigue el cursor. Hoy el menú de escritorio son enlaces pequeños.
- [ ] **Botones con texto que "rueda".** Al pasar el mouse, el texto sube y entra una copia desde abajo.
- [ ] **Lista de la carta con foto flotante.** Nombres de productos en grande; al pasar el mouse por una fila, la foto del producto sigue el cursor. Funciona con relleno y luego con las fotos reales.

**Con material tuyo:**

- [ ] **Logo que se dibuja solo** en la precarga y en el pie de página, como la firma de Lando. Necesita el logo en **SVG**: con PNG no se puede.
- [ ] **Objeto 3D que gira** con el scroll y que el cliente puede arrastrar con el dedo. Es el casco de Lando; aquí, una hookah o una botella. Necesita un `.glb` (ver [GUIA-FOTOS-Y-3D.md](GUIA-FOTOS-Y-3D.md), secciones 6 y 9).
- [ ] **Colección en 3D**: fila de sabores de hookah o botellas de la casa que se pueden girar, cada una con nombre y "desde $X". Necesita un `.glb` por objeto.
- [ ] **Producto que gira al hacer scroll**, sin 3D, a partir de un video del producto rotando 360° (guía, sección 9).
- [ ] **Video de portada.** Ya está preparado en `HERO`; solo falta el archivo (guía, sesión 4). Es lo que más sube el nivel.
- [ ] **Cinta de marcas**: logos de las marcas de licores que se venden, pasando en bucle (como los patrocinadores de Lando). Necesita los logos en SVG o PNG sin fondo.
- [ ] **"Únete al parche"**: bloque para entrar al canal o lista de difusión de WhatsApp con las promos (el equivalente al boletín de Lando). Necesita el enlace del canal.
- [ ] **"Lo último en redes"**: los últimos posts o reels de Instagram y TikTok en una cinta. Necesita las cuentas.

**Lo que conviene mandar primero:** el logo en SVG, un `.glb` de la hookah o de una botella, y los eventos de las próximas semanas (fecha, hora, nombre y qué incluyen).

### 0.8 Revisión antes de entregar (2 de octubre de 2026)

**Qué se revisó:**

- **Web:** con Playwright, las 8 páginas en computador (1440 px) y en celular (390 px), incluido el modo mesa (`productos.html?mesa=vip1`) y la reserva de cumpleaños. Resultado: sin errores en consola, sin archivos que no carguen, sin imágenes rotas y sin scroll horizontal en el celular.
- **App:** TypeScript, lint y `expo-doctor` (21 de 21) sin errores. Inicio, Carta y Reservar se probaron en la versión web de la app. No se probó en un teléfono real.

**Qué se corrigió:**

- El inicio mostraba un aviso en la consola cuando `REVIEWS` está vacío. Ya no sale.
- En Reservas, las opciones mostraban la marca ✓ aunque no estuvieran elegidas. Ahora solo aparece en la que el cliente escoge.
- La versión de CSS y JS pasó a `?v=5` en todas las páginas.

**Avisos que se dejaron a propósito:** la versión web de la app muestra `props.pointerEvents is deprecated` y un aviso de Reanimated sobre el easing. Solo pasan en el navegador; en iOS y Android funciona bien.

**Datos de ejemplo que siguen en el código.** Sin cambiarlos, los pedidos y reservas de WhatsApp van a un número que no existe:

| Dato | Dónde | Ahora dice |
|---|---|---|
| WhatsApp real | `web/js/config.js` y `mobile/src/constants/config.ts` | `570000000000` |
| Dirección y ciudad | `INFO` en los dos config | `Calle 00 # 00-00`, `Tu ciudad` |
| Mapa, Instagram, TikTok, correo, enlace de reseñas | `INFO` en los dos config | vacíos (no se muestran) |
| Dominio | `robots.txt`, `sitemap.xml`, `og:image` y `DOMINIO` de la app | `TU-DOMINIO.com` |
| Precios | `PRODUCTS` (web) y `DRINKS` (app) | todos dicen "Consultar" |

Sin dominio propio, la web funciona igual en `https://parchaditos.pages.dev`.

**Para subirla**, desde la carpeta `PARCHADITOS` (no dentro de `web`). Revisa los QR antes y después de subir (sección 3.6):

```bash
npm run publicar
```

**Para repetir la revisión:** levanta la web en local (README, sección 4) y abre cada página con la consola del navegador abierta. Si usas `playwright-cli` y no tienes Chrome instalado, ábrelo con `playwright-cli open --browser=msedge`.

---

## 1. Lo que tienes que ingresar

Casi todo se edita en **`web/js/config.js`**. Lo que sale de Loyverse o de Cloudflare se configura en esas plataformas, no en el código.

| Qué | Dónde | Ejemplo |
|---|---|---|
| WhatsApp del negocio (reservas y pedidos a domicilio) | `config.js` → `WHATSAPP` | `"573001234567"` |
| WhatsApp que recibe los pedidos de las mesas (el celular de la barra) | `config.js` → `WHATSAPP_MESAS` (vacío = el mismo de arriba) | `"573109876543"` |
| Mesas del local | `config.js` → `TABLES` | `{ id: "vip1", nombre: "VIP 1" }` |
| Enlace para dejar reseña en Google | `config.js` → `INFO.resenas` | `"https://g.page/r/XXXX/review"` |
| Dirección, ciudad, mapa, Instagram, TikTok, correo | `config.js` → `INFO` | — |
| Horario | `config.js` → `HOURS` | — |
| Encender Loyverse | `config.js` → `LOYVERSE.activo: true` y en la app `config.ts` → `LOYVERSE.activo: true` | — |
| Dominio de la web, para la app | `mobile/src/constants/config.ts` → `DOMINIO` | `"https://parchaditos.com"` |
| Categorías de Loyverse ↔ categorías de la web | `config.js` → `LOYVERSE.categorias` | `"Licores": "licores"` |
| Token de Loyverse | **Cloudflare**, nunca en el código (sección 4) | — |
| Dominio | `robots.txt`, `sitemap.xml`, `og:image` de cada HTML y el campo "Dominio" de `/qr.html` | `parchaditos.com` |
| Tickets predefinidos con el nombre de cada mesa | **Loyverse** (sección 4.4) | `VIP 1`, `Mesa 1`… |
| Nombre y clave del Wi-Fi de clientes | Solo en `/qr.html` al imprimir; no se guarda | — |

**Cómo sacar el enlace de reseñas:** en Google, busca tu negocio estando conectado con la cuenta dueña del perfil. Toca **Pedir reseñas** (o **Obtener más reseñas**) y copia el enlace.

---

## 2. Hosting y costos

La web es estática y no necesita servidor. La conexión con Loyverse usa una función pequeña (`functions/api/catalogo.js`) que solo corre en Cloudflare Pages.

### 2.1 Dónde subirla

| Hosting | Precio | Rutas cortas de los QR (`_redirects`) | Loyverse (`functions/`) | Veredicto |
|---|---|---|---|---|
| **Cloudflare Pages** | **Gratis.** Visitas ilimitadas; la función de Loyverse tiene 100.000 llamadas gratis por día | Sí | Sí | **Recomendado** |
| Netlify | Gratis con límites de tráfico | Sí | No; habría que reescribir la función | Sirve si no usas Loyverse |
| Vercel (plan Hobby) | Gratis | — | — | **No:** su plan gratis prohíbe el uso comercial |
| GitHub Pages | Gratis | No | No | No sirve para los QR de mesa |
| Hosting compartido (Hostinger, cPanel) | Pago mensual | No (habría que hacerlo con `.htaccess`) | No | Pagas por un servidor que la web no necesita |

**¿Alcanzan las 100.000 llamadas diarias?** Sí, de sobra. Cada visita a la carta hace una llamada, y la función guarda el catálogo un minuto para no consultar Loyverse en cada visita. Un local con mil visitas en una noche usa el 1 %. Si algún día se pasara, el plan pago de Cloudflare Workers cuesta US$5 al mes.

### 2.2 Cuánto cuesta todo

Precios en dólares, revisados en octubre de 2026. Para pasarlos a pesos usa la tasa del día.

| Concepto | Costo | Cada cuánto | ¿Obligatorio? |
|---|---|---|---|
| Hosting en Cloudflare Pages | US$0 | — | Sí |
| Dominio `.com` en Cloudflare Registrar | US$10,46 (sube a US$11,15 desde el 1 de noviembre de 2026) | Al año | Sí, para verse profesional y para los QR |
| Correo `contacto@tudominio.com` con Cloudflare Email Routing | US$0 (reenvía al Gmail del dueño) | — | No, pero recomendado para la política de privacidad |
| Cuenta de Google Play (app Android) | US$25 | **Una sola vez** | Solo si publicas la app Android |
| Cuenta de Apple Developer (app iPhone) | US$99 | Al año | Solo si publicas la app iPhone |
| Compilar la app con EAS (Expo) | US$0 (15 compilaciones de Android y 15 de iOS al mes) | — | Sí, para la app |
| Loyverse POS + conexión con la web y la app | US$0 (sección 4, "Costos de Loyverse") | — | No |

**Totales:**

| Paquete | Primer año | Desde el segundo año |
|---|---|---|
| Solo la web | **≈ US$11** | ≈ US$11 al año |
| Web + app Android | **≈ US$36** | ≈ US$11 al año |
| Web + Android + iPhone | **≈ US$135** | ≈ US$110 al año |

**Sobre el dominio:** Cloudflare Registrar vende al precio de costo y la renovación cuesta lo mismo que la compra. GoDaddy y otros cobran barato el primer año y mucho más al renovar. Un `.co` cuesta varias veces más que un `.com`, y un `.com.co` hay que comprarlo en un registrador colombiano. Para un bar, el `.com` está bien.

**Si vendes la web a un cliente:** crea todas las cuentas (Cloudflare, dominio, Google Play, Apple, Loyverse) **con el correo y la tarjeta del cliente**. Así el negocio es dueño de todo, la entrega es limpia y tú no quedas pagando renovaciones. Tu trabajo lo cobras aparte: el desarrollo una vez, y si quieres, una mensualidad de mantenimiento (cambiar precios, subir fotos, publicar).

### 2.3 Publicar en Cloudflare Pages

> **Importante:** la opción de arrastrar la carpeta en el panel ("Upload assets") **no sube la función de Loyverse**. Si vas a usar Loyverse, publica desde la terminal o conectando un repositorio de GitHub.

**Desde la terminal, parado en la carpeta `PARCHADITOS` (no dentro de `web`):**

```bash
npm run publicar
```

Este comando hace tres cosas: revisa que ningún QR impreso se rompa (sección 3.6), sube la web y vuelve a probar cada QR en la web publicada. **Si algún QR fallaría, no publica.** Siempre publica con este comando; si usas `npx wrangler pages deploy` directo, te saltas la revisión.

Wrangler sube la carpeta `web` y toma la función de la carpeta `functions` que está al lado. La primera vez abre el navegador para iniciar sesión. Queda en `https://parchaditos.pages.dev`. Cuando tengas dominio propio, cambia `https://parchaditos.pages.dev` por el dominio en el script `publicar` de `package.json`.

**Comprar el dominio:** en dash.cloudflare.com → **Domain Registration → Register Domains**, busca el nombre y paga con la tarjeta del dueño.

**Conectar el dominio:** en el proyecto de Pages, entra a **Custom domains → Set up a domain**. Si el dominio está en Cloudflare, se configura solo. Después cambia `TU-DOMINIO.com` en `robots.txt`, `sitemap.xml` y en las líneas `og:image`.

**Correo con el dominio:** en el dominio, entra a **Email → Email Routing**, crea `contacto@tudominio.com` y que reenvíe al Gmail del dueño. Pon ese correo en `INFO.email` de `config.js`.

**Sin Loyverse:** también puedes arrastrar la carpeta `web` en **Workers & Pages → Create → Pages → Upload assets**. Los QR y las rutas cortas funcionan igual. Así no se revisan los QR, así que antes corre `npm run verificar-qr` y no subas nada si sale un error.

---

## 3. Los QR del local

### 3.1 Cómo funcionan

Ningún QR apunta a la página final. Todos apuntan a una **ruta corta** de tu dominio, y el archivo `web/_redirects` decide a dónde lleva cada una. Si mañana quieres que `/cumple` lleve a otra parte, cambias una línea y vuelves a publicar. **No hay que reimprimir.**

**Excepción, los QR de mesa (`/m/…`):** en Cloudflare los redirige la función `functions/m/[mesa].js`, no `_redirects`, porque `_redirects` no pasa el nombre de la mesa al destino. Si cambias a dónde llevan los QR de mesa, cambia esa función.

| QR | Ruta corta | A dónde lleva | Dónde ponerlo |
|---|---|---|---|
| Una por mesa | `/m/vip1`, `/m/mesa1`… | La carta (`productos.html`) en **modo mesa** | Pegado en cada mesa |
| La carta | `/carta` | La carta (`productos.html`) | Entrada, barra |
| Reservas | `/reservar` | Página de reservas | Entrada, flyers |
| Zona VIP | `/vip` | Reserva con "Zona VIP" ya elegido | Flyers |
| Hookah | `/hookah` | Reserva con "Hookah" ya elegido | Flyers |
| Cumpleaños | `/cumple` | Reserva con "VIP + Hookah" y ocasión "Cumpleaños" ya elegidos | Flyers, redes |
| Reseñas | `/resena` | Tu perfil de Google para dejar reseña | Con la cuenta, en la salida |
| Wi-Fi | — (el QR guarda la red y la clave) | El celular se conecta solo | Mesas, barra |

### 3.2 El modo mesa

Al escanear el QR de una mesa se abre la carta y la web recuerda la mesa durante 8 horas (`TABLE_HOURS`). En la carta y en el inicio aparece una barra fija abajo con:

- **Pedido:** el cliente toca **Agregar** en los productos, ajusta las cantidades, escribe una nota ("sin hielo") y envía.
- **Mesero:** avisa que necesitan atención.
- **Cuenta:** pide la cuenta. Si `INFO.resenas` tiene enlace, después invita a dejar una reseña.
- **Menú de la mesa** (tocando el nombre de la mesa):
  - **Repetir el último pedido** ("otra ronda") en un toque.
  - **Hookah:** cambio de carbón o cambio de sabor.
  - **Hielo, vasos o servilletas.**
  - **No estoy en esta mesa:** sale del modo mesa.

Cada acción abre WhatsApp con el mensaje listo y el cliente solo toca enviar. Así llega a la barra:

```
*VIP 1*
Pedido:
2 × Aguardiente (Media)
1 × Granizado con licor
Nota: sin hielo
Total: $ 96.000
```

El mesero abre en Loyverse el ticket predefinido **VIP 1** y agrega los productos (sección 4.4).

### 3.3 Imprimir los QR

1. Publica la web primero: los QR solo funcionan con el dominio real.
2. Abre `https://TU-DOMINIO.com/qr.html`. Es una página interna: no tiene enlaces desde la web y Google no la indexa.
3. En **Dominio de la web**, escribe el dominio real (por ejemplo `https://parchaditos.com`).
4. Si quieres el QR del Wi-Fi, escribe la red y la clave. No se guardan en ningún lado.
5. Marca las secciones que vas a imprimir y toca **Imprimir seleccionados**. Salen tarjetas de 9 cm, dos por fila, con línea de corte.
6. Para una imprenta o un diseño en Canva, usa **Descargar SVG**: se puede agrandar sin que pierda calidad.

**Consejos para la impresión:**

- Mínimo 3 × 3 cm de QR. Mejor 5 cm o más en la mesa.
- Plastifica o usa acrílico: en la mesa se moja.
- Antes de pegarlos todos, prueba uno con un iPhone y con un Android.

### 3.4 Agregar, quitar o renombrar mesas

1. Edita `TABLES` en `config.js`.
2. Publica con `npm run publicar`.
3. En `/qr.html`, imprime solo las mesas nuevas.

- **Agregar una mesa:** libre. Al publicar queda anotada sola en `tools/qr-impresos.json`.
- **Cambiar el nombre** (`"VIP 1"` → `"VIP Oro"`): libre. El QR sigue sirviendo.
- **Cambiar el id o borrar la mesa:** el verificador **no deja publicar**, porque el QR pegado en esa mesa dejaría de abrir el modo mesa. Si de verdad despegaste ese QR para siempre, borra su línea (por ejemplo `"/m/mesa4"`) de `tools/qr-impresos.json` y después sí la puedes quitar de `TABLES`.

### 3.5 Probar en local

El servidor local (`python -m http.server`) no lee `_redirects`, así que `/m/vip1` da error 404. En local se usa la ruta final, por ejemplo `http://localhost:5173/productos.html?mesa=vip1`. El botón **Probar** de `/qr.html` ya lo hace solo.

Para probar las rutas cortas igual que en Cloudflare, usa su emulador. Desde la carpeta `PARCHADITOS`:

```bash
npx wrangler pages dev web --port 8788
```

Y en otra terminal:

```bash
node tools/verificar-qr.mjs --url http://127.0.0.1:8788
```

### 3.6 Por qué los QR no se rompen

Un QR impreso no se puede cambiar, así que la web está armada para que **ningún cambio en el código lo rompa**. Tiene cuatro protecciones:

1. **Rutas cortas.** El QR guarda `/m/vip1` o `/carta`, nunca la página final. Si cambias páginas, nombres de archivos o diseño, solo hay que ajustar el destino en `_redirects`.
2. **Plan B en `404.html`.** Si `_redirects` falla, se borra o el hosting no lo lee, la ruta corta cae en `404.html`, y esta página la manda a su destino. No depende de ningún otro archivo de la web. También acepta mayúsculas y una `/` al final (`/CARTA`, `/m/vip1/`), que a veces agregan las cámaras o la gente al escribir.
3. **Registro de QR impresos (`tools/qr-impresos.json`).** Cada ruta que alguna vez tuvo QR se anota ahí y **no se borra sola**. Aunque quites una mesa de `TABLES`, la ruta sigue en el registro y se sigue revisando.
4. **Verificador (`tools/verificar-qr.mjs`).** Se corre solo con `npm run publicar` y **no deja publicar** si:
   - una ruta registrada no tiene regla en `_redirects`, o `_redirects` y el plan B de `404.html` llevan a sitios distintos;
   - la página de destino ya no existe (por ejemplo, si renombras `productos.html`);
   - una mesa con QR ya no está en `TABLES`, o su página dejó de cargar `mesa.js`;
   - el QR `/vip` o `/hookah` apunta a un servicio que ya no está en `SERVICES`;
   - `config.js` tiene un error que tumbaría la web.

   Después de publicar, abre cada QR en la web real y confirma que llega a la página correcta.

   Se probó rompiendo una copia de la web a propósito, en estos 7 casos: borrar una mesa, renombrar `productos.html`, borrar la regla de las mesas, un error en `config.js`, cambiar un destino solo en `_redirects`, quitar `mesa.js` y cambiar el id de un servicio. El verificador los detectó todos. También se probó con el emulador de Cloudflare: con `_redirects` y **sin él**, los 13 QR llegan a su destino.

**El QR de reseñas** (`/resena`) va a `ir-resena.html`, una página aparte que solo lee `INFO.resenas` de `config.js`. Mientras ese enlace esté vacío, lleva al inicio.

**Lo único que el código no puede proteger (te toca a ti):**

- **El dominio.** Todos los QR llevan el dominio. Si el dominio se vence, **todos dejan de funcionar** y no hay forma de arreglarlo sin reimprimir. En Cloudflare, activa la **renovación automática** del dominio y ten una tarjeta vigente. Si puedes, págalo varios años por adelantado.
- **Imprimir con el dominio definitivo.** No imprimas QR con `parchaditos.pages.dev` si después vas a usar un dominio propio (o al revés). Elige uno y quédate con él.
- **No borrar el proyecto `parchaditos` en Cloudflare** ni cambiar de hosting sin revisar que lea `_redirects` y `404.html`. Cloudflare Pages y Netlify los leen; GitHub Pages solo lee `404.html`, que igual sirve gracias al plan B.
- **No cambiar las rutas cortas** (`/carta`, `/m/…`, `/cumple`…). Si quieres una ruta nueva, agrégala; no renombres las que ya están impresas.

---

## 4. Loyverse

### 4.0 En palabras simples

**Loyverse** es el programa de caja (POS) que usa el local en una tablet o celular: ahí se registran los productos, se abren las cuentas de cada mesa y se cobra. Es gratis.

**La conexión hace una sola cosa: la carta de la web y la de la app leen los productos y precios de Loyverse.** Así el dueño cambia un precio en un solo lugar y la web y la app se actualizan solas, con los mismos nombres, precios, fotos y agotados.

**Lo que no hace:** el pedido que un cliente hace desde la web **no entra solo a la caja**. Loyverse no lo permite (sección 4.1). El pedido llega por WhatsApp y el mesero lo pasa a la cuenta de esa mesa en Loyverse, como si se lo hubieran dicho en persona.

**Una noche normal:**

1. El cliente escanea el QR de la mesa **VIP 1** y ve la carta con los precios de Loyverse.
2. Agrega 2 aguardientes y un granizado, y toca **Enviar**.
3. Al celular de la barra llega un WhatsApp: "*VIP 1* · 2 × Aguardiente (Media) · 1 × Granizado con licor".
4. El mesero abre en Loyverse el ticket **VIP 1**, agrega los productos y lleva el pedido.
5. Cuando el cliente pide la cuenta (botón **Cuenta**), el mesero cobra ese ticket en Loyverse como siempre.

### Costos de Loyverse

| Qué | Precio |
|---|---|
| App POS, Back Office, pantalla de cocina y pantalla de cliente | **Gratis** |
| **Integraciones (la API que usa la web)** | **Gratis** |
| Complemento: historial de ventas ilimitado | US$9 al mes por tienda (opcional) |
| Complemento: gestión de empleados (permisos y reloj de turnos) | US$5 al mes por empleado (opcional) |
| Complemento: inventario avanzado (órdenes de compra a proveedores) | US$25 al mes por tienda (opcional) |

Precios de la página oficial (loyverse.com/pricing), revisados en octubre de 2026. Cada complemento trae 14 días de prueba gratis. **La conexión con la web no necesita ningún complemento.** Algunas reseñas en internet dicen que las integraciones cuestan; la página oficial las lista como gratis. Si al crear el token el Back Office te pide "iniciar la prueba" de Integraciones, acéptala.

### 4.1 Qué se puede y qué no

Loyverse tiene una API pública, pero **no permite crear pedidos abiertos (tickets abiertos) desde fuera**. Lo confirman sus propias respuestas en el [foro de desarrolladores](https://loyverse.town/topic/3571-is-it-possible-to-create-an-open-order-that-will-show-up-on-registers-through-api/). Por eso un pedido hecho en la web **no puede aparecer solo en el POS** ni imprimirse en la impresora de cocina.

| Qué | ¿Se puede? | Cómo lo resolvimos |
|---|---|---|
| Leer productos, precios y categorías | Sí | La web los toma de Loyverse |
| Leer existencias (stock) | Sí | Lo agotado sale como "Agotado" y no se puede pedir |
| Crear un pedido abierto en el POS | **No** | El pedido llega por WhatsApp con el nombre de la mesa, igual al ticket predefinido |
| Registrar una venta ya pagada | Sí | No lo usamos: quedaría cobrada antes de que el cliente pague |
| Cobrar en línea desde la web | No | — |

### 4.2 Qué gana el local con la conexión

- **Un solo lugar para el catálogo:** cambias un precio o agregas un producto en Loyverse y la web se actualiza sola en máximo un minuto. Ya no hay que editar `PRODUCTS` en `config.js`.
- **Agotados automáticos:** si el stock de un producto llega a 0 en Loyverse, la web lo muestra como "Agotado".
- **Los mismos nombres en la web y en el POS:** lo que el cliente pide se llama igual en Loyverse, así que el mesero lo encuentra rápido.
- **Si Loyverse falla**, la web sigue funcionando con la lista `PRODUCTS` de `config.js`.

### 4.3 Cómo funciona por dentro

```
Cliente en la web ─┐
                   ├→ /api/catalogo (función en Cloudflare, con el token en secreto) → API de Loyverse
Cliente en la app ─┘
```

**La web y la app leen exactamente la misma función.** Lo único que cambia es qué categorías muestra cada una:

| Categoría en Loyverse | Web | App |
|---|---|---|
| Licores | ✓ (Licores) | ✓ (Botellas) |
| Granizados | ✓ (Licores) | ✓ (Granizados) |
| Cocteles | ✓ (Licores) | ✓ (Cocteles) |
| Vapes, Blunts | ✓ | **Nunca:** Apple y Google rechazan apps que los vendan |
| Cualquier otra (Insumos, Cocina…) | No | No |

La app guarda en el teléfono la última carta que recibió. Si el cliente abre la app sin señal, ve esa copia; si nunca se conectó, ve la lista `DRINKS` de `config.ts`.

El token de Loyverse da **acceso total a la cuenta** (ventas, clientes, inventario). Por eso nunca va en el código de la web, donde cualquiera lo vería. Se guarda como secreto en Cloudflare. La función `functions/api/catalogo.js` lo usa para leer el catálogo y le entrega a la web solo esto: nombre, categoría, precio, foto y si está agotado. Nunca entrega cantidades de stock, costos ni ventas.

### 4.4 Paso a paso

**A. En Loyverse (Back Office, en el navegador)**

1. **Crea el token:** entra a **Integraciones → Tokens de acceso → + Agregar token de acceso**. Ponle de nombre "Web Parchaditos", sin fecha de vencimiento, y guarda. Copia el token. **No lo pegues en ningún archivo, chat ni correo.**
2. **Revisa las categorías:** cada producto que quieras en la web debe tener una categoría en Loyverse (por ejemplo "Licores", "Vapes").
3. **Fotos (opcional):** si un producto tiene foto en Loyverse, la web la usa. Una foto en `web/assets/productos/` con el mismo nombre de producto en `PRODUCTS` tiene prioridad.
4. **Stock:** para que salga "Agotado", activa **Seguimiento de stock** en el producto.
5. **Tickets predefinidos para las mesas:** en **Configuración → Funciones**, activa **Tickets abiertos**. Después ve a **Configuración → Tickets abiertos**, elige la tienda, activa **Usar tickets predefinidos** y crea un ticket por mesa, con el **mismo nombre** que tiene en `TABLES` (VIP 1, VIP 2, Mesa 1…). Guía oficial: [tickets predefinidos](https://help.loyverse.com/help/how-use-predefined-open-tickets).

**B. En Cloudflare**

1. Entra a **Workers & Pages → parchaditos → Settings → Variables and Secrets → Add**.
2. Tipo **Secret**, nombre `LOYVERSE_TOKEN`, valor: el token. Guarda.
3. Solo si la cuenta de Loyverse tiene varias tiendas: agrega `LOYVERSE_STORE_ID` (tipo Text) con el id de la tienda. Si no, se usa la primera.
4. Vuelve a publicar (sección 2) para que la función tome el secreto.

**C. En `web/js/config.js`**

```js
const LOYVERSE = {
  activo: true,
  categorias: {
    // "Nombre exacto de la categoría en Loyverse": "id de la categoría en la web"
    "Licores": "licores",
    "Cocteles": "licores",
    "Vapes": "vapes",
    "Blunts": "blunts",
    "Granizados": "granizados",
  },
};
```

Las categorías de Loyverse que no estén en esta lista (por ejemplo "Insumos" o "Cocina") **no se muestran** en la web.

**D. En la app (`mobile/src/constants/config.ts`)**

```ts
export const DOMINIO = 'https://parchaditos.com'; // el dominio real, sin "/" al final

export const LOYVERSE = {
  activo: true,
  categorias: {
    Licores: 'botellas',
    Granizados: 'granizados',
    Cocteles: 'cocteles',
  },
};
```

Los nombres de la izquierda deben ser **exactamente** los de Loyverse, igual que en la web. No agregues aquí categorías de vapes ni wraps. Después vuelve a compilar la app (README, sección 6). Los cambios de precios y productos llegan solos, sin compilar otra vez.

**E. Verificar**

1. Abre `https://TU-DOMINIO.com/api/catalogo`. Debe mostrar la lista de productos.
   - Si dice `Falta LOYVERSE_TOKEN`, el secreto no quedó guardado o falta volver a publicar.
   - Si dice `Loyverse /items respondió 401`, el token está mal o fue borrado en Loyverse.
2. Abre la web y la app, y revisa que los precios coincidan con Loyverse y entre ellas.
3. Pon en 0 el stock de un producto de prueba en Loyverse. En un minuto debe salir "Agotado" en la web; en la app, al volver a abrirla.

### 4.5 Productos con variantes

Si un producto tiene variantes en Loyverse (por ejemplo Aguardiente: Media / Botella), cada variante sale en la web como una tarjeta propia, con su precio: "Aguardiente · Media" y "Aguardiente · Botella". Los productos con **precio variable** en Loyverse salen como "Consultar".

### 4.6 Si algún día cambian de POS

Solo se apaga `LOYVERSE.activo` y la web vuelve a usar `PRODUCTS`. Los QR, el modo mesa y los pedidos por WhatsApp no dependen de Loyverse.

---

### 4.7 Preguntas frecuentes

**¿Qué pasa si se cae el internet del local?** La caja de Loyverse sigue funcionando sin internet y sincroniza cuando vuelve. La web no depende del internet del local: el cliente usa sus datos móviles. Si Loyverse no responde, la web muestra la lista `PRODUCTS` de `config.js`.

**¿Cuánto tarda en verse un cambio de precio?** En la web, máximo un minuto. En la app, la próxima vez que el cliente la abra.

**¿Por qué la web y la app muestran lo mismo?** Porque las dos leen `/api/catalogo`. Si Loyverse no está conectado, cada una usa su lista de respaldo (`PRODUCTS` en la web, `DRINKS` en la app), y esas dos listas ya tienen los mismos licores. Si agregas un producto sin Loyverse, agrégalo en las dos.

**¿El cliente ve el inventario o las ventas?** No. La función solo entrega nombre, categoría, precio, foto y si está agotado.

**¿Qué pasa si alguien ve el token?** Puede leer y cambiar todo en la cuenta de Loyverse. Si crees que se filtró: bórralo en Loyverse (**Integraciones → Tokens de acceso**), crea uno nuevo y reemplázalo en Cloudflare (sección 4.4 B).

**¿Puedo cobrar en línea?** Con Loyverse, no. Se podría agregar un enlace de pago (Wompi, Bold, Mercado Pago) en el mensaje de WhatsApp, pero eso queda por fuera de Loyverse.

---

## 5. Lista final antes de lanzar

**Web**

- [ ] `WHATSAPP` y `WHATSAPP_MESAS` reales, probados enviando un mensaje
- [ ] `INFO` completo (dirección, mapa, redes, correo, `resenas`)
- [ ] `HOURS` con el horario real
- [ ] `TABLES` con las mesas reales y los mismos nombres en Loyverse
- [ ] Fotos y video según [GUIA-FOTOS-Y-3D.md](GUIA-FOTOS-Y-3D.md), procesados con `python tools/preparar-fotos.py`
- [ ] Precios reales en `PRODUCTS` (o en Loyverse) y los 5 licores nuevos revisados (sección 0.1)
- [ ] `INFO.email` con el correo del dominio (sección 0.5)
- [ ] `TU-DOMINIO.com` reemplazado en `robots.txt`, `sitemap.xml` y `og:image`
- [ ] Publicada en Cloudflare Pages con el dominio propio, usando `npm run publicar` (revisa los QR antes y después)
- [ ] Renovación automática del dominio activada en Cloudflare: si el dominio se vence, todos los QR mueren (sección 3.6)
- [ ] El script `publicar` de `package.json` apunta al dominio definitivo, no a `parchaditos.pages.dev`
- [ ] Loyverse: token en Cloudflare, `LOYVERSE.activo: true`, `/api/catalogo` responde
- [ ] Loyverse: categorías `Licores`, `Granizados`, `Cocteles`, `Vapes`, `Blunts` creadas y cada producto asignado
- [ ] QR impresos desde `/qr.html` **con el dominio real** y probados en iPhone y Android
- [ ] `npm run verificar-qr` dice OK después de imprimir, y `tools/qr-impresos.json` tiene todas las rutas impresas
- [ ] Prueba completa en una mesa: escanear → agregar → enviar → llega a la barra → el mesero lo pasa al ticket de Loyverse

**App (iOS y Android)**

- [ ] `mobile/src/constants/config.ts` con los mismos datos que `config.js`, `DOMINIO` real y `LOYVERSE.activo: true` si la web lo tiene
- [ ] Íconos y splash en `mobile/assets/images/`
- [ ] Fotos de bebidas y galería conectadas (las pone el script de fotos)
- [ ] `DRINKS` con los mismos licores y precios que `PRODUCTS` de la web (sección 0.1)
- [ ] Abrir `https://TU-DOMINIO.com/privacidad.html` y confirmar que carga: la app enlaza ahí (`DOMINIO`) y las tiendas lo exigen
- [ ] Compilar **después** de poner `DOMINIO`, `LOYVERSE` y las fotos: esos cambios van dentro de la app
- [ ] Probar la carta de la app con Loyverse: mismos precios que la web, sin vapes ni wraps, y "Agotado" al poner un producto en 0
- [ ] Android: `eas build` y `eas submit` (README, sección 6)
- [ ] iOS: cuenta de Apple Developer (USD 99 al año) y el mismo proceso con `--platform ios`

**En el local**

- [ ] El celular de la barra con WhatsApp abierto y alguien pendiente en las horas de servicio
- [ ] Meseros entrenados: un mensaje "*VIP 1*" significa abrir el ticket VIP 1 en Loyverse

---

## 6. Qué puedo hacer yo y qué te toca a ti

Para terminar lo más rápido posible, esto es lo que yo (Claude, aquí en el editor) hago en minutos y lo que solo puedes hacer tú.

### Lo hago yo, solo pídelo

| Tarea | Qué necesito de ti |
|---|---|
| Llenar `config.js` y la app con los datos reales (WhatsApp, dirección, horario, mesas, productos, precios) | Los datos, en un mensaje |
| Procesar y conectar las fotos (`tools/preparar-fotos.py`) | Las fotos en la carpeta `fotos/` |
| Regenerar favicon, íconos de la web y de la app, `og.jpg` y pantalla de carga con el logo real | El logo en vector (SVG, AI o PDF) |
| Agregar, quitar o renombrar productos, categorías, mesas o servicios | Qué cambia |
| Mostrar un modelo 3D que el cliente gire con el dedo en la web | El archivo `.glb` (sale de Meshy o Spline) |
| Revisar la web en computador y celular antes de publicar | Nada |
| Publicar la web en Cloudflare con `wrangler` | Que inicies sesión cuando se abra el navegador |
| Compilar la app con EAS | Que inicies sesión en tu cuenta de Expo |
| Cambiar `TU-DOMINIO.com` en todos los archivos | El dominio comprado |
| Ajustar textos, colores o secciones | Qué quieres cambiar |

### Te toca a ti (o al dueño del local)

| Tarea | Por qué no lo puedo hacer yo |
|---|---|
| Tomar las fotos y el video | Hay que estar en el local |
| Crear las cuentas (Cloudflare, Google Play, Apple, Expo) y pagar dominio y tiendas | Son cuentas y pagos personales: no puedo crear cuentas ni ingresar tarjetas |
| Crear el token en Loyverse y pegarlo en Cloudflare | El token da acceso total a la cuenta: no debe pasar por ningún chat, ni siquiera este |
| Crear los tickets predefinidos de las mesas en Loyverse | Se hace en el Back Office del local |
| Llenar la ficha de la app en Google Play y App Store (descripción, capturas, clasificación de edad) | Lo exige la tienda dentro de tu cuenta. Puedo escribirte los textos para que los pegues |
| Imprimir y pegar los QR | Físico |
| Revisar lo legal (venta de vapes y wraps) | Es una decisión del negocio. Si la categoría no está permitida, la apago con `activo: false` |

---

## Fuentes

- [¿Se puede crear una orden abierta por API? (Loyverse Town)](https://loyverse.town/topic/3571-is-it-possible-to-create-an-open-order-that-will-show-up-on-registers-through-api/)
- [Acceso a tickets abiertos por API (Loyverse Town)](https://loyverse.town/topic/5133-how-to-access-open-tickets-on-loyverse-pos-app-via-api/)
- [FAQs about Loyverse API](https://support.loyverse.com/en/articles/8061203-faqs-about-loyverse-api)
- [How to create tokens for API](https://support.loyverse.com/en/articles/4510160-how-to-create-tokens-for-api)
- [Tickets predefinidos para nombrar mesas](https://help.loyverse.com/help/how-use-predefined-open-tickets)
- [Precios de Loyverse (oficial)](https://loyverse.com/pricing)
- [Precios de Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/pricing/)
- [Precio del .com en Cloudflare Registrar 2026](https://startupowl.com/reviews/cloudflare-registrar)
- [Precios de Expo / EAS](https://expo.dev/pricing)
